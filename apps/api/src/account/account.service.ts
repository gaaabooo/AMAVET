import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase.service';
import { NotificacionesService } from '../notificaciones.service';
import { AuditService } from '../common/audit.service';

// Días que una cuenta marcada para eliminación permanece recuperable antes de
// que la purga la borre definitivamente.
export const DIAS_PERIODO_GRACIA = 30;

// Tope de cuentas a purgar por invocación. Evita que una corrida acumulada
// (cron caído mucho tiempo) exceda el timeout HTTP; el cron reintenta.
const MAX_PURGA_POR_LOTE = 100;

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private supabase: SupabaseService,
    private notificaciones: NotificacionesService,
    private audit: AuditService,
  ) {}

  /**
   * Indica si el usuario es el único ADMIN activo del sistema. Se usa para
   * impedir que el sistema quede sin administrador tras una eliminación.
   */
  async esUnicoAdminActivo(userId: string): Promise<boolean> {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { rol: true },
    });
    if (usuario?.rol !== 'ADMIN') return false;
    const adminsActivos = await this.prisma.user.count({
      where: { rol: 'ADMIN', eliminadoEn: null },
    });
    return adminsActivos <= 1;
  }

  /** Devuelve el rol de una cuenta, o null si no existe. */
  async obtenerRol(userId: string): Promise<'TUTOR' | 'ADMIN' | null> {
    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { rol: true },
    });
    return usuario?.rol ?? null;
  }

  /**
   * Inicia el soft-delete de una cuenta: la marca como eliminada, cierra sus
   * sesiones, cancela sus citas activas y envía un email de confirmación con el
   * plazo de gracia. Los datos NO se borran aún — la purga lo hace tras
   * DIAS_PERIODO_GRACIA.
   */
  async eliminarCuenta(userId: string): Promise<{ ok: true }> {
    // marcarEliminada valida que el usuario exista y que no esté ya eliminado.
    await this.usersService.marcarEliminada(userId);

    // Las citas activas del tutor se cancelan: no tiene sentido mantener
    // agenda de una cuenta que dejará de existir, y evita que el equipo
    // confirme una visita de una cuenta en vías de purga.
    await this.prisma.cita.updateMany({
      where: {
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
        mascota: { tutorId: userId },
      },
      data: { estado: 'CANCELADA' },
    });

    this.audit.registrar('CUENTA_ELIMINADA', { userId });

    const usuario = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (usuario?.email) {
      // Fire-and-forget: el email no debe bloquear la respuesta.
      void this.notificaciones.notificarCuentaEliminada(
        usuario.email,
        DIAS_PERIODO_GRACIA,
      );
    }
    return { ok: true };
  }

  /**
   * Purga definitiva de las cuentas cuyo periodo de gracia ya venció. Pensada
   * para ejecutarse a diario desde un cron externo.
   */
  async purgarCuentasVencidas(): Promise<{ purgadas: number }> {
    const limite = new Date(
      Date.now() - DIAS_PERIODO_GRACIA * 24 * 60 * 60 * 1000,
    );
    const vencidas = await this.usersService.listarVencidasParaPurga(
      limite,
      MAX_PURGA_POR_LOTE,
    );

    let purgadas = 0;
    for (const cuenta of vencidas) {
      try {
        const borrada = await this.purgarUna(cuenta.id, limite);
        if (borrada) {
          purgadas += 1;
          this.audit.registrar('CUENTA_PURGADA', { userId: cuenta.id });
        }
      } catch (err) {
        // Si una cuenta falla, se registra y se sigue con las demás: no dejar
        // que un error puntual bloquee toda la purga. Se registra solo el TIPO
        // de error, no el mensaje crudo: un error de Prisma puede contener
        // fragmentos de query con datos de fila (PII).
        const tipoError = err instanceof Error ? err.name : 'Error';
        this.audit.alertar('CUENTA_PURGADA', {
          userId: cuenta.id,
          resultado: 'ERROR',
          tipoError,
        });
        this.logger.error(
          `Error al purgar la cuenta ${cuenta.id}: ${String(err)}`,
        );
      }
    }
    return { purgadas };
  }

  /**
   * Borra de forma definitiva una sola cuenta y sus datos asociados.
   * Devuelve false si la cuenta dejó de cumplir la condición (p. ej. fue
   * reactivada entre el listado y este punto) y no se borró nada.
   *
   * Orden deliberado: PRIMERO la BD (dentro de una transacción), y SOLO si el
   * commit tuvo éxito se borran los PDF de Storage. Si se borrara Storage
   * primero y la transacción fallara, los registros clínicos quedarían con
   * archivos perdidos de forma irrecuperable. Un PDF huérfano en Storage (si su
   * borrado falla) es un problema menor y recuperable.
   */
  private async purgarUna(userId: string, limite: Date): Promise<boolean> {
    // Recolectar las rutas de los PDF ANTES de borrar la BD (después ya no
    // serían consultables).
    const examenes = await this.prisma.examen.findMany({
      where: { mascota: { tutorId: userId }, archivoUrl: { not: null } },
      select: { archivoUrl: true },
    });

    // Borrado de la BD en una transacción. Primero se confirma, dentro de la
    // misma transacción, que la cuenta SIGUE eliminada y vencida: si el usuario
    // la reactivó entre el listado y ahora, se aborta sin borrar nada.
    const resultado = await this.prisma.$transaction(async (tx) => {
      const sigueVencida = await tx.user.count({
        where: { id: userId, eliminadoEn: { not: null, lt: limite } },
      });
      if (sigueVencida === 0) {
        return false;
      }
      // Orden por las foreign keys: las mascotas referencian al usuario, así
      // que se borran ANTES (esto cascadea a exámenes y citas por
      // onDelete: Cascade); luego el usuario (cascadea a PasswordResetToken).
      await tx.mascota.deleteMany({ where: { tutorId: userId } });
      await tx.user.delete({ where: { id: userId } });
      return true;
    });

    if (!resultado) return false;

    // Commit OK: ahora sí se borran los archivos de Storage. borrarArchivo no
    // lanza (loguea su propio error); un PDF que no se borre no revierte nada.
    for (const examen of examenes) {
      if (examen.archivoUrl) {
        await this.supabase.borrarArchivo(examen.archivoUrl);
      }
    }
    return true;
  }
}
