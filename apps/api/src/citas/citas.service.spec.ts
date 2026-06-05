import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CitasService } from './citas.service';
import { PrismaService } from '../prisma.service';
import { NotificacionesService } from '../notificaciones.service';

const tutorMock = { id: 'tutor-1', email: 'tutor@test.cl' };
const mascotaConTutorMock = {
  id: 'mascota-1',
  nombre: 'Firulais',
  tutorId: 'tutor-1',
  tutor: tutorMock,
};

const mockPrisma = {
  mascota: { findUnique: jest.fn() },
  cita: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  examen: { createMany: jest.fn() },
  // $transaction ejecuta el callback de inmediato pasándole el propio mock
  // como cliente transaccional (sin transacción real). La implementación se
  // (re)aplica en beforeEach porque clearAllMocks la borra.
  $transaction: jest.fn(),
};

const mockNotificaciones = {
  notificarCitaAgendada: jest.fn().mockResolvedValue(undefined),
  notificarEstadoCita: jest.fn().mockResolvedValue(undefined),
};

// Helper para extraer el primer argumento del último createMany llamado, con un
// tipo razonable (los mocks de jest sin genéricos pierden el tipo del arg).
interface CreateManyArg {
  data: { tipo: string; citaId: string; mascotaId: string }[];
}
function leerArgCreateMany(): CreateManyArg {
  const calls = mockPrisma.examen.createMany.mock
    .calls as unknown as CreateManyArg[][];
  return calls[0][0];
}

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
    // $transaction acepta (callback, opciones). El aislamiento real solo
    // aplica contra PostgreSQL, así que el mock ignora las opciones y solo
    // ejecuta el callback. El test específico de Serializable verifica que
    // el servicio sí pasa las opciones correctamente.
    mockPrisma.$transaction.mockImplementation((cb: (tx: unknown) => unknown) =>
      cb(mockPrisma),
    );
  });

  describe('crear', () => {
    const fechaFutura = new Date(Date.now() + 86_400_000).toISOString();

    it('crea la cita y envía notificación', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaConTutorMock);
      mockPrisma.cita.count.mockResolvedValue(0);
      mockPrisma.cita.findFirst.mockResolvedValue(null);
      mockPrisma.cita.create.mockResolvedValue({ id: 'cita-1' });

      const result = await service.crear(
        fechaFutura,
        'Av. Test 123',
        ['Control Médico'],
        'mascota-1',
      );

      expect(result).toEqual({ id: 'cita-1' });
      expect(mockPrisma.cita.create).toHaveBeenCalledTimes(1);
      expect(mockNotificaciones.notificarCitaAgendada).toHaveBeenCalledTimes(1);
    });

    it('no crea exámenes si los servicios son solo consultas generales', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaConTutorMock);
      mockPrisma.cita.count.mockResolvedValue(0);
      mockPrisma.cita.findFirst.mockResolvedValue(null);
      mockPrisma.cita.create.mockResolvedValue({ id: 'cita-1' });

      await service.crear(
        fechaFutura,
        'Av. Test',
        ['Control Médico'],
        'mascota-1',
      );

      expect(mockPrisma.examen.createMany).not.toHaveBeenCalled();
    });

    it('crea un examen PENDIENTE por cada servicio de laboratorio/test', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaConTutorMock);
      mockPrisma.cita.count.mockResolvedValue(0);
      mockPrisma.cita.findFirst.mockResolvedValue(null);
      mockPrisma.cita.create.mockResolvedValue({ id: 'cita-1' });

      await service.crear(
        fechaFutura,
        'Av. Test',
        ['Control Médico', 'Examen Hemograma', 'Test de Parvovirus'],
        'mascota-1',
      );

      expect(mockPrisma.examen.createMany).toHaveBeenCalledTimes(1);
      const data = leerArgCreateMany().data;
      // Solo los 2 servicios-examen, no la consulta general.
      expect(data.map((d) => d.tipo).sort()).toEqual([
        'Examen Hemograma',
        'Test de Parvovirus',
      ]);
      expect(data.every((d) => d.citaId === 'cita-1')).toBe(true);
    });

    it('rechaza la cita si el tutor ya tiene el máximo de citas activas (D-2)', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaConTutorMock);
      mockPrisma.cita.count.mockResolvedValue(10);

      await expect(
        service.crear(fechaFutura, 'Av. Test', ['Consulta'], 'mascota-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.cita.create).not.toHaveBeenCalled();
    });

    it('rechaza la cita si hay otra en el mismo horario — doble-booking (D-1)', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaConTutorMock);
      mockPrisma.cita.count.mockResolvedValue(0);
      mockPrisma.cita.findFirst.mockResolvedValue({ id: 'cita-existente' });

      await expect(
        service.crear(fechaFutura, 'Av. Test', ['Consulta'], 'mascota-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.cita.create).not.toHaveBeenCalled();
    });

    it('ejecuta la transacción con isolationLevel Serializable (anti-race D-1/D-2)', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaConTutorMock);
      mockPrisma.cita.count.mockResolvedValue(0);
      mockPrisma.cita.findFirst.mockResolvedValue(null);
      mockPrisma.cita.create.mockResolvedValue({ id: 'cita-1' });

      await service.crear(fechaFutura, 'Av. Test', ['Consulta'], 'mascota-1');

      const txCalls = mockPrisma.$transaction.mock.calls as unknown as Array<
        [unknown, { isolationLevel?: string } | undefined]
      >;
      expect(txCalls.length).toBeGreaterThan(0);
      expect(txCalls[0][1]?.isolationLevel).toBe('Serializable');
    });

    it('reintenta una vez si Prisma aborta la transacción con P2034 (serialization_failure)', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(mascotaConTutorMock);
      mockPrisma.cita.count.mockResolvedValue(0);
      mockPrisma.cita.findFirst.mockResolvedValue(null);
      mockPrisma.cita.create.mockResolvedValue({ id: 'cita-1' });

      // Primera corrida: simulamos el conflicto de serialización. Segunda
      // corrida: la transacción se ejecuta normal y la cita se crea.
      const p2034 = Object.assign(new Error('serialization_failure'), {
        code: 'P2034',
      });
      let llamada = 0;
      mockPrisma.$transaction.mockImplementation(
        (cb: (tx: unknown) => unknown) => {
          llamada += 1;
          if (llamada === 1) throw p2034;
          return cb(mockPrisma);
        },
      );

      const result = await service.crear(
        fechaFutura,
        'Av. Test',
        ['Consulta'],
        'mascota-1',
      );

      expect(llamada).toBe(2);
      expect(result).toEqual(expect.objectContaining({ id: 'cita-1' }));
    });

    it('rechaza la cita si la fecha está demasiado lejos en el futuro', async () => {
      const muyLejos = new Date(Date.now() + 400 * 86_400_000).toISOString();

      await expect(
        service.crear(muyLejos, 'Av. Test', ['Consulta'], 'mascota-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
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
        service.crear(
          fechaFutura,
          'Av. Test',
          ['Consulta'],
          'mascota-inexistente',
        ),
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
      mockPrisma.cita.update.mockResolvedValue({
        ...citaMock,
        estado: 'CONFIRMADA',
      });

      const result = await service.actualizarEstado('cita-1', 'CONFIRMADA');

      expect(result.estado).toBe('CONFIRMADA');
      expect(mockNotificaciones.notificarEstadoCita).toHaveBeenCalledTimes(1);
    });

    it('actualiza el estado y notifica si es CANCELADA', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue(citaMock);
      mockPrisma.cita.update.mockResolvedValue({
        ...citaMock,
        estado: 'CANCELADA',
      });

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

    it('rechaza cambiar el estado de una cita ya COMPLETADA (D-4)', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue({
        ...citaMock,
        estado: 'COMPLETADA',
      });

      await expect(
        service.actualizarEstado('cita-1', 'PENDIENTE'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.cita.update).not.toHaveBeenCalled();
    });

    it('rechaza cambiar el estado de una cita ya CANCELADA (D-4)', async () => {
      mockPrisma.cita.findUnique.mockResolvedValue({
        ...citaMock,
        estado: 'CANCELADA',
      });

      await expect(
        service.actualizarEstado('cita-1', 'CONFIRMADA'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockPrisma.cita.update).not.toHaveBeenCalled();
    });
  });

  describe('esDuenoDeMascota', () => {
    it('retorna true si el tutorId coincide', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue({ tutorId: 'tutor-1' });
      expect(await service.esDuenoDeMascota('mascota-1', 'tutor-1')).toBe(true);
    });

    it('retorna false si el tutorId no coincide', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue({ tutorId: 'tutor-1' });
      expect(await service.esDuenoDeMascota('mascota-1', 'otro-tutor')).toBe(
        false,
      );
    });

    it('retorna false si la mascota no existe', async () => {
      mockPrisma.mascota.findUnique.mockResolvedValue(null);
      expect(await service.esDuenoDeMascota('no-existe', 'tutor-1')).toBe(
        false,
      );
    });
  });
});
