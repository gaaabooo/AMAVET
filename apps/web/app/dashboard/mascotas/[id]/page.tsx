'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import ExamStatusBadge from '@/components/ExamStatusBadge';
import CitaStatusBadge from '@/components/CitaStatusBadge';
import Logo from '@/components/Logo';

interface Examen {
  id: string;
  tipo: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE';
  archivoUrl: string | null;
  creadoEn: string;
}

interface Cita {
  id: string;
  fecha: string;
  direccion: string;
  servicios: string[];
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA';
}

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  raza?: string;
  edad?: number;
  examenes: Examen[];
  citas?: Cita[];
}

const ANIMAL_ICON: Record<string, string> = {
  perro: '🐶', gato: '🐱', conejo: '🐰', ave: '🐦', pájaro: '🐦',
  pajaro: '🐦', hamster: '🐹', hámster: '🐹', tortuga: '🐢',
  pez: '🐟', hurón: '🦔', huron: '🦔',
};

function getAnimalIcon(tipo: string): string {
  return ANIMAL_ICON[tipo.toLowerCase().trim()] ?? '🐾';
}

export default function PerfilMascota() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!u || !token) { router.push('/login'); return; }
    const usuario = JSON.parse(u);
    cargarDatos(usuario.id);
  }, [id]);

  const cargarDatos = async (tutorId: string) => {
    if (!id) return;
    setCargando(true);
    setError(null);
    try {
      let mascotaData: Mascota | null = null;
      try {
        const res = await api.get(`/mascotas/${id}`);
        mascotaData = res.data;
      } catch {
        const fallback = await api.get(`/mascotas/tutor/${tutorId}`);
        mascotaData = (fallback.data as Mascota[]).find(m => m.id === id) ?? null;
      }
      if (!mascotaData) {
        setError('No encontramos esta mascota.');
        setCargando(false);
        return;
      }
      const citasRes = await api.get(`/citas/mascota/${id}`);
      setMascota(mascotaData);
      setCitas(citasRes.data ?? []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar el perfil de la mascota.');
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-(--surface) font-[family-name:var(--font-manrope)]">
        <nav className="bg-(--surface-container-lowest) border-b border-(--outline-variant) px-6 py-4">
          <Logo size="sm" variant="light" />
        </nav>
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-6 animate-pulse">
          <div className="h-40 rounded-2xl bg-(--surface-container-lowest)" />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 h-64 rounded-2xl bg-(--surface-container-lowest)" />
            <div className="md:col-span-7 h-64 rounded-2xl bg-(--surface-container-lowest)" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !mascota) {
    return (
      <main className="min-h-screen bg-(--surface) font-[family-name:var(--font-manrope)] flex flex-col items-center justify-center px-6">
        <p className="text-(--on-surface) mb-4">{error ?? 'No encontramos esta mascota.'}</p>
        <button onClick={() => router.push('/dashboard')}
          className="bg-(--primary) hover:bg-[#1b4332] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150">
          Volver al dashboard
        </button>
      </main>
    );
  }

  const citasOrdenadas = [...citas].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const fechaLarga = (iso: string) => {
    const f = new Date(iso);
    const fechaStr = f.toLocaleDateString('es-CL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const fechaCapitalizada = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1).toLowerCase();
    const hora = f.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    return `${fechaCapitalizada} · ${hora}`;
  };

  const fechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });

  const icon = getAnimalIcon(mascota.tipo);

  const detallesMeta = [
    mascota.tipo,
    mascota.raza,
    mascota.edad != null ? `${mascota.edad} ${mascota.edad === 1 ? 'año' : 'años'}` : null,
  ].filter(Boolean);

  const ordenados = [...mascota.examenes].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
  );
  const grupos = new Map<string, Examen[]>();
  for (const ex of ordenados) {
    const lista = grupos.get(ex.tipo) ?? [];
    lista.push(ex);
    grupos.set(ex.tipo, lista);
  }
  const examenesDeduplicados: Examen[] = [];
  for (const lista of grupos.values()) {
    const conservados: Examen[] = [];
    for (const ex of lista) {
      const muyCercano = conservados.some(c =>
        Math.abs(new Date(c.creadoEn).getTime() - new Date(ex.creadoEn).getTime()) < 24 * 60 * 60 * 1000
      );
      if (!muyCercano) conservados.push(ex);
    }
    examenesDeduplicados.push(...conservados);
  }
  examenesDeduplicados.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());

  return (
    <main className="min-h-screen bg-(--surface) font-[family-name:var(--font-manrope)]">
      <nav className="bg-(--surface-container-lowest) border-b border-(--outline-variant) px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.push('/dashboard')} aria-label="Ir al dashboard">
          <Logo size="sm" variant="light" />
        </button>
        <button onClick={() => router.push('/dashboard')}
          className="text-sm font-medium text-(--on-surface-muted) hover:text-(--primary) transition-colors duration-150 inline-flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mis mascotas
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-(--surface-container-lowest) border border-(--outline-variant) flex items-center justify-center text-4xl flex-shrink-0">
                {icon}
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-(--on-surface) leading-tight" style={{ letterSpacing: '-0.015em' }}>
                  {mascota.nombre}
                </h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {detallesMeta.map((d) => (
                    <span key={d} className="bg-(--surface-container-low) text-(--on-surface-variant) rounded-full px-3 py-1 text-sm font-medium">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => router.push('/dashboard/agendar')}
              className="bg-(--primary) hover:bg-[#1b4332] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 self-start sm:self-center flex-shrink-0">
              Agendar visita
            </button>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left — Próximas Citas */}
          <section className="md:col-span-5 bg-(--surface-container-lowest) border border-(--outline-variant) rounded-2xl p-6">
            <h2 className="text-base font-bold text-(--on-surface) mb-4 tracking-tight">Próximas Citas</h2>
            {citasOrdenadas.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-(--surface-container-low) flex items-center justify-center mx-auto mb-3 text-xl">
                  📅
                </div>
                <p className="text-(--on-surface-variant) text-sm mb-4">Sin citas agendadas</p>
                <button onClick={() => router.push('/dashboard/agendar')}
                  className="border border-(--primary) text-(--primary) hover:bg-(--surface-container-low) px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150">
                  Agendar primera visita
                </button>
              </div>
            ) : (
              <ul>
                {citasOrdenadas.map(cita => {
                  const visibles = cita.servicios.slice(0, 3);
                  const restantes = cita.servicios.length - visibles.length;
                  return (
                    <li key={cita.id} className="border-b border-(--outline-variant) py-4 last:border-0">
                      <div className="flex justify-between items-start mb-1.5">
                        <p className="text-sm font-semibold text-(--on-surface) leading-snug">{fechaLarga(cita.fecha)}</p>
                        <CitaStatusBadge estado={cita.estado} />
                      </div>
                      <p className="text-sm text-(--on-surface-muted) mb-2">{cita.direccion}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {visibles.map(s => (
                          <span key={s} className="bg-(--surface-container-low) text-(--on-surface-variant) rounded-full px-2 py-0.5 text-xs">
                            {s}
                          </span>
                        ))}
                        {restantes > 0 && (
                          <span className="text-(--on-surface-muted) text-xs px-2 py-0.5">+{restantes} más</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {citasOrdenadas.length > 0 && (
              <p className="text-xs text-(--on-surface-muted) mt-4">
                Las citas son confirmadas por nuestro equipo.
              </p>
            )}
          </section>

          {/* Right — Historial de Exámenes */}
          <section className="md:col-span-7 bg-(--surface-container-lowest) border border-(--outline-variant) rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-(--on-surface) tracking-tight">Historial de Exámenes</h2>
              {examenesDeduplicados.length > 0 && (
                <span className="text-xs text-(--on-surface-muted) bg-(--surface-container-low) px-2.5 py-1 rounded-full">
                  {examenesDeduplicados.length} {examenesDeduplicados.length === 1 ? 'registro' : 'registros'}
                </span>
              )}
            </div>
            {examenesDeduplicados.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-xl bg-(--surface-container-low) flex items-center justify-center mx-auto mb-3 text-xl">
                  🔬
                </div>
                <p className="text-(--on-surface-variant) text-sm">
                  Aún no hay exámenes registrados
                </p>
              </div>
            ) : (
              <ul>
                {examenesDeduplicados.map(examen => (
                  <li key={examen.id} className="border-b border-(--outline-variant) py-4 last:border-0 flex justify-between items-center gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-(--on-surface) truncate">{examen.tipo}</p>
                      <p className="text-xs text-(--on-surface-muted) mt-0.5">{fechaCorta(examen.creadoEn)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ExamStatusBadge estado={examen.estado} />
                      {examen.estado === 'DISPONIBLE' && examen.archivoUrl && (
                        <a
                          href={examen.archivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-(--primary) hover:bg-[#1b4332] text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150"
                        >
                          Descargar
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
