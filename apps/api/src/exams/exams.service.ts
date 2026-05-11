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

    // Nombre opaco e impredecible para evitar enumeración o sobrescritura.
    const nombreArchivo = `${examen.id}/${randomUUID()}.pdf`;

    const url = await this.supabase.subirArchivo(
      archivo.buffer,
      nombreArchivo,
      'application/pdf',
    );
    const resultado = await this.actualizarEstado(id, EstadoExamen.DISPONIBLE, url);

    try {
      await this.notificaciones.notificarExamenDisponible(
        examen.mascota.tutor.email,
        examen.mascota.nombre,
        url,
      );
    } catch {
      // fallo de SMTP no interrumpe la subida
    }

    return resultado;
  }
}
