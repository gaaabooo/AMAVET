import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { TurnstileGuard } from '../common/turnstile.guard';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    registro: jest.fn(),
    login: jest.fn(),
  };

  const mockPasswordResetService = {
    solicitarReset: jest.fn(),
    confirmarReset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: PasswordResetService, useValue: mockPasswordResetService },
      ],
    })
      // El captcha se prueba aparte (turnstile.service.spec); aquí el guard
      // siempre deja pasar.
      .overrideGuard(TurnstileGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login delega en authService.login con la IP del request', async () => {
    mockAuthService.login.mockResolvedValue({
      token: 't',
      usuario: { id: 'u-1' },
    });
    const result = await controller.login(
      { email: 'a@b.cl', password: 'pass' },
      '127.0.0.1',
    );
    expect(result.token).toBe('t');
    expect(mockAuthService.login).toHaveBeenCalledWith(
      'a@b.cl',
      'pass',
      '127.0.0.1',
    );
  });
});
