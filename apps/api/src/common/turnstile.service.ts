import { Injectable, Logger } from '@nestjs/common';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  hostname?: string;
  'error-codes'?: string[];
}

/**
 * Verifica los tokens de Cloudflare Turnstile (captcha) contra la API de
 * Cloudflare. Turnstile funciona sin dominio propio: basta con crear un widget
 * en el panel de Cloudflare y registrar los hostnames permitidos.
 *
 * Si TURNSTILE_SECRET_KEY no está configurada, la verificación se omite (deja
 * pasar) — así el desarrollo local y los despliegues no se rompen antes de
 * configurar las claves. En producción la clave SIEMPRE debe estar puesta.
 */
@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  get configurado(): boolean {
    return !!process.env.TURNSTILE_SECRET_KEY;
  }

  /**
   * Devuelve true si el token de captcha es válido (o si Turnstile no está
   * configurado todavía). Devuelve false solo si está configurado y el token
   * es inválido, ausente o la verificación falla.
   *
   * No se envía remoteip a Cloudflare: detrás del proxy de Render, req.ip no es
   * la IP real del cliente mientras no se configure `trust proxy`. Enviar una IP
   * incorrecta degrada la señal de Turnstile, así que se omite.
   */
  async verificar(token: string | undefined): Promise<boolean> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      this.logger.warn(
        'TURNSTILE_SECRET_KEY no configurada: la verificación de captcha está desactivada.',
      );
      return true;
    }

    if (!token) return false;

    try {
      const params = new URLSearchParams({ secret, response: token });

      const resp = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
        // Sin red, Cloudflare caído, etc.: no colgar el request indefinidamente.
        signal: AbortSignal.timeout(5000),
      });

      // Fail-closed ante respuestas HTTP no exitosas de Cloudflare (5xx, 429...).
      if (!resp.ok) {
        this.logger.error(`Cloudflare siteverify respondió HTTP ${resp.status}`);
        return false;
      }

      const data = (await resp.json()) as TurnstileVerifyResponse;

      if (!data.success) {
        this.logger.warn(
          `Verificación de captcha fallida: ${(data['error-codes'] ?? []).join(', ') || 'sin detalle'}`,
        );
        return false;
      }

      // Si se define TURNSTILE_EXPECTED_HOSTNAME, el token solo se acepta si fue
      // resuelto en ese host. Bloquea la reutilización de un token obtenido en
      // otro sitio que use la misma site key. Opcional: si no se define, se
      // omite la comprobación (útil en desarrollo y previews).
      const hostnameEsperado = process.env.TURNSTILE_EXPECTED_HOSTNAME;
      if (hostnameEsperado && data.hostname !== hostnameEsperado) {
        this.logger.warn(
          `Token de captcha resuelto en hostname inesperado: ${data.hostname ?? '?'}`,
        );
        return false;
      }

      return true;
    } catch (err) {
      // Fail-closed: si no podemos verificar el captcha, rechazamos.
      this.logger.error(`Error al verificar captcha con Cloudflare: ${String(err)}`);
      return false;
    }
  }
}
