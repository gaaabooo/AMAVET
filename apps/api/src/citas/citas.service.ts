import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EstadoCita } from '@prisma/client';

@Injectable()
export class CitasService {
  constructor(private prisma: PrismaService) {}

  async crear(fecha: string, direccion: string, servicios: string[], mascotaId: string) {
    const mascota = await this.prisma.mascota.findUnique({ where: { id: mascotaId } });
    if (!mascota) throw new NotFoundException('Mascota no encontrada');

    return this.prisma.cita.create({
      data: {
        fecha: new Date(fecha),
        direccion,
        servicios,
        mascotaId,
      },
      include: { mascota: { include: { tutor: true } } },
    });
  }

  async listarTodas() {
    return this.prisma.cita.findMany({
      include: { mascota: { include: { tutor: true } } },
      orderBy: { fecha: 'asc' },
    });
  }

  async listarPorMascota(mascotaId: string) {
    return this.prisma.cita.findMany({
      where: { mascotaId },
      orderBy: { fecha: 'asc' },
    });
  }

  async actualizarEstado(id: string, estado: EstadoCita) {
    const cita = await this.prisma.cita.findUnique({ where: { id } });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    return this.prisma.cita.update({
      where: { id },
      data: { estado },
    });
  }
}
