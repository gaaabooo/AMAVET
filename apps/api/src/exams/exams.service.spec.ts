import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { PrismaService } from '../prisma.service';
import { SupabaseService } from '../supabase.service';
import { NotificacionesService } from '../notificaciones.service';
import { AuditService } from '../common/audit.service';
import { mockAuditService } from '../common/audit.mock';

const mockPrisma = {
  examen: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  mascota: {
    findUnique: jest.fn(),
  },
};

const mockSupabase = {
  subirArchivo: jest.fn(),
  borrarArchivo: jest.fn().mockResolvedValue(undefined),
  generarUrlFirmada: jest
    .fn()
    .mockResolvedValue('https://signed-url.example.com/file.pdf'),
};

const mockNotificaciones = {
  notificarExamenDisponible: jest.fn(),
};

describe('ExamsService', () => {
  let service: ExamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: NotificacionesService, useValue: mockNotificaciones },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    jest.clearAllMocks();
  });

  describe('actualizarEstado', () => {
    it('actualiza el estado si la transición es válida', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'PENDIENTE',
      });
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'EN_PROCESO',
      });

      const result = await service.actualizarEstado('ex-1', 'EN_PROCESO');

      expect(result.estado).toBe('EN_PROCESO');
      expect(mockPrisma.examen.update).toHaveBeenCalledTimes(1);
    });

    it('rechaza una transición inválida (DISPONIBLE no vuelve a PENDIENTE)', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
      });

      await expect(
        service.actualizarEstado('ex-1', 'PENDIENTE'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.examen.update).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el examen no existe', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue(null);

      await expect(
        service.actualizarEstado('no-existe', 'DISPONIBLE'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('incluye archivoUrl en la actualización si se provee', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'EN_PROCESO',
      });
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
        archivoUrl: 'ruta/archivo.pdf',
      });

      await service.actualizarEstado('ex-1', 'DISPONIBLE', 'ruta/archivo.pdf');

      expect(mockPrisma.examen.update).toHaveBeenCalledWith({
        where: { id: 'ex-1' },
        data: { estado: 'DISPONIBLE', archivoUrl: 'ruta/archivo.pdf' },
      });
    });
  });

  describe('generarUrlDescarga', () => {
    it('genera una URL firmada si el examen tiene archivo', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        archivoUrl: 'ruta/archivo.pdf',
      });

      const url = await service.generarUrlDescarga('ex-1');

      expect(url).toBe('https://signed-url.example.com/file.pdf');
      expect(mockSupabase.generarUrlFirmada).toHaveBeenCalledWith(
        'ruta/archivo.pdf',
      );
    });

    it('lanza NotFoundException si el examen no existe', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue(null);

      await expect(
        service.generarUrlDescarga('no-existe'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza NotFoundException si el examen no tiene archivo', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        archivoUrl: null,
      });

      await expect(service.generarUrlDescarga('ex-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('esDuenoMascota', () => {
    it('retorna true si el tutorId coincide', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue({ tutorId: 'tutor-1' });

      expect(await service.esDuenoMascota('mascota-1', 'tutor-1')).toBe(true);
    });

    it('retorna false si la mascota no existe', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(null);

      expect(await service.esDuenoMascota('no-existe', 'tutor-1')).toBe(false);
    });
  });

  describe('subirArchivo', () => {
    it('sube el archivo, actualiza el estado, y envía notificación', async () => {
      const examenMock = {
        id: 'ex-1',
        estado: 'EN_PROCESO',
        mascota: { nombre: 'Firulais', tutor: { email: 'tutor@test.cl' } },
      };
      mockPrisma.examen.findUnique
        .mockResolvedValueOnce(examenMock)
        .mockResolvedValueOnce(examenMock);
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
      });
      mockSupabase.subirArchivo.mockResolvedValue(undefined);

      const archivo = {
        buffer: Buffer.from('pdf'),
        size: 3,
      } as Express.Multer.File;
      await service.subirArchivo('ex-1', archivo);

      expect(mockSupabase.subirArchivo).toHaveBeenCalledTimes(1);
      expect(mockPrisma.examen.update).toHaveBeenCalledTimes(1);
      expect(mockNotificaciones.notificarExamenDisponible).toHaveBeenCalledWith(
        'tutor@test.cl',
        'Firulais',
        'https://signed-url.example.com/file.pdf',
      );
    });

    it('no falla si la notificación lanza error', async () => {
      const examenMock = {
        id: 'ex-1',
        estado: 'EN_PROCESO',
        mascota: { nombre: 'Firulais', tutor: { email: 'tutor@test.cl' } },
      };
      mockPrisma.examen.findUnique
        .mockResolvedValueOnce(examenMock)
        .mockResolvedValueOnce(examenMock);
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
      });
      mockSupabase.subirArchivo.mockResolvedValue(undefined);
      mockNotificaciones.notificarExamenDisponible.mockRejectedValue(
        new Error('SMTP down'),
      );

      const archivo = {
        buffer: Buffer.from('pdf'),
        size: 3,
      } as Express.Multer.File;
      await expect(
        service.subirArchivo('ex-1', archivo),
      ).resolves.toBeDefined();
    });

    it('borra el archivo de Storage si falla el guardado en BD (compensación M-1)', async () => {
      const examenMock = {
        id: 'ex-1',
        estado: 'EN_PROCESO',
        mascota: { nombre: 'Firulais', tutor: { email: 'tutor@test.cl' } },
      };
      // findUnique: 1ª vez en buscarPorId (subirArchivo), 2ª en actualizarEstado.
      mockPrisma.examen.findUnique
        .mockResolvedValueOnce(examenMock)
        .mockResolvedValueOnce(examenMock);
      mockSupabase.subirArchivo.mockResolvedValue(undefined);
      // El guardado en BD falla después de que el archivo ya subió a Storage.
      mockPrisma.examen.update.mockRejectedValue(new Error('BD caída'));

      const archivo = {
        buffer: Buffer.from('pdf'),
        size: 3,
      } as Express.Multer.File;

      await expect(service.subirArchivo('ex-1', archivo)).rejects.toThrow(
        'BD caída',
      );
      // El archivo huérfano se borra para que un reintento parta limpio.
      expect(mockSupabase.borrarArchivo).toHaveBeenCalledTimes(1);
    });
  });
});
