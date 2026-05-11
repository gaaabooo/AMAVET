import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CitasService } from './citas.service';
import { PrismaService } from '../prisma.service';

const mockPrisma = {
  mascota: { findUnique: jest.fn() },
  cita: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('CitasService', () => {
  let service: CitasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CitasService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CitasService>(CitasService);
    jest.clearAllMocks();
  });

  describe('crear', () => {
    const mascotaMock = { id: 'mascota-1', tutorId: 'tutor-1' };
    const fechaFutura = new Date(Date.now() + 86_400_000).toISOString();

    it('crea la cita con fecha válida en el futuro', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaMock);
      mockPrisma.cita.create.mockResolvedValue({ id: 'cita-1' });

      const result = await service.crear(fechaFutura, 'Av. Test 123', ['Consulta'], 'mascota-1');

      expect(result).toEqual({ id: 'cita-1' });
      expect(mockPrisma.cita.create).toHaveBeenCalledTimes(1);
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
    it('actualiza el estado si la cita existe', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue({ id: 'cita-1', estado: 'PENDIENTE' });
      mockPrisma.cita.update.mockResolvedValue({ id: 'cita-1', estado: 'CONFIRMADA' });

      const result = await service.actualizarEstado('cita-1', 'CONFIRMADA');

      expect(result.estado).toBe('CONFIRMADA');
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

      const result = await service.esDuenoDeMascota('mascota-1', 'tutor-1');

      expect(result).toBe(true);
    });

    it('retorna false si el tutorId no coincide', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue({ tutorId: 'tutor-1' });

      const result = await service.esDuenoDeMascota('mascota-1', 'otro-tutor');

      expect(result).toBe(false);
    });

    it('retorna false si la mascota no existe', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(null);

      const result = await service.esDuenoDeMascota('no-existe', 'tutor-1');

      expect(result).toBe(false);
    });
  });
});
