import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase.service';
import { LoginLockoutService } from './login-lockout.service';
import { NotificacionesService } from '../notificaciones.service';
import { emailEnmascarado } from '../common/audit';
import { AuditService } from '../common/audit.service';
import {
  verifyPassword,
  necesitaRehash,
  verificacionDummy,
} from '../common/password';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private supabaseService: SupabaseService,
    private lockout: LoginLockoutService,
    private audit: AuditService,
    private notificaciones: NotificacionesService,
  ) {}

  async registro(
    nombre: string,
    email: string,
    telefono: string,
    password: string,
    ip?: string,
  ) {
    const existe = await this.usersService.buscarPorEmail(email);

    // Para no permitir enumeración de cuentas, NUNCA revelamos si el email ya
    // existía. Si el correo ya estaba registrado, no creamos cuenta nueva y
    // tampoco emitimos token: respondemos un payload neutro y el frontend
    // muestra el mismo mensaje en ambos casos.
    if (existe) {
      this.audit.alertar('REGISTRO_EMAIL_DUPLICADO', {
        email: emailEnmascarado(email),
        ip: ip ?? '?',
      });
      return { pendiente: true };
    }

    const usuario = await this.usersService.crear(
      nombre,
      email,
      telefono,
      password,
    );
    this.audit.registrar('REGISTRO_OK', {
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

  async loginConGoogle(accessToken: string, ip?: string) {
    // No lleva lockout de credenciales: no hay contraseña que adivinar, la
    // identidad la prueba Google/Supabase al validar el accessToken. El abuso
    // de volumen lo cubre el @Throttle del controlador.
    const datosGoogle =
      await this.supabaseService.verificarTokenAcceso(accessToken);
    if (!datosGoogle)
      throw new UnauthorizedException('Token de Google inválido');

    const usuario = await this.usersService.buscarOCrearGoogle(
      datosGoogle.email,
      datosGoogle.nombre,
    );

    if (usuario.rol !== 'TUTOR')
      throw new UnauthorizedException(
        'Solo tutores pueden ingresar con Google',
      );

    // Si la cuenta estaba en periodo de gracia de eliminación, autenticarse con
    // Google (identidad ya probada por Cloudflare/Supabase) la reactiva.
    const estado = await this.usersService.obtenerEstadoSesion(usuario.id);
    const reactivada = estado?.eliminado ?? false;
    if (reactivada) {
      await this.usersService.reactivar(usuario.id);
      this.audit.registrar('CUENTA_REACTIVADA', {
        userId: usuario.id,
        ip: ip ?? '?',
      });
      void this.notificaciones.notificarCuentaReactivada(
        usuario.email,
        new Date(),
      );
    }

    // Aviso de inicio de sesión desde una IP nueva. Igual que en login(): se
    // evalúa antes de registrar el evento, no se avisa en el primer login, y
    // se omite si la cuenta acaba de reactivarse (ese aviso ya cumple la
    // función de alerta).
    if (ip && !reactivada) {
      const [ipConocida, loginsPrevios] = await Promise.all([
        this.audit.ipConocidaParaUsuario(usuario.id, ip),
        this.audit.loginsPreviosDeUsuario(usuario.id),
      ]);
      if (!ipConocida && loginsPrevios > 0) {
        void this.notificaciones.notificarLoginNuevaUbicacion(
          usuario.email,
          ip,
          new Date(),
        );
      }
    }

    this.audit.registrar('LOGIN_GOOGLE_OK', {
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
    return { token, usuario };
  }

  async login(email: string, password: string, ip?: string) {
    // Email e ip normalizados para el lockout: así "Test@x.cl" y "test@x.cl"
    // cuentan como la misma combinación, y un ip ausente no rompe el conteo.
    const emailNorm = email.trim().toLowerCase();
    const ipNorm = ip ?? '?';

    // Lockout escalonado: si esta combinación email+ip acumula demasiados
    // fallos recientes, se rechaza con 429 ANTES de tocar la BD o de verificar
    // la contraseña.
    await this.lockout.verificarBloqueo(emailNorm, ipNorm);

    const usuario = await this.usersService.buscarPorEmail(email);

    // Evento único en logs para no permitir enumeración de cuentas desde Render
    // logs (mismo evento si el usuario no existe, si el hash está corrupto o si
    // la password no coincide). Cada fallo también se registra para el lockout.
    const fallar = async () => {
      await this.lockout.registrarIntento(emailNorm, ipNorm, false);
      this.audit.alertar('LOGIN_FALLIDO', {
        email: emailEnmascarado(email),
        ip: ipNorm,
      });
    };

    // Defensa contra timing attacks: si el usuario no existe, hacemos una
    // verificación dummy (Argon2id real) para que la latencia sea similar al
    // caso "usuario existe pero pwd mala".
    if (!usuario) {
      await verificacionDummy(password);
      await fallar();
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Defensa contra hashes vacíos o corruptos en BD.
    if (!usuario.password || usuario.password.length < 60) {
      await fallar();
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valido = await verifyPassword(usuario.password, password);
    if (!valido) {
      await fallar();
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Migración gradual a Argon2id: si la cuenta todavía tiene un hash bcrypt
    // heredado, se re-hashea ahora que tenemos la contraseña en claro y ya se
    // verificó. Es transparente para el usuario. Fire-and-forget: un fallo al
    // re-hashear no debe impedir el login (el .catch defensivo evita un
    // unhandled rejection si la migración cambiara en el futuro).
    if (necesitaRehash(usuario.password)) {
      void this.usersService
        .migrarHashPassword(usuario.id, password, usuario.password)
        .catch(() => undefined);
    }

    // Login correcto: se limpian los fallos previos de esta combinación.
    await this.lockout.registrarIntento(emailNorm, ipNorm, true);

    // La cuenta puede estar en periodo de gracia de eliminación. La
    // reactivación SOLO ocurre aquí, después de comprobar la contraseña: así no
    // se revela a nadie sin credenciales si una cuenta existe o está eliminada.
    const reactivada = usuario.eliminadoEn !== null;
    if (reactivada) {
      await this.usersService.reactivar(usuario.id);
      this.audit.registrar('CUENTA_REACTIVADA', {
        userId: usuario.id,
        ip: ip ?? '?',
      });
      void this.notificaciones.notificarCuentaReactivada(
        usuario.email,
        new Date(),
      );
    }

    // Aviso de inicio de sesión desde una IP nueva. Se evalúa ANTES de
    // registrar el LOGIN_OK actual (que dejaría la IP marcada como conocida).
    // No se avisa en el primer login de la cuenta (sin historial, toda IP es
    // "nueva") ni si la cuenta acaba de reactivarse (ese aviso ya alerta).
    if (ip && !reactivada) {
      const [ipConocida, loginsPrevios] = await Promise.all([
        this.audit.ipConocidaParaUsuario(usuario.id, ip),
        this.audit.loginsPreviosDeUsuario(usuario.id),
      ]);
      if (!ipConocida && loginsPrevios > 0) {
        void this.notificaciones.notificarLoginNuevaUbicacion(
          usuario.email,
          ip,
          new Date(),
        );
      }
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
