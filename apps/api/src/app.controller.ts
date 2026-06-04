import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  estado(): { status: string } {
    return this.appService.estado();
  }

  // Healthcheck profundo: toca BD. Diseñado para el cron-keepalive y para
  // monitoreo externo (uptime trackers). Throttle estricto: 6 req/min por IP,
  // suficiente para keepalive cada 3 días y monitoreo cada 5 minutos, y bloquea
  // abuso. Si la BD está caída, responde 503 (no 200 con flag) para que un
  // monitor lo interprete como caída sin parsear el body.
  @Get('health')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async salud(
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: boolean; db: 'up' | 'down' }> {
    const resultado = await this.appService.salud();
    if (!resultado.ok) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return resultado;
  }
}
