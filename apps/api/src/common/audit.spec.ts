import { emailEnmascarado, valorSeguro } from './audit';

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

describe('valorSeguro', () => {
  it('quita saltos de línea (evita inyección de logs, CWE-117)', () => {
    expect(valorSeguro('1.2.3.4\nevento=LOGIN_OK')).not.toContain('\n');
  });

  it('entrecomilla los valores con espacios', () => {
    expect(valorSeguro('con espacios')).toBe('"con espacios"');
  });

  it('deja los valores simples sin comillas', () => {
    expect(valorSeguro('abc123')).toBe('abc123');
  });

  it('recorta valores muy largos', () => {
    expect(valorSeguro('x'.repeat(500)).length).toBeLessThanOrEqual(202);
  });
});
