import { AuditAlertService } from './audit-alert.service';

const mockPrisma = {
  auditLog: { count: jest.fn() },
};

const mockNotificaciones = {
  notificarAlertaSeguridad: jest.fn().mockResolvedValue(true),
};

describe('AuditAlertService', () => {
  let service: AuditAlertService;

  beforeEach(() => {
    service = new AuditAlertService(
      mockPrisma as never,
      mockNotificaciones as never,
    );
    jest.clearAllMocks();
    mockNotificaciones.notificarAlertaSeguridad.mockResolvedValue(true);
  });

  describe('fuerza bruta por IP', () => {
    it('alerta si hay 10 o más LOGIN_FALLIDO desde la misma IP', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(10);
      await service.evaluar('LOGIN_FALLIDO', { ip: '1.2.3.4' });
      expect(mockNotificaciones.notificarAlertaSeguridad).toHaveBeenCalledTimes(1);
    });

    it('no alerta por debajo del umbral', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(4);
      await service.evaluar('LOGIN_FALLIDO', { ip: '1.2.3.4' });
      expect(mockNotificaciones.notificarAlertaSeguridad).not.toHaveBeenCalled();
    });
  });

  describe('login admin desde IP nueva', () => {
    it('alerta si un admin con historial entra desde una IP nueva', async () => {
      // 1ª count = logins totales (>0, tiene historial), 2ª = desde esa IP (0).
      mockPrisma.auditLog.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(0);
      await service.evaluar('LOGIN_OK', {
        userId: 'admin-1',
        ip: '9.9.9.9',
        rol: 'ADMIN',
      });
      expect(mockNotificaciones.notificarAlertaSeguridad).toHaveBeenCalledTimes(1);
    });

    it('NO alerta en el primer login de un admin nuevo (sin historial)', async () => {
      // logins totales = 0: es el bootstrap, no hay IP conocida con qué comparar.
      mockPrisma.auditLog.count.mockResolvedValue(0);
      await service.evaluar('LOGIN_OK', {
        userId: 'admin-nuevo',
        ip: '9.9.9.9',
        rol: 'ADMIN',
      });
      expect(mockNotificaciones.notificarAlertaSeguridad).not.toHaveBeenCalled();
    });

    it('no alerta si el admin ya había entrado desde esa IP', async () => {
      // logins totales >0 y también >0 desde esa IP.
      mockPrisma.auditLog.count.mockResolvedValue(3);
      await service.evaluar('LOGIN_OK', {
        userId: 'admin-1',
        ip: '1.2.3.4',
        rol: 'ADMIN',
      });
      expect(mockNotificaciones.notificarAlertaSeguridad).not.toHaveBeenCalled();
    });

    it('no evalúa la regla de admin para un login de TUTOR', async () => {
      await service.evaluar('LOGIN_OK', {
        userId: 't-1',
        ip: '9.9.9.9',
        rol: 'TUTOR',
      });
      expect(mockPrisma.auditLog.count).not.toHaveBeenCalled();
    });
  });

  describe('cooldown de alertas', () => {
    it('no envía dos alertas del mismo tipo seguidas', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(10);
      await service.evaluar('LOGIN_FALLIDO', { ip: '1.2.3.4' });
      await service.evaluar('LOGIN_FALLIDO', { ip: '1.2.3.4' });
      // La segunda cae dentro del cooldown.
      expect(mockNotificaciones.notificarAlertaSeguridad).toHaveBeenCalledTimes(1);
    });
  });

  it('un fallo en la detección no se propaga', async () => {
    mockPrisma.auditLog.count.mockRejectedValue(new Error('BD caída'));
    await expect(
      service.evaluar('LOGIN_FALLIDO', { ip: '1.2.3.4' }),
    ).resolves.toBeUndefined();
  });
});
