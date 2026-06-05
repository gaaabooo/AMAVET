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

// Helper para extraer el primer argumento del último update llamado, con un
// tipo razonable (los mocks de jest sin genéricos pierden el tipo del arg).
interface UpdateArg {
  where: { id: string };
  data: {
    estado: string;
    archivoUrl?: string | null;
    subidoEn?: Date | null;
  };
}
function leerArgUpdate(): UpdateArg {
  const calls = mockPrisma.examen.update.mock.calls as unknown as UpdateArg[][];
  return calls[0][0];
}

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

    it('permite volver de DISPONIBLE a PENDIENTE (corregir un PDF mal subido)', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
      });
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'PENDIENTE',
      });

      const result = await service.actualizarEstado('ex-1', 'PENDIENTE');

      expect(result.estado).toBe('PENDIENTE');
      expect(mockPrisma.examen.update).toHaveBeenCalledTimes(1);
    });

    it('rechaza una transición inválida (EN_PROCESO no vuelve a PENDIENTE)', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'EN_PROCESO',
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

      const updateArg = leerArgUpdate();
      expect(updateArg.where).toEqual({ id: 'ex-1' });
      expect(updateArg.data.estado).toBe('DISPONIBLE');
      expect(updateArg.data.archivoUrl).toBe('ruta/archivo.pdf');
      expect(updateArg.data.subidoEn).toBeInstanceOf(Date);
    });

    it('marca subidoEn al pasar EN_PROCESO -> DISPONIBLE', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'EN_PROCESO',
      });
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
      });

      await service.actualizarEstado('ex-1', 'DISPONIBLE');

      const updateArg = leerArgUpdate();
      expect(updateArg.data.estado).toBe('DISPONIBLE');
      expect(updateArg.data.subidoEn).toBeInstanceOf(Date);
    });

    it('limpia subidoEn al volver DISPONIBLE -> PENDIENTE (borrar PDF)', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
      });
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'PENDIENTE',
      });

      await service.actualizarEstado('ex-1', 'PENDIENTE');

      const updateArg = leerArgUpdate();
      expect(updateArg.data.estado).toBe('PENDIENTE');
      expect(updateArg.data.subidoEn).toBeNull();
    });

    it('borra el blob de Storage al volver DISPONIBLE -> PENDIENTE si habia archivoUrl (hallazgo M-1)', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
        archivoUrl: 'ex-1/abc-123.pdf',
      });
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'PENDIENTE',
      });

      await service.actualizarEstado('ex-1', 'PENDIENTE');

      expect(mockSupabase.borrarArchivo).toHaveBeenCalledWith(
        'ex-1/abc-123.pdf',
      );
    });

    it('NO borra blob en transiciones que no son DISPONIBLE -> PENDIENTE', async () => {
      mockPrisma.examen.findUnique.mockResolvedValue({
        id: 'ex-1',
        estado: 'EN_PROCESO',
        archivoUrl: null,
      });
      mockPrisma.examen.update.mockResolvedValue({
        id: 'ex-1',
        estado: 'DISPONIBLE',
      });

      await service.actualizarEstado('ex-1', 'DISPONIBLE');

      expect(mockSupabase.borrarArchivo).not.toHaveBeenCalled();
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
