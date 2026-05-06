import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
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

  async listarTutores() {
    return this.prisma.user.findMany({
      where: { rol: 'TUTOR' },
      select: { id: true, nombre: true, email: true, telefono: true, creadoEn: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async actualizarPerfil(id: string, data: { nombre?: string; telefono?: string }) {
    const usuario = await this.prisma.user.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const update: { nombre?: string; telefono?: string } = {};
    if (typeof data.nombre === 'string') {
      const nombre = data.nombre.trim();
      if (nombre.length < 2) throw new BadRequestException('El nombre debe tener al menos 2 caracteres');
      update.nombre = nombre;
    }
    if (typeof data.telefono === 'string') {
      const telefono = data.telefono.trim();
      if (telefono.length < 6) throw new BadRequestException('El teléfono no es válido');
      update.telefono = telefono;
    }

    const actualizado = await this.prisma.user.update({
      where: { id },
      data: update,
      select: { id: true, nombre: true, email: true, telefono: true, rol: true },
    });
    return actualizado;
  }

  async cambiarPassword(id: string, passwordActual: string, passwordNueva: string) {
    if (!passwordActual || !passwordNueva) {
      throw new BadRequestException('Debes ingresar la contraseña actual y la nueva');
    }
    if (passwordNueva.length < 6) {
      throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');
    }
    if (passwordActual === passwordNueva) {
      throw new BadRequestException('La nueva contraseña debe ser distinta de la actual');
    }

    const usuario = await this.prisma.user.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const valido = await bcrypt.compare(passwordActual, usuario.password);
    if (!valido) throw new UnauthorizedException('La contraseña actual no es correcta');

    const hash = await bcrypt.hash(passwordNueva, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hash },
    });
    return { ok: true };
  }
}
