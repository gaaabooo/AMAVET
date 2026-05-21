// Mock de AuditService para los tests unitarios: registrar/alertar son no-ops.
// La persistencia y las alertas se prueban aparte (audit.service.spec).
export const mockAuditService = {
  registrar: jest.fn(),
  alertar: jest.fn(),
  // Por defecto: IP conocida y con logins previos → no dispara avisos de
  // "login desde IP nueva" en los tests que no lo prueban específicamente.
  ipConocidaParaUsuario: jest.fn().mockResolvedValue(true),
  loginsPreviosDeUsuario: jest.fn().mockResolvedValue(5),
};
