import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { PasswordResetService } from './password-reset.service';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { NotificacionesService } from '../notificaciones.service';

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

const mockPrisma = {
  passwordResetToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: { findUnique: jest.fn() },
  // $transaction recibe un callback y lo ejecuta de inmediato (sin transacción real).
  $transaction: jest.fn(async (cb: () => Promise<unknown>) => cb()),
};

const mockUsersService = {
  buscarPorEmail: jest.fn(),
  resetearPassword: jest.fn().mockResolvedValue({ ok: true }),
};

const mockNotificaciones = {
  notificarResetPassword: jest.fn().mockResolvedValue(undefined),
  notificarResetCuentaGoogle: jest.fn().mockResolvedValue(undefined),
  notificarPasswordCambiada: jest.fn().mockResolvedValue(undefined),
};

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    jest.clearAllMocks();
  });

  describe('solicitarReset', () => {
    it('responde mensaje neutro y no genera token si el email no existe', async () => {
      mockUsersService.buscarPorEmail.mockResolvedValue(null);

      const res = await service.solicitarReset('noexiste@test.cl', '1.2.3.4');

      expect(res).toHaveProperty('mensaje');
      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mockNotificaciones.notificarResetPassword).not.toHaveBeenCalled();
    });

    it('genera token y envía email si el email existe', async () => {
      mockUsersService.buscarPorEmail.mockResolvedValue({
        id: 'u-1',
        email: 'ana@test.cl',
        telefono: '+56911112222',
        proveedor: 'LOCAL',
      });

      await service.solicitarReset('ana@test.cl', '1.2.3.4');

      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
      const llamada = mockPrisma.passwordResetToken.create.mock.calls[0] as [
        { data: { userId: string; tokenHash: string; expiraEn: Date } },
      ];
      const data = llamada[0].data;
      expect(data.userId).toBe('u-1');
      // En la DB se guarda el SHA-256 (64 hex), nunca el token en claro.
      expect(data.tokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(data.expiraEn.getTime()).toBeGreaterThan(Date.now());
      expect(mockNotificaciones.notificarResetPassword).toHaveBeenCalledTimes(
        1,
      );
    });

    it('para cuentas de Google no genera token y envía aviso distinto', async () => {
      mockUsersService.buscarPorEmail.mockResolvedValue({
        id: 'u-g',
        email: 'google@test.cl',
        telefono: 'PENDIENTE',
        proveedor: 'GOOGLE',
      });

      await service.solicitarReset('google@test.cl', '1.2.3.4');

      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mockNotificaciones.notificarResetPassword).not.toHaveBeenCalled();
      expect(
        mockNotificaciones.notificarResetCuentaGoogle,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('confirmarReset', () => {
    it('lanza BadRequestException si el token no existe', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.confirmarReset('token-malo', 'NuevaPass1!'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockUsersService.resetearPassword).not.toHaveBeenCalled();
    });

    it('lanza BadRequestException si el token ya fue usado', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 't-1',
        userId: 'u-1',
        usado: true,
        expiraEn: new Date(Date.now() + 60_000),
      });

      await expect(
        service.confirmarReset('token', 'NuevaPass1!'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza BadRequestException si el token expiró', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 't-1',
        userId: 'u-1',
        usado: false,
        expiraEn: new Date(Date.now() - 60_000),
      });

      await expect(
        service.confirmarReset('token', 'NuevaPass1!'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resetea la contraseña, marca el token usado e invalida los demás', async () => {
      const tokenEnClaro = 'token-valido';
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 't-1',
        userId: 'u-1',
        usado: false,
        expiraEn: new Date(Date.now() + 60_000),
        tokenHash: hashToken(tokenEnClaro),
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'ana@test.cl',
      });

      const res = await service.confirmarReset(tokenEnClaro, 'NuevaPass1!');

      expect(res).toEqual({ ok: true });
      expect(mockUsersService.resetearPassword).toHaveBeenCalledWith(
        'u-1',
        'NuevaPass1!',
      );
      expect(mockPrisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { usado: true },
      });
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u-1', usado: false },
      });
      expect(
        mockNotificaciones.notificarPasswordCambiada,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
