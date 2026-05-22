import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';

// Construye un objeto Multer.File mínimo para los tests de subida.
function archivoFake(buffer: Buffer): Express.Multer.File {
  return {
    fieldname: 'archivo',
    originalname: 'examen.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
  };
}

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
      id: 'ex-1',
      mascota: { tutorId: 'tutor-1' },
    });
    mockExamsService.generarUrlDescarga.mockResolvedValue(
      'https://signed.example.com/f.pdf',
    );

    const req = {
      user: { userId: 'admin-1', email: 'a@b.cl', rol: 'ADMIN' as const },
    };
    const result = await controller.descargar(req, 'ex-1');

    expect(result).toEqual({ url: 'https://signed.example.com/f.pdf' });
  });

  describe('subirArchivo', () => {
    it('rechaza un archivo cuyos bytes no son los de un PDF', async () => {
      // Content-Type "application/pdf" pero el contenido es HTML.
      const noPdf = archivoFake(Buffer.from('<html><body>fake</body></html>'));

      await expect(
        controller.subirArchivo('ex-1', noPdf),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockExamsService.subirArchivo).not.toHaveBeenCalled();
    });

    it('acepta un archivo que empieza con la firma %PDF-', async () => {
      const pdf = archivoFake(Buffer.from('%PDF-1.7\n...contenido...'));
      mockExamsService.subirArchivo.mockResolvedValue({ id: 'ex-1' });

      await controller.subirArchivo('ex-1', pdf);

      expect(mockExamsService.subirArchivo).toHaveBeenCalledWith('ex-1', pdf);
    });
  });
});
