import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrisma = {
    user: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crear', () => {
    it('rechaza contraseñas demasiado cortas', async () => {
      await expect(
        service.crear('Test', 'test@test.cl', '123456', 'corta'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('crea el usuario con la contraseña hasheada', async () => {
      mockPrisma.user.create.mockResolvedValue({ id: 'u-1' });
      await service.crear('Test', 'TEST@Test.cl ', '123456', 'Password1!');
      const arg = mockPrisma.user.create.mock.calls[0][0].data;
      expect(arg.email).toBe('test@test.cl');
      expect(arg.password).not.toBe('Password1!');
      expect(await bcrypt.compare('Password1!', arg.password)).toBe(true);
    });
  });

  describe('buscarPorId', () => {
    it('no incluye el campo password en el select', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1' });
      await service.buscarPorId('u-1');
      const select = mockPrisma.user.findUnique.mock.calls[0][0].select;
      expect(select.password).toBeUndefined();
      expect(select.id).toBe(true);
    });
  });

  describe('cambiarPassword', () => {
    it('lanza UnauthorizedException si la contraseña actual no coincide', async () => {
      const hash = await bcrypt.hash('CorrectPass1!', 12);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-1', password: hash });
      await expect(
        service.cambiarPassword('u-1', 'WrongPass1!', 'NewPass1!'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.cambiarPassword('no-existe', 'Actual1!', 'Nueva1234!'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
