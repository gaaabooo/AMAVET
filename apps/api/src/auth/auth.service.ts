import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async registro(nombre: string, email: string, telefono: string, password: string) {
    const existe = await this.usersService.buscarPorEmail(email);
    if (existe) throw new ConflictException('El email ya está registrado');

    const usuario = await this.usersService.crear(nombre, email, telefono, password);
    const token = this.jwtService.sign({ sub: usuario.id, email: usuario.email, rol: usuario.rol });
    return { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } };
  }

  async login(email: string, password: string) {
    const usuario = await this.usersService.buscarPorEmail(email);
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwtService.sign({ sub: usuario.id, email: usuario.email, rol: usuario.rol });
    return { token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } };
  }
}