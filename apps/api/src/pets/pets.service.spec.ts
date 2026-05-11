import { Test, TestingModule } from '@nestjs/testing';
import { PetsService } from './pets.service';
import { PrismaService } from '../prisma.service';

describe('PetsService', () => {
  let service: PetsService;

  const mockPrisma = {
    mascota: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('crear delega en prisma.mascota.create', async () => {
    mockPrisma.mascota.create.mockResolvedValue({ id: 'm-1' });
    const result = await service.crear('Firulais', 'perro', 'mestizo', 3, 'tutor-1');
    expect(result).toEqual({ id: 'm-1' });
    expect(mockPrisma.mascota.create).toHaveBeenCalledWith({
      data: { nombre: 'Firulais', tipo: 'perro', raza: 'mestizo', edad: 3, tutorId: 'tutor-1' },
    });
  });
});
