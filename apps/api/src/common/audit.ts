import { Logger } from '@nestjs/common';

/**
 * Eventos de seguridad auditables. Mantener esta lista como el catálogo único:
 * cualquier alerta o filtro futuro (en Render o en un agregador externo) se
 * apoya en estos nombres.
 */
export type EventoAuditoria =
  | 'LOGIN_OK'
  | 'LOGIN_FALLIDO'
  | 'LOGIN_GOOGLE_OK'
  | 'REGISTRO_OK'
  | 'REGISTRO_EMAIL_DUPLICADO'
  | 'PASSWORD_CAMBIADA'
  | 'PASSWORD_RESET_SOLICITADO'
  | 'PASSWORD_RESET_CONFIRMADO'
  | 'EXAMEN_CREADO'
  | 'EXAMEN_ESTADO_ACTUALIZADO'
  | 'EXAMEN_ARCHIVO_SUBIDO'
  | 'CUENTA_ELIMINADA'
  | 'CUENTA_REACTIVADA'
  | 'CUENTA_PURGADA';

// Enmascara un email para no filtrar PII en logs. "gabriel@gmail.com" -> "g***@gmail.com".
export function emailEnmascarado(email: string | undefined | null): string {
  if (!email || !email.includes('@')) return '***';
  const [local, dominio] = email.split('@');
  const inicial = local[0] ?? '';
  return `${inicial}***@${dominio}`;
}

// Sanea un valor para una línea de log: sin saltos de línea (evita inyección de
// líneas falsas, CWE-117) y recortado. Los valores con espacios van entre comillas.
function valorSeguro(valor: unknown): string {
  const texto = String(valor ?? '').replace(/[\r\n\t]+/g, ' ').slice(0, 200);
  return /\s/.test(texto) ? `"${texto}"` : texto;
}

/**
 * Logger de eventos de seguridad con formato estructurado y uniforme:
 *
 *   [Audit] evento=LOGIN_OK userId=abc rol=ADMIN ip=1.2.3.4
 *
 * El formato key=value es parseable por agregadores de logs y facilita definir
 * alertas (p. ej. contar eventos LOGIN_FALLIDO por ip). Nunca registrar aquí
 * contraseñas, tokens ni JWT; los emails siempre enmascarados.
 */
export class AuditLogger {
  private readonly logger = new Logger('Audit');

  private formatear(evento: EventoAuditoria, datos: Record<string, unknown>): string {
    const pares = Object.entries(datos)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${valorSeguro(v)}`)
      .join(' ');
    return `evento=${evento}${pares ? ' ' + pares : ''}`;
  }

  /** Evento de seguridad normal (login OK, cambio de password, acción de admin). */
  registrar(evento: EventoAuditoria, datos: Record<string, unknown> = {}): void {
    this.logger.log(this.formatear(evento, datos));
  }

  /** Evento sospechoso o fallido (login fallido, email duplicado en registro). */
  alertar(evento: EventoAuditoria, datos: Record<string, unknown> = {}): void {
    this.logger.warn(this.formatear(evento, datos));
  }
}
