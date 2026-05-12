import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CitasService } from './citas.service';
import { PrismaService } from '../prisma.service';
import { NotificacionesService } from '../notificaciones.service';

const tutorMock = { id: 'tutor-1', email: 'tutor@test.cl' };
const mascotaConTutorMock = { id: 'mascota-1', nombre: 'Firulais', tutorId: 'tutor-1', tutor: tutorMock };

const mockPrisma = {
  mascota: { findUnique: jest.fn() },
  cita: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockNotificaciones = {
  notificarCitaAgendada: jest.fn().mockResolvedValue(undefined),
  notificarEstadoCita: jest.fn().mockResolvedValue(undefined),
};

describe('CitasService', () => {
  let service: CitasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitasService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    }).compile();

    service = module.get<CitasService>(CitasService);
    jest.clearAllMocks();
  });

  describe('crear', () => {
    const fechaFutura = new Date(Date.now() + 86_400_000).toISOString();

    it('crea la cita y envía notificación', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaConTutorMock);
      mockPrisma.cita.create.mockResolvedValue({ id: 'cita-1' });

      const result = await service.crear(fechaFutura, 'Av. Test 123', ['Consulta'], 'mascota-1');

      expect(result).toEqual({ id: 'cita-1' });
      expect(mockPrisma.cita.create).toHaveBeenCalledTimes(1);
      expect(mockNotificaciones.notificarCitaAgendada).toHaveBeenCalledTimes(1);
    });

    it('lanza BadRequestException si la fecha es inválida', async () => {
      await expect(
        service.crear('no-es-fecha', 'Av. Test', ['Consulta'], 'mascota-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza BadRequestException si la fecha es en el pasado', async () => {
      const fechaPasada = new Date(Date.now() - 86_400_000).toISOString();

      await expect(
        service.crear(fechaPasada, 'Av. Test', ['Consulta'], 'mascota-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lanza NotFoundException si la mascota no existe', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(null);

      await expect(
        service.crear(fechaFutura, 'Av. Test', ['Consulta'], 'mascota-inexistente'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('actualizarEstado', () => {
    const citaMock = {
      id: 'cita-1',
      estado: 'PENDIENTE',
      fecha: new Date(),
      mascota: { nombre: 'Firulais', tutor: tutorMock },
    };

    it('actualiza el estado y notifica si es CONFIRMADA', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue(citaMock);
      mockPrisma.cita.update.mockResolvedValue({ ...citaMock, estado: 'CONFIRMADA' });

      const result = await service.actualizarEstado('cita-1', 'CONFIRMADA');

      expect(result.estado).toBe('CONFIRMADA');
      expect(mockNotificaciones.notificarEstadoCita).toHaveBeenCalledTimes(1);
    });

    it('actualiza el estado y notifica si es CANCELADA', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue(citaMock);
      mockPrisma.cita.update.mockResolvedValue({ ...citaMock, estado: 'CANCELADA' });

      await service.actualizarEstado('cita-1', 'CANCELADA');

      expect(mockNotificaciones.notificarEstadoCita).toHaveBeenCalledTimes(1);
    });

    it('no notifica si el estado es PENDIENTE', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue(citaMock);
      mockPrisma.cita.update.mockResolvedValue(citaMock);

      await service.actualizarEstado('cita-1', 'PENDIENTE');

      expect(mockNotificaciones.notificarEstadoCita).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si la cita no existe', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue(null);

      await expect(
        service.actualizarEstado('no-existe', 'CANCELADA'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('esDuenoDeMascota', () => {
    it('retorna true si el tutorId coincide', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue({ tutorId: 'tutor-1' });
      expect(await service.esDuenoDeMascota('mascota-1', 'tutor-1')).toBe(true);
    });

    it('retorna false si el tutorId no coincide', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue({ tutorId: 'tutor-1' });
      expect(await service.esDuenoDeMascota('mascota-1', 'otro-tutor')).toBe(false);
    });

    it('retorna false si la mascota no existe', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(null);
      expect(await service.esDuenoDeMascota('no-existe', 'tutor-1')).toBe(false);
    });
  });
});
