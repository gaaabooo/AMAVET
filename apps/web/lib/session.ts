export interface SesionUsuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'TUTOR' | 'ADMIN';
}

export function getSesion(): SesionUsuario | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!raw || !token) return null;
    return JSON.parse(raw) as SesionUsuario;
  } catch {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    return null;
  }
}

export function clearSesion(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('usuario');
  localStorage.removeItem('token');
}
