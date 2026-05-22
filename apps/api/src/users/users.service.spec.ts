import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService, TELEFONO_PENDIENTE } from './users.service';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../common/audit.service';
import { mockAuditService } from '../common/audit.mock';
import { NotificacionesService } from '../notificaciones.service';
import * as bcrypt from 'bcryptjs';

// Extrae, ya tipado, el primer argumento de la primera llamada a un mock de
// Prisma. Evita el `any` que arrastra `jest.fn().mock.calls`.
function primerArg<T>(mockFn: jest.Mock): T {
  const calls = mockFn.mock.calls as unknown[][];
  return calls[0][0] as T;
}

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockNotificaciones = {
    notificarPasswordCambiada: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crear', () => {
    it('rechaza contraseñas demasiado cortas', async () => {
      await expect(
        service.crear('Test', 'test@test.cl', '123456', 'corta'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('crea el usuario con la contraseña hasheada', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'u-1' });
      await service.crear('Test', 'TEST@Test.cl ', '123456', 'Password1!');
      const arg = primerArg<{ data: { email: string; password: string } }>(
        mockPrisma.user.create,
      ).data;
      expect(arg.email).toBe('test@test.cl');
      expect(arg.password).not.toBe('Password1!');
      expect(await bcrypt.compare('Password1!', arg.password)).toBe(true);
    });
  });

  describe('buscarPorId', () => {
    it('no incluye el campo password en el select', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1' });
      await service.buscarPorId('u-1');
      const select = primerArg<{ select: Record<string, boolean> }>(
        mockPrisma.user.findUnique,
      ).select;
      expect(select.password).toBeUndefined();
      expect(select.id).toBe(true);
    });
  });

  describe('buscarOCrearGoogle', () => {
    it('devuelve el usuario existente sin crear uno nuevo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        nombre: 'Ana',
        email: 'ana@test.cl',
        rol: 'TUTOR',
        telefono: '+56911112222',
        tokenVersion: 2,
      });
      const result = await service.buscarOCrearGoogle(
        'ANA@Test.cl ',
        'Ana Google',
      );
      expect(result).toEqual({
        id: 'u-1',
        nombre: 'Ana',
        email: 'ana@test.cl',
        rol: 'TUTOR',
        telefono: '+56911112222',
        tokenVersion: 2,
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('crea un usuario nuevo con teléfono PENDIENTE y password bloqueada', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'u-2',
        nombre: 'Beto',
        email: 'beto@test.cl',
        rol: 'TUTOR',
        telefono: TELEFONO_PENDIENTE,
        tokenVersion: 0,
      });
      const result = await service.buscarOCrearGoogle(
        'beto@test.cl',
        'Beto Google',
      );
      const data = primerArg<{
        data: {
          telefono: string;
          rol: string;
          proveedor: string;
          password: string;
        };
      }>(mockPrisma.user.create).data;
      expect(data.telefono).toBe(TELEFONO_PENDIENTE);
      expect(data.rol).toBe('TUTOR');
      // La cuenta creada vía Google se marca con proveedor GOOGLE.
      expect(data.proveedor).toBe('GOOGLE');
      // El constraint de la DB exige >= 60 chars; un hash bcrypt mide 60.
      expect(data.password.length).toBeGreaterThanOrEqual(60);
      expect(result.telefono).toBe(TELEFONO_PENDIENTE);
      expect(result.tokenVersion).toBe(0);
    });
  });

  describe('cambiarPassword', () => {
    it('lanza UnauthorizedException si la contraseña actual no coincide', async () => {
      const hash = await bcrypt.hash('CorrectPass1!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        password: hash,
      });
      await expect(
        service.cambiarPassword('u-1', 'WrongPass1!', 'NewPass1!'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.cambiarPassword('no-existe', 'Actual1!', 'Nueva1234!'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('incrementa tokenVersion al cambiar la contraseña — invalida sesiones previas', async () => {
      const hash = await bcrypt.hash('Actual1234!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        password: hash,
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'u-1' });
      await service.cambiarPassword('u-1', 'Actual1234!', 'Nueva12345!');
      const updateArg = primerArg<{ data: { tokenVersion: unknown } }>(
        mockPrisma.user.update,
      );
      expect(updateArg.data.tokenVersion).toEqual({ increment: 1 });
    });

    it('notifica al usuario por email tras un cambio de contraseña exitoso', async () => {
      const hash = await bcrypt.hash('Actual1234!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        password: hash,
        email: 'ana@test.cl',
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'u-1' });
      await service.cambiarPassword('u-1', 'Actual1234!', 'Nueva12345!');
      expect(mockNotificaciones.notificarPasswordCambiada).toHaveBeenCalledWith(
        'ana@test.cl',
      );
    });
  });

  describe('obtenerEstadoSesion', () => {
    it('devuelve tokenVersion y eliminado=false para una cuenta activa', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        tokenVersion: 5,
        eliminadoEn: null,
      });
      expect(await service.obtenerEstadoSesion('u-1')).toEqual({
        tokenVersion: 5,
        eliminado: false,
      });
    });

    it('devuelve eliminado=true si la cuenta tiene eliminadoEn', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        tokenVersion: 2,
        eliminadoEn: new Date(),
      });
      expect(await service.obtenerEstadoSesion('u-1')).toEqual({
        tokenVersion: 2,
        eliminado: true,
      });
    });

    it('devuelve null si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      expect(await service.obtenerEstadoSesion('no-existe')).toBeNull();
    });
  });

  describe('marcarEliminada', () => {
    it('marca eliminadoEn e incrementa tokenVersion', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        eliminadoEn: null,
      });
      mockPrisma.user.update.mockResolvedValue({ id: 'u-1' });
      await service.marcarEliminada('u-1');
      const data = primerArg<{
        data: { eliminadoEn: unknown; tokenVersion: unknown };
      }>(mockPrisma.user.update).data;
      expect(data.eliminadoEn).toBeInstanceOf(Date);
      expect(data.tokenVersion).toEqual({ increment: 1 });
    });

    it('rechaza si la cuenta ya estaba marcada para eliminación', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        eliminadoEn: new Date(),
      });
      await expect(service.marcarEliminada('u-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.marcarEliminada('no-existe')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
