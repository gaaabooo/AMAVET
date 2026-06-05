import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EstadoExamen } from '@prisma/client';
import { SupabaseService } from '../supabase.service';
import { NotificacionesService } from '../notificaciones.service';
import { AuditService } from '../common/audit.service';
import { randomUUID } from 'crypto';

// Transiciones de estado válidas de un examen. El flujo normal avanza:
// PENDIENTE -> EN_PROCESO -> DISPONIBLE. Se permite además volver de DISPONIBLE
// a PENDIENTE: si el equipo subió un PDF equivocado, "borrar PDF" devuelve el
// examen a PENDIENTE para resubir el archivo correcto.
const TRANSICIONES_EXAMEN: Record<EstadoExamen, EstadoExamen[]> = {
  PENDIENTE: ['PENDIENTE', 'EN_PROCESO', 'DISPONIBLE'],
  EN_PROCESO: ['EN_PROCESO', 'DISPONIBLE'],
  DISPONIBLE: ['DISPONIBLE', 'PENDIENTE'],
};

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(SupabaseService) private supabase: SupabaseService,
    @Inject(NotificacionesService)
    private notificaciones: NotificacionesService,
    private audit: AuditService,
  ) {}

  async listarPorMascota(mascotaId: string) {
    return this.prisma.examen.findMany({
      where: { mascotaId },
      include: { mascota: true, cita: true },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async listarTodos() {
    return this.prisma.examen.findMany({
      include: { mascota: { include: { tutor: true } }, cita: true },
      orderBy: { creadoEn: 'desc' },
      take: 500,
    });
  }

  async actualizarEstado(
    id: string,
    estado: EstadoExamen,
    archivoUrl?: string | null,
  ) {
    const examen = await this.prisma.examen.findUnique({ where: { id } });
    if (!examen) throw new NotFoundException('Examen no encontrado');

    // Solo se permiten transiciones de estado válidas: el flujo del examen
    // avanza y no retrocede (un resultado DISPONIBLE no vuelve a PENDIENTE).
    if (!TRANSICIONES_EXAMEN[examen.estado].includes(estado)) {
      throw new BadRequestException(
        `No se puede pasar un examen de ${examen.estado} a ${estado}`,
      );
    }

    // subidoEn refleja cuándo el PDF estuvo disponible para el tutor.
    // - Al pasar a DISPONIBLE: lo marcamos con la hora actual.
    // - Al volver a PENDIENTE (borrar PDF para resubir): lo limpiamos.
    // - En cualquier otra transición (p.ej. PENDIENTE -> EN_PROCESO) no se toca.
    const subidoEnUpdate: { subidoEn?: Date | null } = {};
    if (estado === 'DISPONIBLE' && examen.estado !== 'DISPONIBLE') {
      subidoEnUpdate.subidoEn = new Date();
    } else if (estado === 'PENDIENTE' && examen.estado === 'DISPONIBLE') {
      subidoEnUpdate.subidoEn = null;
    }

    const actualizado = await this.prisma.examen.update({
      where: { id },
      data: {
        estado,
        ...(archivoUrl !== undefined && { archivoUrl }),
        ...subidoEnUpdate,
      },
    });

    // Si la transición fue "borrar PDF" (DISPONIBLE -> PENDIENTE), borramos
    // también el blob de Storage. Sin esto, cualquier signed URL emitida
    // previamente (TTL 24h, posiblemente en el email del tutor) seguiría
    // resolviendo al PDF antiguo durante su ventana de vida — que es justo el
    // escenario problemático (PDF subido a la mascota equivocada).
    // Fire-and-forget defensivo: borrarArchivo() ya loguea y no lanza, así que
    // un fallo aquí no rompe la actualización de estado. La BD queda como
    // fuente de verdad: si el blob no se borró, queda huérfano pero ya no es
    // accesible vía la app (archivoUrl es null).
    if (
      estado === 'PENDIENTE' &&
      examen.estado === 'DISPONIBLE' &&
      examen.archivoUrl
    ) {
      void this.supabase.borrarArchivo(examen.archivoUrl);
    }

    this.audit.registrar('EXAMEN_ESTADO_ACTUALIZADO', {
      examenId: id,
      estadoAnterior: examen.estado,
      estado,
      // Marca explícita cuando se "borró el PDF" (DISPONIBLE -> PENDIENTE): así
      // el evento se lee solo en auditoría forense sin tener que correlacionar
      // con la transición previa.
      ...(estado === 'PENDIENTE' &&
        examen.estado === 'DISPONIBLE' && { subidoEnLimpiado: true }),
    });
    return actualizado;
  }

  async buscarPorId(id: string) {
    return this.prisma.examen.findUnique({
      where: { id },
      include: { mascota: { include: { tutor: true } } },
    });
  }

  async subirArchivo(id: string, archivo: Express.Multer.File) {
    const examen = await this.buscarPorId(id);
    if (!examen) throw new NotFoundException('Examen no encontrado');

    // Nombre opaco e impredecible. Guardamos la RUTA, no una URL pública.
    const rutaArchivo = `${examen.id}/${randomUUID()}.pdf`;

    await this.supabase.subirArchivo(
      archivo.buffer,
      rutaArchivo,
      'application/pdf',
    );

    this.audit.registrar('EXAMEN_ARCHIVO_SUBIDO', {
      examenId: id,
      bytes: archivo.size,
    });

    // Compensación: subir a Storage y guardar la ruta en la BD son dos sistemas
    // distintos, no hay transacción que los abarque. Si el guardado en BD falla,
    // el archivo ya está en Storage y quedaría huérfano; lo borramos antes de
    // propagar el error para que un reintento parta limpio.
    let resultado: Awaited<ReturnType<typeof this.actualizarEstado>>;
    try {
      resultado = await this.actualizarEstado(
        id,
        EstadoExamen.DISPONIBLE,
        rutaArchivo,
      );
    } catch (err) {
      await this.supabase.borrarArchivo(rutaArchivo);
      throw err;
    }

    // Fire-and-forget: generar la URL firmada y enviar el email no debe
    // bloquear ni demorar la respuesta de la subida.
    void (async () => {
      try {
        const urlFirmada = await this.supabase.generarUrlFirmada(rutaArchivo);
        await this.notificaciones.notificarExamenDisponible(
          examen.mascota.tutor.email,
          examen.mascota.nombre,
          urlFirmada,
        );
      } catch (err) {
        this.logger.warn(
          `No se pudo notificar examen disponible (examen=${id}): ${String(err)}`,
        );
      }
    })();

    return resultado;
  }

  async esDuenoMascota(mascotaId: string, userId: string): Promise<boolean> {
    const mascota = await this.prisma.mascota.findUnique({
      where: { id: mascotaId },
      select: { tutorId: true },
    });
    return mascota?.tutorId === userId;
  }

  async generarUrlDescarga(id: string): Promise<string> {
    const examen = await this.prisma.examen.findUnique({ where: { id } });
    if (!examen) throw new NotFoundException('Examen no encontrado');
    if (!examen.archivoUrl)
      throw new NotFoundException('Este examen no tiene archivo');

    return this.supabase.generarUrlFirmada(examen.archivoUrl);
  }
}
