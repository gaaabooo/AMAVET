import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EstadoExamen } from '@prisma/client';
import { SupabaseService } from '../supabase.service';

@Injectable()
export class ExamsService {
  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(SupabaseService) private supabase: SupabaseService,
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
    const nombreArchivo = `${id}-${Date.now()}.pdf`;
    const url = await this.supabase.subirArchivo(
      archivo.buffer,
      nombreArchivo,
      archivo.mimetype,
    );
    return this.actualizarEstado(id, EstadoExamen.DISPONIBLE, url);
  }
}