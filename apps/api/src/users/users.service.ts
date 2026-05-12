import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

// Sentinel para usuarios creados por Google que aún no han ingresado su teléfono.
// La DB tiene un constraint que prohíbe teléfono vacío, así que usamos este valor
// y el frontend lo trata como "sin teléfono" para pedirlo en /auth/completar-perfil.
export const TELEFONO_PENDIENTE = 'PENDIENTE';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async crear(nombre: string, email: string, telefono: string, password: string) {
    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return this.prisma.user.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        telefono: telefono.trim(),
        password: hash,
      },
    });
  }

  async buscarPorEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, nombre: true, email: true, telefono: true, rol: true, creadoEn: true },
    });
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

    return this.prisma.user.update({
      where: { id },
      data: update,
      select: { id: true, nombre: true, email: true, telefono: true, rol: true },
    });
  }

  async buscarOCrearGoogle(
    email: string,
    nombre: string,
  ): Promise<{ id: string; nombre: string; email: string; rol: string; telefono: string }> {
    const emailNorm = email.trim().toLowerCase();
    const existente = await this.prisma.user.findUnique({ where: { email: emailNorm } });
    if (existente) {
      return {
        id: existente.id,
        nombre: existente.nombre,
        email: existente.email,
        rol: existente.rol,
        telefono: existente.telefono,
      };
    }
    // Hash de un valor aleatorio impredecible: satisface el constraint de la DB
    // (password no vacío) y nadie puede hacer login con email/password — solo Google.
    const passwordBloqueada = await bcrypt.hash(randomBytes(32).toString('hex'), BCRYPT_ROUNDS);
    const nuevo = await this.prisma.user.create({
      data: {
        nombre: nombre.trim(),
        email: emailNorm,
        telefono: TELEFONO_PENDIENTE,
        password: passwordBloqueada,
        rol: 'TUTOR',
      },
    });
    return { id: nuevo.id, nombre: nuevo.nombre, email: nuevo.email, rol: nuevo.rol, telefono: nuevo.telefono };
  }

  async cambiarPassword(id: string, passwordActual: string, passwordNueva: string) {
    if (!passwordActual || !passwordNueva) {
      throw new BadRequestException('Debes ingresar la contraseña actual y la nueva');
    }
    if (passwordNueva.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    if (passwordActual === passwordNueva) {
      throw new BadRequestException('La nueva contraseña debe ser distinta de la actual');
    }

    const usuario = await this.prisma.user.findUnique({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const valido = await bcrypt.compare(passwordActual, usuario.password);
    if (!valido) throw new UnauthorizedException('La contraseña actual no es correcta');

    const hash = await bcrypt.hash(passwordNueva, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { password: hash },
    });
    return { ok: true };
  }
}
