import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { NotificacionesService } from '../notificaciones.service';

// Minutos de validez del token de recuperación.
const TOKEN_TTL_MINUTOS = 15;

// Enmascara un email para no filtrar PII en logs. "gabriel@gmail.com" -> "g***@gmail.com".
// Se replica aquí (en auth.service.ts es una función privada de archivo).
function emailEnmascarado(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, dominio] = email.split('@');
  const inicial = local[0] ?? '';
  return `${inicial}***@${dominio}`;
}

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
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notificaciones: NotificacionesService,
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
      this.logger.warn(
        `Solicitud de reset para email no registrado=${emailEnmascarado(email)} ip=${ip ?? '?'}`,
      );
      return { mensaje: MENSAJE_NEUTRO };
    }

    // Heurística para detectar cuentas creadas con Google: su contraseña es un
    // hash de un valor aleatorio impredecible y el teléfono quedó en el
    // sentinel PENDIENTE hasta que completen el perfil. Como no podemos saber
    // con certeza el origen sin un campo dedicado, usamos el indicador más
    // fiable disponible: si el usuario nunca pudo loguearse con password, un
    // reset no le sirve. Avisamos por correo que use Google y no generamos token.
    // (Si en el futuro se agrega un campo "proveedor", reemplazar esta lógica.)
    const esProbableCuentaGoogle = usuario.telefono === 'PENDIENTE';
    if (esProbableCuentaGoogle) {
      this.logger.warn(
        `Solicitud de reset sobre cuenta Google=${emailEnmascarado(email)} ip=${ip ?? '?'}`,
      );
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

    this.logger.log(
      `Token de reset emitido para=${emailEnmascarado(email)} ip=${ip ?? '?'}`,
    );
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
    this.logger.log(
      `Contraseña restablecida para=${emailEnmascarado(usuario.email)}`,
    );
    return { ok: true };
  }
}
