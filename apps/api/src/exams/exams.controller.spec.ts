import { Test, TestingModule } from '@nestjs/testing';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

describe('ExamsController', () => {
  let controller: ExamsController;

  const mockExamsService = {
    crear: jest.fn(),
    listarPorMascota: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    generarUrlDescarga: jest.fn(),
    actualizarEstado: jest.fn(),
    subirArchivo: jest.fn(),
    esDuenoMascota: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamsController],
      providers: [{ provide: ExamsService, useValue: mockExamsService }],
    }).compile();

    controller = module.get<ExamsController>(ExamsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('descargar retorna la url firmada para un admin', async () => {
    mockExamsService.buscarPorId.mockResolvedValue({
      id: 'ex-1', mascota: { tutorId: 'tutor-1' },
    });
    mockExamsService.generarUrlDescarga.mockResolvedValue('https://signed.example.com/f.pdf');

    const req = { user: { userId: 'admin-1', email: 'a@b.cl', rol: 'ADMIN' as const } };
    const result = await controller.descargar(req, 'ex-1');

    expect(result).toEqual({ url: 'https://signed.example.com/f.pdf' });
  });
});
