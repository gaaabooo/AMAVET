import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase.service';
import * as bcrypt from 'bcryptjs';

const mockUsersService = {
  buscarPorEmail: jest.fn(),
  crear: jest.fn(),
  buscarOCrearGoogle: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('signed-token'),
};

const mockSupabaseService = {
  verificarTokenAcceso: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('registro', () => {
    it('crea usuario y retorna token cuando el email no existe', async () => {
      mockUsersService.buscarPorEmail.mockResolvedValue(null);
      mockUsersService.crear.mockResolvedValue({
        id: 'uuid-1', nombre: 'Test', email: 'test@test.cl', rol: 'TUTOR',
      });

      const result = await service.registro('Test', 'test@test.cl', '123456', 'Password1!');

      expect(result.token).toBe('signed-token');
      expect(result.usuario.email).toBe('test@test.cl');
      expect(mockUsersService.crear).toHaveBeenCalledTimes(1);
    });

    it('lanza ConflictException si el email ya existe', async () => {
      mockUsersService.buscarPorEmail.mockResolvedValue({ id: 'uuid-existing' });

      await expect(
        service.registro('Test', 'test@test.cl', '123456', 'Password1!'),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(mockUsersService.crear).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('retorna token con credenciales válidas', async () => {
      const hash = await bcrypt.hash('Password1!', 12);
      mockUsersService.buscarPorEmail.mockResolvedValue({
        id: 'uuid-1', email: 'test@test.cl', rol: 'TUTOR', password: hash,
      });

      const result = await service.login('test@test.cl', 'Password1!');

      expect(result.token).toBe('signed-token');
      expect(result.usuario.email).toBe('test@test.cl');
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      mockUsersService.buscarPorEmail.mockResolvedValue(null);

      await expect(service.login('noexiste@test.cl', 'pass')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      const hash = await bcrypt.hash('CorrectPass1!', 12);
      mockUsersService.buscarPorEmail.mockResolvedValue({
        id: 'uuid-1', email: 'test@test.cl', rol: 'TUTOR', password: hash,
      });

      await expect(service.login('test@test.cl', 'WrongPass1!')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('lanza UnauthorizedException si el hash está corrupto', async () => {
      mockUsersService.buscarPorEmail.mockResolvedValue({
        id: 'uuid-1', email: 'test@test.cl', rol: 'TUTOR', password: 'corto',
      });

      await expect(service.login('test@test.cl', 'pass')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('loginConGoogle', () => {
    it('retorna token cuando el token de Google es válido y el usuario es TUTOR', async () => {
      mockSupabaseService.verificarTokenAcceso.mockResolvedValue({
        email: 'tutor@test.cl', nombre: 'Tutor Google',
      });
      mockUsersService.buscarOCrearGoogle.mockResolvedValue({
        id: 'uuid-g', nombre: 'Tutor Google', email: 'tutor@test.cl', rol: 'TUTOR', telefono: '',
      });

      const result = await service.loginConGoogle('valid-access-token');

      expect(result.token).toBe('signed-token');
      expect(result.usuario.email).toBe('tutor@test.cl');
      expect(result.usuario.telefono).toBe('');
      expect(mockUsersService.buscarOCrearGoogle).toHaveBeenCalledWith('tutor@test.cl', 'Tutor Google');
    });

    it('lanza UnauthorizedException si el token de Google es inválido', async () => {
      mockSupabaseService.verificarTokenAcceso.mockResolvedValue(null);

      await expect(service.loginConGoogle('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockUsersService.buscarOCrearGoogle).not.toHaveBeenCalled();
    });

    it('lanza UnauthorizedException si el usuario existente no es TUTOR', async () => {
      mockSupabaseService.verificarTokenAcceso.mockResolvedValue({
        email: 'admin@test.cl', nombre: 'Admin',
      });
      mockUsersService.buscarOCrearGoogle.mockResolvedValue({
        id: 'uuid-a', nombre: 'Admin', email: 'admin@test.cl', rol: 'ADMIN', telefono: '999',
      });

      await expect(service.loginConGoogle('valid-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
