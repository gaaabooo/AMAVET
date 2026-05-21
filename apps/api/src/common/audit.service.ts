import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuditAlertService } from './audit-alert.service';
import { EventoAuditoria, valorSeguro } from './audit';

/**
 * Servicio de auditoría de seguridad. Cada evento auditable:
 *  1. se loguea a stdout en formato key=value (parseable),
 *  2. se persiste en la tabla AuditLog (consultable desde el panel admin),
 *  3. se evalúa contra los patrones de alerta.
 *
 * Nunca registrar contraseñas, tokens ni JWT; los emails siempre enmascarados
 * por quien llama (ver emailEnmascarado).
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  constructor(
    private prisma: PrismaService,
    private alertas: AuditAlertService,
  ) {}

  /** Evento de seguridad normal (login OK, cambio de password, acción admin). */
  registrar(evento: EventoAuditoria, datos: Record<string, unknown> = {}): void {
    this.procesar(evento, datos, false);
  }

  /** Evento sospechoso o fallido (login fallido, email duplicado en registro). */
  alertar(evento: EventoAuditoria, datos: Record<string, unknown> = {}): void {
    this.procesar(evento, datos, true);
  }

  private procesar(
    evento: EventoAuditoria,
    datos: Record<string, unknown>,
    esAlerta: boolean,
  ): void {
    // 1. Log a stdout (síncrono, nunca falla).
    const linea = this.formatear(evento, datos);
    if (esAlerta) this.logger.warn(linea);
    else this.logger.log(linea);

    // 2 y 3. Persistir + evaluar alertas. Es fire-and-forget: la auditoría no
    // debe bloquear ni romper el flujo de negocio que generó el evento.
    void this.persistirYEvaluar(evento, datos, esAlerta);
  }

  // Sanea el objeto de datos antes de persistirlo: cada valor pasa por
  // valorSeguro (sin saltos de línea, recortado a 200 chars). Defensa en
  // profundidad para que ningún valor inesperado (errores crudos, textos
  // largos) entre sin control al audit trail.
  private sanearDatos(datos: Record<string, unknown>): Record<string, string> {
    const limpio: Record<string, string> = {};
    for (const [k, v] of Object.entries(datos)) {
      if (v === undefined || v === null) continue;
      limpio[k] = valorSeguro(v);
    }
    return limpio;
  }

  private async persistirYEvaluar(
    evento: EventoAuditoria,
    datos: Record<string, unknown>,
    esAlerta: boolean,
  ): Promise<void> {
    const userId = typeof datos.userId === 'string' ? datos.userId : null;
    const ip = typeof datos.ip === 'string' ? datos.ip : null;

    try {
      await this.prisma.auditLog.create({
        data: {
          evento,
          alerta: esAlerta,
          userId,
          ip,
          datos: this.sanearDatos(datos),
        },
      });
    } catch (err) {
      // Si la persistencia falla, el evento ya quedó en stdout: no se pierde
      // del todo. No propagar.
      this.logger.error(`No se pudo persistir el evento de auditoría: ${String(err)}`);
      return;
    }

    await this.alertas.evaluar(evento, {
      userId: userId ?? undefined,
      ip: ip ?? undefined,
      rol: typeof datos.rol === 'string' ? datos.rol : undefined,
    });
  }

  private formatear(evento: EventoAuditoria, datos: Record<string, unknown>): string {
    const pares = Object.entries(datos)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${k}=${valorSeguro(v)}`)
      .join(' ');
    return `evento=${evento}${pares ? ' ' + pares : ''}`;
  }
}
