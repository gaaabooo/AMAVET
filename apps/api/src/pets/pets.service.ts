import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async crear(nombre: string, tipo: string, raza: string, edad: number, tutorId: string) {
    return this.prisma.mascota.create({
      data: { nombre, tipo, raza, edad, tutorId },
    });
  }

  async listarPorTutor(tutorId: string) {
    return this.prisma.mascota.findMany({
      where: { tutorId },
      include: { examenes: true },
    });
  }

  async listarTodas() {
    return this.prisma.mascota.findMany({
      include: { tutor: true, examenes: true },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.mascota.findUnique({
      where: { id },
      include: { tutor: true, examenes: true },
    });
  }
}