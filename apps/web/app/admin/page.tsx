'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getSesion } from '@/lib/session';
import { SERVICIOS_CON_PDF } from '@/lib/utils/animals';
import Logo from '@/components/Logo';

interface Usuario {
  id: string;
  nombre: string;
  email?: string;
  rol?: string;
  telefono?: string;
}

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  raza?: string;
  edad?: number;
  creadoEn: string;
  tutor: { id: string; nombre: string; email: string; telefono: string };
  examenes: Examen[];
}

interface Examen {
  id: string;
  tipo: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE';
  archivoUrl: string | null;
  creadoEn: string;
  mascota?: { id: string; nombre: string; tipo: string; tutor: { nombre: string } };
}

type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';

interface Cita {
  id: string;
  fecha: string;
  direccion: string;
  servicios: string[];
  estado: EstadoCita;
  mascotaId: string;
  mascota: { id: string; nombre: string; tipo: string; tutor: { nombre: string; telefono: string; email: string } };
  creadoEn: string;
}

type Vista = 'dashboard' | 'mascotas' | 'examenes' | 'agenda' | 'configuracion' | 'ayuda';

const SERVICIOS_EXAMEN = new Set([
  'Examen Hemograma', 'Examen T4', 'Examen TSH',
  'Perfil Bioquímico',
  'Test de Distemper', 'Test de leucemia', 'Test de Parvovirus', 'Test de SIDA Felino',
]);

const fechaCorta = (s?: string) =>
  s ? new Date(s).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const mensajeError = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) return resp.data.message;
  }
  return fallback;
};

const ultimoExamen = (m: Mascota) =>
  m.examenes.length
    ? [...m.examenes].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())[0]
    : null;

const ultimaActividad = (m: Mascota) => {
  const ue = ultimoExamen(m);
  return ue ? new Date(ue.creadoEn).getTime() : new Date(m.creadoEn).getTime();
};

const fueAtendida = (m: Mascota) => m.examenes.some(e => e.estado === 'DISPONIBLE');

const esMascotaGato = (tipo?: string) => !!tipo && /gat|felin/i.test(tipo);
const emojiMascota = (tipo?: string) => (esMascotaGato(tipo) ? '🐱' : '🐶');

/* ── Texturas/decoraciones compartidas ── */
const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E\")";

function PawPrint({ className = '', fill = 'currentColor', opacity = 0.18 }: { className?: string; fill?: string; opacity?: number }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden style={{ filter: 'blur(1.2px)' }}>
      <g fill={fill} opacity={opacity}>
        <ellipse cx="24" cy="34" rx="10" ry="7.5" />
        <ellipse cx="11" cy="20" rx="3.4" ry="4.2" />
        <ellipse cx="18.5" cy="11" rx="3.2" ry="4.2" />
        <ellipse cx="29.5" cy="11" rx="3.2" ry="4.2" />
        <ellipse cx="37" cy="20" rx="3.4" ry="4.2" />
      </g>
    </svg>
  );
}

function FernLeaf({ className = '', color = '#fff', opacity = 0.05, style = {} }: { className?: string; color?: string; opacity?: number; style?: React.CSSProperties }) {
  return (
    <svg className={className} viewBox="0 0 777 611" aria-hidden fill={color} style={{ opacity, ...style }}>
      <g transform="translate(0,611) scale(0.1,-0.1)">
        <path d="M6130 6000 c-154 -102 -159 -105 -226 -138 -202 -101 -449 -190 -669 -242 -71 -17 -148 -35 -170 -40 -57 -14 -257 -53 -495 -95 -634 -113 -989 -230 -1356 -449 -187 -111 -432 -318 -594 -501 -90 -101 -202 -260 -272 -383 -302 -536 -357 -1140 -159 -1750 46 -139 178 -415 245 -510 l44 -62 29 52 c47 84 83 165 83 186 0 11 -17 51 -39 89 -21 37 -42 79 -46 93 -4 14 -11 30 -15 35 -23 29 -98 252 -133 396 -29 116 -59 396 -53 484 17 221 57 426 110 567 102 269 209 445 423 693 67 77 274 265 292 265 17 0 14 -7 -34 -90 -84 -147 -145 -297 -187 -460 -27 -105 -30 -134 -35 -335 -3 -135 -1 -247 6 -290 24 -157 50 -324 61 -385 17 -103 24 -440 11 -562 -6 -59 -30 -178 -52 -265 -42 -166 -40 -162 -225 -523 -49 -96 -107 -213 -128 -260 -88 -194 -212 -517 -255 -665 -101 -350 -104 -375 -57 -424 54 -56 160 -58 203 -4 13 15 28 53 34 83 6 30 14 69 19 85 5 17 18 68 30 115 48 191 110 378 207 625 123 315 187 415 327 516 45 32 103 74 130 94 61 44 273 152 341 173 53 16 156 20 265 10 36 -4 57 -4 48 -2 -9 3 -20 14 -23 25 -4 10 -13 19 -21 19 -15 0 -18 9 -6 25 17 25 233 63 507 90 83 8 168 17 190 20 223 33 308 48 382 70 49 15 104 30 125 35 95 25 362 150 450 212 55 39 211 164 251 202 35 33 57 45 57 31 0 -12 -75 -171 -92 -197 -10 -14 -18 -30 -18 -34 0 -4 -11 -24 -24 -43 -13 -20 -49 -76 -79 -126 -129 -205 -330 -426 -511 -559 -74 -55 -265 -167 -351 -206 -90 -41 -258 -90 -410 -121 -120 -24 -186 -31 -331 -36 -270 -9 -426 9 -702 79 l-123 31 -25 -24 c-30 -28 -100 -166 -90 -176 17 -18 306 -93 456 -119 150 -27 659 -27 800 -1 221 41 347 78 510 150 357 155 621 371 884 722 105 140 178 261 271 450 68 137 158 368 198 505 63 217 74 262 108 435 57 286 78 469 109 915 22 332 2 827 -55 1337 -14 122 -25 225 -25 228 0 12 -20 1 -120 -65z"/>
      </g>
    </svg>
  );
}

function FernLeaf2({ className = '', color = '#fff', opacity = 0.05, style = {} }: { className?: string; color?: string; opacity?: number; style?: React.CSSProperties }) {
  return (
    <svg className={className} viewBox="0 0 730 592" aria-hidden fill={color} style={{ opacity, ...style }}>
      <g transform="translate(0,592) scale(0.1,-0.1)">
        <path d="M3709 5233 c13 -12 41 -76 76 -178 59 -170 119 -301 147 -318 13 -9 27 -6 61 11 56 28 90 19 106 -30 6 -18 15 -97 20 -175 12 -174 25 -208 76 -200 18 3 68 26 111 51 87 51 114 56 144 26 17 -17 20 -33 20 -102 -1 -108 -11 -161 -95 -483 -24 -96 -38 -173 -42 -245 l-6 -105 30 -2 c24 -2 38 7 74 49 24 28 58 66 75 84 18 19 64 82 104 139 81 117 129 165 165 165 33 0 64 -35 77 -88 6 -24 17 -46 25 -49 17 -7 69 28 147 97 55 48 92 70 118 70 6 0 25 -16 43 -35 l32 -35 48 21 c27 12 94 49 150 82 108 65 186 97 216 90 57 -15 51 -78 -26 -243 -98 -211 -130 -330 -90 -330 9 0 29 -7 45 -15 26 -13 30 -21 30 -55 0 -32 -11 -52 -64 -122 -110 -145 -131 -209 -78 -239 15 -9 55 -24 90 -34 71 -21 107 -54 96 -89 -22 -69 -172 -181 -492 -366 -193 -112 -255 -161 -250 -198 3 -22 11 -27 58 -38 30 -7 116 -13 190 -14 149 0 179 -9 194 -53 8 -22 6 -35 -8 -62 -32 -58 -31 -59 229 -169 145 -61 187 -86 203 -119 26 -54 -5 -78 -163 -122 -128 -35 -376 -139 -405 -170 l-21 -23 25 -51 c30 -58 33 -97 9 -123 -13 -15 -31 -18 -97 -18 -45 0 -112 5 -151 11 -107 16 -285 16 -314 0 -21 -12 -23 -18 -18 -63 4 -27 27 -95 53 -151 57 -125 65 -166 35 -196 -30 -30 -57 -27 -232 25 -321 94 -408 132 -549 238 -47 35 -99 66 -116 69 l-31 6 -12 -147 c-25 -300 -57 -481 -116 -644 -33 -93 -58 -125 -102 -137 -47 -13 -81 -5 -115 27 -44 40 -44 67 2 187 68 179 120 446 120 616 l0 67 -35 4 c-31 4 -47 -4 -123 -60 -122 -89 -218 -132 -447 -201 -255 -77 -272 -79 -309 -50 -25 19 -28 27 -23 63 2 23 16 66 30 96 54 119 67 155 73 191 6 33 3 39 -22 56 -23 15 -46 18 -134 17 -58 -1 -134 -7 -170 -13 -36 -6 -104 -11 -152 -11 -75 0 -91 3 -108 20 -26 26 -25 40 5 100 31 61 31 85 3 104 -70 46 -333 148 -477 186 -46 12 -91 49 -91 74 0 38 52 74 187 131 198 84 260 112 268 125 3 6 -1 30 -10 55 -21 54 -14 92 21 105 14 6 88 10 165 10 112 0 229 12 229 24 0 2 -7 23 -16 49 -14 42 -25 53 -97 100 -45 30 -131 82 -192 117 -200 114 -405 267 -415 310 -14 57 0 73 93 105 48 17 96 40 108 52 l21 21 -21 48 c-12 27 -53 89 -91 139 -98 128 -101 163 -21 200 30 13 41 24 41 40 0 34 -42 147 -109 296 -80 178 -82 239 -9 239 33 0 53 -9 203 -95 61 -35 129 -71 153 -81 l43 -17 30 37 c43 51 65 47 151 -27 83 -72 131 -107 147 -107 10 0 51 79 51 99 0 16 42 41 69 41 30 0 77 -48 154 -158 31 -44 83 -108 115 -141 33 -33 70 -76 83 -95 29 -42 68 -63 81 -44 23 32 -13 271 -72 483 -54 196 -80 386 -60 435 23 54 65 52 171 -11 37 -22 83 -43 103 -46 34 -5 37 -4 53 33 11 27 19 86 24 188 9 156 18 188 59 201 13 4 36 -2 61 -15 23 -11 49 -18 59 -15 25 8 80 118 129 260 66 188 84 229 111 242 32 16 34 16 59 -4z"/>
      </g>
    </svg>
  );
}

export default function Admin() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [vista, setVista] = useState<Vista>('dashboard');
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const [uploadMascotaId, setUploadMascotaId] = useState('');
  const [uploadTipo, setUploadTipo] = useState('');
  const [uploadArchivo, setUploadArchivo] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mascotaOrden, setMascotaOrden] = useState<'fecha' | 'tipo' | 'atendido' | 'sin-atender'>('fecha');
  const [mascotaBusqueda, setMascotaBusqueda] = useState('');

  const [examenEstado, setExamenEstado] = useState<'TODOS' | 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE'>('TODOS');
  const [examenBusqueda, setExamenBusqueda] = useState('');

  const [citas, setCitas] = useState<Cita[]>([]);
  const [mesActual, setMesActual] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  const mostrarMensaje = useCallback((tipo: 'ok' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      const [mascRes, examRes, citasRes] = await Promise.all([
        api.get('/mascotas'),
        api.get('/examenes'),
        api.get('/citas'),
      ]);
      setMascotas(mascRes.data);
      setExamenes(examRes.data);
      setCitas(citasRes.data);
    } catch (err) {
      mostrarMensaje('error', mensajeError(err, 'Error al cargar los datos del panel'));
    } finally {
      setCargando(false);
    }
  }, [mostrarMensaje]);

  useEffect(() => {
    const sesion = getSesion();
    if (!sesion) { router.push('/login'); return; }
    if (sesion.rol !== 'ADMIN') { router.push('/dashboard'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuario(sesion);
    cargarDatos();
  }, [router, cargarDatos]);

  const actualizarEstadoCita = async (id: string, estado: EstadoCita) => {
    try {
      await api.patch(`/citas/${id}/estado`, { estado });
      // Actualización optimista: refleja el cambio en la UI de inmediato.
      setCitaSeleccionada(prev => (prev && prev.id === id ? { ...prev, estado } : prev));
      setCitas(prev => prev.map(c => (c.id === id ? { ...c, estado } : c)));
      mostrarMensaje('ok', `Cita marcada como ${estado.toLowerCase()}`);
      // Recarga en segundo plano para sincronizar con el servidor (no bloquea).
      void cargarDatos();
    } catch (err) {
      mostrarMensaje('error', mensajeError(err, 'Error al actualizar la cita'));
    }
  };

  const esExamen = SERVICIOS_CON_PDF.has(uploadTipo);

  const subirResultado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadMascotaId || !uploadTipo) return;
    if (esExamen && !uploadArchivo) return;
    setSubiendo(true);
    try {
      if (esExamen && uploadArchivo) {
        const { data: examen } = await api.post('/examenes', { tipo: uploadTipo, mascotaId: uploadMascotaId });
        const formData = new FormData();
        formData.append('archivo', uploadArchivo);
        await api.post(`/examenes/${examen.id}/subir`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mostrarMensaje('ok', 'Resultado subido. El tutor fue notificado por correo.');
      } else {
        await api.post('/examenes', { tipo: uploadTipo, mascotaId: uploadMascotaId });
        mostrarMensaje('ok', 'Servicio registrado correctamente.');
      }
      setUploadMascotaId('');
      setUploadTipo('');
      setUploadArchivo(null);
      await cargarDatos();
    } catch (err) {
      mostrarMensaje('error', mensajeError(err, 'Error al registrar el servicio'));
    } finally {
      setSubiendo(false);
    }
  };

  const actualizarEstado = async (id: string, estado: string) => {
    try {
      await api.patch(`/examenes/${id}/estado`, { estado });
      await cargarDatos();
    } catch (err) {
      mostrarMensaje('error', mensajeError(err, 'Error al actualizar el estado del examen'));
    }
  };

  const borrarPdf = async (id: string) => {
    try {
      await api.patch(`/examenes/${id}/estado`, { estado: 'PENDIENTE', archivoUrl: null });
      mostrarMensaje('ok', 'PDF eliminado. El examen volvió a estado pendiente.');
      await cargarDatos();
    } catch (err) {
      mostrarMensaje('error', mensajeError(err, 'Error al eliminar el PDF'));
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  const recentMascotas = useMemo(
    () => [...mascotas].sort((a, b) => ultimaActividad(b) - ultimaActividad(a)).slice(0, 8),
    [mascotas]
  );

  const mascotasFiltradas = useMemo(() => {
    let result = [...mascotas];
    if (mascotaBusqueda.trim()) {
      const q = mascotaBusqueda.toLowerCase().trim();
      result = result.filter(m =>
        m.nombre.toLowerCase().includes(q) ||
        m.tipo.toLowerCase().includes(q) ||
        (m.raza?.toLowerCase().includes(q) ?? false) ||
        m.tutor.nombre.toLowerCase().includes(q) ||
        m.tutor.email.toLowerCase().includes(q)
      );
    }
    if (mascotaOrden === 'fecha') {
      result.sort((a, b) => ultimaActividad(b) - ultimaActividad(a));
    } else if (mascotaOrden === 'tipo') {
      result.sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre));
    } else if (mascotaOrden === 'atendido') {
      result.sort((a, b) => Number(fueAtendida(b)) - Number(fueAtendida(a)));
    } else if (mascotaOrden === 'sin-atender') {
      result.sort((a, b) => Number(fueAtendida(a)) - Number(fueAtendida(b)));
    }
    return result;
  }, [mascotas, mascotaOrden, mascotaBusqueda]);

  const examenesReales = useMemo(
    () => examenes.filter(e => SERVICIOS_EXAMEN.has(e.tipo)),
    [examenes]
  );

  const examenesDeduplicados = useMemo(() => {
    const ordenados = [...examenesReales].sort(
      (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
    );
    const grupos = new Map<string, Examen[]>();
    for (const ex of ordenados) {
      const key = `${ex.mascota?.id ?? 'sin-mascota'}|${ex.tipo}`;
      const lista = grupos.get(key) ?? [];
      lista.push(ex);
      grupos.set(key, lista);
    }
    const resultado: Examen[] = [];
    for (const lista of grupos.values()) {
      const procesados: Examen[] = [];
      for (const ex of lista) {
        const t = new Date(ex.creadoEn).getTime();
        const yaRepresentado = procesados.some(p => Math.abs(new Date(p.creadoEn).getTime() - t) < 24 * 60 * 60 * 1000);
        if (!yaRepresentado) procesados.push(ex);
      }
      resultado.push(...procesados);
    }
    return resultado;
  }, [examenesReales]);

  const examenesFiltrados = useMemo(() => {
    let result = [...examenesDeduplicados];
    if (examenEstado !== 'TODOS') result = result.filter(e => e.estado === examenEstado);
    if (examenBusqueda.trim()) {
      const q = examenBusqueda.toLowerCase().trim();
      result = result.filter(e =>
        e.tipo.toLowerCase().includes(q) ||
        e.mascota?.nombre.toLowerCase().includes(q) ||
        e.mascota?.tutor?.nombre.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
    return result;
  }, [examenesDeduplicados, examenEstado, examenBusqueda]);

  const pendientes = examenesDeduplicados.filter(e => e.estado !== 'DISPONIBLE').length;
  const sinAtender = useMemo(() => mascotas.filter(m => !fueAtendida(m)).length, [mascotas]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--admin-bg)' }}>
        <span className="font-[family-name:var(--font-dm-mono)] text-sm" style={{ color: 'rgba(20,36,26,0.5)' }}>Cargando…</span>
      </div>
    );
  }

  const navItems: { v: Vista; label: string; icon: React.ReactNode }[] = [
    { v: 'dashboard', label: 'Dashboard', icon: <IconGrid /> },
    { v: 'mascotas', label: 'Mascotas', icon: <IconPets /> },
    { v: 'examenes', label: 'Exámenes', icon: <IconExams /> },
    { v: 'agenda', label: 'Agenda', icon: <IconCalendar /> },
    { v: 'configuracion', label: 'Configuración', icon: <IconSettings /> },
    { v: 'ayuda', label: 'Ayuda', icon: <IconHelp /> },
  ];

  const titulos: Record<Vista, { titulo: string; sub: string }> = {
    dashboard: { titulo: `${(() => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'; })()}, ${usuario?.nombre?.split(' ')[0] ?? ''}`, sub: new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
    mascotas: { titulo: 'Mis pacientes', sub: `${mascotas.length} mascotas registradas` },
    examenes: { titulo: 'Registro de exámenes', sub: `${examenesDeduplicados.length} registros en total` },
    agenda: { titulo: 'Agenda de consultas', sub: '' },
    configuracion: { titulo: 'Mi cuenta', sub: 'Perfil · Seguridad · Sesión' },
    ayuda: { titulo: '', sub: '' },
  };

  const cabecera = titulos[vista];
  const inicialUsuario = usuario?.nombre?.[0]?.toUpperCase() ?? 'A';

  return (
    <>
      <style>{`
        :root{
          --admin-bg:#f4f0e6;--admin-card:#fffdf7;--admin-soft:#ebe7da;--admin-ink:#14241a;
          --admin-green-deep:#0d2818;--admin-green-mid:#1f4d33;--admin-green-leaf:#4a7a5a;
          --admin-mint:#b1f0ce;--admin-glow:#d8e9c8;--admin-gold:#d4c47a;--admin-gold-dark:#a8973e;
          --admin-cream:#f5f1e8;--admin-red:#c0392b;--admin-orange:#d4603a;--admin-blue:#5a8fc0;
        }
        .admin-shell ::selection{background:var(--admin-mint);color:var(--admin-green-deep)}
        @keyframes adminRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes adminFadeRow{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes adminDotPulse{0%,100%{box-shadow:0 0 0 0 rgba(74,122,90,0.5)}50%{box-shadow:0 0 0 5px rgba(74,122,90,0)}}
        @keyframes adminShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes adminBorderPulse{0%,100%{border-color:rgba(20,36,26,0.2)}50%{border-color:rgba(74,122,90,0.5)}}
        @keyframes adminPanelIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .admin-rise{opacity:0;animation:adminRise 0.55s ease forwards}
        .admin-nav-item{position:relative}
        .admin-nav-item::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--admin-gold);transform:scaleY(0);transition:transform 0.25s}
        .admin-nav-item:hover::before{transform:scaleY(0.4)}
        .admin-nav-item.is-active::before{transform:scaleY(1)}
        .admin-dropzone::before{content:'';position:absolute;inset:0;border-radius:11px;padding:1.5px;background:linear-gradient(110deg,rgba(20,36,26,0.18),rgba(74,122,90,0.5),rgba(20,36,26,0.18));background-size:200% 100%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:adminShimmer 3s linear infinite}
        .admin-input{width:100%;padding:0.7rem 0.9rem;background:var(--admin-soft);border:1px solid rgba(20,36,26,0.1);border-radius:9px;font-family:var(--font-manrope);font-size:0.875rem;color:var(--admin-ink);outline:none;transition:border-color 0.2s,background 0.2s}
        .admin-input:focus{border-color:var(--admin-green-leaf);background:var(--admin-card)}
        .admin-input:disabled{opacity:0.5;cursor:not-allowed}
        select.admin-input{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2314241a' stroke-opacity='0.4' stroke-width='1.5'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.9rem center;padding-right:2.2rem}
        .admin-input-compact{padding:0.4rem 1.8rem 0.4rem 0.7rem;font-size:0.78rem;border-radius:7px;width:auto}
      `}</style>

      <div className="admin-shell flex min-h-screen" style={{ background: 'var(--admin-bg)' }}>
        {/* Grano de papel */}
        <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, opacity: 0.5, mixBlendMode: 'multiply', backgroundImage: GRAIN_BG }} aria-hidden />

        {/* ── Sidebar ── */}
        <aside
          className="w-[252px] flex-shrink-0 fixed top-0 left-0 h-full z-50 flex flex-col overflow-hidden font-[family-name:var(--font-manrope)]"
          style={{ background: 'var(--admin-green-deep)', color: '#fff', borderRight: '1px solid rgba(212,196,122,0.18)' }}
        >
          <span aria-hidden style={{ position: 'absolute', top: 0, right: 0, width: 1, height: '100%', background: 'linear-gradient(180deg,transparent,rgba(212,196,122,0.4),transparent)' }} />
          <FernLeaf2 color="#fff" opacity={0.06} style={{ position: 'absolute', bottom: -20, right: -50, width: 220, height: 'auto', transform: 'rotate(-20deg)', pointerEvents: 'none' }} />

          <div className="px-6 py-7 relative z-10">
            <Logo size="sm" variant="dark" />
          </div>

          <nav className="flex-1 py-2 relative z-10">
            <p className="px-6 pt-3 pb-2 font-[family-name:var(--font-dm-mono)] text-[0.58rem] uppercase" style={{ letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>Panel</p>
            {navItems.map(item => {
              const active = vista === item.v;
              return (
                <button
                  key={item.v}
                  onClick={() => { setVista(item.v); setCitaSeleccionada(null); }}
                  className={`admin-nav-item w-full flex items-center gap-3.5 py-2.5 text-left text-[0.875rem] font-medium transition-all duration-200 ${active ? 'is-active' : ''}`}
                  style={{
                    paddingLeft: '1.5rem', paddingRight: '1.5rem',
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    background: active ? 'rgba(212,196,122,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.paddingLeft = '1.7rem'; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.paddingLeft = '1.5rem'; } }}
                >
                  <span style={{ width: 18, height: 18, flexShrink: 0, opacity: active ? 1 : 0.85, display: 'flex' }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="m-3 px-4 py-4 relative z-10 flex items-center gap-3" style={{ borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-center flex-shrink-0 font-[family-name:var(--font-dm-mono)]" style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--admin-gold)', color: 'var(--admin-green-deep)', fontWeight: 500, fontSize: '0.85rem' }}>
              {inicialUsuario}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.8rem] font-semibold truncate" style={{ color: '#fff' }}>{usuario?.nombre ?? 'Administradora'}</div>
              <div className="text-[0.72rem] truncate" style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', color: 'var(--admin-mint)' }}>Médico Veterinaria</div>
            </div>
            <button onClick={cerrarSesion} title="Cerrar sesión" className="flex-shrink-0 p-1 transition-colors" style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--admin-red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
              <IconLogout />
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 ml-[252px] min-h-screen flex flex-col font-[family-name:var(--font-manrope)] relative" style={{ zIndex: 2 }}>
          {/* Topbar */}
          {vista !== 'ayuda' && (
            <div className="relative flex items-end justify-between gap-6 px-10 pt-8 pb-6">
              <span aria-hidden style={{ position: 'absolute', left: '2.5rem', right: '2.5rem', bottom: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,196,122,0.5) 20%,rgba(212,196,122,0.5) 80%,transparent)' }} />
              <div>
                <h1 className="text-[2rem] leading-tight" style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontWeight: 300, color: 'var(--admin-green-deep)' }}>{cabecera.titulo}</h1>
                {cabecera.sub && <p className="mt-1.5 font-[family-name:var(--font-dm-mono)] text-[0.7rem] uppercase" style={{ letterSpacing: '0.12em', color: 'rgba(20,36,26,0.4)' }}>{cabecera.sub}</p>}
              </div>
            </div>
          )}

          {/* Mensaje global */}
          {mensaje && (
            <div className="px-10 pt-4">
              <div role={mensaje.tipo === 'error' ? 'alert' : 'status'} aria-live={mensaje.tipo === 'error' ? 'assertive' : 'polite'}
                className="flex items-start gap-3 p-3 rounded-lg text-sm"
                style={{ background: mensaje.tipo === 'ok' ? 'rgba(177,240,206,0.35)' : 'rgba(192,57,43,0.1)', color: 'var(--admin-ink)' }}>
                <span className="flex-1">{mensaje.texto}</span>
                <button onClick={() => setMensaje(null)} aria-label="Cerrar mensaje" className="flex-shrink-0 leading-none" style={{ color: 'rgba(20,36,26,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              </div>
            </div>
          )}

          {vista === 'dashboard' && (
            <DashboardView
              mascotas={mascotas}
              citas={citas}
              recentMascotas={recentMascotas}
              pendientes={pendientes}
              sinAtender={sinAtender}
              citasHoy={citas.filter(c => {
                const f = new Date(c.fecha);
                const h = new Date();
                return f.getFullYear() === h.getFullYear() && f.getMonth() === h.getMonth() && f.getDate() === h.getDate();
              }).length}
              uploadMascotaId={uploadMascotaId}
              setUploadMascotaId={setUploadMascotaId}
              uploadTipo={uploadTipo}
              setUploadTipo={setUploadTipo}
              uploadArchivo={uploadArchivo}
              setUploadArchivo={setUploadArchivo}
              dragging={dragging}
              setDragging={setDragging}
              subiendo={subiendo}
              fileInputRef={fileInputRef}
              subirResultado={subirResultado}
              actualizarEstadoCita={actualizarEstadoCita}
            />
          )}

          {vista === 'mascotas' && (
            <MascotasView
              mascotas={mascotasFiltradas}
              orden={mascotaOrden}
              setOrden={setMascotaOrden}
              busqueda={mascotaBusqueda}
              setBusqueda={setMascotaBusqueda}
            />
          )}

          {vista === 'examenes' && (
            <ExamenesView
              examenes={examenesFiltrados}
              estado={examenEstado}
              setEstado={setExamenEstado}
              busqueda={examenBusqueda}
              setBusqueda={setExamenBusqueda}
              actualizarEstado={actualizarEstado}
              borrarPdf={borrarPdf}
            />
          )}

          {vista === 'agenda' && (
            <AgendaView
              citas={citas}
              mascotas={mascotas}
              mesActual={mesActual}
              setMesActual={setMesActual}
              citaSeleccionada={citaSeleccionada}
              setCitaSeleccionada={setCitaSeleccionada}
              actualizarEstadoCita={actualizarEstadoCita}
            />
          )}

          {vista === 'configuracion' && <ConfiguracionView usuario={usuario} cerrarSesion={cerrarSesion} mostrarMensaje={mostrarMensaje} />}
          {vista === 'ayuda' && <AyudaView />}
        </main>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Componentes base de estilo                                   */
/* ──────────────────────────────────────────────────────────── */

function Card({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`admin-rise overflow-hidden ${className}`} style={{ background: 'var(--admin-card)', borderRadius: 14, border: '1px solid rgba(20,36,26,0.07)', boxShadow: '0 1px 3px rgba(20,36,26,0.04)', animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

function CardHead({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(20,36,26,0.06)' }}>{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <span className="font-[family-name:var(--font-dm-mono)] text-[0.66rem] uppercase" style={{ letterSpacing: '0.18em', color: 'rgba(20,36,26,0.4)' }}>{children}</span>;
}

function GoldRule() {
  return <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,rgba(212,196,122,0.5),transparent)' }} aria-hidden />;
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block font-[family-name:var(--font-dm-mono)] text-[0.6rem] uppercase mb-1.5" style={{ letterSpacing: '0.14em', color: 'rgba(20,36,26,0.42)' }}>{label}</label>
      {children}
      {hint && <p className="text-xs mt-1.5" style={{ color: 'rgba(20,36,26,0.35)' }}>{hint}</p>}
    </div>
  );
}

function FilterPill({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-full text-[0.78rem] font-semibold transition-all" style={{
      padding: '0.55rem 1.05rem',
      border: active ? '1.5px solid var(--admin-green-deep)' : '1.5px solid rgba(20,36,26,0.12)',
      background: active ? 'var(--admin-green-deep)' : 'var(--admin-card)',
      color: active ? 'var(--admin-cream)' : 'rgba(20,36,26,0.55)',
    }}>
      {children}
    </button>
  );
}

function SegBtn({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="font-[family-name:var(--font-dm-mono)] text-[0.62rem] uppercase font-medium transition-all" style={{
      padding: '0.6rem 1rem', letterSpacing: '0.1em', whiteSpace: 'nowrap', border: 'none',
      background: active ? 'var(--admin-green-deep)' : 'transparent',
      color: active ? 'var(--admin-gold)' : 'rgba(20,36,26,0.45)',
      cursor: 'pointer',
    }}>
      {children}
    </button>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative flex-1" style={{ minWidth: 240 }}>
      <svg className="absolute" style={{ left: '0.95rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(20,36,26,0.32)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full text-[0.85rem] outline-none transition-all"
        style={{ padding: '0.7rem 0.9rem 0.7rem 2.5rem', background: 'var(--admin-card)', border: '1px solid rgba(20,36,26,0.1)', borderRadius: 9, color: 'var(--admin-ink)', fontFamily: 'var(--font-manrope)' }}
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--admin-green-leaf)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(20,36,26,0.1)')}
      />
    </div>
  );
}

/* ── Badges (consistentes) ── */
type EstadoExamen = 'DISPONIBLE' | 'EN_PROCESO' | 'PENDIENTE';

function ExamBadge({ estado }: { estado: EstadoExamen }) {
  const cfg = {
    DISPONIBLE: { bg: 'rgba(177,240,206,0.35)', color: 'var(--admin-green-mid)', emoji: '✅' },
    EN_PROCESO: { bg: 'rgba(212,196,122,0.18)', color: 'var(--admin-gold-dark)', emoji: '⏳' },
    PENDIENTE:  { bg: 'rgba(20,36,26,0.05)',    color: 'rgba(20,36,26,0.5)',     emoji: '⏸' },
  }[estado];
  return (
    <span className="inline-flex items-center justify-center rounded-full" style={{ width: 28, height: 28, background: cfg.bg, fontSize: '0.9rem', lineHeight: 1 }}>
      {cfg.emoji}
    </span>
  );
}

function CitaBadge({ estado }: { estado: EstadoCita }) {
  const cfg: Record<EstadoCita, { bg: string; color: string; label: string; dotColor: string; pulse?: boolean }> = {
    CONFIRMADA: { bg: 'rgba(177,240,206,0.35)', color: 'var(--admin-green-mid)', label: 'CONFIRMADA', dotColor: 'var(--admin-green-leaf)', pulse: true },
    PENDIENTE: { bg: 'rgba(212,196,122,0.18)', color: 'var(--admin-gold-dark)', label: 'PENDIENTE', dotColor: 'var(--admin-gold)' },
    COMPLETADA: { bg: 'rgba(20,36,26,0.06)', color: 'rgba(20,36,26,0.45)', label: 'COMPLETADA', dotColor: 'rgba(20,36,26,0.25)' },
    CANCELADA: { bg: 'rgba(192,57,43,0.09)', color: 'var(--admin-red)', label: 'CANCELADA', dotColor: 'var(--admin-red)' },
  };
  const c = cfg[estado];
  return (
    <span className="inline-flex items-center gap-1.5 font-[family-name:var(--font-dm-mono)] text-[0.6rem] font-medium rounded-full" style={{ padding: '0.3rem 0.65rem', letterSpacing: '0.1em', background: c.bg, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: c.dotColor, animation: c.pulse ? 'adminDotPulse 2s infinite' : 'none' }} />
      {c.label}
    </span>
  );
}

function ServicioChip({ estado }: { estado: 'DISPONIBLE' | 'PENDIENTE' | 'EN_PROCESO' | 'cancelado' }) {
  const cfg = {
    DISPONIBLE: { bg: 'rgba(177,240,206,0.4)', emoji: '✅' },
    EN_PROCESO: { bg: 'rgba(212,196,122,0.2)', emoji: '⏳' },
    cancelado:  { bg: 'rgba(192,57,43,0.09)',  emoji: '✖' },
    PENDIENTE:  { bg: 'rgba(20,36,26,0.06)',   emoji: '⏸' },
  }[estado];
  return (
    <span className="inline-flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 24, height: 24, background: cfg.bg, fontSize: '0.78rem', lineHeight: 1 }}>
      {cfg.emoji}
    </span>
  );
}

function PetEmojiCircle({ tipo, size = 'md' }: { tipo?: string; size?: 'sm' | 'md' }) {
  const gato = esMascotaGato(tipo);
  const dim = size === 'sm' ? 36 : 74;
  const fs = size === 'sm' ? '1.15rem' : '2.4rem';
  return (
    <div className="inline-flex items-center justify-center flex-shrink-0" style={{
      width: dim, height: dim, borderRadius: '50%', fontSize: fs,
      background: gato ? 'radial-gradient(circle at 35% 30%,rgba(232,210,200,0.6),rgba(245,232,225,0.4))' : 'radial-gradient(circle at 35% 30%,rgba(216,233,200,0.7),rgba(216,233,200,0.35))',
    }}>
      {gato ? '🐱' : '🐶'}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Vista: Dashboard                                             */
/* ──────────────────────────────────────────────────────────── */

interface DashboardViewProps {
  mascotas: Mascota[];
  citas: Cita[];
  recentMascotas: Mascota[];
  pendientes: number;
  sinAtender: number;
  citasHoy: number;
  uploadMascotaId: string;
  setUploadMascotaId: (v: string) => void;
  uploadTipo: string;
  setUploadTipo: (v: string) => void;
  uploadArchivo: File | null;
  setUploadArchivo: (f: File | null) => void;
  dragging: boolean;
  setDragging: (v: boolean) => void;
  subiendo: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  subirResultado: (e: React.FormEvent) => void;
  actualizarEstadoCita: (id: string, estado: EstadoCita) => void;
}

function DashboardView({
  mascotas, citas, recentMascotas, pendientes, sinAtender, citasHoy,
  uploadMascotaId, setUploadMascotaId, uploadTipo, setUploadTipo,
  uploadArchivo, setUploadArchivo, dragging, setDragging,
  subiendo, fileInputRef, subirResultado, actualizarEstadoCita,
}: DashboardViewProps) {
  const esExamen = SERVICIOS_CON_PDF.has(uploadTipo);

  const serviciosSolicitados: string[] = uploadMascotaId
    ? (() => {
        const mascota = mascotas.find(m => m.id === uploadMascotaId);
        const citasActivas = citas.filter(c => c.mascotaId === uploadMascotaId && c.estado !== 'CANCELADA');
        const pend: string[] = [];
        for (const c of citasActivas) {
          for (const s of c.servicios) {
            if (SERVICIOS_CON_PDF.has(s)) {
              const yaSubido = mascota?.examenes.some(ex => ex.tipo === s && ex.estado === 'DISPONIBLE');
              if (!yaSubido) pend.push(s);
            }
          }
        }
        return Array.from(new Set(pend)).sort();
      })()
    : [];

  return (
    <div className="px-10 pt-8 pb-14">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatTile tone="green" icon="🐾" num={mascotas.length} label="Pacientes activos" trend="registrados" paw />
        <StatTile tone="gold" icon="🧪" num={pendientes} label="Exámenes pendientes" trend="por revisar" />
        <StatTile tone="leaf" icon="📅" num={citasHoy} label="Citas para hoy" trend={citasHoy === 1 ? '1 visita' : `${citasHoy} visitas`} />
        <StatTile tone="orange" icon="⚠" num={sinAtender} label="Sin atender" trend="↑ revisar" />
      </div>

      <div className="grid gap-6 items-start" style={{ gridTemplateColumns: '320px 1fr' }}>
        {/* Subir resultado */}
        <Card delay={0.32}>
          <CardHead><CardTitle>Publicar resultado</CardTitle></CardHead>
          <div className="p-6">
            <form onSubmit={subirResultado}>
              <Field label="Mascota">
                <select required value={uploadMascotaId} onChange={e => { setUploadMascotaId(e.target.value); setUploadTipo(''); }} className="admin-input">
                  <option value="">Buscar mascota…</option>
                  {mascotas.map(m => <option key={m.id} value={m.id}>{emojiMascota(m.tipo)} {m.nombre} — {m.tutor?.nombre}</option>)}
                </select>
              </Field>

              <Field label="Tipo de examen" hint={uploadMascotaId ? (serviciosSolicitados.length === 0 ? 'No hay exámenes con PDF pendientes para esta mascota.' : 'Solo se muestran los servicios solicitados por el tutor.') : undefined}>
                <select required value={uploadTipo} onChange={e => setUploadTipo(e.target.value)} disabled={!uploadMascotaId || serviciosSolicitados.length === 0} className="admin-input">
                  <option value="">{!uploadMascotaId ? 'Primero selecciona mascota' : serviciosSolicitados.length === 0 ? 'Sin servicios solicitados' : 'Seleccionar servicio…'}</option>
                  {serviciosSolicitados.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              {esExamen && (
                <>
                  <label className="block font-[family-name:var(--font-dm-mono)] text-[0.6rem] uppercase mb-1.5" style={{ letterSpacing: '0.14em', color: 'rgba(20,36,26,0.42)' }}>Archivo PDF</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e: React.DragEvent) => {
                      e.preventDefault(); setDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file?.type === 'application/pdf') setUploadArchivo(file);
                    }}
                    className="admin-dropzone relative text-center cursor-pointer transition-all my-3 overflow-hidden"
                    style={{ borderRadius: 11, padding: '2rem 1.5rem', background: dragging ? 'rgba(216,233,200,0.45)' : 'rgba(216,233,200,0.18)' }}
                  >
                    {uploadArchivo ? (
                      <div className="relative z-10 flex items-center gap-3 justify-center rounded-lg py-3 px-4" style={{ background: 'var(--admin-glow)' }}>
                        <span>📄</span>
                        <span className="text-[0.82rem] font-semibold flex-1 truncate text-left" style={{ color: 'var(--admin-green-deep)' }}>{uploadArchivo.name}</span>
                        <span className="font-[family-name:var(--font-dm-mono)] text-[0.62rem]" style={{ color: 'var(--admin-green-leaf)' }}>{(uploadArchivo.size / 1024).toFixed(0)} KB</span>
                        <button type="button" onClick={e => { e.stopPropagation(); setUploadArchivo(null); }} className="leading-none text-base" style={{ color: 'var(--admin-green-leaf)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <div className="relative z-10">
                        <div className="text-3xl mb-2">📄</div>
                        <p className="text-[0.84rem]" style={{ color: 'rgba(20,36,26,0.55)' }}><strong style={{ color: 'var(--admin-green-leaf)' }}>Arrastra el PDF aquí</strong> o haz clic</p>
                        <p className="font-[family-name:var(--font-dm-mono)] text-[0.6rem] mt-1" style={{ color: 'rgba(20,36,26,0.32)' }}>PDF · máx. 10 MB</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => e.target.files && setUploadArchivo(e.target.files[0])} />
                  </div>
                </>
              )}

              <button type="submit" disabled={subiendo || !uploadMascotaId || !uploadTipo || (esExamen && !uploadArchivo)}
                className="w-full flex items-center justify-center gap-2 rounded-lg font-bold text-[0.85rem] transition-all mt-1"
                style={{ padding: '0.85rem', background: 'var(--admin-gold)', color: 'var(--admin-green-deep)', border: 'none', cursor: subiendo ? 'wait' : 'pointer', opacity: (subiendo || !uploadMascotaId || !uploadTipo || (esExamen && !uploadArchivo)) ? 0.45 : 1 }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.background = '#e2d490'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-gold)'; }}>
                {subiendo ? 'Procesando…' : esExamen ? 'Publicar resultado →' : 'Registrar servicio →'}
              </button>
            </form>
          </div>
        </Card>

        {/* Actividad reciente */}
        <Card delay={0.4}>
          <CardHead>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHead>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <ThEditorial>Mascota / Tutor</ThEditorial>
                  <ThEditorial>Última cita</ThEditorial>
                  <ThEditorial>Estado de cita</ThEditorial>
                  <ThEditorial>Exámenes</ThEditorial>
                  <ThEditorial>Acciones</ThEditorial>
                </tr>
              </thead>
              <tbody>
                {recentMascotas.map((m, i) => {
                  const citasMascota = citas.filter(c => c.mascotaId === m.id).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                  const citaMasReciente = citasMascota[0];
                  const examenesDeCita = citaMasReciente ? citaMasReciente.servicios.filter(s => SERVICIOS_EXAMEN.has(s)) : [];
                  return (
                    <tr key={m.id} style={{ animation: 'adminFadeRow 0.4s ease forwards', animationDelay: `${0.45 + i * 0.05}s`, opacity: 0, borderBottom: '1px solid rgba(20,36,26,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(216,233,200,0.35)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <PetEmojiCircle tipo={m.tipo} size="sm" />
                          <div>
                            <p className="text-[0.85rem] font-semibold" style={{ color: 'var(--admin-ink)' }}>{m.nombre}</p>
                            <p className="text-[0.72rem]" style={{ color: 'rgba(20,36,26,0.42)' }}>{m.tutor?.nombre}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-[family-name:var(--font-dm-mono)] text-[0.76rem]" style={{ color: 'rgba(20,36,26,0.6)' }}>{citaMasReciente ? fechaCorta(citaMasReciente.fecha) : 'Sin citas'}</td>
                      <td className="px-4 py-3.5">{citaMasReciente ? <CitaBadge estado={citaMasReciente.estado} /> : <span className="text-xs" style={{ color: 'rgba(20,36,26,0.4)' }}>—</span>}</td>
                      <td className="px-4 py-3.5">
                        {!citaMasReciente && <span className="text-xs" style={{ color: 'rgba(20,36,26,0.4)' }}>—</span>}
                        {citaMasReciente && examenesDeCita.length === 0 && <span className="text-xs" style={{ color: 'rgba(20,36,26,0.4)' }}>Sin exámenes</span>}
                        {citaMasReciente && examenesDeCita.length > 0 && (
                          <ul className="space-y-1">
                            {examenesDeCita.map(tipoEx => {
                              const exsMismotipo = m.examenes.filter(e => e.tipo === tipoEx);
                              const cancelado = citaMasReciente.estado === 'CANCELADA';
                              const prioridad = (s: string) => s === 'DISPONIBLE' ? 2 : s === 'EN_PROCESO' ? 1 : 0;
                              const mejor = exsMismotipo.sort((a, b) => prioridad(b.estado) - prioridad(a.estado))[0];
                              const estadoChip = cancelado ? 'cancelado' : (mejor?.estado ?? 'PENDIENTE');
                              return (
                                <li key={tipoEx} className="flex items-center justify-between gap-2 text-xs" style={{ color: 'var(--admin-ink)' }}>
                                  <span className="truncate">{tipoEx}</span>
                                  <ServicioChip estado={estadoChip as 'DISPONIBLE' | 'PENDIENTE' | 'EN_PROCESO' | 'cancelado'} />
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {citaMasReciente ? (
                          <>
                            <span className="sr-only">Cambiar estado de la cita de {m.nombre}</span>
                            <select value={citaMasReciente.estado} onChange={e => actualizarEstadoCita(citaMasReciente.id, e.target.value as EstadoCita)} className="admin-input admin-input-compact">
                              <option value="PENDIENTE">Pendiente</option>
                              <option value="CONFIRMADA">Confirmada</option>
                              <option value="COMPLETADA">Atendida</option>
                              <option value="CANCELADA">Cancelada</option>
                            </select>
                          </>
                        ) : <span className="text-xs" style={{ color: 'rgba(20,36,26,0.4)' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
                {recentMascotas.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: 'rgba(20,36,26,0.4)' }}>No hay mascotas registradas aún</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatTile({ tone, icon, num, label, trend, paw = false }: { tone: 'green' | 'gold' | 'leaf' | 'orange'; icon: string; num: number; label: string; trend: string; paw?: boolean }) {
  const isGreen = tone === 'green';
  const topBar = { green: 'linear-gradient(90deg,var(--admin-gold),transparent)', gold: 'var(--admin-gold)', leaf: 'var(--admin-green-leaf)', orange: 'var(--admin-orange)' }[tone];
  const numColor = { green: 'var(--admin-gold)', gold: 'var(--admin-gold-dark)', leaf: 'var(--admin-ink)', orange: 'var(--admin-orange)' }[tone];
  const trendCfg = isGreen
    ? { bg: 'rgba(212,196,122,0.15)', color: 'rgba(212,196,122,0.85)' }
    : tone === 'orange'
      ? { bg: 'rgba(212,96,58,0.12)', color: 'var(--admin-orange)' }
      : { bg: 'rgba(74,122,90,0.12)', color: 'var(--admin-green-mid)' };
  const delays = { green: 0.05, gold: 0.12, leaf: 0.19, orange: 0.26 }[tone];
  return (
    <div className="admin-rise relative overflow-hidden" style={{
      background: isGreen ? 'var(--admin-green-deep)' : 'var(--admin-card)',
      borderRadius: 14, border: isGreen ? '1px solid transparent' : '1px solid rgba(20,36,26,0.07)',
      padding: '1.5rem 1.4rem 1.4rem', boxShadow: '0 1px 3px rgba(20,36,26,0.04)', animationDelay: `${delays}s`,
    }}>
      <span aria-hidden style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: topBar }} />
      {paw && <div className="absolute" style={{ right: -20, bottom: -30, width: 140, height: 140, opacity: 0.08 }} aria-hidden><PawPrint fill="#fff" opacity={1} className="w-full h-full" /></div>}
      <span className="block text-[1.3rem] mb-3.5 relative z-10">{icon}</span>
      <div className="relative z-10 leading-none" style={{ fontFamily: 'var(--font-newsreader)', fontWeight: 300, fontSize: '3.1rem', color: numColor }}>{num}</div>
      <div className="relative z-10 font-[family-name:var(--font-dm-mono)] text-[0.62rem] uppercase mt-2.5" style={{ letterSpacing: '0.15em', color: isGreen ? 'rgba(212,196,122,0.6)' : 'rgba(20,36,26,0.45)' }}>{label}</div>
      <span className="absolute font-[family-name:var(--font-dm-mono)] text-[0.62rem] font-medium rounded-full z-10" style={{ top: '1.4rem', right: '1.4rem', padding: '0.2rem 0.5rem', background: trendCfg.bg, color: trendCfg.color }}>{trend}</span>
    </div>
  );
}

function ThEditorial({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-[family-name:var(--font-dm-mono)] text-[0.6rem] uppercase first:pl-6" style={{ padding: '0.85rem 1rem', letterSpacing: '0.15em', color: 'rgba(20,36,26,0.38)', borderBottom: '1px solid rgba(20,36,26,0.08)', whiteSpace: 'nowrap', background: 'rgba(235,231,218,0.4)' }}>{children}</th>;
}

/* ──────────────────────────────────────────────────────────── */
/*  Vista: Mascotas                                              */
/* ──────────────────────────────────────────────────────────── */

type MascotaOrden = 'fecha' | 'tipo' | 'atendido' | 'sin-atender';

function MascotasView({ mascotas, orden, setOrden, busqueda, setBusqueda }: {
  mascotas: Mascota[]; orden: MascotaOrden; setOrden: (o: MascotaOrden) => void; busqueda: string; setBusqueda: (s: string) => void;
}) {
  return (
    <div className="px-10 pt-8 pb-14">
      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, raza o tutor…" />
        <select value={orden} onChange={e => setOrden(e.target.value as MascotaOrden)} className="admin-input" style={{ width: 'auto' }}>
          <option value="fecha">Más recientes</option>
          <option value="tipo">Por tipo de animal</option>
          <option value="atendido">Atendidas primero</option>
          <option value="sin-atender">Sin atender primero</option>
        </select>
        <div className="flex gap-2">
          <FilterPill active={orden === 'fecha' || orden === 'tipo'} onClick={() => setOrden('fecha')}>Todos</FilterPill>
          <FilterPill active={orden === 'atendido'} onClick={() => setOrden('atendido')}>Atendidas</FilterPill>
          <FilterPill active={orden === 'sin-atender'} onClick={() => setOrden('sin-atender')}>Sin atender</FilterPill>
        </div>
      </div>

      {mascotas.length === 0 ? (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--admin-card)', border: '1px solid rgba(20,36,26,0.07)' }}>
          <p className="text-sm font-[family-name:var(--font-dm-mono)]" style={{ color: 'rgba(20,36,26,0.4)' }}>Sin resultados</p>
        </div>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))' }}>
          {mascotas.map((m, i) => {
            const ue = ultimoExamen(m);
            const atendida = fueAtendida(m);
            return (
              <div key={m.id} className="admin-rise flex flex-col overflow-hidden" style={{ background: 'var(--admin-card)', borderRadius: 14, border: '1px solid rgba(20,36,26,0.07)', boxShadow: '0 1px 3px rgba(20,36,26,0.04)', animationDelay: `${0.04 * i}s` }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 36px rgba(20,36,26,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(20,36,26,0.04)'; }}>
                <div className="text-center pt-6 px-5 pb-4">
                  <div className="mx-auto mb-3 transition-transform" style={{ width: 'fit-content' }}><PetEmojiCircle tipo={m.tipo} /></div>
                  <div className="leading-tight" style={{ fontFamily: 'var(--font-newsreader)', fontWeight: 400, fontSize: '1.25rem', color: 'var(--admin-green-deep)' }}>{m.nombre}</div>
                  <div className="font-[family-name:var(--font-dm-mono)] text-[0.62rem] uppercase mt-1" style={{ letterSpacing: '0.08em', color: 'rgba(20,36,26,0.4)' }}>
                    {m.tipo}{m.raza ? ` · ${m.raza}` : ''}{m.edad != null ? ` · ${m.edad} años` : ''}
                  </div>
                </div>
                <GoldRule />
                <div className="px-5 py-3.5">
                  <div className="text-[0.82rem] font-semibold" style={{ color: 'var(--admin-ink)' }}>{m.tutor?.nombre}</div>
                  <div className="font-[family-name:var(--font-dm-mono)] text-[0.66rem] mt-0.5" style={{ color: 'rgba(20,36,26,0.42)' }}>{m.tutor?.telefono || m.tutor?.email}</div>
                </div>
                <GoldRule />
                <div className="px-5 py-3.5 flex items-center justify-between">
                  {atendida ? <ExamBadge estado="DISPONIBLE" /> : (
                    <span className="inline-flex items-center gap-1.5 font-[family-name:var(--font-dm-mono)] text-[0.58rem] font-medium rounded-full" style={{ padding: '0.28rem 0.6rem', letterSpacing: '0.1em', background: 'rgba(20,36,26,0.05)', color: 'rgba(20,36,26,0.5)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', border: '1.5px solid rgba(20,36,26,0.32)' }} />SIN ATENDER
                    </span>
                  )}
                  <span className="font-[family-name:var(--font-dm-mono)] text-[0.62rem]" style={{ color: 'rgba(20,36,26,0.38)' }}>{m.examenes.length} examen{m.examenes.length !== 1 ? 'es' : ''}</span>
                </div>
                <div className="mx-5 mb-5">
                  <div className="text-[0.7rem] mb-2" style={{ color: 'rgba(20,36,26,0.45)' }}>
                    {ue ? <>Último: {ue.tipo} · {fechaCorta(ue.creadoEn)}</> : 'Sin exámenes registrados'}
                  </div>
                  <div className="text-[0.72rem]" style={{ color: 'rgba(20,36,26,0.4)' }}>{m.tutor?.email}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Vista: Exámenes                                              */
/* ──────────────────────────────────────────────────────────── */

type ExamenEstado = 'TODOS' | 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE';

function ExamenesView({ examenes, estado, setEstado, busqueda, setBusqueda, actualizarEstado, borrarPdf }: {
  examenes: Examen[]; estado: ExamenEstado; setEstado: (e: ExamenEstado) => void; busqueda: string; setBusqueda: (s: string) => void;
  actualizarEstado: (id: string, estado: string) => void; borrarPdf: (id: string) => void;
}) {
  return (
    <div className="px-10 pt-8 pb-14">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por mascota, tutor o tipo…" />
        <div className="flex overflow-hidden" style={{ background: 'var(--admin-card)', border: '1px solid rgba(20,36,26,0.1)', borderRadius: 9 }}>
          <SegBtn active={estado === 'TODOS'} onClick={() => setEstado('TODOS')}>Todos</SegBtn>
          <SegBtn active={estado === 'PENDIENTE'} onClick={() => setEstado('PENDIENTE')}>Pendiente</SegBtn>
          <SegBtn active={estado === 'EN_PROCESO'} onClick={() => setEstado('EN_PROCESO')}>En proceso</SegBtn>
          <SegBtn active={estado === 'DISPONIBLE'} onClick={() => setEstado('DISPONIBLE')}>Disponible</SegBtn>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <ThEditorial>Mascota</ThEditorial>
                <ThEditorial>Tutor</ThEditorial>
                <ThEditorial>Tipo de examen</ThEditorial>
                <ThEditorial>Fecha</ThEditorial>
                <ThEditorial>Estado</ThEditorial>
                <ThEditorial>Acciones</ThEditorial>
              </tr>
            </thead>
            <tbody>
              {examenes.map((ex, i) => (
                <tr key={ex.id} style={{ animation: 'adminFadeRow 0.4s ease forwards', animationDelay: `${0.03 * i}s`, opacity: 0, borderBottom: '1px solid rgba(20,36,26,0.04)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(216,233,200,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <PetEmojiCircle tipo={ex.mascota?.tipo} size="sm" />
                      <span className="text-[0.85rem] font-semibold" style={{ color: 'var(--admin-ink)' }}>{ex.mascota?.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-[0.85rem]" style={{ color: 'var(--admin-ink)' }}>{ex.mascota?.tutor?.nombre}</span>
                    <div className="font-[family-name:var(--font-dm-mono)] text-[0.62rem] uppercase mt-0.5" style={{ letterSpacing: '0.08em', color: 'rgba(20,36,26,0.4)' }}>tutor</div>
                  </td>
                  <td className="px-4 py-3.5 text-[0.85rem]" style={{ color: 'var(--admin-ink)' }}>{ex.tipo}</td>
                  <td className="px-4 py-3.5 font-[family-name:var(--font-dm-mono)] text-[0.76rem]" style={{ color: 'rgba(20,36,26,0.6)' }}>{fechaCorta(ex.creadoEn)}</td>
                  <td className="px-4 py-3.5"><ExamBadge estado={ex.estado} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="sr-only">Estado del examen</span>
                      <select value={ex.estado} onChange={e => actualizarEstado(ex.id, e.target.value)} className="admin-input admin-input-compact">
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_PROCESO">En proceso</option>
                        <option value="DISPONIBLE">Disponible</option>
                      </select>
                      {ex.archivoUrl ? (
                        <a href={ex.archivoUrl} target="_blank" rel="noopener noreferrer" title="Ver PDF" className="flex items-center justify-center transition-all" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(20,36,26,0.1)', color: 'var(--admin-ink)', textDecoration: 'none' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-glow)'; e.currentTarget.style.borderColor = 'var(--admin-green-leaf)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(20,36,26,0.1)'; }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </a>
                      ) : (
                        <span title="Sin PDF" className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(20,36,26,0.06)', color: 'rgba(20,36,26,0.2)', cursor: 'not-allowed' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </span>
                      )}
                      <button onClick={() => { if (ex.archivoUrl && confirm('¿Eliminar el PDF y volver a estado pendiente?')) borrarPdf(ex.id); }} title={ex.archivoUrl ? 'Borrar PDF' : 'Sin PDF que borrar'} disabled={!ex.archivoUrl} className="flex items-center justify-center transition-all" style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid rgba(20,36,26,0.1)', background: 'transparent', cursor: ex.archivoUrl ? 'pointer' : 'not-allowed', color: ex.archivoUrl ? 'var(--admin-ink)' : 'rgba(20,36,26,0.2)', opacity: ex.archivoUrl ? 1 : 0.4 }}
                        onMouseEnter={e => { if (ex.archivoUrl) { e.currentTarget.style.background = 'rgba(192,57,43,0.08)'; e.currentTarget.style.borderColor = 'var(--admin-red)'; e.currentTarget.style.color = 'var(--admin-red)'; }}}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(20,36,26,0.1)'; e.currentTarget.style.color = ex.archivoUrl ? 'var(--admin-ink)' : 'rgba(20,36,26,0.2)'; }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {examenes.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm" style={{ color: 'rgba(20,36,26,0.4)' }}>No hay exámenes con esos criterios.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-8 px-6 py-4 flex-wrap font-[family-name:var(--font-dm-mono)] text-[0.6rem]" style={{ borderTop: '1px solid rgba(20,36,26,0.06)', color: 'rgba(20,36,26,0.5)', letterSpacing: '0.06em' }}>
          <span className="uppercase" style={{ fontSize: '0.56rem', letterSpacing: '0.12em', color: 'rgba(20,36,26,0.3)' }}>Leyenda</span>
          <span className="flex items-center gap-2"><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--admin-green-leaf)', boxShadow: '0 0 0 3px rgba(74,122,90,0.15)' }} />DISPONIBLE — resultado publicado</span>
          <span className="flex items-center gap-2"><span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--admin-gold)' }} />EN PROCESO — laboratorio en análisis</span>
          <span className="flex items-center gap-2"><span style={{ width: 7, height: 7, borderRadius: '50%', border: '1.5px solid rgba(20,36,26,0.3)' }} />PENDIENTE — sin resultado</span>
        </div>
      </Card>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Vista: Agenda                                                */
/* ──────────────────────────────────────────────────────────── */

function estadoServicio(servicio: string, cita: Cita, mascotas: Mascota[]): 'DISPONIBLE' | 'PENDIENTE' | 'EN_PROCESO' | 'cancelado' {
  if (cita.estado === 'CANCELADA') return 'cancelado';
  if (SERVICIOS_EXAMEN.has(servicio)) {
    const mascota = mascotas.find(m => m.id === cita.mascotaId);
    const examenes = mascota?.examenes.filter(e => e.tipo === servicio) ?? [];
    const prioridad = (s: string) => s === 'DISPONIBLE' ? 2 : s === 'EN_PROCESO' ? 1 : 0;
    const mejor = examenes.sort((a, b) => prioridad(b.estado) - prioridad(a.estado))[0];
    return (mejor?.estado ?? 'PENDIENTE') as 'DISPONIBLE' | 'PENDIENTE' | 'EN_PROCESO';
  }
  if (cita.estado !== 'COMPLETADA') return 'PENDIENTE';
  return 'DISPONIBLE';
}

function horaCorta(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function chipStyle(estado: EstadoCita): React.CSSProperties {
  const cfg: Record<EstadoCita, { bg: string; color: string; bar: string }> = {
    CONFIRMADA: { bg: 'rgba(31,77,51,0.12)', color: 'var(--admin-green-mid)', bar: 'var(--admin-green-mid)' },
    PENDIENTE: { bg: 'rgba(212,196,122,0.2)', color: 'var(--admin-gold-dark)', bar: 'var(--admin-gold)' },
    COMPLETADA: { bg: 'rgba(20,36,26,0.06)', color: 'rgba(20,36,26,0.45)', bar: 'rgba(20,36,26,0.25)' },
    CANCELADA: { bg: 'rgba(192,57,43,0.09)', color: 'var(--admin-red)', bar: 'var(--admin-red)' },
  };
  const c = cfg[estado];
  return { background: c.bg, color: c.color, borderLeft: `2.5px solid ${c.bar}` };
}

function AgendaView({ citas, mascotas, mesActual, setMesActual, citaSeleccionada, setCitaSeleccionada, actualizarEstadoCita }: {
  citas: Cita[]; mascotas: Mascota[]; mesActual: Date; setMesActual: (d: Date) => void;
  citaSeleccionada: Cita | null; setCitaSeleccionada: (c: Cita | null) => void; actualizarEstadoCita: (id: string, estado: EstadoCita) => void;
}) {
  const año = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const primerDia = new Date(año, mes, 1).getDay();
  const offset = (primerDia + 6) % 7;
  const diasMes = new Date(año, mes + 1, 0).getDate();

  const citasMes = citas.filter(c => { const f = new Date(c.fecha); return f.getFullYear() === año && f.getMonth() === mes; });
  const citasPorDia = new Map<number, Cita[]>();
  for (const c of citasMes) {
    const dia = new Date(c.fecha).getDate();
    const list = citasPorDia.get(dia) ?? [];
    list.push(c); citasPorDia.set(dia, list);
  }
  for (const list of citasPorDia.values()) list.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const hoy = new Date();
  const esHoy = (dia: number) => hoy.getFullYear() === año && hoy.getMonth() === mes && hoy.getDate() === dia;

  const stats = {
    confirmadas: citasMes.filter(c => c.estado === 'CONFIRMADA').length,
    pendientes: citasMes.filter(c => c.estado === 'PENDIENTE').length,
    hoy: citasMes.filter(c => { const f = new Date(c.fecha); return f.getDate() === hoy.getDate() && f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear(); }).length,
    completadas: citasMes.filter(c => c.estado === 'COMPLETADA').length,
  };

  const mesAnterior = () => setMesActual(new Date(año, mes - 1, 1));
  const mesSiguiente = () => setMesActual(new Date(año, mes + 1, 1));

  const cells: ({ dia: number } | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= diasMes; d++) cells.push({ dia: d });
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailing; i++) cells.push(null);

  const navBtn = (label: string, onClick: () => void, aria: string) => (
    <button onClick={onClick} aria-label={aria} className="flex items-center justify-center transition-all text-[0.85rem]" style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid rgba(20,36,26,0.12)', background: 'var(--admin-card)', color: 'var(--admin-ink)', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-green-deep)'; e.currentTarget.style.color = 'var(--admin-gold)'; e.currentTarget.style.borderColor = 'var(--admin-green-deep)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--admin-card)'; e.currentTarget.style.color = 'var(--admin-ink)'; e.currentTarget.style.borderColor = 'rgba(20,36,26,0.12)'; }}>{label}</button>
  );

  return (
    <div className="px-10 pt-2 pb-14">
      {/* Nav mes */}
      <div className="flex items-center gap-2 mb-7">
        {navBtn('◄', mesAnterior, 'Mes anterior')}
        <span className="inline-flex items-center px-4 h-[34px] rounded-lg font-[family-name:var(--font-dm-mono)] text-[0.72rem] uppercase select-none" style={{ letterSpacing: '0.1em', border: '1px solid rgba(20,36,26,0.12)', background: 'var(--admin-card)', color: 'var(--admin-ink)' }}>
          {mesActual.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
        </span>
        {navBtn('►', mesSiguiente, 'Mes siguiente')}
      </div>

      <div className="grid gap-6 items-start" style={{ gridTemplateColumns: '1fr 344px' }}>
        {/* Calendario */}
        <div className="admin-rise overflow-hidden" style={{ background: 'var(--admin-card)', borderRadius: 14, border: '1px solid rgba(20,36,26,0.07)', boxShadow: '0 1px 3px rgba(20,36,26,0.04)', animationDelay: '0.1s' }}>
          <div className="grid grid-cols-7" style={{ borderBottom: '1px solid rgba(20,36,26,0.07)', background: 'rgba(235,231,218,0.5)' }}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-center py-3 font-[family-name:var(--font-dm-mono)] text-[0.58rem] uppercase" style={{ letterSpacing: '0.12em', color: 'rgba(20,36,26,0.38)' }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={idx} style={{ minHeight: 122, borderRight: '1px solid rgba(20,36,26,0.04)', borderBottom: '1px solid rgba(20,36,26,0.04)', background: 'rgba(20,36,26,0.015)' }} />;
              const dia = cell.dia;
              const citasDia = citasPorDia.get(dia) ?? [];
              const hoyCell = esHoy(dia);
              return (
                <div key={idx} className="p-2 relative transition-colors" style={{ minHeight: 122, borderRight: '1px solid rgba(20,36,26,0.04)', borderBottom: '1px solid rgba(20,36,26,0.04)', boxShadow: hoyCell ? 'inset 0 0 0 2px var(--admin-green-leaf)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(216,233,200,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="flex justify-end mb-1.5 font-[family-name:var(--font-dm-mono)] text-[0.72rem] font-medium" style={{ color: 'rgba(20,36,26,0.4)' }}>
                    {hoyCell ? <span className="inline-flex items-center justify-center" style={{ background: 'var(--admin-green-deep)', color: 'var(--admin-gold)', width: 22, height: 22, borderRadius: '50%', fontSize: '0.68rem' }}>{dia}</span> : dia}
                  </div>
                  <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 80 }}>
                    {citasDia.slice(0, 3).map(c => (
                      <button key={c.id} onClick={() => setCitaSeleccionada(c)} className="text-left text-[0.62rem] font-semibold rounded transition-transform truncate" style={{ padding: '0.24rem 0.42rem 0.24rem 0.5rem', ...chipStyle(c.estado), ...(citaSeleccionada?.id === c.id ? { outline: '1.5px solid var(--admin-green-leaf)', outlineOffset: 1 } : {}) }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                        {emojiMascota(c.mascota.tipo)} {c.mascota.nombre} · {horaCorta(c.fecha)}
                      </button>
                    ))}
                    {citasDia.length > 3 && <span className="font-[family-name:var(--font-dm-mono)] text-[0.55rem] px-1" style={{ color: 'rgba(20,36,26,0.4)' }}>+{citasDia.length - 3} más</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Stats debajo del calendario */}
          <div className="flex gap-2.5 flex-wrap px-4 py-3" style={{ borderTop: '1px solid rgba(20,36,26,0.06)' }}>
            <MiniStat dot="var(--admin-green-leaf)" num={stats.confirmadas} label="Confirmadas" />
            <MiniStat dot="var(--admin-gold)" num={stats.pendientes} label="Pendientes" />
            <MiniStat dot="var(--admin-blue)" num={stats.hoy} label="Hoy" glow />
            <MiniStat dot="rgba(20,36,26,0.22)" num={stats.completadas} label="Completadas" />
          </div>
        </div>

        {/* Panel lateral */}
        <aside className="sticky overflow-hidden" style={{ top: '1.5rem', background: 'var(--admin-card)', borderRadius: 14, border: '1px solid rgba(20,36,26,0.07)', boxShadow: '0 4px 24px rgba(20,36,26,0.08)', animation: citaSeleccionada ? 'adminPanelIn 0.35s cubic-bezier(.4,0,.2,1)' : 'none' }}>
          {!citaSeleccionada ? (
            <div className="text-center font-[family-name:var(--font-dm-mono)] text-[0.72rem]" style={{ padding: '3rem 1.4rem', color: 'rgba(20,36,26,0.35)', lineHeight: 1.7 }}>
              <span className="block text-2xl mb-3" style={{ opacity: 0.4 }}>📅</span>
              Selecciona una cita<br />en el calendario para ver<br />sus detalles aquí.
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden flex items-start justify-between gap-4" style={{ padding: '1.4rem 1.4rem 1rem' }}>
                <span aria-hidden style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'radial-gradient(circle,rgba(216,233,200,0.5),transparent 70%)' }} />
                <div className="relative z-10">
                  <span className="block text-3xl mb-1.5">{emojiMascota(citaSeleccionada.mascota.tipo)}</span>
                  <div style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.4rem', color: 'var(--admin-green-deep)' }}>{citaSeleccionada.mascota.nombre}</div>
                </div>
                <button onClick={() => setCitaSeleccionada(null)} className="relative z-10 flex items-center justify-center flex-shrink-0 text-[0.85rem] transition-all" style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(20,36,26,0.1)', background: 'transparent', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.08)'; e.currentTarget.style.borderColor = 'var(--admin-red)'; e.currentTarget.style.color = 'var(--admin-red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(20,36,26,0.1)'; e.currentTarget.style.color = 'inherit'; }}>✕</button>
              </div>
              <div style={{ padding: '0 1.4rem 1.4rem' }}>
                <PanelRow icon="📅" label="Fecha y hora" value={new Date(citaSeleccionada.fecha).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} sub={`${horaCorta(citaSeleccionada.fecha)} hrs`} />
                <PanelRow icon="📍" label="Dirección" value={citaSeleccionada.direccion} />
                <PanelRow icon="👤" label="Tutor" value={citaSeleccionada.mascota.tutor.nombre} sub={citaSeleccionada.mascota.tutor.telefono} />
                <div className="my-4"><GoldRule /></div>
                <div className="font-[family-name:var(--font-dm-mono)] text-[0.58rem] uppercase mb-2" style={{ letterSpacing: '0.1em', color: 'rgba(20,36,26,0.4)' }}>Servicios solicitados</div>
                <div className="flex flex-col gap-1">
                  {citaSeleccionada.servicios.map(s => {
                    const estado = estadoServicio(s, citaSeleccionada, mascotas);
                    return (
                      <div key={s} className="flex items-center justify-between gap-2 text-[0.8rem] py-1.5" style={{ borderBottom: '1px solid rgba(20,36,26,0.04)' }}>
                        <span className="truncate flex items-center gap-2" style={{ color: 'var(--admin-ink)' }}><span style={{ color: 'var(--admin-green-leaf)', fontWeight: 800 }}>·</span>{s}</span>
                        <ServicioChip estado={estado} />
                      </div>
                    );
                  })}
                </div>
                <div className="my-4"><GoldRule /></div>
                <div className="mb-2.5"><CitaBadge estado={citaSeleccionada.estado} /></div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {citaSeleccionada.estado === 'PENDIENTE' && (
                    <>
                      <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'CONFIRMADA')} className="rounded-lg font-semibold text-[0.78rem] transition-all" style={{ padding: '0.65rem', background: 'var(--admin-green-deep)', color: 'var(--admin-cream)', border: 'none', cursor: 'pointer' }}>✓ Confirmar</button>
                      <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'CANCELADA')} className="rounded-lg font-semibold text-[0.78rem] transition-all" style={{ padding: '0.65rem', background: 'transparent', border: '1.5px solid rgba(192,57,43,0.3)', color: 'var(--admin-red)', cursor: 'pointer' }}>✕ Cancelar</button>
                    </>
                  )}
                  {citaSeleccionada.estado === 'CONFIRMADA' && (
                    <>
                      <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'COMPLETADA')} className="rounded-lg font-semibold text-[0.78rem] transition-all" style={{ padding: '0.65rem', background: 'var(--admin-green-deep)', color: 'var(--admin-cream)', border: 'none', cursor: 'pointer' }}>✓ Atendida</button>
                      <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'CANCELADA')} className="rounded-lg font-semibold text-[0.78rem] transition-all" style={{ padding: '0.65rem', background: 'transparent', border: '1.5px solid rgba(192,57,43,0.3)', color: 'var(--admin-red)', cursor: 'pointer' }}>✕ Cancelar</button>
                    </>
                  )}
                  {(citaSeleccionada.estado === 'COMPLETADA' || citaSeleccionada.estado === 'CANCELADA') && (
                    <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'PENDIENTE')} className="col-span-2 rounded-lg font-semibold text-[0.78rem] transition-all" style={{ padding: '0.65rem', background: 'transparent', border: '1.5px solid rgba(20,36,26,0.12)', color: 'var(--admin-ink)', cursor: 'pointer' }}>Reabrir como pendiente</button>
                  )}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function MiniStat({ dot, num, label, glow = false }: { dot: string; num: number; label: string; glow?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2" style={{ background: 'var(--admin-card)', borderRadius: 9, border: '1px solid rgba(20,36,26,0.07)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: dot, boxShadow: glow ? '0 0 0 3px rgba(90,143,192,0.2)' : 'none' }} />
      <div>
        <div className="leading-none" style={{ fontFamily: 'var(--font-newsreader)', fontWeight: 300, fontSize: '1.2rem', color: 'var(--admin-green-deep)' }}>{num}</div>
        <div className="font-[family-name:var(--font-dm-mono)] text-[0.58rem] uppercase" style={{ letterSpacing: '0.1em', color: 'rgba(20,36,26,0.4)' }}>{label}</div>
      </div>
    </div>
  );
}

function PanelRow({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <span className="text-[0.95rem] text-center flex-shrink-0" style={{ width: 20, marginTop: '0.05rem' }}>{icon}</span>
      <div>
        <div className="font-[family-name:var(--font-dm-mono)] text-[0.58rem] uppercase mb-0.5" style={{ letterSpacing: '0.1em', color: 'rgba(20,36,26,0.4)' }}>{label}</div>
        <div className="text-[0.85rem] font-medium" style={{ color: 'var(--admin-ink)' }}>{value}</div>
        {sub && <div className="text-[0.75rem] mt-0.5" style={{ color: 'rgba(20,36,26,0.5)' }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Vista: Configuración                                         */
/* ──────────────────────────────────────────────────────────── */

function ConfiguracionView({ usuario, cerrarSesion, mostrarMensaje }: {
  usuario: Usuario | null; cerrarSesion: () => void; mostrarMensaje: (tipo: 'ok' | 'error', texto: string) => void;
}) {
  const inicial = usuario?.nombre?.[0]?.toUpperCase() ?? '?';
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [foto, setFoto] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [pwdActual, setPwdActual] = useState('');
  const [pwdNueva, setPwdNueva] = useState('');
  const [pwdConfirma, setPwdConfirma] = useState('');

  const [estadoGuardar, setEstadoGuardar] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNombre(usuario?.nombre ?? '');
    setTelefono(usuario?.telefono ?? '');
  }, [usuario]);

  const reqLargo = pwdNueva.length >= 8;
  const reqMayusMinus = /[A-Z]/.test(pwdNueva) && /[a-z]/.test(pwdNueva);
  const reqNum = /\d/.test(pwdNueva);
  const reqEspecial = /[^A-Za-z0-9]/.test(pwdNueva);
  const pwdCoincide = pwdNueva.length > 0 && pwdNueva === pwdConfirma;
  const cambiandoPwd = pwdActual.length > 0 || pwdNueva.length > 0 || pwdConfirma.length > 0;
  const pwdValida = !cambiandoPwd || (pwdActual.length > 0 && reqLargo && reqMayusMinus && reqNum && reqEspecial && pwdCoincide);

  const onSeleccionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { mostrarMensaje('error', 'La imagen supera 1 MB. Usa una más liviana.'); return; }
    const reader = new FileReader();
    reader.onload = ev => setFoto(typeof ev.target?.result === 'string' ? ev.target.result : null);
    reader.readAsDataURL(file);
  };

  const onSubmitPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id) return;
    setEstadoGuardar('loading');
    try {
      await api.patch(`/usuarios/${usuario.id}`, { nombre, telefono });
      setEstadoGuardar('success');
      mostrarMensaje('ok', 'Perfil actualizado correctamente.');
      setTimeout(() => setEstadoGuardar('idle'), 2000);
    } catch {
      setEstadoGuardar('idle');
      mostrarMensaje('error', 'No se pudo actualizar el perfil.');
    }
  };

  const onSubmitPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdValida) { mostrarMensaje('error', 'Revisa los requisitos de la contraseña antes de guardar.'); return; }
    if (!usuario?.id) return;
    try {
      await api.patch(`/usuarios/${usuario.id}/password`, { passwordActual: pwdActual, passwordNueva: pwdNueva });
      mostrarMensaje('ok', 'Contraseña actualizada correctamente.');
      setPwdActual(''); setPwdNueva(''); setPwdConfirma('');
    } catch {
      mostrarMensaje('error', 'No se pudo cambiar la contraseña. Verifica la contraseña actual.');
    }
  };

  return (
    <div className="px-10 pt-8 pb-14 mx-auto w-full" style={{ maxWidth: 920 }}>
      <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Perfil */}
        <Card>
          <CardHead><CardTitle>Información de perfil</CardTitle></CardHead>
          <form onSubmit={onSubmitPerfil} className="p-6">
            <div className="flex flex-col items-center gap-3 mb-7">
              <div onClick={() => fotoInputRef.current?.click()} className="relative flex items-center justify-center cursor-pointer transition-transform overflow-hidden" style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--admin-green-deep)', color: 'var(--admin-gold)', fontFamily: 'var(--font-dm-mono)', fontSize: '1.5rem', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="" className="w-full h-full object-cover" />
                ) : inicial}
              </div>
              <button type="button" onClick={() => fotoInputRef.current?.click()} className="text-[0.74rem] font-semibold underline" style={{ color: 'var(--admin-green-leaf)', background: 'none', border: 'none', cursor: 'pointer', textUnderlineOffset: '3px' }}>Cambiar foto</button>
              <input ref={fotoInputRef} type="file" accept="image/png,image/jpeg,image/gif" className="hidden" onChange={onSeleccionarFoto} />
            </div>
            <Field label="Nombre completo"><input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="admin-input" placeholder="Tu nombre" /></Field>
            <Field label="Teléfono"><input type="tel" inputMode="tel" value={telefono} onChange={e => setTelefono(e.target.value)} className="admin-input" placeholder="+56 9 1234 5678" /></Field>
            <Field label="Correo electrónico" hint="Para cambiar el correo, contacta al soporte."><input type="email" value={usuario?.email ?? ''} disabled className="admin-input" /></Field>
            <Field label="Rol en el sistema">
              <span className="inline-flex items-center gap-2 font-[family-name:var(--font-dm-mono)] text-[0.66rem] font-medium uppercase rounded-lg" style={{ padding: '0.5rem 0.9rem', letterSpacing: '0.06em', background: 'rgba(177,240,206,0.35)', color: 'var(--admin-green-mid)' }}>⬡ Médico Veterinaria · {usuario?.rol === 'ADMIN' ? 'Administradora' : usuario?.rol ?? ''}</span>
            </Field>
            <SaveButton estado={estadoGuardar} idle="Guardar cambios" loading="Guardando…" success="✓ Guardado" />
          </form>
        </Card>

        {/* Seguridad */}
        <Card delay={0.1}>
          <CardHead><CardTitle>Seguridad y contraseña</CardTitle></CardHead>
          <form onSubmit={onSubmitPwd} className="p-6">
            <Field label="Contraseña actual"><input type="password" value={pwdActual} onChange={e => setPwdActual(e.target.value)} className="admin-input" placeholder="••••••••" autoComplete="current-password" /></Field>
            <Field label="Nueva contraseña">
              <input type="password" value={pwdNueva} onChange={e => setPwdNueva(e.target.value)} className="admin-input" placeholder="••••••••" autoComplete="new-password" />
              <div className="mt-3 flex flex-col gap-1.5">
                <CheckItem ok={reqLargo}>Mínimo 8 caracteres</CheckItem>
                <CheckItem ok={reqMayusMinus}>Mayúscula y minúscula</CheckItem>
                <CheckItem ok={reqNum}>Al menos un número</CheckItem>
                <CheckItem ok={reqEspecial}>Símbolo especial (!@#$…)</CheckItem>
              </div>
            </Field>
            <Field label="Confirmar contraseña"><input type="password" value={pwdConfirma} onChange={e => setPwdConfirma(e.target.value)} className="admin-input" placeholder="••••••••" autoComplete="new-password" />{pwdConfirma.length > 0 && !pwdCoincide && <p className="text-xs mt-1.5" style={{ color: 'var(--admin-red)' }}>Las contraseñas no coinciden.</p>}</Field>
            <SaveButton estado="idle" idle="Cambiar contraseña" loading="Actualizando…" success="✓ Contraseña actualizada" submit />
          </form>
        </Card>
      </div>

      {/* Sesión */}
      <div className="overflow-hidden" style={{ background: 'var(--admin-card)', borderRadius: 14, border: '1px solid rgba(20,36,26,0.07)', boxShadow: '0 1px 3px rgba(20,36,26,0.04)' }}>
        <div className="flex items-center justify-between gap-8 flex-wrap" style={{ padding: '1.25rem 1.5rem' }}>
          <div className="flex items-center gap-4">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--admin-green-leaf)', boxShadow: '0 0 0 3px rgba(74,122,90,0.2)', animation: 'adminDotPulse 2.5s infinite', flexShrink: 0 }} />
            <div>
              <div className="font-[family-name:var(--font-dm-mono)] text-[0.58rem] uppercase mb-1" style={{ letterSpacing: '0.12em', color: 'rgba(20,36,26,0.35)' }}>Sesión activa</div>
              <div className="text-[0.84rem] font-medium" style={{ color: 'var(--admin-ink)' }}>Chrome · Windows 11</div>
              <div className="font-[family-name:var(--font-dm-mono)] text-[0.72rem] mt-0.5" style={{ color: 'rgba(20,36,26,0.4)' }}>Iniciada el {new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })} · Santiago, Chile</div>
            </div>
          </div>
          <button type="button" onClick={cerrarSesion} className="text-[0.8rem] font-semibold rounded-lg transition-all" style={{ padding: '0.6rem 1.25rem', background: 'transparent', border: '1.5px solid rgba(192,57,43,0.3)', color: 'var(--admin-red)', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.08)'; e.currentTarget.style.borderColor = 'var(--admin-red)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.3)'; }}>Cerrar sesión →</button>
        </div>
      </div>
    </div>
  );
}

function SaveButton({ estado, idle, loading, success, submit = false }: { estado: 'idle' | 'loading' | 'success'; idle: string; loading: string; success: string; submit?: boolean }) {
  const txt = estado === 'loading' ? loading : estado === 'success' ? success : idle;
  return (
    <button type={submit ? 'submit' : 'button'} className="w-full flex items-center justify-center gap-2 rounded-lg font-bold text-[0.85rem] transition-all mt-2" style={{ padding: '0.78rem', background: estado === 'success' ? 'var(--admin-green-leaf)' : 'var(--admin-green-deep)', color: 'var(--admin-cream)', border: 'none', cursor: estado === 'loading' ? 'wait' : 'pointer', opacity: estado === 'loading' ? 0.7 : 1 }}
      onMouseEnter={e => { if (estado === 'idle') e.currentTarget.style.background = 'var(--admin-green-mid)'; }}
      onMouseLeave={e => { if (estado === 'idle') e.currentTarget.style.background = 'var(--admin-green-deep)'; }}>{txt}</button>
  );
}

function CheckItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[0.75rem] transition-colors" style={{ color: ok ? 'var(--admin-green-leaf)' : 'rgba(20,36,26,0.4)' }}>
      <span className="flex items-center justify-center flex-shrink-0 text-[0.55rem] transition-all" style={{ width: 16, height: 16, borderRadius: '50%', border: ok ? '1.5px solid var(--admin-green-leaf)' : '1.5px solid rgba(20,36,26,0.2)', background: ok ? 'var(--admin-green-leaf)' : 'transparent', color: ok ? '#fff' : 'transparent' }}>{ok ? '✓' : ''}</span>
      <span>{children}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Vista: Ayuda                                                 */
/* ──────────────────────────────────────────────────────────── */

const FAQS = [
  { q: '¿Cómo subo un resultado de examen?', tag: 'upload' as const, a: 'En la vista Dashboard, usa el formulario «Publicar resultado». Selecciona la mascota, el tipo de examen y arrastra el PDF al área de carga. Haz clic en «Publicar resultado» para que el tutor reciba la notificación por correo automáticamente.' },
  { q: '¿Qué formatos acepta el sistema para los resultados?', tag: 'upload' as const, a: 'Solo se aceptan archivos en formato PDF. El tamaño máximo es de 10 MB por archivo. Si el laboratorio entrega los resultados en otro formato, conviértelo a PDF antes de subirlo.' },
  { q: '¿Qué significa cada estado en la Agenda?', tag: 'citas' as const, a: 'PENDIENTE: la cita fue solicitada por el tutor pero aún no fue revisada. CONFIRMADA: fue aceptada y programada, el tutor recibe una notificación. COMPLETADA: la visita ya ocurrió y fue registrada. CANCELADA: fue anulada por cualquier parte y el tutor es notificado.' },
  { q: '¿Puedo cancelar una cita que ya está confirmada?', tag: 'citas' as const, a: 'Sí. En la vista Agenda, haz clic sobre la cita y en el panel lateral cambia el estado a CANCELADA. El sistema enviará un correo automático al tutor. Se recomienda contactar al tutor previamente para agendar una nueva fecha.' },
  { q: '¿Cómo funciona el estado de los exámenes?', tag: 'status' as const, a: 'PENDIENTE: se registró el examen pero el PDF aún no se ha subido. EN PROCESO: el laboratorio está procesando la muestra. DISPONIBLE: el PDF fue subido y el tutor ya puede descargarlo desde su panel.' },
  { q: '¿En qué zonas realizan visitas a domicilio?', tag: 'coverage' as const, a: 'La cobertura habitual incluye Viña del Mar, Valparaíso, Con-Con y Quilpué. La cobertura extendida abarca Villa Alemana, Limache, La Calera, Olmué, Quillota y Los Andes, con tiempo de traslado adicional y un posible recargo según la distancia.' },
];

const TAG_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  upload: { bg: 'rgba(212,196,122,0.2)', color: 'var(--admin-gold-dark)', label: 'Subir exámenes' },
  citas: { bg: 'rgba(20,36,26,0.06)', color: 'rgba(20,36,26,0.5)', label: 'Citas y agenda' },
  status: { bg: 'rgba(177,240,206,0.4)', color: 'var(--admin-green-mid)', label: 'Exámenes' },
  coverage: { bg: 'rgba(177,240,206,0.4)', color: 'var(--admin-green-mid)', label: 'Cobertura' },
};

function AyudaView() {
  const [abierta, setAbierta] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const faqsFiltradas = busqueda
    ? FAQS.map((f, i) => ({ ...f, i })).filter(f => (f.q + ' ' + f.a).toLowerCase().includes(busqueda.toLowerCase()))
    : FAQS.map((f, i) => ({ ...f, i }));

  return (
    <div className="px-10 pb-14 mx-auto w-full" style={{ maxWidth: 920 }}>
      {/* Hero */}
      <div className="text-center relative" style={{ padding: '3.25rem 1rem 2.5rem' }}>
        <span aria-hidden style={{ position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%,-50%)', width: 600, height: 340, background: 'radial-gradient(ellipse,rgba(177,240,206,0.4),transparent 65%)', pointerEvents: 'none' }} />
        <div className="relative font-[family-name:var(--font-dm-mono)] text-[0.62rem] uppercase mb-3.5" style={{ letterSpacing: '0.22em', color: 'var(--admin-green-leaf)' }}>Centro de ayuda · Admin</div>
        <h1 className="relative mb-6 leading-tight" style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontWeight: 300, fontSize: '2.4rem', color: 'var(--admin-green-deep)' }}>¿En qué podemos ayudarte?</h1>
        <div className="relative max-w-lg mx-auto">
          <svg className="absolute" style={{ left: '1.15rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(20,36,26,0.3)', pointerEvents: 'none' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar en la documentación…" className="w-full text-[0.95rem] outline-none transition-all" style={{ padding: '1rem 1rem 1rem 3rem', background: 'var(--admin-card)', border: '1.5px solid rgba(20,36,26,0.1)', borderRadius: 13, color: 'var(--admin-ink)', fontFamily: 'var(--font-manrope)', boxShadow: '0 6px 22px rgba(20,36,26,0.06)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--admin-green-leaf)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(20,36,26,0.1)')} />
        </div>
      </div>

      {/* Acordeón */}
      <div className="font-[family-name:var(--font-dm-mono)] text-[0.62rem] uppercase mb-4 pb-2.5" style={{ letterSpacing: '0.18em', color: 'rgba(20,36,26,0.35)', borderBottom: '1px solid rgba(212,196,122,0.5)' }}>Preguntas frecuentes</div>
      <div className="overflow-hidden mb-8" style={{ background: 'var(--admin-card)', borderRadius: 14, border: '1px solid rgba(20,36,26,0.07)', boxShadow: '0 1px 3px rgba(20,36,26,0.04)' }}>
        {faqsFiltradas.map(f => {
          const open = abierta === f.i;
          const tag = TAG_STYLES[f.tag];
          return (
            <div key={f.i} style={{ borderBottom: '1px solid rgba(20,36,26,0.06)' }}>
              <button onClick={() => setAbierta(open ? null : f.i)} className="w-full flex items-center justify-between gap-4 text-left transition-colors" style={{ padding: '1.1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(216,233,200,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span className="text-[0.9rem] font-semibold flex-1" style={{ color: 'var(--admin-ink)' }}>{f.q}</span>
                <span className="font-[family-name:var(--font-dm-mono)] text-[0.85rem] flex-shrink-0 transition-transform" style={{ color: open ? 'var(--admin-green-leaf)' : 'rgba(20,36,26,0.35)', transform: open ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
              </button>
              <div style={{ maxHeight: open ? 420 : 0, overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(.4,0,.2,1)' }}>
                <div className="text-[0.85rem]" style={{ padding: '0 1.5rem 1.25rem', lineHeight: 1.65, color: 'rgba(20,36,26,0.65)' }}>
                  <span className="inline-block font-[family-name:var(--font-dm-mono)] text-[0.56rem] uppercase rounded mb-3" style={{ padding: '0.2rem 0.5rem', letterSpacing: '0.12em', background: tag.bg, color: tag.color }}>{tag.label}</span>
                  <br />{f.a}
                </div>
              </div>
            </div>
          );
        })}
        {faqsFiltradas.length === 0 && <div className="px-6 py-10 text-center text-sm font-[family-name:var(--font-dm-mono)]" style={{ color: 'rgba(20,36,26,0.4)' }}>Sin resultados</div>}
      </div>

      {/* Contacto */}
      <div className="relative overflow-hidden flex items-center justify-between gap-8 flex-wrap" style={{ background: 'var(--admin-green-deep)', borderRadius: 14, padding: '2rem' }}>
        <div style={{ position: 'absolute', bottom: -50, right: 30, width: 200, height: 200, opacity: 0.06, pointerEvents: 'none', transform: 'rotate(15deg)' }} aria-hidden><FernLeaf color="#fff" opacity={1} className="w-full h-full" /></div>
        <div className="relative z-10">
          <h3 className="mb-1.5" style={{ fontFamily: 'var(--font-newsreader)', fontStyle: 'italic', fontWeight: 300, fontSize: '1.3rem', color: 'var(--admin-cream)' }}>¿No encontraste lo que buscabas? <span style={{ color: 'var(--admin-gold)' }}>Escríbenos</span></h3>
          <p className="text-[0.8rem]" style={{ color: 'rgba(245,241,232,0.55)' }}>Respuesta en menos de 24 horas hábiles</p>
        </div>
        <div className="relative z-10 flex gap-6 flex-wrap">
          <div className="flex items-center gap-2.5"><span className="text-base">✉</span><div><div className="font-[family-name:var(--font-dm-mono)] text-[0.56rem] uppercase mb-0.5" style={{ letterSpacing: '0.1em', color: 'rgba(177,240,206,0.7)' }}>Correo</div><div className="text-[0.82rem] font-medium" style={{ color: 'var(--admin-cream)' }}>gabriel.munoz.r99@gmail.com</div></div></div>
          <div className="flex items-center gap-2.5"><span className="text-base">🕐</span><div><div className="font-[family-name:var(--font-dm-mono)] text-[0.56rem] uppercase mb-0.5" style={{ letterSpacing: '0.1em', color: 'rgba(177,240,206,0.7)' }}>Horario</div><div className="text-[0.82rem] font-medium" style={{ color: 'var(--admin-cream)' }}>Lun–Vie · 09:00–18:00</div></div></div>
        </div>
        <a href="mailto:gabriel.munoz.r99@gmail.com" className="relative z-10 inline-flex items-center gap-2 text-[0.82rem] font-bold rounded-lg transition-all" style={{ padding: '0.75rem 1.5rem', background: 'var(--admin-gold)', color: 'var(--admin-green-deep)', whiteSpace: 'nowrap' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#e2d490')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--admin-gold)')}>Enviar mensaje →</a>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Iconos                                                       */
/* ──────────────────────────────────────────────────────────── */

function IconGrid()     { return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconPets()     { return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><circle cx="6.5" cy="14" r="2"/><circle cx="15.5" cy="14" r="2"/><path d="M8 18c0-2 1.5-3.5 4-3.5S16 16 16 18s-1.5 3-4 3-4-1-4-3z"/></svg>; }
function IconExams()    { return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>; }
function IconCalendar() { return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>; }
function IconSettings() { return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function IconHelp()     { return <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/></svg>; }
function IconLogout()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>; }
