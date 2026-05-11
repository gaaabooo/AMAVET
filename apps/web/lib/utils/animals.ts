const ANIMAL_ICON: Record<string, string> = {
  perro: '🐶', gato: '🐱', conejo: '🐰', ave: '🐦', pájaro: '🐦',
  pajaro: '🐦', hamster: '🐹', hámster: '🐹', tortuga: '🐢',
  pez: '🐟', hurón: '🦔', huron: '🦔',
};

export function getAnimalIcon(tipo: string): string {
  return ANIMAL_ICON[tipo.toLowerCase().trim()] ?? '🐾';
}

export const SERVICIOS_CON_PDF = new Set([
  'Examen Hemograma', 'Examen T4', 'Examen TSH',
  'Perfil Bioquímico',
  'Test de Distemper', 'Test de leucemia', 'Test de Parvovirus', 'Test de SIDA Felino',
]);
