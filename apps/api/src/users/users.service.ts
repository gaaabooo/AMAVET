import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async crear(nombre: string, email: string, telefono: string, password: string) {
    const hash = await bcrypt.hash(password, 10);
    return this.prisma.user.create({
      data: { nombre, email, telefono, password: hash },
    });
  }

  async buscarPorEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async buscarPorId(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}