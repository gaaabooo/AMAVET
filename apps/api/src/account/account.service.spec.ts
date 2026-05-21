import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase.service';
import { NotificacionesService } from '../notificaciones.service';

// Cliente Prisma transaccional simulado.
const txMock = {
  user: { count: jest.fn(), delete: jest.fn() },
  mascota: { deleteMany: jest.fn() },
};

const mockPrisma = {
  user: { findUnique: jest.fn(), count: jest.fn() },
  examen: { findMany: jest.fn() },
  cita: { updateMany: jest.fn() },
  $transaction: jest.fn(),
};

const mockUsersService = {
  marcarEliminada: jest.fn(),
  listarVencidasParaPurga: jest.fn(),
};

const mockSupabase = {
  borrarArchivo: jest.fn(),
};

const mockNotificaciones = {
  notificarCuentaEliminada: jest.fn(),
};

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: SupabaseService, useValue: mockSupabase },
        { provide: NotificacionesService, useValue: mockNotificaciones },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    jest.clearAllMocks();
    mockUsersService.marcarEliminada.mockResolvedValue(undefined);
    mockSupabase.borrarArchivo.mockResolvedValue(undefined);
    mockNotificaciones.notificarCuentaEliminada.mockResolvedValue(undefined);
    mockPrisma.cita.updateMany.mockResolvedValue({ count: 0 });
    // $transaction ejecuta el callback con el tx simulado.
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof txMock) => unknown) => cb(txMock),
    );
    txMock.user.count.mockResolvedValue(1);
    txMock.user.delete.mockResolvedValue({ id: 'u-1' });
    txMock.mascota.deleteMany.mockResolvedValue({ count: 0 });
  });

  describe('eliminarCuenta', () => {
    it('marca la cuenta, cancela sus citas activas y envía el email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ email: 'ana@test.cl' });

      const res = await service.eliminarCuenta('u-1');

      expect(res).toEqual({ ok: true });
      expect(mockUsersService.marcarEliminada).toHaveBeenCalledWith('u-1');
      // Las citas PENDIENTE/CONFIRMADA del tutor se cancelan.
      expect(mockPrisma.cita.updateMany).toHaveBeenCalledWith({
        where: {
          estado: { in: ['PENDIENTE', 'CONFIRMADA'] },
          mascota: { tutorId: 'u-1' },
        },
        data: { estado: 'CANCELADA' },
      });
      expect(mockNotificaciones.notificarCuentaEliminada).toHaveBeenCalledTimes(1);
    });
  });

  describe('esUnicoAdminActivo', () => {
    it('true si el usuario es ADMIN y es el único activo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ rol: 'ADMIN' });
      mockPrisma.user.count.mockResolvedValue(1);
      expect(await service.esUnicoAdminActivo('a-1')).toBe(true);
    });

    it('false si hay más de un ADMIN activo', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ rol: 'ADMIN' });
      mockPrisma.user.count.mockResolvedValue(2);
      expect(await service.esUnicoAdminActivo('a-1')).toBe(false);
    });

    it('false si el usuario no es ADMIN', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ rol: 'TUTOR' });
      expect(await service.esUnicoAdminActivo('t-1')).toBe(false);
    });
  });

  describe('purgarCuentasVencidas', () => {
    it('purga: borra la BD en transacción y los PDFs DESPUÉS del commit', async () => {
      mockUsersService.listarVencidasParaPurga.mockResolvedValue([
        { id: 'u-1', email: 'a@test.cl' },
      ]);
      mockPrisma.examen.findMany.mockResolvedValue([
        { archivoUrl: 'u-1/abc.pdf' },
      ]);

      const res = await service.purgarCuentasVencidas();

      expect(res).toEqual({ purgadas: 1 });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(txMock.mascota.deleteMany).toHaveBeenCalledTimes(1);
      expect(txMock.user.delete).toHaveBeenCalledTimes(1);
      // El PDF se borra tras el commit de la transacción.
      expect(mockSupabase.borrarArchivo).toHaveBeenCalledWith('u-1/abc.pdf');
    });

    it('NO borra los PDFs si la cuenta fue reactivada (count 0) — H5', async () => {
      mockUsersService.listarVencidasParaPurga.mockResolvedValue([
        { id: 'u-1', email: 'a@test.cl' },
      ]);
      mockPrisma.examen.findMany.mockResolvedValue([
        { archivoUrl: 'u-1/abc.pdf' },
      ]);
      // La cuenta ya no cumple la condición dentro de la transacción.
      txMock.user.count.mockResolvedValue(0);

      const res = await service.purgarCuentasVencidas();

      expect(res).toEqual({ purgadas: 0 });
      expect(txMock.user.delete).not.toHaveBeenCalled();
      // Clave: los PDFs NO se tocan si la BD no se borró.
      expect(mockSupabase.borrarArchivo).not.toHaveBeenCalled();
    });

    it('si una cuenta falla, sigue con las demás y no aborta la purga', async () => {
      mockUsersService.listarVencidasParaPurga.mockResolvedValue([
        { id: 'u-1', email: 'a@test.cl' },
        { id: 'u-2', email: 'b@test.cl' },
      ]);
      mockPrisma.examen.findMany.mockResolvedValue([]);
      mockPrisma.$transaction
        .mockRejectedValueOnce(new Error('fallo BD'))
        .mockImplementationOnce((cb: (tx: typeof txMock) => unknown) => cb(txMock));

      const res = await service.purgarCuentasVencidas();

      expect(res).toEqual({ purgadas: 1 });
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('no purga nada si no hay cuentas vencidas', async () => {
      mockUsersService.listarVencidasParaPurga.mockResolvedValue([]);

      const res = await service.purgarCuentasVencidas();

      expect(res).toEqual({ purgadas: 0 });
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
