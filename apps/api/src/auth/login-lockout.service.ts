import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// A partir de cuántos fallos recientes (misma combinación email+ip) empieza el
// bloqueo.
const UMBRAL_FALLOS = 5;

// Ventana en la que se cuentan los fallos para evaluar el bloqueo.
const VENTANA_FALLOS_MS = 6 * 60 * 60 * 1000; // 6 horas

// Edad a partir de la cual una fila de LoginIntento se purga (limpieza).
// INVARIANTE: debe ser siempre >= VENTANA_FALLOS_MS, o la purga borraría
// fallos que la ventana aún quiere contar y reiniciaría el escalado.
const EDAD_PURGA_MS = 24 * 60 * 60 * 1000; // 24 horas

// Escalado del bloqueo: a más fallos acumulados, más tiempo de espera. El
// bloqueo se cuenta desde el último fallo registrado. El tramo bajo es de
// 30 min (no 15) para que con el umbral de 5 fallos un atacante no pueda
// sostener un goteo de muchos intentos por hora.
function duracionBloqueoMs(fallos: number): number {
  if (fallos >= 15) return 3 * 60 * 60 * 1000; // 3 horas
  if (fallos >= 10) return 60 * 60 * 1000; // 1 hora
  return 30 * 60 * 1000; // 30 minutos
}

@Injectable()
export class LoginLockoutService {
  private readonly logger = new Logger(LoginLockoutService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Lanza HTTP 429 si la combinación email+ip está bloqueada por demasiados
   * intentos fallidos recientes. El bloqueo escala con la cantidad de fallos.
   *
   * Nota sobre concurrencia: el conteo y el registro no son atómicos. La
   * defensa contra ráfagas simultáneas es el @Throttle por IP del controlador
   * (5/min); este lockout es la defensa contra fuerza bruta sostenida y lenta.
   */
  async verificarBloqueo(email: string, ip: string): Promise<void> {
    // Una IP indeterminada agrupa a usuarios no relacionados bajo la misma
    // clave. En producción no debería ocurrir (trust proxy configurado): si
    // ocurre, se alerta para detectarlo, y no se aplica el lockout por email+ip
    // para no convertirlo en un DoS entre usuarios distintos.
    if (ip === '?') {
      this.logger.warn(
        'Login con IP indeterminada: lockout por email+ip omitido (revisar trust proxy)',
      );
      return;
    }

    // Purga oportunista de filas viejas (evita necesitar un cron dedicado).
    await this.prisma.loginIntento
      .deleteMany({
        where: { creadoEn: { lt: new Date(Date.now() - EDAD_PURGA_MS) } },
      })
      .catch(() => undefined); // la limpieza nunca debe romper el login

    const desde = new Date(Date.now() - VENTANA_FALLOS_MS);
    const filtroFallos = {
      email,
      ip,
      exitoso: false,
      creadoEn: { gte: desde },
    };

    const numeroFallos = await this.prisma.loginIntento.count({ where: filtroFallos });
    if (numeroFallos < UMBRAL_FALLOS) return;

    // El bloqueo se mide desde el fallo más reciente.
    const ultimo = await this.prisma.loginIntento.findFirst({
      where: filtroFallos,
      orderBy: { creadoEn: 'desc' },
      select: { creadoEn: true },
    });
    if (!ultimo) return;

    const finBloqueo = ultimo.creadoEn.getTime() + duracionBloqueoMs(numeroFallos);
    if (Date.now() < finBloqueo) {
      // Mensaje genérico: no se revela el tiempo exacto restante para no dar
      // al atacante telemetría del tramo de escalado en que se encuentra.
      throw new HttpException(
        'Demasiados intentos fallidos. Inténtalo de nuevo más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Registra un intento de login. En un intento exitoso se borran los fallos
   * previos de esa combinación email+ip (el contador se reinicia) y se deja una
   * fila de éxito — útil para análisis posterior de patrones de acceso.
   */
  async registrarIntento(email: string, ip: string, exitoso: boolean): Promise<void> {
    try {
      if (exitoso) {
        await this.prisma.loginIntento.deleteMany({
          where: { email, ip, exitoso: false },
        });
        await this.prisma.loginIntento.create({
          data: { email, ip, exitoso: true },
        });
        return;
      }
      await this.prisma.loginIntento.create({
        data: { email, ip, exitoso: false },
      });
    } catch (err) {
      // Registrar el intento nunca debe romper el flujo de login: si fallara,
      // un fallo de credenciales devolvería 500 en vez de 401, lo que sería
      // distinguible por un atacante. Se loguea y se continúa.
      this.logger.error(`No se pudo registrar el intento de login: ${String(err)}`);
    }
  }
}
