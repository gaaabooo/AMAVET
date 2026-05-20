import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase.service';
import * as bcrypt from 'bcryptjs';

// Enmascara un email para no filtrar PII en logs. "gabriel@gmail.com" -> "g***@gmail.com".
function emailEnmascarado(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, dominio] = email.split('@');
  const inicial = local[0] ?? '';
  return `${inicial}***@${dominio}`;
}

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

    // Para no permitir enumeración de cuentas, NUNCA revelamos si el email ya
    // existía. Si el correo ya estaba registrado, no creamos cuenta nueva y
    // tampoco emitimos token: respondemos un payload neutro y el frontend
    // muestra el mismo mensaje en ambos casos.
    if (existe) {
      this.logger.warn(
        `Intento de registro con email ya existente=${emailEnmascarado(email)}`,
      );
      return { pendiente: true };
    }

    const usuario = await this.usersService.crear(nombre, email, telefono, password);
    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      tv: usuario.tokenVersion,
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
      tv: usuario.tokenVersion,
    });
    return { token, usuario };
  }

  async login(email: string, password: string, ip?: string) {
    const usuario = await this.usersService.buscarPorEmail(email);

    // Mensaje único en logs para no permitir enumeración de cuentas desde Render
    // logs (mismo texto si el usuario no existe, si el hash está corrupto o si
    // la password no coincide).
    const logFallo = () =>
      this.logger.warn(
        `Login fallido email=${emailEnmascarado(email)} ip=${ip ?? '?'}`,
      );

    // Defensa contra timing attacks: si el usuario no existe, hacemos un compare
    // dummy para que la latencia sea similar al caso "usuario existe pero pwd mala".
    if (!usuario) {
      await bcrypt.compare(password, '$2b$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsaltinv');
      logFallo();
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Defensa contra hashes vacíos o corruptos en BD.
    if (!usuario.password || usuario.password.length < 60) {
      logFallo();
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valido = await bcrypt.compare(password, usuario.password);
    if (!valido) {
      logFallo();
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
      tv: usuario.tokenVersion,
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
