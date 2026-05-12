import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificacionesService } from '../notificaciones.service';
import { EstadoCita } from '@prisma/client';

@Injectable()
export class CitasService {
  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  async crear(fecha: string, direccion: string, servicios: string[], mascotaId: string) {
    const fechaDate = new Date(fecha);
    if (isNaN(fechaDate.getTime())) throw new BadRequestException('Fecha inválida');
    if (fechaDate < new Date()) throw new BadRequestException('No puedes agendar en el pasado');

    const mascota = await this.prisma.mascota.findUnique({
      where: { id: mascotaId },
      include: { tutor: true },
    });
    if (!mascota) throw new NotFoundException('Mascota no encontrada');

    const cita = await this.prisma.cita.create({
      data: { fecha: fechaDate, direccion, servicios, mascotaId },
      include: { mascota: { include: { tutor: true } } },
    });

    // Fire-and-forget: el envío del email no debe bloquear ni demorar la
    // respuesta. notificarCitaAgendada ya maneja sus propios errores.
    void this.notificaciones.notificarCitaAgendada(
      mascota.tutor.email,
      mascota.nombre,
      fechaDate,
      servicios,
      direccion,
    );

    return cita;
  }

  async listarTodas() {
    return this.prisma.cita.findMany({
      include: { mascota: { include: { tutor: true } } },
      orderBy: { fecha: 'asc' },
      take: 500,
    });
  }

  async listarPorMascota(mascotaId: string) {
    return this.prisma.cita.findMany({
      where: { mascotaId },
      orderBy: { fecha: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.cita.findUnique({
      where: { id },
      include: { mascota: true },
    });
  }

  async actualizarEstado(id: string, estado: EstadoCita) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: { mascota: { include: { tutor: true } } },
    });
    if (!cita) throw new NotFoundException('Cita no encontrada');

    const resultado = await this.prisma.cita.update({
      where: { id },
      data: { estado },
    });

    if (estado === 'CONFIRMADA' || estado === 'CANCELADA') {
      // Fire-and-forget: no bloquear la respuesta esperando el email.
      void this.notificaciones.notificarEstadoCita(
        cita.mascota.tutor.email,
        cita.mascota.nombre,
        cita.fecha,
        estado,
      );
    }

    return resultado;
  }

  async esDuenoDeMascota(mascotaId: string, userId: string): Promise<boolean> {
    const mascota = await this.prisma.mascota.findUnique({
      where: { id: mascotaId },
      select: { tutorId: true },
    });
    return mascota?.tutorId === userId;
  }
}
