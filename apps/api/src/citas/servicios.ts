// Servicios que, al agendarse en una cita, generan un registro de Examen
// (requieren que el equipo suba un PDF con el resultado). El resto de
// servicios — las consultas generales — no producen examen.
//
// Esta lista es la fuente de verdad en el backend; debe mantenerse alineada
// con SERVICIOS_CON_PDF del frontend (apps/web/lib/utils/animals.ts).
export const SERVICIOS_CON_EXAMEN: ReadonlySet<string> = new Set([
  'Examen Hemograma',
  'Examen T4',
  'Examen TSH',
  'Perfil Bioquímico',
  'Test de Distemper',
  'Test de leucemia',
  'Test de Parvovirus',
  'Test de SIDA Felino',
]);

// De una lista de servicios, devuelve solo los que generan examen, sin
// duplicados (por si el cliente envía el mismo servicio dos veces).
export function serviciosQueGeneranExamen(servicios: string[]): string[] {
  return [...new Set(servicios)].filter((s) => SERVICIOS_CON_EXAMEN.has(s));
}
