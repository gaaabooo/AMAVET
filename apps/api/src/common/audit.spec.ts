import { Logger } from '@nestjs/common';
import { AuditLogger, emailEnmascarado } from './audit';

describe('emailEnmascarado', () => {
  it('enmascara el local part dejando solo la inicial', () => {
    expect(emailEnmascarado('gabriel@gmail.com')).toBe('g***@gmail.com');
  });

  it('devuelve *** para valores sin @ o vacíos', () => {
    expect(emailEnmascarado('')).toBe('***');
    expect(emailEnmascarado(null)).toBe('***');
    expect(emailEnmascarado('sinarroba')).toBe('***');
  });
});

describe('AuditLogger', () => {
  let audit: AuditLogger;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    audit = new AuditLogger();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registrar() emite un log en formato key=value', () => {
    audit.registrar('LOGIN_OK', { userId: 'abc', rol: 'ADMIN' });
    expect(logSpy).toHaveBeenCalledWith('evento=LOGIN_OK userId=abc rol=ADMIN');
  });

  it('alertar() emite un warn', () => {
    audit.alertar('LOGIN_FALLIDO', { ip: '1.2.3.4' });
    expect(warnSpy).toHaveBeenCalledWith('evento=LOGIN_FALLIDO ip=1.2.3.4');
  });

  it('omite los campos undefined o null', () => {
    audit.registrar('EXAMEN_CREADO', { examenId: 'e1', mascotaId: undefined });
    expect(logSpy).toHaveBeenCalledWith('evento=EXAMEN_CREADO examenId=e1');
  });

  it('sanea saltos de línea para evitar inyección de logs (CWE-117)', () => {
    audit.alertar('LOGIN_FALLIDO', { ip: '1.2.3.4\nevento=LOGIN_OK userId=fake' });
    const arg = warnSpy.mock.calls[0][0] as string;
    expect(arg).not.toContain('\n');
  });

  it('entrecomilla los valores con espacios', () => {
    audit.registrar('EXAMEN_CREADO', { nota: 'con espacios' });
    expect(logSpy).toHaveBeenCalledWith('evento=EXAMEN_CREADO nota="con espacios"');
  });
});
