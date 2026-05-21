import { HttpException } from '@nestjs/common';
import { LoginLockoutService } from './login-lockout.service';

const mockPrisma = {
  loginIntento: {
    deleteMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

describe('LoginLockoutService', () => {
  let service: LoginLockoutService;

  beforeEach(() => {
    service = new LoginLockoutService(mockPrisma as never);
    jest.clearAllMocks();
    mockPrisma.loginIntento.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.loginIntento.create.mockResolvedValue({});
  });

  describe('verificarBloqueo', () => {
    it('no bloquea si hay menos fallos que el umbral', async () => {
      mockPrisma.loginIntento.count.mockResolvedValue(2);
      await expect(
        service.verificarBloqueo('a@test.cl', '1.2.3.4'),
      ).resolves.toBeUndefined();
    });

    it('bloquea con 429 si se alcanza el umbral y el último fallo es reciente', async () => {
      mockPrisma.loginIntento.count.mockResolvedValue(5);
      mockPrisma.loginIntento.findFirst.mockResolvedValue({
        creadoEn: new Date(Date.now() - 60_000), // hace 1 min, dentro del bloqueo
      });
      await expect(
        service.verificarBloqueo('a@test.cl', '1.2.3.4'),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('no bloquea si el último fallo es viejo y el bloqueo ya expiró', async () => {
      mockPrisma.loginIntento.count.mockResolvedValue(5);
      mockPrisma.loginIntento.findFirst.mockResolvedValue({
        creadoEn: new Date(Date.now() - 40 * 60_000), // hace 40 min > bloqueo de 30
      });
      await expect(
        service.verificarBloqueo('a@test.cl', '1.2.3.4'),
      ).resolves.toBeUndefined();
    });

    it('el bloqueo escala: con 15 fallos sigue bloqueado tras 1 hora', async () => {
      mockPrisma.loginIntento.count.mockResolvedValue(15);
      mockPrisma.loginIntento.findFirst.mockResolvedValue({
        creadoEn: new Date(Date.now() - 60 * 60_000), // hace 1h, bloqueo de 3h
      });
      await expect(
        service.verificarBloqueo('a@test.cl', '1.2.3.4'),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('omite el lockout (no consulta la BD) si la IP es indeterminada', async () => {
      await expect(
        service.verificarBloqueo('a@test.cl', '?'),
      ).resolves.toBeUndefined();
      expect(mockPrisma.loginIntento.count).not.toHaveBeenCalled();
    });
  });

  describe('registrarIntento', () => {
    it('un fallo inserta una fila con exitoso=false', async () => {
      await service.registrarIntento('a@test.cl', '1.2.3.4', false);
      expect(mockPrisma.loginIntento.create).toHaveBeenCalledWith({
        data: { email: 'a@test.cl', ip: '1.2.3.4', exitoso: false },
      });
    });

    it('un éxito borra los fallos previos y registra el éxito', async () => {
      await service.registrarIntento('a@test.cl', '1.2.3.4', true);
      expect(mockPrisma.loginIntento.deleteMany).toHaveBeenCalledWith({
        where: { email: 'a@test.cl', ip: '1.2.3.4', exitoso: false },
      });
      expect(mockPrisma.loginIntento.create).toHaveBeenCalledWith({
        data: { email: 'a@test.cl', ip: '1.2.3.4', exitoso: true },
      });
    });

    it('un fallo de BD al registrar no se propaga (el login no debe romperse)', async () => {
      mockPrisma.loginIntento.create.mockRejectedValue(new Error('BD caída'));
      await expect(
        service.registrarIntento('a@test.cl', '1.2.3.4', false),
      ).resolves.toBeUndefined();
    });
  });
});
