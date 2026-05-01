import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EstadoExamen } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

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
}