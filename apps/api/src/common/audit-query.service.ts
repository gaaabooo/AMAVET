import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { EventoAuditoria } from './audit';

// Retención del audit trail: los eventos más antiguos se purgan.
const RETENCION_DIAS = 90;

// Tope de filas por consulta (paginación).
const PAGINA_MAX = 100;

interface FiltroAuditoria {
  evento?: string;
  userId?: string;
  soloAlertas?: boolean;
  pagina?: number;
}

/**
 * Consulta del audit trail persistido, para el panel de administración.
 */
@Injectable()
export class AuditQueryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Lista eventos de auditoría con filtros y paginación. De paso purga los
   * eventos que superan la retención (limpieza oportunista, sin cron).
   */
  async listar(filtro: FiltroAuditoria) {
    // Purga oportunista de eventos vencidos. Es fire-and-forget (no se hace
    // await): un delete masivo no debe bloquear ni demorar la respuesta del
    // panel de auditoría. Si falla, se reintentará en la próxima consulta.
    void this.prisma.auditLog
      .deleteMany({
        where: {
          creadoEn: {
            lt: new Date(Date.now() - RETENCION_DIAS * 24 * 60 * 60 * 1000),
          },
        },
      })
      .catch(() => undefined);

    const where: Prisma.AuditLogWhereInput = {};
    if (filtro.evento) where.evento = filtro.evento;
    if (filtro.userId) where.userId = filtro.userId;
    if (filtro.soloAlertas) where.alerta = true;

    const pagina = Math.max(1, filtro.pagina ?? 1);

    const [total, eventos] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        skip: (pagina - 1) * PAGINA_MAX,
        take: PAGINA_MAX,
      }),
    ]);

    return {
      total,
      pagina,
      porPagina: PAGINA_MAX,
      eventos,
    };
  }
}

// Reexportado para que el DTO del controlador valide contra el catálogo.
export type { EventoAuditoria };
