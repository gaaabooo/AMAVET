// Mock de AuditService para los tests unitarios: registrar/alertar son no-ops.
// La persistencia y las alertas se prueban aparte (audit.service.spec).
export const mockAuditService = {
  registrar: jest.fn(),
  alertar: jest.fn(),
};
