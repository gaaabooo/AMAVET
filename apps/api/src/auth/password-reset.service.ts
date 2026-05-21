import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { NotificacionesService } from '../notificaciones.service';
import { emailEnmascarado } from '../common/audit';
import { AuditService } from '../common/audit.service';

// Minutos de validez del token de recuperación.
const TOKEN_TTL_MINUTOS = 15;

// SHA-256 en hex. Igual que se hashea el token antes de guardarlo en la DB.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// Mensaje neutro: se devuelve SIEMPRE, exista o no el email, para no permitir
// enumeración de cuentas (misma política que /auth/registro).
const MENSAJE_NEUTRO =
  'Si el correo está registrado, te enviaremos un enlace para restablecer tu contraseña en los próximos minutos.';

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notificaciones: NotificacionesService,
    private audit: AuditService,
  ) {}

  /**
   * Solicita un reset de contraseña. Responde SIEMPRE el mismo mensaje neutro.
   * Si el email existe genera un token de un solo uso y envía el email; si no
   * existe no hace nada visible. Los usuarios de Google reciben un aviso
   * distinto (no tienen contraseña que restablecer).
   */
  async solicitarReset(email: string, ip?: string) {
    const usuario = await this.usersService.buscarPorEmail(email);

    if (!usuario) {
      this.audit.alertar('PASSWORD_RESET_SOLICITADO', {
        resultado: 'EMAIL_NO_REGISTRADO',
        email: emailEnmascarado(email),
        ip: ip ?? '?',
      });
      return { mensaje: MENSAJE_NEUTRO };
    }

    // Las cuentas creadas con Google no tienen contraseña propia que
    // restablecer. El campo proveedor lo determina con certeza (lo marca
    // buscarOCrearGoogle al crear la cuenta). Avisamos por correo que ingresen
    // con Google y no generamos token.
    if (usuario.proveedor === 'GOOGLE') {
      this.audit.alertar('PASSWORD_RESET_SOLICITADO', {
        resultado: 'CUENTA_GOOGLE',
        userId: usuario.id,
        ip: ip ?? '?',
      });
      await this.notificaciones.notificarResetCuentaGoogle(usuario.email);
      return { mensaje: MENSAJE_NEUTRO };
    }

    // Token en claro: solo viaja en el email. En la DB se guarda su SHA-256.
    const tokenEnClaro = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(tokenEnClaro);
    const expiraEn = new Date(Date.now() + TOKEN_TTL_MINUTOS * 60_000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: usuario.id,
        tokenHash,
        expiraEn,
        ipSolicitud: ip ?? null,
      },
    });

    const base =
      process.env.FRONTEND_URL?.split(',')[0]?.trim() ||
      'http://localhost:3000';
    const urlReset = `${base}/auth/restablecer?token=${tokenEnClaro}`;
    await this.notificaciones.notificarResetPassword(usuario.email, urlReset);

    this.audit.registrar('PASSWORD_RESET_SOLICITADO', {
      resultado: 'TOKEN_EMITIDO',
      userId: usuario.id,
      ip: ip ?? '?',
    });
    return { mensaje: MENSAJE_NEUTRO };
  }

  /**
   * Confirma el reset: valida el token, cambia la contraseña, incrementa
   * tokenVersion (invalida sesiones previas), marca el token como usado e
   * invalida los demás tokens del usuario. Todo en una transacción.
   */
  async confirmarReset(tokenEnClaro: string, passwordNueva: string) {
    const tokenHash = hashToken(tokenEnClaro);
    const registro = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    // Mismo mensaje genérico para "no existe", "usado" y "expirado": no damos
    // pistas sobre por qué falló.
    const enlaceInvalido = () =>
      new BadRequestException('Enlace inválido o expirado');

    if (!registro || registro.usado || registro.expiraEn < new Date()) {
      throw enlaceInvalido();
    }

    const usuario = await this.prisma.user.findUnique({
      where: { id: registro.userId },
    });
    if (!usuario) throw enlaceInvalido();

    // resetearPassword valida la longitud, hashea con bcrypt 12 e incrementa
    // tokenVersion. El reset del token y el borrado de los demás van junto a
    // ello dentro de la misma transacción.
    await this.prisma.$transaction(async () => {
      await this.usersService.resetearPassword(usuario.id, passwordNueva);
      await this.prisma.passwordResetToken.update({
        where: { id: registro.id },
        data: { usado: true },
      });
      // Cualquier otro token de reset pendiente del mismo usuario deja de servir.
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: usuario.id, usado: false },
      });
    });

    await this.notificaciones.notificarPasswordCambiada(usuario.email);
    this.audit.registrar('PASSWORD_RESET_CONFIRMADO', { userId: usuario.id });
    return { ok: true };
  }
}
