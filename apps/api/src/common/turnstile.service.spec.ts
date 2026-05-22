import { TurnstileService } from './turnstile.service';

describe('TurnstileService', () => {
  let service: TurnstileService;
  const SECRET_ORIGINAL = process.env.TURNSTILE_SECRET_KEY;

  beforeEach(() => {
    service = new TurnstileService();
  });

  afterEach(() => {
    if (SECRET_ORIGINAL === undefined) {
      delete process.env.TURNSTILE_SECRET_KEY;
    } else {
      process.env.TURNSTILE_SECRET_KEY = SECRET_ORIGINAL;
    }
    jest.restoreAllMocks();
  });

  describe('sin TURNSTILE_SECRET_KEY (captcha desactivado)', () => {
    beforeEach(() => {
      delete process.env.TURNSTILE_SECRET_KEY;
    });

    it('configurado es false', () => {
      expect(service.configurado).toBe(false);
    });

    it('verificar() deja pasar aunque no haya token', async () => {
      expect(await service.verificar(undefined)).toBe(true);
    });
  });

  describe('con TURNSTILE_SECRET_KEY (captcha activo)', () => {
    beforeEach(() => {
      process.env.TURNSTILE_SECRET_KEY = 'secret-de-prueba';
    });

    it('configurado es true', () => {
      expect(service.configurado).toBe(true);
    });

    it('rechaza si no hay token', async () => {
      expect(await service.verificar(undefined)).toBe(false);
    });

    it('devuelve true si Cloudflare responde success', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response);
      expect(await service.verificar('token-valido')).toBe(true);
    });

    it('devuelve false si Cloudflare responde success: false', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: false,
            'error-codes': ['invalid-input-response'],
          }),
      } as Response);
      expect(await service.verificar('token-malo')).toBe(false);
    });

    it('fail-closed: devuelve false si la llamada a Cloudflare falla', async () => {
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('red caída'));
      expect(await service.verificar('token')).toBe(false);
    });

    it('fail-closed: devuelve false si Cloudflare responde HTTP no-ok', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue({ ok: false, status: 503 } as Response);
      expect(await service.verificar('token')).toBe(false);
    });

    it('rechaza el token si el hostname no coincide con el esperado', async () => {
      process.env.TURNSTILE_EXPECTED_HOSTNAME = 'amavet.cl';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, hostname: 'sitio-atacante.com' }),
      } as Response);
      expect(await service.verificar('token')).toBe(false);
      delete process.env.TURNSTILE_EXPECTED_HOSTNAME;
    });

    it('acepta el token si el hostname coincide con el esperado', async () => {
      process.env.TURNSTILE_EXPECTED_HOSTNAME = 'amavet.cl';
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, hostname: 'amavet.cl' }),
      } as Response);
      expect(await service.verificar('token')).toBe(true);
      delete process.env.TURNSTILE_EXPECTED_HOSTNAME;
    });
  });
});
