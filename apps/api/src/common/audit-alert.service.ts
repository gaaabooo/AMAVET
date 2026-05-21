import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificacionesService } from '../notificaciones.service';
import { EventoAuditoria } from './audit';

// --- Umbrales de detección de patrones sospechosos ---

// Fuerza bruta: nº de LOGIN_FALLIDO desde una misma IP en la ventana.
const BRUTE_FORCE_UMBRAL = 10;
const BRUTE_FORCE_VENTANA_MS = 15 * 60 * 1000; // 15 min

// Registro masivo: nº de REGISTRO_OK + REGISTRO_EMAIL_DUPLICADO en la ventana.
const REGISTRO_MASIVO_UMBRAL = 20;
const REGISTRO_MASIVO_VENTANA_MS = 10 * 60 * 1000; // 10 min

// Cambios de password en ráfaga: nº de PASSWORD_CAMBIADA del mismo usuario.
const PASSWORD_RAFAGA_UMBRAL = 3;
const PASSWORD_RAFAGA_VENTANA_MS = 30 * 60 * 1000; // 30 min

// Cooldown: tiempo mínimo entre dos emails de alerta del mismo tipo, para no
// inundar el buzón del admin durante un ataque sostenido.
const COOLDOWN_ALERTA_MS = 30 * 60 * 1000; // 30 min

type TipoAlerta =
  | 'FUERZA_BRUTA_IP'
  | 'LOGIN_ADMIN_IP_NUEVA'
  | 'REGISTRO_MASIVO'
  | 'PASSWORD_RAFAGA';

/**
 * Detecta patrones sospechosos sobre el audit trail persistido y notifica al
 * administrador por email. Se invoca después de registrar cada evento.
 */
@Injectable()
export class AuditAlertService {
  private readonly logger = new Logger(AuditAlertService.name);
  // Marca temporal del último email enviado por tipo de alerta (cooldown).
  private readonly ultimaAlerta = new Map<TipoAlerta, number>();

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  /**
   * Evalúa si el evento recién registrado dispara alguna alerta. Nunca lanza:
   * un fallo en la detección no debe afectar al flujo que generó el evento.
   */
  async evaluar(
    evento: EventoAuditoria,
    contexto: { userId?: string; ip?: string; rol?: string },
  ): Promise<void> {
    try {
      if (evento === 'LOGIN_FALLIDO' && contexto.ip) {
        await this.detectarFuerzaBruta(contexto.ip);
      }
      if (evento === 'LOGIN_OK' && contexto.rol === 'ADMIN' && contexto.userId && contexto.ip) {
        await this.detectarLoginAdminIpNueva(contexto.userId, contexto.ip);
      }
      if (evento === 'REGISTRO_OK' || evento === 'REGISTRO_EMAIL_DUPLICADO') {
        await this.detectarRegistroMasivo();
      }
      if (evento === 'PASSWORD_CAMBIADA' && contexto.userId) {
        await this.detectarPasswordRafaga(contexto.userId);
      }
    } catch (err) {
      this.logger.error(`Fallo al evaluar alertas de auditoría: ${String(err)}`);
    }
  }

  private async detectarFuerzaBruta(ip: string): Promise<void> {
    const desde = new Date(Date.now() - BRUTE_FORCE_VENTANA_MS);
    const fallos = await this.prisma.auditLog.count({
      where: { evento: 'LOGIN_FALLIDO', ip, creadoEn: { gte: desde } },
    });
    if (fallos >= BRUTE_FORCE_UMBRAL) {
      await this.notificar(
        'FUERZA_BRUTA_IP',
        'Posible ataque de fuerza bruta',
        `Se detectaron ${fallos} intentos de inicio de sesión fallidos desde la IP ${ip} en los últimos 15 minutos.`,
      );
    }
  }

  private async detectarLoginAdminIpNueva(userId: string, ip: string): Promise<void> {
    // Si el admin no tiene NINGÚN login previo, es su primer acceso (cuenta
    // recién creada): no hay IP "conocida" contra la que comparar, así que no
    // se alerta — sería un falso positivo de bootstrap.
    const loginsTotales = await this.prisma.auditLog.count({
      where: {
        evento: 'LOGIN_OK',
        userId,
        creadoEn: { lt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (loginsTotales === 0) return;

    // ¿Hubo algún LOGIN_OK previo de este admin desde esta IP? (excluye el
    // evento actual mirando solo registros anteriores al último minuto).
    const previoMismaIp = await this.prisma.auditLog.count({
      where: {
        evento: 'LOGIN_OK',
        userId,
        ip,
        creadoEn: { lt: new Date(Date.now() - 60 * 1000) },
      },
    });
    if (previoMismaIp === 0) {
      await this.notificar(
        'LOGIN_ADMIN_IP_NUEVA',
        'Inicio de sesión de administrador desde una IP nueva',
        `Una cuenta de administrador inició sesión desde la IP ${ip}, nunca usada antes para esa cuenta. Si no fuiste tú, cambia la contraseña de inmediato.`,
      );
    }
  }

  private async detectarRegistroMasivo(): Promise<void> {
    const desde = new Date(Date.now() - REGISTRO_MASIVO_VENTANA_MS);
    const registros = await this.prisma.auditLog.count({
      where: {
        evento: { in: ['REGISTRO_OK', 'REGISTRO_EMAIL_DUPLICADO'] },
        creadoEn: { gte: desde },
      },
    });
    if (registros >= REGISTRO_MASIVO_UMBRAL) {
      await this.notificar(
        'REGISTRO_MASIVO',
        'Registro masivo de cuentas',
        `Se registraron ${registros} solicitudes de registro en los últimos 10 minutos. Podría tratarse de bots evadiendo el captcha.`,
      );
    }
  }

  private async detectarPasswordRafaga(userId: string): Promise<void> {
    const desde = new Date(Date.now() - PASSWORD_RAFAGA_VENTANA_MS);
    const cambios = await this.prisma.auditLog.count({
      where: { evento: 'PASSWORD_CAMBIADA', userId, creadoEn: { gte: desde } },
    });
    if (cambios >= PASSWORD_RAFAGA_UMBRAL) {
      await this.notificar(
        'PASSWORD_RAFAGA',
        'Cambios de contraseña en ráfaga',
        `Una cuenta cambió su contraseña ${cambios} veces en los últimos 30 minutos. Podría indicar una toma de control de la cuenta.`,
      );
    }
  }

  /**
   * Envía el email de alerta al administrador, respetando un cooldown por tipo
   * para no inundar el buzón durante un ataque sostenido.
   *
   * Limitación conocida: el cooldown vive en memoria del proceso. En el plan
   * actual de hosting hay una sola instancia, así que es suficiente; si se
   * escalara a varias instancias o el proceso se reinicia, el cooldown se
   * reinicia con él. Aceptable: el peor caso es algún email de más, no de menos.
   */
  private async notificar(tipo: TipoAlerta, titulo: string, detalle: string): Promise<void> {
    const ahora = Date.now();
    const ultima = this.ultimaAlerta.get(tipo) ?? 0;
    if (ahora - ultima < COOLDOWN_ALERTA_MS) return;

    this.logger.warn(`Alerta de seguridad: ${tipo} — ${detalle}`);
    const enviado = await this.notificaciones.notificarAlertaSeguridad(titulo, detalle);
    // El cooldown se marca solo si el correo se envió: si SendGrid falló, la
    // próxima detección reintentará en vez de quedar silenciada 30 minutos.
    if (enviado) {
      this.ultimaAlerta.set(tipo, ahora);
    }
  }
}
