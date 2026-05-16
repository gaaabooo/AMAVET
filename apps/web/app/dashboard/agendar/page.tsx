'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getSesion, type SesionUsuario } from '@/lib/session';
import DashboardNav from '@/components/DashboardNav';

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  raza?: string;
  edad?: number;
}

const SERVICIOS_CATEGORIAS: { titulo: string; numero: string; items: string[] }[] = [
  {
    titulo: 'Consulta general',
    numero: 'I',
    items: ['Control Médico', 'Colocación de chips', 'Curación de heridas'],
  },
  {
    titulo: 'Exámenes de laboratorio',
    numero: 'II',
    items: ['Examen Hemograma', 'Examen T4', 'Examen TSH', 'Perfil Bioquímico'],
  },
  {
    titulo: 'Tests rápidos',
    numero: 'III',
    items: ['Test de Distemper', 'Test de leucemia', 'Test de Parvovirus', 'Test de SIDA Felino'],
  },
];

const SERVICIOS_FLAT: string[] = SERVICIOS_CATEGORIAS.flatMap(c => c.items);

const HORAS = ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30'];

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_SEMANA_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_SEMANA_CORTO = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function AgendarVisita() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState<string>('');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<string[]>([]);
  const [direccion, setDireccion] = useState('');
  const [mesActual, setMesActual] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const cargarMascotas = useCallback(async (tutorId: string) => {
    try {
      const res = await api.get(`/mascotas/tutor/${tutorId}`);
      setMascotas(res.data);
      if (res.data.length > 0) setMascotaSeleccionada(res.data[0].id);
    } catch {
      // error silencioso — el interceptor 401 ya redirige si es necesario
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const sesion = getSesion();
    if (!sesion) { router.push('/login'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuario(sesion);
    cargarMascotas(sesion.id);
  }, [router, cargarMascotas]);

  const toggleServicio = (servicio: string) => {
    setServiciosSeleccionados(prev =>
      prev.includes(servicio) ? prev.filter(s => s !== servicio) : [...prev, servicio]
    );
  };

  const puedeConfirmar =
    !!mascotaSeleccionada &&
    serviciosSeleccionados.length > 0 &&
    direccion.trim().length > 0 &&
    !!fechaSeleccionada &&
    !!horaSeleccionada;

  const hoy = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const celdasCalendario = useMemo(() => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    const primerDia = new Date(año, mes, 1).getDay();
    const diasMes = new Date(año, mes + 1, 0).getDate();
    const cells: ({ dia: number; fecha: Date; pasado: boolean } | null)[] = [];
    for (let i = 0; i < primerDia; i++) cells.push(null);
    for (let d = 1; d <= diasMes; d++) {
      const fecha = new Date(año, mes, d);
      cells.push({ dia: d, fecha, pasado: fecha < hoy });
    }
    return cells;
  }, [mesActual, hoy]);

  const mesAnterior = () => {
    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const nuevoMes = new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1);
    if (nuevoMes >= inicioMesActual) setMesActual(nuevoMes);
  };

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
  };

  const seleccionarFecha = (fecha: Date) => {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada(null);
  };

  const fechaResumen = useMemo(() => {
    if (!fechaSeleccionada) return null;
    const dia = DIAS_SEMANA_LARGO[fechaSeleccionada.getDay()];
    const numDia = String(fechaSeleccionada.getDate()).padStart(2, '0');
    const mes = NOMBRES_MES[fechaSeleccionada.getMonth()].slice(0, 3);
    return `${dia} ${numDia} ${mes}`;
  }, [fechaSeleccionada]);

  const horaResumen = useMemo(() => {
    if (!horaSeleccionada) return null;
    const [h, m] = horaSeleccionada.split(':').map(Number);
    const periodo = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${periodo}`;
  }, [horaSeleccionada]);

  const fechaTituloBloques = useMemo(() => {
    if (!fechaSeleccionada) return null;
    const dia = DIAS_SEMANA_LARGO[fechaSeleccionada.getDay()];
    const numDia = fechaSeleccionada.getDate();
    const mes = NOMBRES_MES[fechaSeleccionada.getMonth()];
    return `${dia} ${numDia} · ${mes}`;
  }, [fechaSeleccionada]);

  const numeroIndice = (servicio: string) => {
    const idx = SERVICIOS_FLAT.indexOf(servicio);
    return String(idx + 1).padStart(2, '0');
  };

  // Pasos para timeline
  const pasoMascotaDone = !!mascotaSeleccionada;
  const pasoServiciosDone = serviciosSeleccionados.length > 0 && direccion.trim().length > 0;
  const pasoFechaDone = !!fechaSeleccionada && !!horaSeleccionada;

  const pasoActivo: 'servicios' | 'fecha' | 'confirmar' =
    !pasoServiciosDone ? 'servicios'
    : !pasoFechaDone ? 'fecha'
    : 'confirmar';

  const confirmar = async () => {
    if (!fechaSeleccionada || !horaSeleccionada || !mascotaSeleccionada) return;
    setError(null);
    setEnviando(true);
    try {
      const [h, m] = horaSeleccionada.split(':').map(Number);
      const fecha = new Date(fechaSeleccionada);
      fecha.setHours(h, m, 0, 0);
      await api.post('/citas', {
        fecha: fecha.toISOString(),
        direccion: direccion.trim(),
        servicios: serviciosSeleccionados,
        mascotaId: mascotaSeleccionada,
      });
      setExito(true);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'No se pudo agendar la cita. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const mascotaActual = mascotas.find(m => m.id === mascotaSeleccionada);

  if (cargando) {
    return (
      <main className="dash-bg min-h-screen relative">
        <AgendarStyles />
        <DashboardNav active="agendar" />
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-8 py-12 space-y-6 animate-pulse">
          <div className="h-16 w-80 rounded-xl" style={{ background: 'var(--d-bg-card)' }} />
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-3 h-72 rounded-3xl" style={{ background: 'var(--d-bg-card)' }} />
            <div className="col-span-6 h-96 rounded-3xl" style={{ background: 'var(--d-bg-card)' }} />
            <div className="col-span-3 h-96 rounded-3xl" style={{ background: 'var(--d-bg-card)' }} />
          </div>
        </div>
      </main>
    );
  }

  if (exito) {
    return (
      <main className="dash-bg min-h-screen relative overflow-hidden flex items-center justify-center px-6">
        <AgendarStyles />
        <div className="leaf-bg" aria-hidden="true">
          <svg className="l1" viewBox="0 0 200 200" fill="currentColor">
            <path d="M100 10 C 60 50, 40 110, 70 180 C 110 150, 160 100, 100 10 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.5" />
          </svg>
          <svg className="l2" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M30 100 C 80 40, 140 30, 180 60 C 150 130, 90 170, 30 100 Z" />
          </svg>
        </div>
        <div className="success-card relative z-10">
          <div className="success-tick">✓</div>
          <span className="success-eyebrow">SOLICITUD RECIBIDA</span>
          <h1 className="success-title">
            Visita <em>agendada</em>
          </h1>
          <p className="success-lead">
            Recibimos tu solicitud. Te confirmaremos la cita por correo pronto.
          </p>
          <div className="success-summary">
            <div className="ss-row">
              <span className="ss-k">Mascota</span>
              <span className="ss-v">{mascotaActual?.nombre}</span>
            </div>
            <div className="ss-row">
              <span className="ss-k">Cita</span>
              <span className="ss-v">{fechaResumen}, {horaResumen}</span>
            </div>
            <div className="ss-row">
              <span className="ss-k">Dirección</span>
              <span className="ss-v ss-v-right">{direccion}</span>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn-primary btn-block">
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="dash-bg min-h-screen relative">
      <AgendarStyles />

      {/* Hojas decorativas */}
      <div className="leaf-bg" aria-hidden="true">
        <svg className="l1" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 10 C 60 50, 40 110, 70 180 C 110 150, 160 100, 100 10 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.5" />
          <path d="M100 30 C 70 60, 60 110, 80 170" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <svg className="l2" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M30 100 C 80 40, 140 30, 180 60 C 150 130, 90 170, 30 100 Z" />
          <path d="M50 100 L 160 70" />
        </svg>
      </div>

      <DashboardNav active="agendar" usuarioNombre={usuario?.nombre} />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-10 py-12">
        {/* Header */}
        <div
          className="header-block"
          style={{
            opacity: 0,
            animation: 'rise 700ms 60ms cubic-bezier(.2,.7,.2,1) forwards',
          }}
        >
          <div className="header-eyebrow">
            <span className="line" /> NUEVA VISITA
          </div>
          <h1 className="header-title">
            Agenda una <em>visita a domicilio</em>
          </h1>
          <p className="header-lead">
            Elige los servicios, la fecha y la hora. Un veterinario se acercará al lugar que indiques sin pagos previos.
          </p>
        </div>

        {mascotas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-ill">🐾</div>
            <p className="empty-title">Aún no tienes mascotas registradas</p>
            <p className="empty-lead">Registra una mascota antes de agendar una visita.</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Ir al inicio
            </button>
          </div>
        ) : (
          <div className="agenda-grid">

            {/* TIMELINE */}
            <aside className="timeline-col">
              <div className="timeline-label">Tu solicitud</div>

              <div className={`tl-step ${pasoMascotaDone ? 'done' : ''}`}>
                <div className="tl-dot">
                  {pasoMascotaDone ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : '01'}
                </div>
                <div className="tl-content">
                  <div className="tl-title">Mascota</div>
                  <div className="tl-meta">
                    {mascotaActual ? `${mascotaActual.nombre} · ${mascotaActual.tipo}` : 'Sin elegir'}
                  </div>
                </div>
              </div>

              <div className={`tl-step ${pasoServiciosDone ? 'done' : pasoActivo === 'servicios' ? 'active' : ''}`}>
                <div className="tl-dot">
                  {pasoServiciosDone ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : '02'}
                </div>
                <div className="tl-content">
                  <div className="tl-title">Servicios</div>
                  <div className="tl-meta">
                    {serviciosSeleccionados.length > 0
                      ? `${serviciosSeleccionados.length} seleccionado${serviciosSeleccionados.length === 1 ? '' : 's'}`
                      : 'Pendiente'}
                  </div>
                </div>
              </div>

              <div className={`tl-step ${pasoFechaDone ? 'done' : pasoActivo === 'fecha' ? 'active' : ''}`}>
                <div className="tl-dot">
                  {pasoFechaDone ? (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : '03'}
                </div>
                <div className="tl-content">
                  <div className="tl-title">Fecha y hora</div>
                  <div className="tl-meta">
                    {fechaResumen && horaResumen ? `${fechaResumen.split(' ')[0]} ${fechaResumen.split(' ')[1]} · ${horaResumen}` : 'Pendiente'}
                  </div>
                </div>
              </div>

              <div className={`tl-step ${pasoActivo === 'confirmar' ? 'active' : ''}`}>
                <div className="tl-dot">04</div>
                <div className="tl-content">
                  <div className="tl-title">Confirmación</div>
                  <div className="tl-meta">
                    {puedeConfirmar ? 'Listo para confirmar' : 'Pendiente'}
                  </div>
                </div>
              </div>
            </aside>

            {/* FORM */}
            <div className="form-col">

              {/* §01 — Mascota + dirección + servicios */}
              <section className="section-block" data-num="01">
                <div className="section-head">
                  <span className="section-num">§ 01</span>
                  <h2 className="section-title">¿Qué necesita <em>tu mascota</em>?</h2>
                </div>

                <div className="field-row">
                  <div>
                    <label className="field-label">Mascota</label>
                    <select
                      value={mascotaSeleccionada}
                      onChange={e => setMascotaSeleccionada(e.target.value)}
                      className="field-input"
                    >
                      {mascotas.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} — {m.tipo}{m.raza ? ` · ${m.raza}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Dirección de la visita</label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={e => setDireccion(e.target.value)}
                      placeholder="Calle, número, comuna"
                      className="field-input"
                    />
                  </div>
                </div>

                {SERVICIOS_CATEGORIAS.map(cat => (
                  <div key={cat.titulo}>
                    <div className="chip-divider">{cat.titulo}</div>
                    <div className="chips-grid">
                      {cat.items.map(servicio => {
                        const checked = serviciosSeleccionados.includes(servicio);
                        return (
                          <button
                            type="button"
                            key={servicio}
                            onClick={() => toggleServicio(servicio)}
                            className={`chip ${checked ? 'checked' : ''}`}
                          >
                            <span className="chip-num">{numeroIndice(servicio)}</span>
                            {servicio}
                            {checked && (
                              <span className="chip-x" aria-hidden="true">
                                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                                  <path d="M2 2l4 4M6 2l-4 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                                </svg>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>

              {/* §02 — Calendario */}
              <section className="section-block" data-num="02">
                <div className="section-head">
                  <span className="section-num">§ 02</span>
                  <h2 className="section-title">Elige <em>cuándo</em></h2>
                </div>

                <div className="calendar-card">
                  <div className="cal-month">
                    <div className="cal-head">
                      <div className="cal-month-name">
                        {NOMBRES_MES[mesActual.getMonth()]}{' '}
                        <span className="yr">{mesActual.getFullYear()}</span>
                      </div>
                      <div className="cal-arrows">
                        <button onClick={mesAnterior} aria-label="Mes anterior">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button onClick={mesSiguiente} aria-label="Mes siguiente">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="cal-grid">
                      {DIAS_SEMANA_CORTO.map(d => (
                        <div key={d} className="dow">{d}</div>
                      ))}
                      {celdasCalendario.map((cell, idx) => {
                        if (!cell) return <div key={idx} />;
                        const seleccionado =
                          fechaSeleccionada &&
                          fechaSeleccionada.getFullYear() === cell.fecha.getFullYear() &&
                          fechaSeleccionada.getMonth() === cell.fecha.getMonth() &&
                          fechaSeleccionada.getDate() === cell.fecha.getDate();
                        const esHoy =
                          cell.fecha.getFullYear() === hoy.getFullYear() &&
                          cell.fecha.getMonth() === hoy.getMonth() &&
                          cell.fecha.getDate() === hoy.getDate();
                        if (cell.pasado) {
                          return (
                            <div key={idx} className="day past">{cell.dia}</div>
                          );
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => seleccionarFecha(cell.fecha)}
                            className={`day ${seleccionado ? 'selected' : ''} ${esHoy ? 'today' : ''}`}
                          >
                            {cell.dia}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="cal-times">
                    <div className="times-head">Bloques disponibles</div>
                    <div className="times-sub">
                      {fechaTituloBloques ?? 'Selecciona una fecha'}
                    </div>
                    {!fechaSeleccionada ? (
                      <div className="times-empty">
                        <div className="times-empty-ill">📅</div>
                        <p>Selecciona una fecha primero</p>
                      </div>
                    ) : (
                      <div className="times-grid">
                        {HORAS.map(hora => {
                          const seleccionada = horaSeleccionada === hora;
                          return (
                            <button
                              key={hora}
                              onClick={() => setHoraSeleccionada(hora)}
                              className={`time-pill ${seleccionada ? 'selected' : ''}`}
                            >
                              {hora}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="info-tip">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      <span>Duración estimada de <b>45 a 60 minutos</b> según los servicios.</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* SUMMARY */}
            <aside className="summary-col">
              <div className="summary-card">
                <svg className="summary-leaf" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
                  <path d="M50 10 C 70 30, 80 50, 50 90 C 20 50, 30 30, 50 10 Z" />
                </svg>

                <div className="expediente">
                  <div className="exp-label">Solicitud №</div>
                  <div className="exp-value">SV-{new Date().getFullYear()}-NUEVA</div>
                  <div className="exp-meta">Provisional · genera al confirmar</div>
                </div>

                <div className="summary-block">
                  <div className="sb-label">Mascota</div>
                  <div className="sb-value">
                    {mascotaActual ? `${mascotaActual.nombre} · ${mascotaActual.tipo}` : (
                      <span className="sb-empty">Sin seleccionar</span>
                    )}
                  </div>
                </div>

                <div className="summary-block">
                  <div className="sb-label">
                    Servicios{serviciosSeleccionados.length > 0 ? ` · ${String(serviciosSeleccionados.length).padStart(2, '0')}` : ''}
                  </div>
                  {serviciosSeleccionados.length === 0 ? (
                    <div className="sb-value"><span className="sb-empty">Ninguno seleccionado</span></div>
                  ) : (
                    <ul className="sb-list">
                      {serviciosSeleccionados.map(s => <li key={s}>{s}</li>)}
                    </ul>
                  )}
                </div>

                {direccion.trim() && (
                  <div className="summary-block">
                    <div className="sb-label">Dirección</div>
                    <div className="sb-value sb-value-sm">{direccion.trim()}</div>
                  </div>
                )}

                <div className="summary-block">
                  <div className="sb-label">Cita</div>
                  <div className="sb-value">
                    {fechaResumen && horaResumen
                      ? `${fechaResumen}, ${horaResumen}`
                      : <span className="sb-empty">Sin programar</span>}
                  </div>
                </div>

                {error && (
                  <div className="summary-error">{error}</div>
                )}

                <button
                  onClick={confirmar}
                  disabled={!puedeConfirmar || enviando}
                  className="btn-confirm"
                >
                  {enviando ? 'Agendando…' : 'Confirmar agendamiento'}
                </button>
                <div className="confirm-meta">SIN PAGO PREVIO REQUERIDO</div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── Estilos ─── */

function AgendarStyles() {
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

      @keyframes rise {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }


      /* Header */
      .dash-bg .header-block {
        margin-bottom: 56px;
        max-width: 720px;
      }
      .dash-bg .header-eyebrow {
        display: inline-flex; align-items: center; gap: 12px;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--d-green-mid);
        margin-bottom: 14px;
      }
      .dash-bg .header-eyebrow .line {
        width: 28px; height: 1px;
        background: var(--d-green-mid);
      }
      .dash-bg .header-title {
        font-size: clamp(2.2rem, 5vw, 3.2rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.05;
        color: var(--d-green-deep);
        margin-bottom: 14px;
      }
      .dash-bg .header-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 300;
        color: var(--d-green-mid);
      }
      .dash-bg .header-lead {
        font-size: 16px;
        color: var(--d-ink-soft);
        line-height: 1.55;
        max-width: 580px;
      }

      /* Layout 3 columnas */
      .dash-bg .agenda-grid {
        display: grid;
        grid-template-columns: 200px 1fr 340px;
        gap: 56px;
        position: relative;
        z-index: 1;
      }
      @media (max-width: 1100px) {
        .dash-bg .agenda-grid {
          grid-template-columns: 1fr;
          gap: 32px;
        }
      }

      /* Timeline */
      .dash-bg .timeline-col {
        position: sticky;
        top: 32px;
        align-self: start;
      }
      .dash-bg .timeline-label {
        font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.2em;
        color: var(--d-ink-mute);
        margin-bottom: 18px;
        padding-left: 40px;
      }
      .dash-bg .tl-step {
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 12px;
        align-items: start;
        padding: 12px 0;
        position: relative;
      }
      .dash-bg .tl-step:not(:last-child)::after {
        content: '';
        position: absolute;
        left: 13px; top: 36px; bottom: -8px;
        width: 1px;
        background: var(--d-rule);
      }
      .dash-bg .tl-step.done:not(:last-child)::after,
      .dash-bg .tl-step.active:not(:last-child)::after {
        background: var(--d-green-mid);
      }
      .dash-bg .tl-dot {
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 1.5px solid var(--d-rule);
        background: var(--d-bg-card);
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 500;
        color: var(--d-ink-mute);
        transition: all .3s;
      }
      .dash-bg .tl-step.active .tl-dot {
        background: var(--d-green-mid);
        border-color: var(--d-green-mid);
        color: white;
        box-shadow: 0 0 0 4px rgba(31, 77, 51, 0.12);
      }
      .dash-bg .tl-step.done .tl-dot {
        background: var(--d-green-mid);
        border-color: var(--d-green-mid);
        color: white;
      }
      .dash-bg .tl-content { padding-top: 4px; }
      .dash-bg .tl-title {
        font-size: 14px; font-weight: 700;
        color: var(--d-ink);
        margin-bottom: 2px;
      }
      .dash-bg .tl-step.active .tl-title { color: var(--d-green-mid); }
      .dash-bg .tl-step:not(.active):not(.done) .tl-title {
        color: var(--d-ink-mute); font-weight: 500;
      }
      .dash-bg .tl-meta {
        font-size: 11px;
        color: var(--d-ink-mute);
        font-family: var(--font-dm-mono), ui-monospace, monospace;
      }

      /* Form */
      .dash-bg .form-col { min-width: 0; }
      .dash-bg .section-block {
        margin-bottom: 64px;
        position: relative;
      }
      .dash-bg .section-block::before {
        content: attr(data-num);
        position: absolute;
        top: -8px; left: -16px;
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-size: 84px;
        color: var(--d-ink);
        opacity: 0.05;
        font-weight: 300;
        line-height: 1;
        z-index: 0;
        pointer-events: none;
      }
      .dash-bg .section-head {
        display: flex; align-items: baseline; gap: 14px;
        margin-bottom: 28px;
        position: relative;
        z-index: 1;
      }
      .dash-bg .section-num {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px;
        color: var(--d-ink-mute);
        letter-spacing: 0.08em;
      }
      .dash-bg .section-title {
        font-size: 24px; font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--d-green-deep);
      }
      .dash-bg .section-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 300;
        color: var(--d-green-mid);
      }

      /* Inputs */
      .dash-bg .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 28px;
      }
      @media (max-width: 640px) {
        .dash-bg .field-row { grid-template-columns: 1fr; }
      }
      .dash-bg .field-label {
        display: block;
        font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.18em;
        color: var(--d-ink-mute);
        margin-bottom: 8px;
      }
      .dash-bg .field-input {
        width: 100%;
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 12px;
        padding: 14px 16px;
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-size: 14px;
        color: var(--d-ink);
        outline: none;
        transition: border-color .2s, box-shadow .2s;
      }
      .dash-bg .field-input:focus {
        border-color: var(--d-green-mid);
        box-shadow: 0 0 0 4px rgba(31, 77, 51, 0.08);
      }
      .dash-bg select.field-input {
        appearance: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'><path d='M3 4.5l3 3 3-3' stroke='%236b7a6e' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/></svg>");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 40px;
      }

      /* Chips */
      .dash-bg .chip-divider {
        margin: 22px 0 12px;
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-size: 14px;
        color: var(--d-ink-mute);
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .dash-bg .chip-divider:first-of-type { margin-top: 4px; }
      .dash-bg .chip-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--d-rule);
      }
      .dash-bg .chips-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .dash-bg .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 999px;
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-size: 13px;
        color: var(--d-ink-soft);
        cursor: pointer;
        transition: all .15s ease;
        user-select: none;
      }
      .dash-bg .chip:hover {
        border-color: var(--d-green-leaf);
        color: var(--d-ink);
      }
      .dash-bg .chip.checked {
        background: var(--d-green-mid);
        border-color: var(--d-green-mid);
        color: white;
        font-weight: 600;
        padding-left: 10px;
      }
      .dash-bg .chip-num {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 10px;
        color: var(--d-ink-mute);
        letter-spacing: 0.05em;
      }
      .dash-bg .chip.checked .chip-num { color: rgba(255,255,255,0.65); }
      .dash-bg .chip-x {
        width: 16px; height: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
      }

      /* Calendario */
      .dash-bg .calendar-card {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 20px;
        overflow: hidden;
        display: grid;
        grid-template-columns: 1fr 1fr;
      }
      @media (max-width: 720px) {
        .dash-bg .calendar-card { grid-template-columns: 1fr; }
      }
      .dash-bg .cal-month {
        padding: 28px;
        border-right: 1px solid var(--d-rule);
      }
      @media (max-width: 720px) {
        .dash-bg .cal-month {
          border-right: none;
          border-bottom: 1px solid var(--d-rule);
        }
      }
      .dash-bg .cal-head {
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 20px;
      }
      .dash-bg .cal-month-name {
        font-size: 14px; font-weight: 700;
        color: var(--d-ink);
      }
      .dash-bg .cal-month-name .yr {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        color: var(--d-ink-mute);
        font-weight: 500;
        margin-left: 4px;
      }
      .dash-bg .cal-arrows { display: flex; gap: 4px; }
      .dash-bg .cal-arrows button {
        width: 28px; height: 28px;
        border-radius: 8px;
        border: none; background: transparent;
        display: flex; align-items: center; justify-content: center;
        color: var(--d-ink-soft);
        cursor: pointer;
        transition: background .2s;
      }
      .dash-bg .cal-arrows button:hover { background: var(--d-bg-soft); }
      .dash-bg .cal-grid {
        display: grid; grid-template-columns: repeat(7, 1fr);
        gap: 4px; text-align: center;
      }
      .dash-bg .dow {
        font-size: 9px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.15em;
        color: var(--d-ink-mute);
        padding: 8px 0;
      }
      .dash-bg .day {
        aspect-ratio: 1;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 500;
        color: var(--d-ink);
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        transition: all .15s;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
      }
      .dash-bg .day:hover { background: var(--d-bg-soft); }
      .dash-bg .day.past {
        color: var(--d-rule);
        cursor: default;
      }
      .dash-bg .day.past:hover { background: transparent; }
      .dash-bg .day.today {
        color: var(--d-green-mid);
        font-weight: 700;
      }
      .dash-bg .day.selected {
        background: var(--d-green-mid);
        color: white;
        box-shadow: 0 0 0 4px rgba(31, 77, 51, 0.15);
      }
      .dash-bg .day.today.selected { color: white; }

      /* Times */
      .dash-bg .cal-times { padding: 28px; }
      .dash-bg .times-head {
        font-size: 14px; font-weight: 700;
        color: var(--d-ink);
        margin-bottom: 4px;
      }
      .dash-bg .times-sub {
        font-size: 12px;
        color: var(--d-ink-mute);
        margin-bottom: 18px;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
      }
      .dash-bg .times-empty {
        display: flex; flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 28px 0 16px;
      }
      .dash-bg .times-empty-ill {
        width: 40px; height: 40px;
        border-radius: 12px;
        background: var(--d-bg-soft);
        display: flex; align-items: center; justify-content: center;
        font-size: 20px;
        margin-bottom: 12px;
      }
      .dash-bg .times-empty p {
        font-size: 13px;
        color: var(--d-ink-mute);
      }
      .dash-bg .times-grid {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .dash-bg .time-pill {
        padding: 12px;
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 12px;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 13px; font-weight: 500;
        color: var(--d-ink);
        cursor: pointer;
        transition: all .15s;
      }
      .dash-bg .time-pill:hover { border-color: var(--d-green-mid); }
      .dash-bg .time-pill.selected {
        background: var(--d-green-mid);
        color: white;
        border-color: var(--d-green-mid);
      }
      .dash-bg .info-tip {
        margin-top: 18px;
        display: flex; align-items: flex-start; gap: 10px;
        padding: 14px;
        background: var(--d-bg-soft);
        border-radius: 12px;
        font-size: 12px;
        color: var(--d-ink-soft);
        line-height: 1.5;
      }
      .dash-bg .info-tip svg {
        flex-shrink: 0;
        margin-top: 1px;
        color: var(--d-green-mid);
      }
      .dash-bg .info-tip b {
        font-weight: 700;
        color: var(--d-ink);
      }

      /* Summary */
      .dash-bg .summary-col {
        position: sticky;
        top: 32px;
        align-self: start;
      }
      .dash-bg .summary-card {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 20px;
        padding: 28px;
        position: relative;
        overflow: hidden;
      }
      .dash-bg .summary-leaf {
        position: absolute;
        top: -20px; right: -20px;
        width: 100px;
        opacity: 0.08;
        color: var(--d-green-mid);
        pointer-events: none;
      }
      .dash-bg .expediente {
        border: 1px dashed var(--d-rule);
        border-radius: 12px;
        padding: 14px 18px;
        margin-bottom: 22px;
        background: var(--d-bg-soft);
      }
      .dash-bg .exp-label {
        font-size: 9px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.22em;
        color: var(--d-ink-mute);
        margin-bottom: 4px;
      }
      .dash-bg .exp-value {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 20px; font-weight: 500;
        color: var(--d-green-mid);
      }
      .dash-bg .exp-meta {
        font-size: 10px;
        color: var(--d-ink-mute);
        margin-top: 4px;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        letter-spacing: 0.05em;
      }
      .dash-bg .summary-block {
        padding: 16px 0;
        border-bottom: 1px solid var(--d-rule-soft);
      }
      .dash-bg .summary-block:last-of-type {
        border-bottom: none;
        padding-bottom: 4px;
      }
      .dash-bg .sb-label {
        font-size: 9px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.22em;
        color: var(--d-ink-mute);
        margin-bottom: 8px;
      }
      .dash-bg .sb-value {
        font-size: 14px; font-weight: 600;
        color: var(--d-ink);
      }
      .dash-bg .sb-value-sm {
        font-size: 13px;
        font-weight: 500;
      }
      .dash-bg .sb-empty {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 300;
        color: var(--d-ink-mute);
      }
      .dash-bg .sb-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .dash-bg .sb-list li {
        font-size: 13px;
        color: var(--d-ink);
        padding: 4px 0;
        padding-left: 14px;
        position: relative;
      }
      .dash-bg .sb-list li::before {
        content: '·';
        position: absolute; left: 0; top: 4px;
        color: var(--d-green-mid);
        font-weight: 700;
      }
      .dash-bg .summary-error {
        background: var(--d-rose-soft, #fadcd2);
        color: var(--d-rose);
        font-size: 12px;
        padding: 10px 12px;
        border-radius: 10px;
        margin-top: 14px;
      }
      .dash-bg .btn-confirm {
        width: 100%;
        background: var(--d-green-deep);
        color: var(--d-green-glow);
        border: 1px solid var(--d-green-deep);
        border-radius: 14px;
        padding: 15px;
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-size: 14px; font-weight: 700;
        cursor: pointer;
        margin-top: 22px;
        transition: all .2s;
        letter-spacing: 0.02em;
      }
      .dash-bg .btn-confirm:hover:not(:disabled) {
        background: var(--d-green-mid);
        transform: translateY(-1px);
      }
      .dash-bg .btn-confirm:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .dash-bg .confirm-meta {
        text-align: center;
        font-size: 10px;
        color: var(--d-ink-mute);
        margin-top: 12px;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        letter-spacing: 0.1em;
      }

      /* Empty state */
      .dash-bg .empty-state {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 20px;
        padding: 48px 32px;
        text-align: center;
        position: relative;
        z-index: 1;
      }
      .dash-bg .empty-ill {
        width: 56px; height: 56px;
        border-radius: 18px;
        background: var(--d-bg-soft);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 18px;
        font-size: 28px;
      }
      .dash-bg .empty-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--d-ink);
        margin-bottom: 6px;
      }
      .dash-bg .empty-lead {
        font-size: 13px;
        color: var(--d-ink-mute);
        margin-bottom: 18px;
      }
      .dash-bg .btn-primary {
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
      .dash-bg .btn-primary:hover {
        background: var(--d-green-mid);
        transform: translateY(-1px);
      }
      .dash-bg .btn-block { width: 100%; }

      /* Success */
      .dash-bg .success-card {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 24px;
        padding: 44px 36px;
        max-width: 460px;
        width: 100%;
        text-align: center;
      }
      .dash-bg .success-tick {
        width: 56px; height: 56px;
        border-radius: 50%;
        background: var(--d-green-glow);
        color: var(--d-green-mid);
        display: flex; align-items: center; justify-content: center;
        font-size: 26px; font-weight: 700;
        margin: 0 auto 18px;
      }
      .dash-bg .success-eyebrow {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px;
        color: var(--d-green-mid);
        letter-spacing: 0.18em;
        font-weight: 500;
      }
      .dash-bg .success-title {
        font-size: 32px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: var(--d-green-deep);
        margin: 8px 0 10px;
      }
      .dash-bg .success-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 300;
        color: var(--d-green-mid);
      }
      .dash-bg .success-lead {
        font-size: 14px;
        color: var(--d-ink-soft);
        margin-bottom: 22px;
      }
      .dash-bg .success-summary {
        background: var(--d-bg-soft);
        border-radius: 14px;
        padding: 16px 18px;
        margin-bottom: 22px;
        text-align: left;
      }
      .dash-bg .ss-row {
        display: flex; justify-content: space-between; gap: 10px;
        font-size: 13px;
        padding: 5px 0;
      }
      .dash-bg .ss-k {
        color: var(--d-ink-mute);
      }
      .dash-bg .ss-v {
        color: var(--d-ink);
        font-weight: 600;
      }
      .dash-bg .ss-v-right {
        text-align: right;
        max-width: 60%;
      }

      @media (max-width: 640px) {
        .dash-bg .agenda-grid { gap: 24px; }
        .dash-bg .timeline-col,
        .dash-bg .summary-col { position: static; }
        .dash-bg .calendar-card,
        .dash-bg .summary-card { padding: 22px 18px; }
        .dash-bg .timeline-label { padding-left: 0; }
      }
    `}</style>
  );
}
