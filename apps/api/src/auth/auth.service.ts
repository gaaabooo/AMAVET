import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase.service';
import { AuditLogger, emailEnmascarado } from '../common/audit';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly audit = new AuditLogger();

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
      this.audit.alertar('REGISTRO_EMAIL_DUPLICADO', {
        email: emailEnmascarado(email),
      });
      return { pendiente: true };
    }

    const usuario = await this.usersService.crear(nombre, email, telefono, password);
    this.audit.registrar('REGISTRO_OK', {
      userId: usuario.id,
      rol: usuario.rol,
    });
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

    this.audit.registrar('LOGIN_GOOGLE_OK', {
      userId: usuario.id,
      rol: usuario.rol,
    });
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

    // Evento único en logs para no permitir enumeración de cuentas desde Render
    // logs (mismo evento si el usuario no existe, si el hash está corrupto o si
    // la password no coincide).
    const logFallo = () =>
      this.audit.alertar('LOGIN_FALLIDO', {
        email: emailEnmascarado(email),
        ip: ip ?? '?',
      });

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

    this.audit.registrar('LOGIN_OK', {
      userId: usuario.id,
      rol: usuario.rol,
      ip: ip ?? '?',
    });
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
