'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Logo from '@/components/Logo';

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  raza?: string;
  edad?: number;
}

const SERVICIOS = [
  'Colocación de chips',
  'Control Médico',
  'Curación de heridas',
  'Examen Hemograma',
  'Examen T4',
  'Examen TSH',
  'Perfil Bioquímico',
  'Test de Distemper',
  'Test de leucemia',
  'Test de Parvovirus',
  'Test de SIDA Felino',
];

const HORAS = ['09:00', '10:30', '12:00', '14:30', '16:00', '17:30'];

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_SEMANA_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_SEMANA_CORTO = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

export default function AgendarVisita() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
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
  const [paso, setPaso] = useState<1 | 2>(1);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!u || !token) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(u);
    setUsuario(parsed);
    cargarMascotas(parsed.id);
  }, []);

  const cargarMascotas = async (tutorId: string) => {
    try {
      const res = await api.get(`/mascotas/tutor/${tutorId}`);
      setMascotas(res.data);
      if (res.data.length > 0) setMascotaSeleccionada(res.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const toggleServicio = (servicio: string) => {
    setServiciosSeleccionados(prev =>
      prev.includes(servicio) ? prev.filter(s => s !== servicio) : [...prev, servicio]
    );
  };

  const puedeAvanzar =
    !!mascotaSeleccionada && serviciosSeleccionados.length > 0 && direccion.trim().length > 0;

  const puedeConfirmar = !!fechaSeleccionada && !!horaSeleccionada;

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo agendar la cita. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-(--surface) font-[family-name:var(--font-manrope)]">
        <nav className="bg-(--surface-container-lowest) border-b border-(--outline-variant) px-6 py-4">
          <Logo size="sm" variant="light" />
        </nav>
        <div className="max-w-[1200px] mx-auto px-8 py-12 animate-pulse space-y-8">
          <div className="h-16 w-80 rounded-xl bg-(--surface-container-lowest)" />
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-8 h-96 rounded-2xl bg-(--surface-container-lowest)" />
            <div className="col-span-4 h-96 rounded-2xl bg-(--surface-container-lowest)" />
          </div>
        </div>
      </div>
    );
  }

  if (exito) {
    return (
      <main className="min-h-screen bg-(--surface) font-[family-name:var(--font-manrope)] flex items-center justify-center p-6">
        <div className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-2xl p-10 max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-2xl bg-(--tertiary-fixed) flex items-center justify-center mx-auto mb-5 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-(--on-surface) mb-2" style={{ letterSpacing: '-0.01em' }}>
            Visita{' '}
            <span className="font-light italic" style={{ fontFamily: 'var(--font-newsreader)', color: 'var(--primary)' }}>
              agendada
            </span>
          </h1>
          <p className="text-(--on-surface-variant) text-sm mb-6">
            Recibimos tu solicitud. Te confirmaremos la cita por correo pronto.
          </p>
          <div className="bg-(--surface) rounded-xl p-4 text-left text-sm space-y-2 mb-6 border border-(--outline-variant)">
            <div className="flex justify-between">
              <span className="text-(--on-surface-muted)">Mascota</span>
              <span className="font-semibold text-(--on-surface)">{mascotas.find(m => m.id === mascotaSeleccionada)?.nombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--on-surface-muted)">Cita</span>
              <span className="font-semibold text-(--on-surface)">{fechaResumen}, {horaResumen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-(--on-surface-muted)">Dirección</span>
              <span className="font-semibold text-(--on-surface) text-right max-w-[60%]">{direccion}</span>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard')}
            className="w-full bg-(--primary) hover:bg-[#1b4332] text-white py-3 rounded-xl font-semibold text-sm transition-colors duration-150">
            Volver al inicio
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--surface) font-[family-name:var(--font-manrope)]">
      <nav className="bg-(--surface-container-lowest) border-b border-(--outline-variant) px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.push('/dashboard')} aria-label="Ir al dashboard">
          <Logo size="sm" variant="light" />
        </button>
        <div className="flex items-center gap-4">
          <span className="text-(--on-surface-variant) text-sm hidden sm:inline">
            Hola, <span className="font-semibold text-(--on-surface)">{usuario?.nombre}</span>
          </span>
          <button onClick={cerrarSesion} className="text-sm font-medium text-(--on-surface-muted) hover:text-(--primary) transition-colors duration-150 py-2 px-1">
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-10">
        <header className="mb-8">
          <button onClick={() => router.push('/dashboard')}
            className="text-sm font-medium text-(--on-surface-muted) hover:text-(--primary) mb-4 inline-flex items-center gap-1 transition-colors duration-150">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Mis mascotas
          </button>
          <span className="block text-[11px] font-bold uppercase tracking-[0.15em] text-(--primary) mb-2">
            Nueva visita
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-(--on-surface) leading-tight" style={{ letterSpacing: '-0.015em' }}>
            Agenda una{' '}
            <span className="font-light italic" style={{ fontFamily: 'var(--font-newsreader)', color: 'var(--primary)' }}>
              visita a domicilio
            </span>
          </h1>
        </header>

        {mascotas.length === 0 ? (
          <div className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-(--surface-container-low) flex items-center justify-center mx-auto mb-4 text-2xl">🐾</div>
            <p className="text-(--on-surface) font-semibold mb-2">Aún no tienes mascotas registradas</p>
            <p className="text-(--on-surface-variant) text-sm mb-5">Registra una mascota antes de agendar una visita.</p>
            <button onClick={() => router.push('/dashboard')}
              className="bg-(--primary) hover:bg-[#1b4332] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors duration-150">
              Ir al inicio
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            {/* ── Formulario ── */}
            <div className="col-span-12 lg:col-span-8 space-y-10">

              {/* Paso 1 */}
              <section className={paso === 1 ? '' : 'opacity-50 pointer-events-none'}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-7 h-7 rounded-full bg-(--primary) text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <h2 className="text-lg font-bold text-(--on-surface)">Elige los servicios</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-(--on-surface-muted) uppercase tracking-widest mb-1.5">
                      Mascota
                    </label>
                    <select
                      value={mascotaSeleccionada}
                      onChange={e => setMascotaSeleccionada(e.target.value)}
                      disabled={paso !== 1}
                      className="sv-input">
                      {mascotas.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} — {m.tipo}{m.raza ? ` · ${m.raza}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-(--on-surface-muted) uppercase tracking-widest mb-1.5">
                      Dirección de la visita
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={e => setDireccion(e.target.value)}
                      disabled={paso !== 1}
                      placeholder="Calle, número, comuna"
                      className="sv-input" />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-(--on-surface-muted) uppercase tracking-widest mb-3">Servicios</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SERVICIOS.map(servicio => {
                      const seleccionado = serviciosSeleccionados.includes(servicio);
                      return (
                        <label
                          key={servicio}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                            seleccionado
                              ? 'border-(--primary) bg-(--surface-container-low)'
                              : 'border-(--outline-variant) bg-(--surface-container-lowest) hover:border-(--primary)'
                          } ${paso !== 1 ? 'pointer-events-none' : ''}`}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-150 ${
                            seleccionado ? 'bg-(--primary) border-(--primary)' : 'border-(--outline-variant)'
                          }`}>
                            {seleccionado && (
                              <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                                <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => toggleServicio(servicio)}
                            className="sr-only" />
                          <span className={`text-sm font-medium ${seleccionado ? 'text-(--on-surface)' : 'text-(--on-surface-variant)'}`}>
                            {servicio}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {paso === 1 && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setPaso(2)}
                      disabled={!puedeAvanzar}
                      className="bg-(--primary) hover:bg-[#1b4332] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
                      Siguiente
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="inline ml-1.5 -mt-px">
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </section>

              {/* Paso 2 */}
              <section className={paso === 2 ? '' : 'opacity-50 pointer-events-none'}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-7 h-7 rounded-full bg-(--primary) text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <h2 className="text-lg font-bold text-(--on-surface)">Elige fecha y hora</h2>
                </div>

                <div className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Calendario */}
                    <div className="p-6 border-b md:border-b-0 md:border-r border-(--outline-variant)">
                      <div className="flex items-center justify-between mb-5">
                        <span className="text-sm font-bold text-(--on-surface)">
                          {NOMBRES_MES[mesActual.getMonth()]} {mesActual.getFullYear()}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={mesAnterior}
                            className="w-8 h-8 flex items-center justify-center hover:bg-(--surface-container-low) rounded-lg transition-colors duration-150 text-(--on-surface-variant)">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          <button onClick={mesSiguiente}
                            className="w-8 h-8 flex items-center justify-center hover:bg-(--surface-container-low) rounded-lg transition-colors duration-150 text-(--on-surface-variant)">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                              <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {DIAS_SEMANA_CORTO.map(d => (
                          <div key={d} className="text-[10px] font-bold text-(--on-surface-muted) uppercase tracking-wider py-1">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {celdasCalendario.map((cell, idx) => {
                          if (!cell) return <div key={idx} />;
                          const seleccionado =
                            fechaSeleccionada &&
                            fechaSeleccionada.getFullYear() === cell.fecha.getFullYear() &&
                            fechaSeleccionada.getMonth() === cell.fecha.getMonth() &&
                            fechaSeleccionada.getDate() === cell.fecha.getDate();
                          if (cell.pasado) {
                            return (
                              <div key={idx} className="aspect-square flex items-center justify-center text-xs text-(--surface-container-highest) rounded-lg">
                                {cell.dia}
                              </div>
                            );
                          }
                          return (
                            <button
                              key={idx}
                              onClick={() => seleccionarFecha(cell.fecha)}
                              className={`aspect-square flex items-center justify-center text-xs font-semibold rounded-lg transition-colors duration-150 ${
                                seleccionado
                                  ? 'bg-(--primary) text-white'
                                  : 'text-(--on-surface) hover:bg-(--surface-container-low)'
                              }`}>
                              {cell.dia}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bloques horarios */}
                    <div className="p-6">
                      <p className="text-sm font-bold text-(--on-surface) mb-4">Bloques disponibles</p>
                      {!fechaSeleccionada ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-10 h-10 rounded-xl bg-(--surface-container-low) flex items-center justify-center text-xl mb-3">📅</div>
                          <p className="text-sm text-(--on-surface-muted)">Selecciona una fecha primero</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {HORAS.map(hora => {
                            const seleccionada = horaSeleccionada === hora;
                            return (
                              <button
                                key={hora}
                                onClick={() => setHoraSeleccionada(hora)}
                                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors duration-150 ${
                                  seleccionada
                                    ? 'bg-(--primary) text-white border-(--primary)'
                                    : 'border-(--outline-variant) text-(--on-surface) hover:border-(--primary) hover:bg-(--surface-container-low)'
                                }`}>
                                {hora}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-5 flex items-start gap-2.5 p-3.5 bg-(--surface-container-low) rounded-xl border border-(--outline-variant)">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="text-(--on-surface-muted) mt-0.5 flex-shrink-0">
                          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                          <path d="M7 6v4M7 4.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                        </svg>
                        <p className="text-xs text-(--on-surface-muted) leading-relaxed">
                          Duración estimada de 45 a 60 minutos según los servicios.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-5">
                  <button
                    onClick={() => setPaso(1)}
                    className="text-sm font-semibold text-(--on-surface-muted) hover:text-(--primary) transition-colors duration-150 inline-flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Volver
                  </button>
                  <button
                    onClick={confirmar}
                    disabled={!puedeConfirmar || enviando}
                    className="bg-(--primary) hover:bg-[#1b4332] text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
                    {enviando ? 'Agendando…' : 'Confirmar cita'}
                  </button>
                </div>
              </section>
            </div>

            {/* ── Sidebar Resumen ── */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="sticky top-10">
                <section className="bg-(--primary) text-white rounded-2xl p-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/60 mb-1">
                    Tu solicitud
                  </p>
                  <h3 className="text-xl font-bold mb-6">
                    Resumen
                  </h3>

                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Mascota</p>
                      <p className="text-sm font-semibold">
                        {mascotas.find(m => m.id === mascotaSeleccionada)?.nombre || <span className="text-white/50 font-normal italic">Sin seleccionar</span>}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1.5">Servicios</p>
                      {serviciosSeleccionados.length === 0 ? (
                        <p className="text-sm text-white/50 italic font-normal">Ninguno seleccionado</p>
                      ) : (
                        <ul className="space-y-1">
                          {serviciosSeleccionados.map(s => (
                            <li key={s} className="text-sm flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 rounded-full bg-white/50 flex-shrink-0" aria-hidden="true" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {direccion.trim() && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Dirección</p>
                        <p className="text-sm">{direccion.trim()}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Cita</p>
                      <p className="text-sm font-semibold">
                        {fechaResumen && horaResumen
                          ? `${fechaResumen}, ${horaResumen}`
                          : <span className="text-white/50 font-normal italic">Sin programar</span>}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-(--error-container) text-(--on-error-container) text-xs p-3 rounded-lg mt-5">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 pt-5 border-t border-white/15">
                    <button
                      onClick={confirmar}
                      disabled={!puedeAvanzar || !puedeConfirmar || enviando}
                      className="w-full bg-(--secondary-container) hover:brightness-95 text-(--on-surface) py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed">
                      {enviando ? 'Agendando…' : 'Confirmar agendamiento'}
                    </button>
                    <p className="text-center text-[10px] text-white/40 mt-3">
                      Sin pago previo requerido.
                    </p>
                  </div>
                </section>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
