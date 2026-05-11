import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    registro: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('login delega en authService.login', async () => {
    mockAuthService.login.mockResolvedValue({ token: 't', usuario: { id: 'u-1' } });
    const result = await controller.login({ email: 'a@b.cl', password: 'pass' });
    expect(result.token).toBe('t');
    expect(mockAuthService.login).toHaveBeenCalledWith('a@b.cl', 'pass');
  });
});
