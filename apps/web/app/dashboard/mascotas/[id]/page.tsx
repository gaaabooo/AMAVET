'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { getSesion } from '@/lib/session';
import { getAnimalIcon } from '@/lib/utils/animals';
import DashboardNav from '@/components/DashboardNav';

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

const EXAM_ICON: Record<string, string> = {
  hemograma: '🩸', t4: '🔬', tsh: '🔬', perfil: '🧪', bioquímico: '🧪', bioquimico: '🧪',
  parvovirus: '🦠', distemper: '🦠', leucemia: '🦠', sida: '🦠', felino: '🦠',
  chip: '📍', chips: '📍', curación: '🩹', curacion: '🩹',
  control: '🩺', médico: '🩺', medico: '🩺',
};

function getExamIcon(tipo: string): string {
  const lc = tipo.toLowerCase();
  for (const k of Object.keys(EXAM_ICON)) {
    if (lc.includes(k)) return EXAM_ICON[k];
  }
  return '🔬';
}

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function PerfilMascota() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [mascota, setMascota] = useState<Mascota | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuarioNombre, setUsuarioNombre] = useState<string | undefined>();
  const [descargando, setDescargando] = useState<string | null>(null);

  const cargarDatos = useCallback(async (tutorId: string) => {
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
    } catch {
      setError('Error al cargar el perfil de la mascota.');
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    const sesion = getSesion();
    if (!sesion) { router.push('/login'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuarioNombre(sesion.nombre);
    cargarDatos(sesion.id);
  }, [router, cargarDatos]);

  const descargarExamen = async (examenId: string) => {
    setDescargando(examenId);
    try {
      const res = await api.get(`/examenes/${examenId}/descargar`);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('No se pudo obtener el enlace de descarga. Intenta nuevamente.');
    } finally {
      setDescargando(null);
    }
  };

  if (cargando) {
    return <SkeletonView />;
  }

  if (error || !mascota) {
    return (
      <main className="dash-bg min-h-screen flex flex-col items-center justify-center px-6">
        <DashStyles />
        <p style={{ color: 'var(--d-ink)' }} className="mb-4">{error ?? 'No encontramos esta mascota.'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors"
          style={{ background: 'var(--d-green-deep)', color: 'var(--d-green-glow)' }}
        >
          Volver al dashboard
        </button>
      </main>
    );
  }

  const citasOrdenadas = [...citas].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  const citasFuturas = citasOrdenadas.filter(c => new Date(c.fecha) >= new Date() && c.estado !== 'CANCELADA');
  const citasPasadas = citasOrdenadas.filter(c => new Date(c.fecha) < new Date() || c.estado === 'COMPLETADA');

  const fechaLarga = (iso: string) => {
    const f = new Date(iso);
    const dia = f.toLocaleDateString('es-CL', { weekday: 'long' });
    const hora = f.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    return { dia: dia.charAt(0).toUpperCase() + dia.slice(1), hora };
  };

  const icon = getAnimalIcon(mascota.tipo);

  // Cada examen pertenece a una cita concreta y la base de datos garantiza que
  // no haya duplicados dentro de una misma cita. Exámenes del mismo tipo de
  // citas distintas son registros legítimos: se muestran todos, solo ordenados
  // del más reciente al más antiguo.
  const examenesOrdenados = [...mascota.examenes].sort(
    (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
  );

  // Stats
  const totalExamenes = examenesOrdenados.length;
  const disponibles = examenesOrdenados.filter(e => e.estado === 'DISPONIBLE').length;
  const visitasRealizadas = citas.filter(c => c.estado === 'COMPLETADA').length;
  const proximaCita = citasFuturas[0];

  // Agrupar exámenes por mes
  const examenesPorMes = new Map<string, Examen[]>();
  for (const ex of examenesOrdenados) {
    const f = new Date(ex.creadoEn);
    const key = `${f.getFullYear()}-${f.getMonth()}`;
    const lista = examenesPorMes.get(key) ?? [];
    lista.push(ex);
    examenesPorMes.set(key, lista);
  }

  const fechaUltimaVisita = citasPasadas.length > 0
    ? new Date(citasPasadas[citasPasadas.length - 1].fecha)
    : null;

  const fechaCorta = (iso: string | Date) => {
    const f = typeof iso === 'string' ? new Date(iso) : iso;
    const dia = String(f.getDate()).padStart(2, '0');
    const mes = NOMBRES_MES[f.getMonth()].slice(0, 3).toLowerCase();
    const anio = f.getFullYear();
    return `${dia}·${mes}·${anio}`;
  };

  // Identificador opaco derivado del UUID (primeros 4 chars, hex). No es
  // secuencial, así que no permite enumerar el total de mascotas del sistema.
  const numeroExpediente = mascota.id.replace(/-/g, '').slice(0, 4).toUpperCase();

  // Estado clínico
  const estadoClinico: { texto: string; tono: 'al-dia' | 'revisar' } =
    disponibles > 0
      ? { texto: `${disponibles} resultado${disponibles === 1 ? '' : 's'} nuevo${disponibles === 1 ? '' : 's'}`, tono: 'revisar' }
      : { texto: 'Al día', tono: 'al-dia' };

  return (
    <main className="dash-bg min-h-screen relative overflow-hidden">
      <DashStyles />

      {/* Hojas de fondo */}
      <div className="leaf-bg" aria-hidden="true">
        <svg className="l1" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 10 C 60 50, 40 110, 70 180 C 110 150, 160 100, 100 10 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.5" />
          <path d="M100 30 C 70 60, 60 110, 80 170" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <svg className="l2" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M30 100 C 80 40, 140 30, 180 60 C 150 130, 90 170, 30 100 Z" />
          <path d="M50 100 L 160 70" />
        </svg>
        <svg className="l3" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 5 C 25 30, 25 70, 50 95 C 75 70, 75 30, 50 5 Z" />
          <path d="M50 10 L 50 95" />
        </svg>
      </div>

      <DashboardNav active="mascotas" usuarioNombre={usuarioNombre} />

      <div className="relative z-10 max-w-[1180px] mx-auto px-6 sm:px-8 py-12">

        {/* HERO */}
        <header
          className="hero-grid pb-10 mb-10 relative"
          style={{
            borderBottom: '1px solid var(--d-rule)',
            opacity: 0,
            animation: 'rise 700ms 60ms cubic-bezier(.2,.7,.2,1) forwards',
          }}
        >
          <div className="hero-avatar">
            <span style={{ fontSize: '4.2rem' }}>{icon}</span>
          </div>

          <div className="hero-info">
            <span
              className={`status-pill status-${estadoClinico.tono}`}
            >
              <span className="dot" />
              {estadoClinico.texto}
            </span>
            <h1 className="pet-name">
              <span className="name-text">{mascota.nombre}</span>
            </h1>
            <div className="pet-tags">
              <span className="tag">{mascota.tipo}</span>
              {mascota.raza && <span className="tag">{mascota.raza}</span>}
              {mascota.edad != null && (
                <span className="tag">
                  {mascota.edad} {mascota.edad === 1 ? 'año' : 'años'}
                </span>
              )}
            </div>
          </div>

          <div className="hero-expediente">
            <span>Expediente</span>
            <b>№ {numeroExpediente}</b>
            <span>Activo · Tutor</span>
            <span>
              {fechaUltimaVisita
                ? `Última visita ${String(fechaUltimaVisita.getDate()).padStart(2, '0')}·${NOMBRES_MES[fechaUltimaVisita.getMonth()].slice(0, 3).toLowerCase()}`
                : 'Sin visitas registradas'}
            </span>
          </div>

          <div className="hero-cta">
            <button
              onClick={() => router.push('/dashboard/agendar')}
              className="btn-primary"
            >
              Agendar visita
            </button>
          </div>
        </header>

        {/* STRIP STATS */}
        <div
          className="stats-strip"
          style={{
            opacity: 0,
            animation: 'rise 700ms 180ms cubic-bezier(.2,.7,.2,1) forwards',
          }}
        >
          <StatCard num={proximaCita ? '01' : '—'} label="Próxima visita" />
          <StatCard num={String(totalExamenes).padStart(2, '0')} label="Exámenes totales" />
          <StatCard
            num={String(disponibles).padStart(2, '0')}
            label="Resultados nuevos"
            accent={disponibles > 0}
          />
          <StatCard num={String(visitasRealizadas).padStart(2, '0')} label="Visitas realizadas" />
        </div>

        {/* GRID */}
        <div className="grid-2">

          {/* CITAS */}
          <section
            className="panel"
            style={{ opacity: 0, animation: 'rise 700ms 280ms cubic-bezier(.2,.7,.2,1) forwards' }}
          >
            <div className="panel-head">
              <h2 className="panel-title">Próximas citas</h2>
              <span className="panel-counter">
                {citasFuturas.length} {citasFuturas.length === 1 ? 'agendada' : 'agendadas'}
              </span>
            </div>

            {citasFuturas.length === 0 ? (
              <div className="empty-citas">
                <div className="empty-ill">📅</div>
                <p>Sin citas agendadas</p>
                <button
                  onClick={() => router.push('/dashboard/agendar')}
                  className="btn-ghost"
                >
                  Agendar primera visita
                </button>
              </div>
            ) : (
              <ul className="cita-list">
                {citasFuturas.map(cita => {
                  const f = new Date(cita.fecha);
                  const { dia: diaSemana, hora } = fechaLarga(cita.fecha);
                  const visibles = cita.servicios.slice(0, 4);
                  const restantes = cita.servicios.length - visibles.length;
                  return (
                    <li key={cita.id} className="cita">
                      <div className="cita-date">
                        <div className="day">{String(f.getDate()).padStart(2, '0')}</div>
                        <div className="month">{NOMBRES_MES[f.getMonth()].slice(0, 3)}</div>
                      </div>
                      <div className="cita-info">
                        <div className="cita-meta-top">
                          <span>{diaSemana} · {hora}</span>
                          <span className={`cita-status cita-status-${cita.estado.toLowerCase()}`}>
                            <span className="dot" />
                            {cita.estado.charAt(0) + cita.estado.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <div className="cita-time">Visita a domicilio</div>
                        <div className="cita-addr">{cita.direccion}</div>
                        <div className="cita-services">
                          {visibles.map(s => (
                            <span key={s} className="service-chip">{s}</span>
                          ))}
                          {restantes > 0 && (
                            <span className="service-chip-more">+{restantes} más</span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {citasFuturas.length > 0 && (
              <p className="panel-footer-note">
                Las citas son confirmadas por nuestro equipo.
              </p>
            )}
          </section>

          {/* EXÁMENES */}
          <section
            className="panel"
            style={{ opacity: 0, animation: 'rise 700ms 360ms cubic-bezier(.2,.7,.2,1) forwards' }}
          >
            <div className="panel-head">
              <h2 className="panel-title">Historial de exámenes</h2>
              {totalExamenes > 0 && (
                <span className="panel-counter">
                  {totalExamenes} {totalExamenes === 1 ? 'registro' : 'registros'}
                </span>
              )}
            </div>

            {totalExamenes === 0 ? (
              <div className="empty-citas">
                <div className="empty-ill">🔬</div>
                <p>Aún no hay exámenes registrados</p>
              </div>
            ) : (
              <div>
                {Array.from(examenesPorMes.entries()).map(([key, exs]) => {
                  const [anio, mes] = key.split('-').map(Number);
                  const label = `${NOMBRES_MES[mes]} ${anio}`;
                  return (
                    <div key={key}>
                      <div className="month-divider">{label}</div>
                      <ul className="exam-list">
                        {exs.map((ex) => {
                          const estadoCls = ex.estado.toLowerCase();
                          return (
                            <li key={ex.id} className="exam">
                              <div className={`exam-icon exam-icon-${estadoCls}`}>
                                {getExamIcon(ex.tipo)}
                              </div>
                              <div className="exam-info">
                                <div className="exam-title">{ex.tipo}</div>
                                <div className="exam-date">{fechaCorta(ex.creadoEn)}</div>
                              </div>
                              <span className={`exam-badge exam-badge-${estadoCls}`}>
                                {ex.estado === 'EN_PROCESO' ? 'En proceso' : ex.estado.charAt(0) + ex.estado.slice(1).toLowerCase()}
                              </span>
                              {ex.archivoUrl ? (
                                <button
                                  onClick={() => descargarExamen(ex.id)}
                                  disabled={descargando === ex.id}
                                  className="exam-download"
                                  title="Ver resultado"
                                  aria-label="Ver resultado"
                                >
                                  {descargando === ex.id ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                                      <circle cx="12" cy="12" r="10" />
                                    </svg>
                                  ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                  )}
                                </button>
                              ) : (
                                <span style={{ width: 36 }} />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* ─── Subcomponentes ─── */

function StatCard({ num, label, accent }: { num: string; label: string; accent?: boolean }) {
  return (
    <div className="stat-card">
      <span className={`stat-num ${accent ? 'accent' : ''}`}>{num}</span>
      <span className="stat-lbl">{label}</span>
    </div>
  );
}

function SkeletonView() {
  return (
    <main className="dash-bg min-h-screen relative">
      <DashStyles />
      <DashboardNav active="mascotas" />
      <div className="relative z-10 max-w-[1180px] mx-auto px-6 sm:px-8 py-12 space-y-6 animate-pulse">
        <div className="h-32 rounded-3xl" style={{ background: 'var(--d-bg-card)' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl" style={{ background: 'var(--d-bg-card)' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 h-72 rounded-3xl" style={{ background: 'var(--d-bg-card)' }} />
          <div className="md:col-span-7 h-72 rounded-3xl" style={{ background: 'var(--d-bg-card)' }} />
        </div>
      </div>
    </main>
  );
}

/* ─── Estilos compartidos ─── */

function DashStyles() {
  return (
    <style jsx global>{`
      .dash-bg {
        --d-bg: #f4f0e6;
        --d-bg-card: #ffffff;
        --d-bg-soft: #ebe7da;
        --d-ink: #14241a;
        --d-ink-soft: #3d4d40;
        --d-ink-mute: #6b7a6e;
        --d-rule: #d8d2bf;
        --d-rule-soft: #ece7d3;
        --d-green-deep: #0d2818;
        --d-green-mid: #1f4d33;
        --d-green-leaf: #4a7a5a;
        --d-green-mist: #c8dcc7;
        --d-green-glow: #d8e9c8;
        --d-amber: #c9930b;
        --d-amber-soft: #fcebbf;
        --d-rose: #b15f4a;
        --d-rose-soft: #fadcd2;
        background: var(--d-bg);
        color: var(--d-ink);
        font-family: var(--font-manrope), system-ui, sans-serif;
      }
      .dash-bg .leaf-bg {
        position: absolute; inset: 0; pointer-events: none; z-index: 0;
        overflow: hidden;
      }
      .dash-bg .leaf-bg svg { position: absolute; color: var(--d-green-leaf); }
      .dash-bg .leaf-bg svg.l1 { top: -40px; right: -60px; width: 320px; opacity: 0.10; transform: rotate(20deg); }
      .dash-bg .leaf-bg svg.l2 { bottom: -80px; left: -100px; width: 380px; opacity: 0.08; transform: rotate(-30deg); }
      .dash-bg .leaf-bg svg.l3 { top: 38%; right: 4%; width: 140px; opacity: 0.06; transform: rotate(80deg); }
      @keyframes rise {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse-dot {
        0%,100% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
        50%     { box-shadow: 0 0 0 5px transparent; opacity: 0.65; }
      }

      /* Hero */
      .hero-grid {
        display: grid;
        grid-template-columns: auto 1fr auto auto;
        column-gap: 2rem;
        row-gap: 1.4rem;
        align-items: center;
      }
      .hero-avatar {
        width: 110px; height: 110px;
        border-radius: 32px;
        background: linear-gradient(135deg, var(--d-green-mist), var(--d-green-glow));
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 18px 40px -22px rgba(13, 40, 24, 0.4);
        flex-shrink: 0;
      }
      .hero-info { min-width: 0; }
      .status-pill {
        display: inline-flex; align-items: center; gap: 0.5rem;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.66rem;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        padding: 0.4rem 0.85rem;
        border-radius: 999px;
        margin-bottom: 0.85rem;
        font-weight: 500;
      }
      .status-pill.status-al-dia {
        background: var(--d-green-glow);
        color: var(--d-green-mid);
      }
      .status-pill.status-revisar {
        background: var(--d-amber-soft);
        color: var(--d-amber);
      }
      .status-pill .dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        background: currentColor;
        animation: pulse-dot 2.4s infinite;
      }
      .pet-name {
        font-weight: 700;
        font-size: clamp(2.4rem, 5.8vw, 3.8rem);
        line-height: 1;
        letter-spacing: -0.035em;
        color: var(--d-green-deep);
        margin-bottom: 0.95rem;
      }
      .pet-name .name-text {
        position: relative;
        display: inline-block;
      }
      .pet-name .name-text::after {
        content: "";
        position: absolute;
        left: 0; right: 0;
        bottom: 6px;
        height: 14px;
        background: var(--d-green-glow);
        z-index: -1;
        border-radius: 3px;
        opacity: 0.7;
      }
      .pet-tags { display: flex; gap: 0.45rem; flex-wrap: wrap; }
      .pet-tags .tag {
        font-size: 0.78rem;
        padding: 0.4rem 0.85rem;
        border-radius: 999px;
        background: var(--d-bg-card);
        color: var(--d-ink-soft);
        border: 1px solid var(--d-rule-soft);
        font-weight: 500;
        text-transform: capitalize;
      }
      .hero-expediente {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.7rem;
        color: var(--d-ink-mute);
        line-height: 1.85;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        border-left: 1px solid var(--d-rule);
        padding-left: 1.6rem;
        align-self: stretch;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-width: 180px;
      }
      .hero-expediente b {
        display: block;
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-weight: 700;
        font-size: 1.15rem;
        color: var(--d-green-deep);
        text-transform: none;
        letter-spacing: -0.005em;
        margin-block: 0.15rem;
      }
      .hero-cta {
        display: flex; align-items: center;
      }
      .btn-primary {
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-weight: 600;
        font-size: 0.88rem;
        padding: 0.85rem 1.45rem;
        border-radius: 14px;
        border: 1px solid var(--d-green-deep);
        cursor: pointer;
        background: var(--d-green-deep);
        color: var(--d-green-glow);
        transition: all .2s ease;
        white-space: nowrap;
      }
      .btn-primary:hover {
        background: var(--d-green-mid);
        transform: translateY(-1px);
      }
      .btn-ghost {
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-weight: 600;
        font-size: 0.86rem;
        padding: 0.7rem 1.2rem;
        border-radius: 12px;
        border: 1px solid var(--d-rule);
        background: var(--d-bg-card);
        color: var(--d-green-deep);
        cursor: pointer;
        transition: all .2s ease;
      }
      .btn-ghost:hover { border-color: var(--d-green-mid); }

      /* Stats strip */
      .stats-strip {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        margin-bottom: 2.4rem;
      }
      .stat-card {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule-soft);
        border-radius: 20px;
        padding: 1.3rem 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        position: relative;
        overflow: hidden;
        transition: all .25s ease;
      }
      .stat-card::after {
        content: "";
        position: absolute;
        top: -12px; right: -12px;
        width: 60px; height: 60px;
        border-radius: 50%;
        background: var(--d-green-glow);
        opacity: 0;
        transition: opacity .3s ease;
      }
      .stat-card:hover {
        border-color: var(--d-green-mist);
        transform: translateY(-2px);
      }
      .stat-card:hover::after { opacity: 0.4; }
      .stat-num {
        position: relative; z-index: 1;
        font-weight: 700;
        font-size: 2.4rem;
        line-height: 1;
        color: var(--d-green-deep);
        letter-spacing: -0.03em;
      }
      .stat-num.accent { color: var(--d-green-leaf); }
      .stat-lbl {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.66rem;
        text-transform: uppercase;
        letter-spacing: 0.13em;
        color: var(--d-ink-mute);
      }

      /* Grid panels */
      .grid-2 {
        display: grid;
        grid-template-columns: 5fr 7fr;
        gap: 1.4rem;
        align-items: start;
      }
      .panel {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule-soft);
        border-radius: 28px;
        padding: 1.85rem;
        position: relative;
        overflow: hidden;
      }
      .panel::before {
        content: "";
        position: absolute;
        top: -30px; right: -30px;
        width: 110px; height: 110px;
        border-radius: 50%;
        background: var(--d-green-glow);
        opacity: 0.4;
        z-index: 0;
      }
      .panel > * { position: relative; z-index: 1; }
      .panel-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 1.3rem;
      }
      .panel-title {
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: -0.015em;
        color: var(--d-green-deep);
      }
      .panel-counter {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.66rem;
        text-transform: uppercase;
        letter-spacing: 0.13em;
        color: var(--d-ink-mute);
        background: var(--d-bg);
        padding: 0.32rem 0.7rem;
        border-radius: 999px;
      }
      .panel-footer-note {
        font-size: 0.78rem;
        color: var(--d-ink-mute);
        margin-top: 1rem;
      }

      /* Citas */
      .cita-list { list-style: none; position: relative; padding: 0; margin: 0; }
      .cita-list::before {
        content: "";
        position: absolute;
        left: 30px; top: 50px; bottom: 24px;
        width: 1px;
        background: linear-gradient(var(--d-green-mist), transparent);
      }
      .cita {
        display: grid;
        grid-template-columns: 64px 1fr;
        gap: 1.1rem;
        padding: 1rem 0;
        border-bottom: 1px solid var(--d-rule-soft);
      }
      .cita:last-child { border-bottom: 0; }
      .cita-date {
        background: var(--d-green-deep);
        color: var(--d-green-glow);
        border-radius: 14px;
        padding: 0.55rem 0;
        text-align: center;
        align-self: start;
        position: relative;
        z-index: 2;
      }
      .cita-date .day {
        font-weight: 700; font-size: 1.4rem;
        line-height: 1;
        letter-spacing: -0.02em;
      }
      .cita-date .month {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.6rem;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        margin-top: 0.3rem;
        color: var(--d-green-mist);
      }
      .cita-info { min-width: 0; }
      .cita-meta-top {
        display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.7rem;
        color: var(--d-ink-mute);
        margin-bottom: 0.45rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .cita-status {
        display: inline-flex; align-items: center; gap: 0.4rem;
        padding: 0.25rem 0.55rem;
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.62rem;
      }
      .cita-status .dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: currentColor;
      }
      .cita-status-confirmada { background: var(--d-green-glow); color: var(--d-green-mid); }
      .cita-status-pendiente { background: var(--d-amber-soft); color: var(--d-amber); }
      .cita-status-completada { background: var(--d-bg-soft); color: var(--d-ink-mute); }
      .cita-status-cancelada { background: var(--d-rose-soft); color: var(--d-rose); }

      .cita-time {
        font-weight: 700; font-size: 1rem;
        color: var(--d-green-deep);
        letter-spacing: -0.005em;
        margin-bottom: 0.3rem;
      }
      .cita-addr {
        font-size: 0.84rem;
        color: var(--d-ink-soft);
        margin-bottom: 0.6rem;
        line-height: 1.4;
      }
      .cita-services { display: flex; flex-wrap: wrap; gap: 0.35rem; }
      .service-chip, .service-chip-more {
        font-size: 0.7rem;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        background: var(--d-bg);
        color: var(--d-ink-soft);
        border: 1px solid var(--d-rule-soft);
      }
      .service-chip-more {
        background: transparent;
        color: var(--d-ink-mute);
        border-style: dashed;
      }

      /* Empty citas */
      .empty-citas {
        text-align: center;
        padding: 1.6rem 1rem 0.5rem;
      }
      .empty-citas .empty-ill {
        width: 60px; height: 60px;
        margin: 0 auto 0.9rem;
        border-radius: 20px;
        background: linear-gradient(135deg, var(--d-green-mist), var(--d-green-glow));
        display: flex; align-items: center; justify-content: center;
        font-size: 1.6rem;
      }
      .empty-citas p {
        color: var(--d-ink-soft);
        font-size: 0.88rem;
        margin-bottom: 1.1rem;
      }

      /* Exámenes */
      .month-divider {
        display: flex; align-items: center; gap: 0.7rem;
        margin: 1.4rem 0 0.4rem;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.66rem;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--d-ink-mute);
      }
      .month-divider::after {
        content: ""; flex: 1; height: 1px; background: var(--d-rule);
      }
      .month-divider:first-child { margin-top: 0; }
      .exam-list { list-style: none; padding: 0; margin: 0; }
      .exam {
        display: grid;
        grid-template-columns: 44px 1fr auto auto;
        gap: 1rem;
        align-items: center;
        padding: 0.95rem 0.6rem;
        border-radius: 14px;
        transition: background .2s, padding-left .25s;
        position: relative;
      }
      .exam:hover {
        background: var(--d-bg);
        padding-left: 1rem;
      }
      .exam::before {
        content: "";
        position: absolute;
        left: 0; top: 14px; bottom: 14px;
        width: 2px;
        background: var(--d-green-leaf);
        border-radius: 2px;
        transform: scaleY(0);
        transform-origin: top;
        transition: transform .25s ease;
      }
      .exam:hover::before { transform: scaleY(1); }
      .exam-icon {
        width: 40px; height: 40px;
        border-radius: 12px;
        background: var(--d-bg-soft);
        display: flex; align-items: center; justify-content: center;
        font-size: 1.05rem;
      }
      .exam-icon-disponible { background: var(--d-green-glow); }
      .exam-icon-pendiente { background: var(--d-amber-soft); }
      .exam-icon-en_proceso { background: #fde6cc; }

      .exam-info { min-width: 0; }
      .exam-title {
        font-weight: 600; font-size: 0.92rem;
        color: var(--d-ink); letter-spacing: -0.005em;
      }
      .exam-date {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.7rem;
        color: var(--d-ink-mute);
        margin-top: 0.15rem;
        letter-spacing: 0.05em;
      }
      .exam-badge {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 0.6rem;
        text-transform: uppercase;
        letter-spacing: 0.13em;
        padding: 0.32rem 0.6rem;
        border-radius: 999px;
        font-weight: 500;
        white-space: nowrap;
      }
      .exam-badge-disponible { background: var(--d-green-glow); color: var(--d-green-mid); }
      .exam-badge-pendiente { background: var(--d-amber-soft); color: var(--d-amber); }
      .exam-badge-en_proceso { background: #fde6cc; color: #b85a14; }
      .exam-download {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: var(--d-green-deep);
        color: var(--d-green-glow);
        display: flex; align-items: center; justify-content: center;
        border: none; cursor: pointer;
        transition: all .2s;
        text-decoration: none;
      }
      .exam-download:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px -8px var(--d-green-deep);
      }

      /* Responsive */
      @media (max-width: 920px) {
        .hero-grid {
          grid-template-columns: auto 1fr;
        }
        .hero-expediente {
          grid-column: 1 / -1;
          border-left: 0;
          border-top: 1px dashed var(--d-rule);
          padding-left: 0;
          padding-top: 1rem;
        }
        .hero-cta { grid-column: 1 / -1; }
        .stats-strip { grid-template-columns: repeat(2, 1fr); }
        .grid-2 { grid-template-columns: 1fr; }
      }
      @media (max-width: 640px) {
        .panel { padding: 1.4rem; border-radius: 22px; }
        .pet-name { font-size: clamp(2rem, 9vw, 3rem); }
        .hero-avatar { width: 88px; height: 88px; border-radius: 24px; }
        .hero-avatar > span { font-size: 3.2rem !important; }
        .stat-card { padding: 1rem 1.1rem; }
        .stat-num { font-size: 1.9rem; }
        .exam { grid-template-columns: 36px 1fr auto; gap: 0.7rem; padding: 0.8rem 0.4rem; }
        .exam-icon { width: 34px; height: 34px; }
        .exam-badge { font-size: 0.55rem; padding: 0.28rem 0.5rem; }
        .exam-download { width: 32px; height: 32px; }
        .cita { grid-template-columns: 54px 1fr; gap: 0.85rem; }
        .cita-list::before { left: 26px; }
      }
      @media (max-width: 480px) {
        .stats-strip { grid-template-columns: 1fr 1fr; }
      }
    `}</style>
  );
}
