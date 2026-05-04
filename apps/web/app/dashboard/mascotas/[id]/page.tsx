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
    return <div className="min-h-screen flex items-center justify-center bg-(--surface) text-(--on-surface-variant)">Cargando...</div>;
  }

  if (error || !mascota) {
    return (
      <main className="min-h-screen bg-(--surface) flex flex-col items-center justify-center px-6">
        <p className="text-(--on-surface) mb-4">{error ?? 'No encontramos esta mascota.'}</p>
        <button onClick={() => router.push('/dashboard')}
          className="bg-(--primary) hover:bg-(--primary-container) text-(--on-primary) px-4 py-2 rounded-lg text-sm font-medium transition">
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

  return (
    <main className="min-h-screen bg-(--surface)">
      <nav className="bg-(--surface-container-lowest) border-b border-(--outline-variant) px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.push('/dashboard')} aria-label="Ir al dashboard">
          <Logo size="sm" variant="light" />
        </button>
        <button onClick={() => router.push('/dashboard')}
          className="text-sm text-(--on-surface-variant) hover:text-(--on-surface) transition">
          ← Volver al dashboard
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* Header card */}
        <div className="bg-(--surface-container-lowest) rounded-xl p-8 mb-8">
          <button onClick={() => router.push('/dashboard')}
            className="text-sm text-(--on-surface-variant) hover:text-(--on-surface) mb-4 transition">
            ← Volver
          </button>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-4xl font-bold text-(--primary) font-[family-name:var(--font-manrope)] mb-3">{mascota.nombre}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="bg-(--surface-container-high) text-(--on-surface-variant) rounded-full px-3 py-1 text-sm">
                  {mascota.tipo}
                </span>
                {mascota.raza && (
                  <span className="bg-(--surface-container-high) text-(--on-surface-variant) rounded-full px-3 py-1 text-sm">
                    {mascota.raza}
                  </span>
                )}
                {mascota.edad != null && (
                  <span className="bg-(--surface-container-high) text-(--on-surface-variant) rounded-full px-3 py-1 text-sm">
                    {mascota.edad} {mascota.edad === 1 ? 'año' : 'años'}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => router.push('/dashboard/agendar')}
              className="bg-(--primary) hover:bg-(--primary-container) text-(--on-primary) px-5 py-2.5 rounded-lg text-sm font-medium transition self-start md:self-end">
              Agendar Visita
            </button>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left — Próximas Citas */}
          <section className="md:col-span-5 bg-(--surface-container-lowest) rounded-xl p-6">
            <h2 className="text-lg font-bold text-(--on-surface) mb-4 font-[family-name:var(--font-manrope)]">Próximas Citas</h2>
            {citasOrdenadas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-(--on-surface-variant) text-sm mb-4">No hay citas agendadas</p>
                <button onClick={() => router.push('/dashboard/agendar')}
                  className="bg-(--surface-container-high) hover:bg-(--surface-container-highest) text-(--on-surface) px-4 py-2 rounded-lg text-sm font-medium transition">
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
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-(--on-surface)">{fechaLarga(cita.fecha)}</p>
                        <CitaStatusBadge estado={cita.estado} />
                      </div>
                      <p className="text-sm text-(--on-surface-variant) mb-2">{cita.direccion}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {visibles.map(s => (
                          <span key={s} className="bg-(--surface-container-high) text-(--on-surface-variant) rounded-full px-2 py-0.5 text-xs">
                            {s}
                          </span>
                        ))}
                        {restantes > 0 && (
                          <span className="text-(--on-surface-variant) text-xs px-2 py-0.5">+ {restantes} más</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs text-(--on-surface-variant) mt-4">
              Las citas son confirmadas por nuestro equipo.
            </p>
          </section>

          {/* Right — Historial de Exámenes */}
          <section className="md:col-span-7 bg-(--surface-container-lowest) rounded-xl p-6">
            <h2 className="text-lg font-bold text-(--on-surface) mb-4 font-[family-name:var(--font-manrope)]">Historial de Exámenes</h2>
            {(() => {
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

              if (examenesDeduplicados.length === 0) {
                return (
                  <p className="text-(--on-surface-variant) text-sm text-center py-8">
                    Esta mascota aún no tiene exámenes registrados
                  </p>
                );
              }
              return (
                <ul>
                  {examenesDeduplicados.map(examen => (
                    <li key={examen.id} className="border-b border-(--outline-variant) py-4 last:border-0 flex justify-between items-center gap-4">
                      <div>
                        <p className="text-sm font-bold text-(--on-surface)">{examen.tipo}</p>
                        <p className="text-xs text-(--on-surface-variant) mt-0.5">{fechaCorta(examen.creadoEn)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <ExamStatusBadge estado={examen.estado} />
                        {examen.estado === 'DISPONIBLE' && examen.archivoUrl && (
                          <a href={examen.archivoUrl} target="_blank" rel="noopener noreferrer"
                            className="bg-(--primary) hover:bg-(--primary-container) text-(--on-primary) px-3 py-1 rounded-lg text-xs transition">
                            Descargar PDF
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </section>
        </div>
      </div>
    </main>
  );
}
