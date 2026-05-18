import { Injectable, Logger, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
  ) {}

  async registro(nombre: string, email: string, telefono: string, password: string) {
    const existe = await this.usersService.buscarPorEmail(email);
    if (existe) throw new ConflictException('El email ya está registrado');

    const usuario = await this.usersService.crear(nombre, email, telefono, password);
    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }

  async loginConGoogle(accessToken: string) {
    const datosGoogle = await this.supabaseService.verificarTokenAcceso(accessToken);
    if (!datosGoogle) throw new UnauthorizedException('Token de Google inválido');

    const usuario = await this.usersService.buscarOCrearGoogle(datosGoogle.email, datosGoogle.nombre);

    if (usuario.rol !== 'TUTOR') throw new UnauthorizedException('Solo tutores pueden ingresar con Google');

    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
    return { token, usuario };
  }

  async login(email: string, password: string, ip?: string) {
    const usuario = await this.usersService.buscarPorEmail(email);

    // Defensa contra timing attacks: si el usuario no existe, hacemos un compare
    // dummy para que la latencia sea similar al caso "usuario existe pero pwd mala".
    if (!usuario) {
      await bcrypt.compare(password, '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsaltinv');
      this.logger.warn(`Login fallido (usuario inexistente) email=${email} ip=${ip ?? '?'}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Defensa contra hashes vacíos o corruptos en BD.
    if (!usuario.password || usuario.password.length < 60) {
      this.logger.warn(`Login fallido (hash inválido) email=${email} ip=${ip ?? '?'}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) {
      this.logger.warn(`Login fallido (password incorrecta) email=${email} ip=${ip ?? '?'}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });
    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    };
  }
}
