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

// Transiciones de estado válidas de un examen. El flujo avanza:
// PENDIENTE -> EN_PROCESO -> DISPONIBLE. Un examen ya DISPONIBLE no retrocede
// (un resultado entregado no vuelve a pendiente), pero sí admite quedarse en
// DISPONIBLE — para permitir re-subir un archivo corregido.
const TRANSICIONES_EXAMEN: Record<EstadoExamen, EstadoExamen[]> = {
  PENDIENTE: ['PENDIENTE', 'EN_PROCESO', 'DISPONIBLE'],
  EN_PROCESO: ['EN_PROCESO', 'DISPONIBLE'],
  DISPONIBLE: ['DISPONIBLE'],
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

  async crear(tipo: string, mascotaId: string) {
    const examen = await this.prisma.examen.create({
      data: { tipo, mascotaId },
    });
    this.audit.registrar('EXAMEN_CREADO', {
      examenId: examen.id,
      mascotaId,
    });
    return examen;
  }

  async listarPorMascota(mascotaId: string) {
    return this.prisma.examen.findMany({
      where: { mascotaId },
      include: { mascota: true },
      orderBy: { creadoEn: 'desc' },
    });
  }

  async listarTodos() {
    return this.prisma.examen.findMany({
      include: { mascota: { include: { tutor: true } } },
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

    const actualizado = await this.prisma.examen.update({
      where: { id },
      data: { estado, ...(archivoUrl !== undefined && { archivoUrl }) },
    });
    this.audit.registrar('EXAMEN_ESTADO_ACTUALIZADO', {
      examenId: id,
      estado,
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
