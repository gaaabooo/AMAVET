import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

const mockPrisma = {
  $queryRaw: jest.fn(),
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    appController = app.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('root', () => {
    it('devuelve un estado de salud sin exponer detalles internos', () => {
      expect(appController.estado()).toEqual({ status: 'ok' });
    });
  });

  describe('health', () => {
    // Helper: respuesta de Express con .status() encadenable, suficiente para
    // verificar que se setea el código correcto sin levantar HttpAdapter.
    function fakeResponse(): { res: Response; statusFn: jest.Mock } {
      const statusFn = jest.fn().mockReturnThis();
      return { res: { status: statusFn } as unknown as Response, statusFn };
    }

    it('responde ok:true y db:up cuando Postgres contesta', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const { res, statusFn } = fakeResponse();

      const resultado = await appController.salud(res);

      expect(resultado).toEqual({ ok: true, db: 'up' });
      // No se cambia el status: el default @HttpCode(200) basta.
      expect(statusFn).not.toHaveBeenCalled();
    });

    it('responde ok:false, db:down y 503 cuando Postgres falla', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('conn refused'));
      const { res, statusFn } = fakeResponse();

      const resultado = await appController.salud(res);

      expect(resultado).toEqual({ ok: false, db: 'down' });
      expect(statusFn).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });
});
