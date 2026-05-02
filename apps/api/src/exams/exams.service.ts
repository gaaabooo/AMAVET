import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EstadoExamen } from '@prisma/client';
import { SupabaseService } from '../supabase.service';
import { NotificacionesService } from '../notificaciones.service';

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
    });
  }

  async listarTodos() {
    return this.prisma.examen.findMany({
      include: { mascota: { include: { tutor: true } } },
    });
  }

  async actualizarEstado(id: string, estado: EstadoExamen, archivoUrl?: string) {
    return this.prisma.examen.update({
      where: { id },
      data: { estado, ...(archivoUrl && { archivoUrl }) },
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
    const nombreArchivo = `${id}-${Date.now()}.pdf`;
    const url = await this.supabase.subirArchivo(
      archivo.buffer,
      nombreArchivo,
      archivo.mimetype,
    );
    const resultado = await this.actualizarEstado(id, EstadoExamen.DISPONIBLE, url);
    if (examen) {
      try {
        await this.notificaciones.notificarExamenDisponible(
          examen.mascota.tutor.email,
          examen.mascota.nombre,
          url,
        );
      } catch {
        // fallo de SMTP no interrumpe la subida
      }
    }
    return resultado;
  }
}