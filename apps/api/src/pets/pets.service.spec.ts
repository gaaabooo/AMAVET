import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PetsService } from './pets.service';
import { PrismaService } from '../prisma.service';

describe('PetsService', () => {
  let service: PetsService;

  const mockPrisma = {
    mascota: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    // $transaction ejecuta el callback con el propio mock como cliente.
    $transaction: jest.fn(),
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
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: typeof mockPrisma) => unknown) => cb(mockPrisma),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('crear registra la mascota si el tutor no alcanzó el límite', async () => {
    mockPrisma.mascota.count.mockResolvedValue(3);
    mockPrisma.mascota.create.mockResolvedValue({ id: 'm-1' });

    const result = await service.crear(
      'Firulais',
      'perro',
      'mestizo',
      3,
      'tutor-1',
    );

    expect(result).toEqual({ id: 'm-1' });
    expect(mockPrisma.mascota.create).toHaveBeenCalledWith({
      data: {
        nombre: 'Firulais',
        tipo: 'perro',
        raza: 'mestizo',
        edad: 3,
        tutorId: 'tutor-1',
      },
    });
  });

  it('crear rechaza si el tutor ya alcanzó el máximo de mascotas', async () => {
    mockPrisma.mascota.count.mockResolvedValue(20);

    await expect(
      service.crear('Otra', 'gato', null, null, 'tutor-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockPrisma.mascota.create).not.toHaveBeenCalled();
  });
});
