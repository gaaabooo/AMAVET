'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
    return <div className="min-h-screen flex items-center justify-center text-(--on-surface)">Cargando...</div>;
  }

  if (exito) {
    return (
      <main className="min-h-screen bg-(--surface) flex items-center justify-center p-6">
        <div className="bg-(--surface-container-lowest) rounded-2xl border border-(--outline-variant) p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-(--primary) flex items-center justify-center mx-auto mb-5">
            <span className="text-(--on-primary) text-3xl leading-none">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-(--on-surface) mb-2">¡Visita agendada!</h1>
          <p className="text-(--on-surface-variant) text-sm mb-6">
            Hemos recibido tu solicitud. La clínica confirmará tu cita pronto y te avisará por correo.
          </p>
          <div className="bg-(--surface) rounded-xl p-4 text-left text-sm space-y-1.5 mb-6">
            <p><span className="text-(--on-surface-variant)">Mascota:</span> <span className="font-medium text-(--on-surface)">{mascotas.find(m => m.id === mascotaSeleccionada)?.nombre}</span></p>
            <p><span className="text-(--on-surface-variant)">Cita:</span> <span className="font-medium text-(--on-surface)">{fechaResumen}, {horaResumen}</span></p>
            <p><span className="text-(--on-surface-variant)">Dirección:</span> <span className="font-medium text-(--on-surface)">{direccion}</span></p>
          </div>
          <button onClick={() => router.push('/dashboard')}
            className="w-full bg-(--primary) hover:bg-(--primary-container) text-(--on-primary) py-3 rounded-xl font-semibold text-sm transition">
            Volver al dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-(--surface)">
      <nav className="bg-(--surface-container-lowest) border-b border-(--outline-variant) px-6 py-4 flex justify-between items-center">
        <button onClick={() => router.push('/dashboard')} className="font-bold text-(--primary) text-xl">
          AMAVET
        </button>
        <div className="flex items-center gap-4">
          <span className="text-(--on-surface-variant) text-sm">Hola, {usuario?.nombre}</span>
          <button onClick={cerrarSesion} className="text-sm text-(--error) hover:underline">Cerrar sesión</button>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto p-10">
        <header className="mb-10">
          <button onClick={() => router.push('/dashboard')}
            className="text-sm text-(--on-surface-variant) hover:text-(--primary) mb-3 inline-flex items-center gap-1">
            ← Volver al dashboard
          </button>
          <h1 className="text-4xl font-bold text-(--primary) mb-2 font-[family-name:var(--font-manrope)] tracking-tight">
            Agendar Nueva Visita
          </h1>
          <p className="text-lg text-(--on-surface-variant)">
            Complete los pasos a continuación para coordinar la atención médica domiciliaria de su mascota.
          </p>
        </header>

        {mascotas.length === 0 ? (
          <div className="bg-(--surface-container-lowest) rounded-xl border border-(--outline-variant) p-10 text-center">
            <p className="text-(--on-surface) font-semibold mb-2">Aún no tienes mascotas registradas</p>
            <p className="text-(--on-surface-variant) text-sm mb-5">Necesitas registrar al menos una mascota antes de agendar una visita.</p>
            <button onClick={() => router.push('/dashboard')}
              className="bg-(--primary) hover:bg-(--primary-container) text-(--on-primary) px-5 py-2.5 rounded-lg font-semibold text-sm transition">
              Ir al dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            {/* ── Formulario ── */}
            <div className="col-span-12 lg:col-span-8 space-y-12">
              {/* Paso 1 */}
              <section className={paso === 1 ? '' : 'opacity-60'}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-8 rounded-full bg-(--primary) text-(--on-primary) flex items-center justify-center font-bold">1</span>
                  <h2 className="text-2xl font-semibold text-(--primary) font-[family-name:var(--font-manrope)]">Seleccionar Servicios</h2>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-(--on-surface-variant) mb-2">
                      Mascota
                    </label>
                    <select
                      value={mascotaSeleccionada}
                      onChange={e => setMascotaSeleccionada(e.target.value)}
                      disabled={paso !== 1}
                      className="w-full bg-(--surface-container-lowest) border border-(--outline-variant) rounded-xl px-4 py-3 text-sm text-(--on-surface) focus:outline-none focus:ring-2 focus:ring-(--primary)">
                      {mascotas.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} — {m.tipo}{m.raza ? ` · ${m.raza}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold tracking-widest uppercase text-(--on-surface-variant) mb-2">
                      Dirección de la visita
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={e => setDireccion(e.target.value)}
                      disabled={paso !== 1}
                      placeholder="Calle, número, comuna"
                      className="w-full bg-(--surface-container-lowest) border border-(--outline-variant) rounded-xl px-4 py-3 text-sm text-(--on-surface) placeholder-(--on-surface-variant) focus:outline-none focus:ring-2 focus:ring-(--primary)" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SERVICIOS.map(servicio => {
                    const seleccionado = serviciosSeleccionados.includes(servicio);
                    return (
                      <label
                        key={servicio}
                        className={`p-5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                          seleccionado
                            ? 'border-(--primary) bg-(--primary)/5'
                            : 'border-(--outline-variant) bg-(--surface-container-lowest) hover:border-(--primary)'
                        } ${paso !== 1 ? 'pointer-events-none' : ''}`}>
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => toggleServicio(servicio)}
                          className="w-5 h-5 mt-0.5 accent-(--primary) cursor-pointer" />
                        <div className="flex-1">
                          <h4 className="font-bold text-(--primary) text-sm">{servicio}</h4>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {paso === 1 && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setPaso(2)}
                      disabled={!puedeAvanzar}
                      className="bg-(--primary) hover:bg-(--primary-container) text-(--on-primary) px-6 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed">
                      Siguiente →
                    </button>
                  </div>
                )}
              </section>

              {/* Paso 2 */}
              <section className={paso === 2 ? '' : 'opacity-60 pointer-events-none'}>
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-8 h-8 rounded-full bg-(--primary) text-(--on-primary) flex items-center justify-center font-bold">2</span>
                  <h2 className="text-2xl font-semibold text-(--primary) font-[family-name:var(--font-manrope)]">Fecha y Hora</h2>
                </div>

                <div className="bg-(--surface-container-lowest) rounded-xl border border-(--outline-variant) overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Calendario */}
                    <div className="p-8 border-b md:border-b-0 md:border-r border-(--outline-variant)">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-(--primary)">
                          {NOMBRES_MES[mesActual.getMonth()]} {mesActual.getFullYear()}
                        </h4>
                        <div className="flex gap-1">
                          <button onClick={mesAnterior}
                            className="p-2 hover:bg-(--surface-container-low) rounded-full transition text-(--on-surface)">
                            ‹
                          </button>
                          <button onClick={mesSiguiente}
                            className="p-2 hover:bg-(--surface-container-low) rounded-full transition text-(--on-surface)">
                            ›
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-(--on-surface-variant) uppercase tracking-widest mb-3">
                        {DIAS_SEMANA_CORTO.map(d => <div key={d}>{d}</div>)}
                      </div>

                      <div className="grid grid-cols-7 gap-2 text-center">
                        {celdasCalendario.map((cell, idx) => {
                          if (!cell) return <div key={idx} className="p-2"></div>;
                          const seleccionado =
                            fechaSeleccionada &&
                            fechaSeleccionada.getFullYear() === cell.fecha.getFullYear() &&
                            fechaSeleccionada.getMonth() === cell.fecha.getMonth() &&
                            fechaSeleccionada.getDate() === cell.fecha.getDate();
                          if (cell.pasado) {
                            return (
                              <div key={idx} className="p-2 text-(--outline-variant) text-sm">
                                {cell.dia}
                              </div>
                            );
                          }
                          return (
                            <button
                              key={idx}
                              onClick={() => seleccionarFecha(cell.fecha)}
                              className={`p-2 text-sm font-semibold rounded-lg cursor-pointer transition ${
                                seleccionado
                                  ? 'bg-(--primary) text-(--on-primary)'
                                  : 'text-(--on-surface) hover:bg-(--primary-fixed) hover:text-(--primary)'
                              }`}>
                              {cell.dia}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bloques horarios */}
                    <div className="p-8 bg-(--surface-container-lowest)">
                      <h4 className="font-bold text-(--primary) mb-5">Bloques Disponibles</h4>
                      {!fechaSeleccionada ? (
                        <p className="text-sm text-(--on-surface-variant)">
                          Selecciona una fecha para ver los bloques horarios disponibles.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {HORAS.map(hora => {
                            const seleccionada = horaSeleccionada === hora;
                            return (
                              <button
                                key={hora}
                                onClick={() => setHoraSeleccionada(hora)}
                                className={`px-4 py-3 rounded-xl font-semibold text-sm transition border ${
                                  seleccionada
                                    ? 'bg-(--primary-container) text-(--on-primary) border-(--primary-container) shadow-md'
                                    : 'border-(--outline-variant) text-(--primary) hover:border-(--primary) hover:bg-(--primary-fixed)'
                                }`}>
                                {hora}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-6 flex items-start gap-3 p-4 bg-(--primary)/5 rounded-xl border border-(--primary)/10">
                        <span className="text-(--primary) text-base leading-none mt-0.5">ℹ</span>
                        <p className="text-xs text-(--primary)">
                          La visita tiene una duración estimada de 45 a 60 minutos según el servicio seleccionado.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <button
                    onClick={() => setPaso(1)}
                    className="text-sm font-semibold text-(--on-surface-variant) hover:text-(--primary) transition">
                    ← Volver
                  </button>
                  <button
                    onClick={confirmar}
                    disabled={!puedeConfirmar || enviando}
                    className="bg-(--primary) hover:bg-(--primary-container) text-(--on-primary) px-6 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed">
                    {enviando ? 'Agendando...' : 'Confirmar'}
                  </button>
                </div>
              </section>
            </div>

            {/* ── Sidebar Resumen ── */}
            <aside className="col-span-12 lg:col-span-4">
              <div className="sticky top-10">
                <section className="bg-(--primary) text-(--on-primary) rounded-2xl p-8 shadow-xl">
                  <h3 className="text-2xl font-semibold mb-6 font-[family-name:var(--font-manrope)]">
                    Resumen
                  </h3>

                  <div className="space-y-5 mb-8">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-(--on-primary)/70 mb-1">Mascota</p>
                      <p className="font-medium">
                        {mascotas.find(m => m.id === mascotaSeleccionada)?.nombre || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-(--on-primary)/70 mb-1">Servicios</p>
                      {serviciosSeleccionados.length === 0 ? (
                        <p className="text-(--on-primary)/70 text-sm italic">Ninguno seleccionado</p>
                      ) : (
                        <ul className="space-y-0.5">
                          {serviciosSeleccionados.map(s => (
                            <li key={s} className="font-medium text-sm">{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-(--on-primary)/70 mb-1">Cita</p>
                      <p className="font-medium">
                        {fechaResumen && horaResumen
                          ? `${fechaResumen}, ${horaResumen}`
                          : <span className="text-(--on-primary)/70 italic font-normal">Sin programar</span>}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-(--on-primary)/70 mb-1">Dirección</p>
                      <p className="font-medium text-sm">
                        {direccion.trim() || <span className="text-(--on-primary)/70 italic font-normal">No especificada</span>}
                      </p>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-(--error-container) text-(--on-error-container) text-xs p-3 rounded-lg mb-4">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={confirmar}
                    disabled={!puedeAvanzar || !puedeConfirmar || enviando}
                    className="w-full bg-(--secondary-container) text-(--on-surface) py-4 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition shadow-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
                    <span>{enviando ? 'Agendando...' : 'Confirmar Agendamiento'}</span>
                    <span className="text-xs font-normal opacity-80">Sin pago previo requerido</span>
                  </button>

                  <p className="text-center text-xs text-(--on-primary)/70 mt-4">
                    Al confirmar, aceptas nuestras políticas de cancelación y términos de servicio.
                  </p>
                </section>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
