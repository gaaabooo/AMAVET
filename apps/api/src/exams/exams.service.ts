import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EstadoExamen } from '@prisma/client';
import { SupabaseService } from '../supabase.service';
import { NotificacionesService } from '../notificaciones.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(SupabaseService) private supabase: SupabaseService,
    @Inject(NotificacionesService) private notificaciones: NotificacionesService,
  ) {}

  async crear(tipo: string, mascotaId: string) {
    return this.prisma.examen.create({
      data: { tipo, mascotaId },
    });
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

  async actualizarEstado(id: string, estado: EstadoExamen, archivoUrl?: string | null) {
    const examen = await this.prisma.examen.findUnique({ where: { id } });
    if (!examen) throw new NotFoundException('Examen no encontrado');
    return this.prisma.examen.update({
      where: { id },
      data: { estado, ...(archivoUrl !== undefined && { archivoUrl }) },
    });
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

    await this.supabase.subirArchivo(archivo.buffer, rutaArchivo, 'application/pdf');

    // Guardamos la ruta en archivoUrl (no la URL pública).
    const resultado = await this.actualizarEstado(id, EstadoExamen.DISPONIBLE, rutaArchivo);

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
    if (!examen.archivoUrl) throw new NotFoundException('Este examen no tiene archivo');

    return this.supabase.generarUrlFirmada(examen.archivoUrl);
  }
}
