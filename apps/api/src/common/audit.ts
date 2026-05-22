/**
 * Eventos de seguridad auditables. Mantener esta lista como el catálogo único:
 * cualquier alerta, filtro o consulta se apoya en estos nombres.
 */
export type EventoAuditoria =
  | 'LOGIN_OK'
  | 'LOGIN_FALLIDO'
  | 'LOGIN_GOOGLE_OK'
  | 'REGISTRO_OK'
  | 'REGISTRO_EMAIL_DUPLICADO'
  | 'PASSWORD_CAMBIADA'
  | 'PASSWORD_RESET_SOLICITADO'
  | 'PASSWORD_RESET_CONFIRMADO'
  | 'EXAMEN_CREADO'
  | 'EXAMEN_ESTADO_ACTUALIZADO'
  | 'EXAMEN_ARCHIVO_SUBIDO'
  | 'CUENTA_ELIMINADA'
  | 'CUENTA_REACTIVADA'
  | 'CUENTA_PURGADA';

// Enmascara un email para no filtrar PII en logs. "gabriel@gmail.com" -> "g***@gmail.com".
export function emailEnmascarado(email: string | undefined | null): string {
  if (!email || !email.includes('@')) return '***';
  const [local, dominio] = email.split('@');
  const inicial = local[0] ?? '';
  return `${inicial}***@${dominio}`;
}

// Convierte cualquier valor a texto sin recurrir a la conversión por defecto
// de los objetos ("[object Object]"): los objetos se serializan como JSON.
function aTexto(valor: unknown): string {
  if (valor === undefined || valor === null) return '';
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') {
    return String(valor);
  }
  return JSON.stringify(valor) ?? '';
}

// Sanea un valor para una línea de log: sin saltos de línea (evita inyección de
// líneas falsas, CWE-117) y recortado. Los valores con espacios van entre comillas.
export function valorSeguro(valor: unknown): string {
  const texto = aTexto(valor)
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 200);
  return /\s/.test(texto) ? `"${texto}"` : texto;
}
