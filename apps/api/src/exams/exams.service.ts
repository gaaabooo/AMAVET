import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EstadoExamen } from '@prisma/client';
import { SupabaseService } from '../supabase.service';
import { NotificacionesService } from '../notificaciones.service';
import { randomUUID } from 'crypto';

@Injectable()
export class ExamsService {
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
    });
  }

  async actualizarEstado(id: string, estado: EstadoExamen, archivoUrl?: string | null) {
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

    // Para la notificación por email generamos una URL firmada de 24h.
    try {
      const urlFirmada = await this.supabase.generarUrlFirmada(rutaArchivo);
      await this.notificaciones.notificarExamenDisponible(
        examen.mascota.tutor.email,
        examen.mascota.nombre,
        urlFirmada,
      );
    } catch {
      // fallo de SMTP o URL firmada no interrumpe la subida
    }

    return resultado;
  }

  async generarUrlDescarga(id: string): Promise<string> {
    const examen = await this.prisma.examen.findUnique({ where: { id } });
    if (!examen) throw new NotFoundException('Examen no encontrado');
    if (!examen.archivoUrl) throw new NotFoundException('Este examen no tiene archivo');

    return this.supabase.generarUrlFirmada(examen.archivoUrl);
  }
}
