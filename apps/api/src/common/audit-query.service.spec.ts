import { AuditQueryService } from './audit-query.service';

const mockPrisma = {
  auditLog: {
    deleteMany: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('AuditQueryService', () => {
  let service: AuditQueryService;

  beforeEach(() => {
    service = new AuditQueryService(mockPrisma as never);
    jest.clearAllMocks();
    mockPrisma.auditLog.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.$transaction.mockResolvedValue([0, []]);
  });

  it('purga eventos vencidos antes de consultar', async () => {
    await service.listar({});
    expect(mockPrisma.auditLog.deleteMany).toHaveBeenCalledTimes(1);
    const where = mockPrisma.auditLog.deleteMany.mock.calls[0][0].where;
    expect(where.creadoEn.lt).toBeInstanceOf(Date);
  });

  it('aplica los filtros de evento, usuario y soloAlertas', async () => {
    mockPrisma.$transaction.mockResolvedValue([2, [{ id: 'e1' }, { id: 'e2' }]]);
    const res = await service.listar({
      evento: 'LOGIN_FALLIDO',
      userId: 'u-1',
      soloAlertas: true,
      pagina: 1,
    });
    expect(res.total).toBe(2);
    expect(res.eventos).toHaveLength(2);
  });

  it('una purga fallida no rompe la consulta', async () => {
    mockPrisma.auditLog.deleteMany.mockRejectedValue(new Error('BD caída'));
    mockPrisma.$transaction.mockResolvedValue([0, []]);
    await expect(service.listar({})).resolves.toBeDefined();
  });

  it('normaliza una página inválida o menor que 1 a la página 1', async () => {
    const res = await service.listar({ pagina: -5 });
    expect(res.pagina).toBe(1);
  });
});
