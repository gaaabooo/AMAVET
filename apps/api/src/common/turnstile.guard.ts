import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TurnstileService } from './turnstile.service';

/**
 * Exige un token de captcha (Cloudflare Turnstile) válido en el body de la
 * petición, bajo el campo "captchaToken". Se aplica a los endpoints públicos
 * expuestos a bots (registro, recuperación de contraseña).
 *
 * Si Turnstile no está configurado (sin TURNSTILE_SECRET_KEY), el guard deja
 * pasar — ver TurnstileService.
 */
@Injectable()
export class TurnstileGuard implements CanActivate {
  constructor(private readonly turnstile: TurnstileService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      body?: { captchaToken?: unknown };
    }>();

    const token =
      typeof req.body?.captchaToken === 'string' ? req.body.captchaToken : undefined;

    const valido = await this.turnstile.verificar(token);
    if (!valido) {
      throw new ForbiddenException('Verificación de captcha fallida. Recarga la página e inténtalo de nuevo.');
    }
    return true;
  }
}
