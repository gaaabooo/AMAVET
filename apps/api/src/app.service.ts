import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  // Health check mínimo. No expone versiones ni detalles internos.
  estado(): { status: string } {
    return { status: 'ok' };
  }

  // Healthcheck profundo: además de responder OK, hace una query trivial a
  // Postgres. Usado por el cron-keepalive para mantener viva la BD de Supabase
  // free (que se autopausa tras 7 días sin actividad). Si la BD no responde
  // devuelve db: 'down' y el llamador (cron) puede alertar.
  async salud(): Promise<{ ok: boolean; db: 'up' | 'down' }> {
    try {
      await this.prisma.$queryRaw<unknown[]>`SELECT 1`;
      return { ok: true, db: 'up' };
    } catch {
      // No propagamos el error original: podría exponer detalles del driver
      // o de la conexión a clientes anónimos.
      return { ok: false, db: 'down' };
    }
  }
}
