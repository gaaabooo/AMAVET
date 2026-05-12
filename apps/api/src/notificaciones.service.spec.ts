import { parseRemitente } from './notificaciones.service';

describe('parseRemitente', () => {
  it('extrae nombre y email del formato "Nombre <email>"', () => {
    expect(
      parseRemitente('Silvestra Vet <notificaciones.silvestra@gmail.com>'),
    ).toEqual({
      name: 'Silvestra Vet',
      email: 'notificaciones.silvestra@gmail.com',
    });
  });

  it('tolera espacios extra alrededor de los componentes', () => {
    expect(
      parseRemitente('  Equipo Silvestra  <  hola@ejemplo.com  >  '),
    ).toEqual({
      name: 'Equipo Silvestra',
      email: 'hola@ejemplo.com',
    });
  });

  it('usa el nombre por defecto si el formato no incluye nombre', () => {
    expect(parseRemitente('<solo@ejemplo.com>')).toEqual({
      name: 'Silvestra Vet',
      email: 'solo@ejemplo.com',
    });
  });

  it('acepta un email plano sin ángulos', () => {
    expect(parseRemitente('plano@ejemplo.com')).toEqual({
      name: 'Silvestra Vet',
      email: 'plano@ejemplo.com',
    });
  });
});
