import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Tope de mascotas que un tutor puede registrar. Evita que una cuenta llene la
// base de datos con registros abusivos; 20 es holgado para un tutor real.
const MAX_MASCOTAS_POR_TUTOR = 20;

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async crear(
    nombre: string,
    tipo: string,
    raza: string | null,
    edad: number | null,
    tutorId: string,
  ) {
    // La verificación del límite y la creación van en una transacción para
    // evitar la condición de carrera de dos solicitudes simultáneas.
    return this.prisma.$transaction(async (tx) => {
      const total = await tx.mascota.count({ where: { tutorId } });
      if (total >= MAX_MASCOTAS_POR_TUTOR) {
        throw new BadRequestException(
          `Alcanzaste el máximo de ${MAX_MASCOTAS_POR_TUTOR} mascotas registradas.`,
        );
      }
      return tx.mascota.create({
        data: { nombre, tipo, raza, edad, tutorId },
      });
    });
  }

  async listarPorTutor(tutorId: string) {
    return this.prisma.mascota.findMany({
      where: { tutorId },
      include: { examenes: { include: { cita: true } } },
    });
  }

  async listarTodas() {
    return this.prisma.mascota.findMany({
      include: { tutor: true, examenes: { include: { cita: true } } },
      orderBy: { creadoEn: 'desc' },
      take: 500,
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.mascota.findUnique({
      where: { id },
      include: { tutor: true, examenes: { include: { cita: true } } },
    });
  }
}
