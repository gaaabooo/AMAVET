'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ExamStatusBadge from '@/components/ExamStatusBadge';
import CitaStatusBadge from '@/components/CitaStatusBadge';
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
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!u || !token) { router.push('/login'); return; }
    const parsed = JSON.parse(u) as Usuario;
    if (parsed.rol !== 'ADMIN') { router.push('/dashboard'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuario(parsed);
    cargarDatos();
  }, [router, cargarDatos]);

  const actualizarEstadoCita = async (id: string, estado: EstadoCita) => {
    try {
      await api.patch(`/citas/${id}/estado`, { estado });
      mostrarMensaje('ok', `Cita marcada como ${estado.toLowerCase()}`);
      cargarDatos();
      setCitaSeleccionada(prev => (prev && prev.id === id ? { ...prev, estado } : prev));
    } catch (err) {
      mostrarMensaje('error', mensajeError(err, 'Error al actualizar la cita'));
    }
  };

  const mostrarMensaje = (tipo: 'ok' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  const SERVICIOS_CON_PDF = new Set([
    'Examen Hemograma', 'Examen T4', 'Examen TSH',
    'Perfil Bioquímico',
    'Test de Distemper', 'Test de leucemia', 'Test de Parvovirus', 'Test de SIDA Felino',
  ]);
  const esExamen = SERVICIOS_CON_PDF.has(uploadTipo);

  const subirResultado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadMascotaId || !uploadTipo) return;
    if (esExamen && !uploadArchivo) return;
    setSubiendo(true);
    try {
      if (esExamen && uploadArchivo) {
        // Servicio que requiere PDF: crear registro de examen y subir archivo
        const { data: examen } = await api.post('/examenes', { tipo: uploadTipo, mascotaId: uploadMascotaId });
        const formData = new FormData();
        formData.append('archivo', uploadArchivo);
        await api.post(`/examenes/${examen.id}/subir`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mostrarMensaje('ok', 'Resultado subido. El tutor fue notificado por correo.');
      } else {
        // Servicio sin PDF: crear registro de examen como marca de "atendido"
        // (no aparecerá en la vista Exámenes porque se filtra por SERVICIOS_EXAMEN)
        await api.post('/examenes', { tipo: uploadTipo, mascotaId: uploadMascotaId });
        mostrarMensaje('ok', 'Servicio registrado correctamente.');
      }
      setUploadMascotaId('');
      setUploadTipo('');
      setUploadArchivo(null);
      cargarDatos();
    } catch (err) {
      mostrarMensaje('error', mensajeError(err, 'Error al registrar el servicio'));
    } finally {
      setSubiendo(false);
    }
  };

  const actualizarEstado = async (id: string, estado: string) => {
    try {
      await api.patch(`/examenes/${id}/estado`, { estado });
      cargarDatos();
    } catch (err) {
      console.error(err);
    }
  };

  const borrarPdf = async (id: string) => {
    try {
      await api.patch(`/examenes/${id}/estado`, { estado: 'PENDIENTE', archivoUrl: null });
      mostrarMensaje('ok', 'PDF eliminado. El examen volvió a estado pendiente.');
      cargarDatos();
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

  // Solo cuentan como "exámenes" los servicios que requieren PDF
  const examenesReales = useMemo(
    () => examenes.filter(e => SERVICIOS_EXAMEN.has(e.tipo)),
    [examenes]
  );

  // Deduplicar: si una misma mascota tiene varios exámenes del mismo tipo creados
  // dentro de la misma cita (≤ 24h del más antiguo), conservar solo el más reciente.
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
      // lista viene ordenada desc por fecha; recorremos y agrupamos por ventana de 24h
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

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center bg-(--surface)">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-(--primary) flex flex-col fixed top-0 left-0 h-full z-10 font-[family-name:var(--font-manrope)]">

        <div className="px-6 py-5">
          <Logo size="sm" variant="dark" />
        </div>

        <div className="px-6 py-4 border-t border-b border-white/10">
          <p className="text-white font-semibold text-base">Panel de gestión</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <NavItem icon={<IconGrid />}     label="Dashboard"     active={vista === 'dashboard'}     onClick={() => setVista('dashboard')} />
          <NavItem icon={<IconPets />}     label="Mascotas"      active={vista === 'mascotas'}      onClick={() => setVista('mascotas')} />
          <NavItem icon={<IconExams />}    label="Exámenes"      active={vista === 'examenes'}      onClick={() => setVista('examenes')} />
          <NavItem icon={<IconCalendar />} label="Agenda"        active={vista === 'agenda'}        onClick={() => setVista('agenda')} />
          <NavItem icon={<IconSettings />} label="Configuración" active={vista === 'configuracion'} onClick={() => setVista('configuracion')} />
        </nav>


        <div className="border-t border-white/10 px-3 py-4 space-y-0.5">
          <NavItem icon={<IconHelp />}   label="Centro de ayuda" active={vista === 'ayuda'} onClick={() => setVista('ayuda')} />
          <NavItem icon={<IconLogout />} label="Cerrar sesión"  onClick={cerrarSesion} />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 ml-64 bg-(--surface) min-h-screen font-[family-name:var(--font-manrope)]">

        {/* Mensaje global */}
        {mensaje && (
          <div className="px-8 pt-6">
            <div
              role={mensaje.tipo === 'error' ? 'alert' : 'status'}
              aria-live={mensaje.tipo === 'error' ? 'assertive' : 'polite'}
              className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                mensaje.tipo === 'ok'
                  ? 'bg-(--tertiary-fixed) text-(--on-surface)'
                  : 'bg-(--error-container) text-(--on-surface)'
              }`}
            >
              <span className="flex-1">{mensaje.texto}</span>
              <button
                onClick={() => setMensaje(null)}
                aria-label="Cerrar mensaje"
                className="flex-shrink-0 text-(--on-surface-variant) hover:text-(--on-surface) leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {vista === 'dashboard' && (
          <DashboardView
            mascotas={mascotas}
            citas={citas}
            recentMascotas={recentMascotas}
            pendientes={pendientes}
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
            total={mascotas.length}
            orden={mascotaOrden}
            setOrden={setMascotaOrden}
            busqueda={mascotaBusqueda}
            setBusqueda={setMascotaBusqueda}
          />
        )}

        {vista === 'examenes' && (
          <ExamenesView
            examenes={examenesFiltrados}
            total={examenes.length}
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
  );
}


/* ──────────────────────────────────────────────────────────── */
/*  Vistas                                                      */
/* ──────────────────────────────────────────────────────────── */

interface DashboardViewProps {
  mascotas: Mascota[];
  citas: Cita[];
  recentMascotas: Mascota[];
  pendientes: number;
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
  mascotas, citas, recentMascotas, pendientes, citasHoy,
  uploadMascotaId, setUploadMascotaId, uploadTipo, setUploadTipo,
  uploadArchivo, setUploadArchivo, dragging, setDragging,
  subiendo, fileInputRef, subirResultado, actualizarEstadoCita,
}: DashboardViewProps) {
  const SERVICIOS_CON_PDF = new Set([
    'Examen Hemograma', 'Examen T4', 'Examen TSH',
    'Perfil Bioquímico',
    'Test de Distemper', 'Test de leucemia', 'Test de Parvovirus', 'Test de SIDA Felino',
  ]);
  const esExamen = SERVICIOS_CON_PDF.has(uploadTipo);

  // Servicios solicitados por la mascota seleccionada en sus citas activas (no canceladas)
  // que aún NO han sido registrados/atendidos por el admin
  const serviciosSolicitados: string[] = uploadMascotaId
    ? (() => {
        const mascota = (mascotas as Mascota[]).find(m => m.id === uploadMascotaId);
        const citasActivas = (citas as Cita[])
          .filter(c => c.mascotaId === uploadMascotaId && c.estado !== 'CANCELADA');
        const pendientes: string[] = [];
        for (const c of citasActivas) {
          for (const s of c.servicios) {
            if (SERVICIOS_CON_PDF.has(s)) {
              // Examen con PDF: solo mostrar si aún no tiene PDF subido
              const yaSubido = mascota?.examenes.some(ex =>
                ex.tipo === s && ex.estado === 'DISPONIBLE'
              );
              if (!yaSubido) pendientes.push(s);
            }
            // Servicios sin PDF (ej. Colocación de chips) no se registran desde aquí
          }
        }
        return Array.from(new Set(pendientes)).sort();
      })()
    : [];
  return (
    <div className="font-[family-name:var(--font-manrope)]">
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-(--on-surface)">Panel de control</h1>
        <p className="text-(--on-surface-variant) text-sm mt-1">Resumen de actividad y pacientes recientes.</p>
      </div>

      <div className="px-8 grid grid-cols-3 gap-4 mb-6">
        <StatCard title="PACIENTES ACTIVOS"   value={mascotas.length} sub="mascotas registradas" />
        <StatCard title="EXÁMENES PENDIENTES" value={pendientes}      sub="Requieren revisión" />
        <StatCard title="CITAS HOY"           value={citasHoy ?? 0}   sub={citasHoy === 1 ? 'Visita programada para hoy' : 'Visitas programadas para hoy'} primary />
      </div>

      <div className="px-8 pb-8 grid grid-cols-[300px_1fr] gap-6 items-start">

        {/* Quick Upload */}
        <div className="bg-(--surface-container-lowest) rounded-xl p-6">
          <h2 className="font-bold text-(--on-surface) mb-5 font-[family-name:var(--font-manrope)]">Subida Rápida</h2>
          <form onSubmit={subirResultado} className="space-y-4">

            <Field label="Seleccionar paciente">
              <select required value={uploadMascotaId}
                onChange={e => {
                  setUploadMascotaId(e.target.value);
                  setUploadTipo('');
                }}
                className="sv-input text-sm py-2">
                <option value="">Seleccionar paciente…</option>
                {mascotas.map((m: Mascota) => (
                  <option key={m.id} value={m.id}>{m.nombre} ({m.tutor?.nombre})</option>
                ))}
              </select>
            </Field>

            <Field label="Tipo de servicio / Examen">
              <select required value={uploadTipo}
                onChange={e => setUploadTipo(e.target.value)}
                disabled={!uploadMascotaId || serviciosSolicitados.length === 0}
                className="sv-input text-sm py-2 disabled:opacity-60 disabled:cursor-not-allowed">
                <option value="">
                  {!uploadMascotaId
                    ? 'Primero selecciona paciente'
                    : serviciosSolicitados.length === 0
                      ? 'Sin servicios solicitados'
                      : 'Seleccionar servicio…'}
                </option>
                {serviciosSolicitados.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {uploadMascotaId && serviciosSolicitados.length === 0 && (
                <p className="text-xs text-(--on-surface-variant) mt-1.5">
                  No hay exámenes con PDF pendientes para esta mascota.
                </p>
              )}
              {uploadMascotaId && serviciosSolicitados.length > 0 && (
                <p className="text-xs text-(--on-surface-variant) mt-1.5">
                  Solo se muestran los servicios solicitados por el tutor.
                </p>
              )}
            </Field>

            {esExamen && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e: React.DragEvent) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e: React.DragEvent) => {
                  e.preventDefault();
                  setDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file?.type === 'application/pdf') setUploadArchivo(file);
                }}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragging
                    ? 'border-(--primary) bg-(--surface)'
                    : 'border-(--outline-variant) hover:border-(--primary) hover:bg-(--surface)'
                }`}>
                {uploadArchivo ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-(--on-surface)">
                      <IconDoc />
                      {uploadArchivo.name}
                    </span>
                    <p className="text-xs text-(--on-surface-variant)">{(uploadArchivo.size / 1024).toFixed(0)} KB · listo para subir</p>
                  </div>
                ) : (
                  <div>
                    <div className="w-10 h-10 rounded-full bg-(--surface) flex items-center justify-center mx-auto mb-3">
                      <IconUpload />
                    </div>
                    <p className="text-sm text-(--on-surface-variant)">Arrastra el PDF aquí</p>
                    <p className="text-xs text-(--on-surface-variant) mt-1">o haz clic para explorar</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                  onChange={e => e.target.files && setUploadArchivo(e.target.files[0])} />
              </div>
            )}

            <button type="submit"
              disabled={subiendo || !uploadMascotaId || !uploadTipo || (esExamen && !uploadArchivo)}
              className="w-full bg-(--primary) hover:bg-(--primary-container) text-white py-2.5 rounded-lg font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed">
              {subiendo ? 'Procesando...' : esExamen ? 'Subir y publicar' : 'Registrar servicio'}
            </button>
          </form>
        </div>

        {/* Pacientes Recientes */}
        <div className="bg-(--surface-container-lowest) rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-(--outline-variant)">
            <h2 className="font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Pacientes recientes</h2>
            <p className="text-xs text-(--on-surface-variant) mt-1">Mascotas ordenadas por última actividad.</p>
          </div>
          <table className="w-full font-[family-name:var(--font-manrope)]">
            <thead>
              <tr className="bg-(--surface) border-b border-(--outline-variant)">
                <Th>Mascota / Tutor</Th>
                <Th>Tipo</Th>
                <Th>Última cita</Th>
                <Th>Estado de cita</Th>
                <Th>Estado de exámenes</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {recentMascotas.map((m: Mascota) => {
                const citasMascota = (citas as Cita[])
                  .filter(c => c.mascotaId === m.id)
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                const citaMasReciente = citasMascota[0];
                const examenesDeCita = citaMasReciente
                  ? citaMasReciente.servicios.filter(s => SERVICIOS_EXAMEN.has(s))
                  : [];
                return (
                  <tr key={m.id} className="border-b border-(--outline-variant) hover:bg-(--surface) transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar nombre={m.nombre} />
                        <div>
                          <p className="text-sm font-semibold text-(--on-surface)">{m.nombre}</p>
                          <p className="text-xs text-(--on-surface-variant)">{m.tutor?.nombre}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-(--on-surface-variant)">{m.tipo}</td>
                    <td className="px-4 py-4 text-sm text-(--on-surface-variant)">
                      {citaMasReciente ? fechaCorta(citaMasReciente.fecha) : 'Sin citas'}
                    </td>
                    <td className="px-4 py-4">
                      {citaMasReciente ? (
                        <CitaStatusBadge estado={citaMasReciente.estado} />
                      ) : <span className="text-xs text-(--on-surface-variant)">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {citaMasReciente && examenesDeCita.length === 0 && (
                        <span className="text-xs text-(--on-surface-variant)">Sin exámenes</span>
                      )}
                      {citaMasReciente && examenesDeCita.length > 0 && (
                        <ul className="space-y-1">
                          {examenesDeCita.map(tipoEx => {
                            const exsMismotipo = m.examenes.filter(e => e.tipo === tipoEx);
                            const cancelado = citaMasReciente.estado === 'CANCELADA';
                            const prioridad = (s: string) => s === 'DISPONIBLE' ? 2 : s === 'EN_PROCESO' ? 1 : 0;
                            const mejor = exsMismotipo.sort((a, b) => prioridad(b.estado) - prioridad(a.estado))[0];
                            const estadoChip = cancelado ? 'cancelado' : (mejor?.estado ?? 'PENDIENTE');
                            return (
                              <li key={tipoEx} className="flex items-center justify-between gap-2 text-xs text-(--on-surface)">
                                <span className="truncate">{tipoEx}</span>
                                <EstadoServicioChip estado={estadoChip} />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {!citaMasReciente && <span className="text-xs text-(--on-surface-variant)">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {citaMasReciente ? (
                        <>
                          <span className="sr-only">Cambiar estado de la cita de {m.nombre}</span>
                          <select
                            value={citaMasReciente.estado}
                            onChange={e => actualizarEstadoCita(citaMasReciente.id, e.target.value as EstadoCita)}
                            className="sv-input sv-select-compact"
                          >
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="CONFIRMADA">Confirmada</option>
                            <option value="COMPLETADA">Atendida</option>
                            <option value="CANCELADA">Cancelada</option>
                          </select>
                        </>
                      ) : <span className="text-xs text-(--on-surface-variant)">—</span>}
                    </td>
                  </tr>
                );
              })}
              {recentMascotas.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-(--on-surface-variant) text-sm">No hay mascotas registradas aún</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type MascotaOrden = 'fecha' | 'tipo' | 'atendido' | 'sin-atender';

interface MascotasViewProps {
  mascotas: Mascota[];
  total: number;
  orden: MascotaOrden;
  setOrden: (o: MascotaOrden) => void;
  busqueda: string;
  setBusqueda: (s: string) => void;
}

function MascotasView({ mascotas, total, orden, setOrden, busqueda, setBusqueda }: MascotasViewProps) {
  return (
    <div className="px-8 py-8 font-[family-name:var(--font-manrope)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Mascotas</h1>
        <p className="text-(--on-surface-variant) text-sm mt-1">{total} registradas · {mascotas.filter((m: Mascota) => fueAtendida(m)).length} atendidas</p>
      </div>

      {/* Filtros */}
      <div className="bg-(--surface-container-lowest) rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-72">
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, raza, tutor…"
            className="sv-input text-sm py-2" />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={orden === 'fecha'}        onClick={() => setOrden('fecha')}>Por fecha</FilterChip>
          <FilterChip active={orden === 'tipo'}         onClick={() => setOrden('tipo')}>Por tipo de animal</FilterChip>
          <FilterChip active={orden === 'atendido'}     onClick={() => setOrden('atendido')}>Atendidas primero</FilterChip>
          <FilterChip active={orden === 'sin-atender'}  onClick={() => setOrden('sin-atender')}>Sin atender primero</FilterChip>
        </div>
      </div>

      {/* Grid de mascotas */}
      {mascotas.length === 0 ? (
        <div className="bg-(--surface-container-lowest) rounded-xl p-12 text-center text-(--on-surface-variant)">
          <p className="text-sm">No se encontraron mascotas con esos criterios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 font-[family-name:var(--font-manrope)]">
          {mascotas.map((m: Mascota) => {
            const ue = ultimoExamen(m);
            const atendida = fueAtendida(m);
            return (
              <div key={m.id} className="bg-(--surface-container-lowest) rounded-xl p-5">
                <div className="flex items-start gap-4 mb-4">
                  <Avatar nombre={m.nombre} large />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">{m.nombre}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${atendida ? 'bg-(--tertiary-fixed) text-(--on-surface)' : 'bg-(--secondary-container) text-(--on-surface)'}`}>
                        {atendida ? 'Atendida' : 'Sin atender'}
                      </span>
                    </div>
                    <p className="text-sm text-(--on-surface-variant)">
                      {m.tipo}{m.raza ? ` · ${m.raza}` : ''}{m.edad != null ? ` · ${m.edad} años` : ''}
                    </p>
                    <p className="text-xs text-(--on-surface-variant) mt-0.5">Registrada el {fechaCorta(m.creadoEn)}</p>
                  </div>
                </div>
                <div className="border-t border-(--outline-variant) pt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-(--on-surface-variant) uppercase tracking-wider mb-1">Tutor</p>
                    <p className="text-(--on-surface) font-medium">{m.tutor?.nombre}</p>
                    <p className="text-xs text-(--on-surface-variant)">{m.tutor?.email}</p>
                    {m.tutor?.telefono && <p className="text-xs text-(--on-surface-variant)">{m.tutor.telefono}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-(--on-surface-variant) uppercase tracking-wider mb-1">Exámenes</p>
                    <p className="text-(--on-surface) font-medium">{m.examenes.length} en total</p>
                    {ue ? (
                      <div className="mt-1 flex items-center gap-2">
                        <ExamStatusBadge estado={ue.estado} />
                        <span className="text-xs text-(--on-surface-variant)">{fechaCorta(ue.creadoEn)}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-(--on-surface-variant)">Sin exámenes registrados</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type ExamenEstado = 'TODOS' | 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE';

interface ExamenesViewProps {
  examenes: Examen[];
  total: number;
  estado: ExamenEstado;
  setEstado: (e: ExamenEstado) => void;
  busqueda: string;
  setBusqueda: (s: string) => void;
  actualizarEstado: (id: string, estado: string) => void;
  borrarPdf: (id: string) => void;
}

function ExamenesView({ examenes, total, estado, setEstado, busqueda, setBusqueda, actualizarEstado, borrarPdf }: ExamenesViewProps) {
  return (
    <div className="px-8 py-8 font-[family-name:var(--font-manrope)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Exámenes</h1>
        <p className="text-(--on-surface-variant) text-sm mt-1">{total} exámenes en total</p>
      </div>

      <div className="bg-(--surface-container-lowest) rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por mascota, tutor o tipo de examen…"
            className="sv-input text-sm py-2" />
        </div>
        <FilterChip active={estado === 'TODOS'}      onClick={() => setEstado('TODOS')}>Todos</FilterChip>
        <FilterChip active={estado === 'PENDIENTE'}  onClick={() => setEstado('PENDIENTE')}>Pendientes</FilterChip>
        <FilterChip active={estado === 'EN_PROCESO'} onClick={() => setEstado('EN_PROCESO')}>En proceso</FilterChip>
        <FilterChip active={estado === 'DISPONIBLE'} onClick={() => setEstado('DISPONIBLE')}>Disponibles</FilterChip>
      </div>

      <div className="bg-(--surface-container-lowest) rounded-xl overflow-hidden">
        <table className="w-full font-[family-name:var(--font-manrope)]">
          <thead>
            <tr className="bg-(--surface) border-b border-(--outline-variant)">
              <Th>Mascota / Tutor</Th>
              <Th>Tipo de Examen</Th>
              <Th>Fecha</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {examenes.map((ex: Examen) => (
              <tr key={ex.id} className="border-b border-(--outline-variant) hover:bg-(--surface) transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar nombre={ex.mascota?.nombre || '?'} />
                    <div>
                      <p className="text-sm font-semibold text-(--on-surface)">{ex.mascota?.nombre}</p>
                      <p className="text-xs text-(--on-surface-variant)">{ex.mascota?.tutor?.nombre}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-(--on-surface)">{ex.tipo}</td>
                <td className="px-4 py-4 text-sm text-(--on-surface-variant)">{fechaCorta(ex.creadoEn)}</td>
                <td className="px-4 py-4"><ExamStatusBadge estado={ex.estado} /></td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="sr-only">Estado del examen</span>
                    <select value={ex.estado}
                      onChange={e => actualizarEstado(ex.id, e.target.value)}
                      className="sv-input sv-select-compact">
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_PROCESO">En proceso</option>
                      <option value="DISPONIBLE">Disponible</option>
                    </select>
                    {ex.archivoUrl && (
                      <>
                        <a href={ex.archivoUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', lineHeight: '1.5' }}
                          className="bg-(--primary) hover:bg-(--primary-container) text-white border border-(--primary) rounded-md font-semibold transition-colors duration-150 font-[family-name:var(--font-manrope)]">
                          Ver PDF
                        </a>
                        <button
                          onClick={() => { if (confirm('¿Eliminar el PDF y volver a estado pendiente?')) borrarPdf(ex.id); }}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem', lineHeight: '1.5' }}
                          className="border border-(--outline-variant) text-(--on-surface-variant) hover:text-(--primary) hover:border-(--primary) rounded-md font-semibold transition-colors duration-150 font-[family-name:var(--font-manrope)]">
                          Borrar PDF
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {examenes.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-(--on-surface-variant) text-sm">No hay exámenes con esos criterios.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ConfiguracionViewProps {
  usuario: Usuario | null;
  cerrarSesion: () => void;
  mostrarMensaje: (tipo: 'ok' | 'error', texto: string) => void;
}

function ConfiguracionView({ usuario, cerrarSesion, mostrarMensaje }: ConfiguracionViewProps) {
  const inicial = usuario?.nombre?.[0]?.toUpperCase() ?? '?';

  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [telefono, setTelefono] = useState(usuario?.telefono ?? '');
  const [foto, setFoto] = useState<string | null>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  const [pwdActual, setPwdActual] = useState('');
  const [pwdNueva, setPwdNueva] = useState('');
  const [pwdConfirma, setPwdConfirma] = useState('');
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirma, setVerConfirma] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNombre(usuario?.nombre ?? '');
    setTelefono(usuario?.telefono ?? '');
  }, [usuario]);

  const reqLargo = pwdNueva.length >= 8;
  const reqMayusMinus = /[A-Z]/.test(pwdNueva) && /[a-z]/.test(pwdNueva);
  const reqNumEspecial = /\d/.test(pwdNueva) && /[^A-Za-z0-9]/.test(pwdNueva);
  const pwdCoincide = pwdNueva.length > 0 && pwdNueva === pwdConfirma;
  const cambiandoPwd = pwdActual.length > 0 || pwdNueva.length > 0 || pwdConfirma.length > 0;
  const pwdValida = !cambiandoPwd || (pwdActual.length > 0 && reqLargo && reqMayusMinus && reqNumEspecial && pwdCoincide);

  const cambiosDetectados =
    nombre.trim() !== (usuario?.nombre ?? '').trim() ||
    telefono.trim() !== (usuario?.telefono ?? '').trim() ||
    foto !== null ||
    cambiandoPwd;

  const onSeleccionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      mostrarMensaje('error', 'La imagen supera 1 MB. Usa una más liviana.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => setFoto(typeof ev.target?.result === 'string' ? ev.target.result : null);
    reader.readAsDataURL(file);
  };

  const onCancelar = () => {
    setNombre(usuario?.nombre ?? '');
    setTelefono(usuario?.telefono ?? '');
    setFoto(null);
    setPwdActual('');
    setPwdNueva('');
    setPwdConfirma('');
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cambiandoPwd && !pwdValida) {
      mostrarMensaje('error', 'Revisa los requisitos de la contraseña antes de guardar.');
      return;
    }
    mostrarMensaje('ok', 'Cambios listos. La sincronización con servidor llegará en próximas versiones.');
  };

  return (
    <form onSubmit={onSubmit} className="px-8 py-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)] mb-1">Configuración del perfil</h1>
        <p
          className="text-(--on-surface-variant)"
          style={{ fontFamily: 'var(--font-newsreader)', fontSize: '1rem', lineHeight: 1.55 }}
        >
          Administra tu información personal y la seguridad de tu cuenta para mantener tu perfil actualizado.
        </p>
      </header>

      {/* Información personal */}
      <section className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-xl p-8 mb-6">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-(--outline-variant)">
          <IconBadge />
          <h2 className="text-lg font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Información personal</h2>
        </div>

        {/* Avatar + acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
          <div
            className="w-24 h-24 rounded-full bg-(--primary) text-white flex items-center justify-center font-bold text-3xl flex-shrink-0 font-[family-name:var(--font-manrope)] overflow-hidden border-4 border-(--surface)"
            aria-hidden
          >
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="" className="w-full h-full object-cover" />
            ) : (
              inicial
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                className="bg-(--primary) hover:bg-(--primary-container) text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 font-[family-name:var(--font-manrope)]"
              >
                Cambiar foto
              </button>
              <button
                type="button"
                onClick={() => setFoto(null)}
                disabled={!foto}
                className="border border-(--outline-variant) text-(--on-surface) hover:bg-(--surface-container-low) px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-manrope)]"
              >
                Eliminar
              </button>
            </div>
            <p className="text-xs text-(--on-surface-variant)">JPG, GIF o PNG. Máximo 1 MB.</p>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif"
              className="hidden"
              onChange={onSeleccionarFoto}
            />
          </div>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <div>
            <label
              htmlFor="config-nombre"
              className="block text-[10px] font-bold tracking-[0.15em] uppercase text-(--on-surface-variant) mb-1.5 font-[family-name:var(--font-manrope)]"
            >
              Nombre
            </label>
            <input
              id="config-nombre"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="sv-input"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label
              htmlFor="config-rol"
              className="block text-[10px] font-bold tracking-[0.15em] uppercase text-(--on-surface-variant) mb-1.5 font-[family-name:var(--font-manrope)]"
            >
              Rol
            </label>
            <input
              id="config-rol"
              type="text"
              value={usuario?.rol === 'ADMIN' ? 'Administradora' : usuario?.rol ?? ''}
              disabled
              className="sv-input cursor-not-allowed opacity-70"
            />
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="config-email"
              className="block text-[10px] font-bold tracking-[0.15em] uppercase text-(--on-surface-variant) mb-1.5 font-[family-name:var(--font-manrope)]"
            >
              Correo electrónico
            </label>
            <input
              id="config-email"
              type="email"
              value={usuario?.email ?? ''}
              disabled
              className="sv-input cursor-not-allowed opacity-70"
            />
            <p className="text-xs text-(--on-surface-variant) mt-1.5">El correo electrónico no se puede cambiar aquí. Contacta a soporte.</p>
          </div>
          <div className="sm:col-span-2">
            <label
              htmlFor="config-telefono"
              className="block text-[10px] font-bold tracking-[0.15em] uppercase text-(--on-surface-variant) mb-1.5 font-[family-name:var(--font-manrope)]"
            >
              Teléfono <span className="font-normal normal-case tracking-normal">(opcional)</span>
            </label>
            <input
              id="config-telefono"
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="sv-input"
              placeholder="+56 9 1234 5678"
            />
          </div>
        </div>
      </section>

      {/* Seguridad de la cuenta */}
      <section className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-xl p-8 mb-6">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-(--outline-variant)">
          <IconLock />
          <h2 className="text-lg font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Seguridad de la cuenta</h2>
        </div>

        <div className="space-y-5">
          <PasswordField
            id="config-pwd-actual"
            label="Contraseña actual"
            value={pwdActual}
            onChange={setPwdActual}
            visible={verActual}
            toggleVisible={() => setVerActual(v => !v)}
            autoComplete="current-password"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 pt-1">
            <PasswordField
              id="config-pwd-nueva"
              label="Nueva contraseña"
              value={pwdNueva}
              onChange={setPwdNueva}
              visible={verNueva}
              toggleVisible={() => setVerNueva(v => !v)}
              autoComplete="new-password"
            />
            <PasswordField
              id="config-pwd-confirma"
              label="Confirmar contraseña"
              value={pwdConfirma}
              onChange={setPwdConfirma}
              visible={verConfirma}
              toggleVisible={() => setVerConfirma(v => !v)}
              autoComplete="new-password"
              error={pwdConfirma.length > 0 && !pwdCoincide ? 'Las contraseñas no coinciden.' : undefined}
            />
          </div>

          <div className="bg-(--surface-container-low) border border-(--outline-variant) rounded-lg p-4 flex items-start gap-3 mt-2">
            <IconInfo />
            <div className="flex-1">
              <p className="font-semibold text-(--on-surface) text-sm mb-1.5 font-[family-name:var(--font-manrope)]">Requisitos de la contraseña</p>
              <ul className="space-y-1 text-sm text-(--on-surface-variant)">
                <ReqItem ok={reqLargo}>Mínimo 8 caracteres</ReqItem>
                <ReqItem ok={reqMayusMinus}>Al menos una letra mayúscula y una minúscula</ReqItem>
                <ReqItem ok={reqNumEspecial}>Al menos un número y un carácter especial</ReqItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sesión */}
      <section className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-xl p-8 mb-6">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-(--outline-variant)">
          <span className="w-8 h-px bg-(--primary)" aria-hidden />
          <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-(--primary) font-[family-name:var(--font-manrope)]">
            Sesión
          </h2>
        </div>
        <p
          className="text-(--on-surface-variant) mb-5"
          style={{ fontFamily: 'var(--font-newsreader)', fontSize: '1rem', lineHeight: 1.55 }}
        >
          Cierra tu sesión para proteger tu cuenta cuando termines de trabajar.
        </p>
        <button
          type="button"
          onClick={cerrarSesion}
          className="border border-(--outline-variant) text-(--on-surface) hover:bg-(--surface-container-low) hover:border-(--primary) hover:text-(--primary) px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 font-[family-name:var(--font-manrope)]"
        >
          Cerrar sesión
        </button>
      </section>

      {/* Footer de acciones */}
      <div className="flex justify-end gap-3 pt-4 border-t border-(--outline-variant)">
        <button
          type="button"
          onClick={onCancelar}
          disabled={!cambiosDetectados}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold text-(--on-surface) hover:bg-(--surface-container-low) transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-manrope)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!cambiosDetectados || (cambiandoPwd && !pwdValida)}
          className="bg-(--primary) hover:bg-(--primary-container) text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-manrope)]"
        >
          Guardar cambios
        </button>
      </div>
    </form>
  );
}

function PasswordField({
  id, label, value, onChange, visible, toggleVisible, autoComplete, error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  toggleVisible: () => void;
  autoComplete: string;
  error?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-bold tracking-[0.15em] uppercase text-(--on-surface-variant) mb-1.5 font-[family-name:var(--font-manrope)]"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="sv-input pr-10"
        />
        <button
          type="button"
          onClick={toggleVisible}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-(--on-surface-muted) hover:text-(--primary) p-1.5 rounded transition-colors duration-150"
        >
          {visible ? <IconEyeOff /> : <IconEye />}
        </button>
      </div>
      {error && <p className="text-xs text-(--error) mt-1.5">{error}</p>}
    </div>
  );
}

function ReqItem({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-0.5 flex-shrink-0 ${ok ? 'text-(--primary)' : 'text-(--on-surface-muted)'}`}
        aria-hidden
      >
        {ok ? (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" fill="currentColor" />
          </svg>
        )}
      </span>
      <span className={ok ? 'text-(--on-surface)' : ''}>{children}</span>
    </li>
  );
}

function AgendaView({ citas, mascotas, mesActual, setMesActual, citaSeleccionada, setCitaSeleccionada, actualizarEstadoCita }: {
  citas: Cita[];
  mascotas: Mascota[];
  mesActual: Date;
  setMesActual: (d: Date) => void;
  citaSeleccionada: Cita | null;
  setCitaSeleccionada: (c: Cita | null) => void;
  actualizarEstadoCita: (id: string, estado: EstadoCita) => void;
}) {
  const año = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const primerDia = new Date(año, mes, 1).getDay();
  const offset = (primerDia + 6) % 7;
  const diasMes = new Date(año, mes + 1, 0).getDate();

  const citasMes = citas.filter(c => {
    const f = new Date(c.fecha);
    return f.getFullYear() === año && f.getMonth() === mes;
  });

  const citasPorDia = new Map<number, Cita[]>();
  for (const c of citasMes) {
    const dia = new Date(c.fecha).getDate();
    const list = citasPorDia.get(dia) ?? [];
    list.push(c);
    citasPorDia.set(dia, list);
  }
  for (const list of citasPorDia.values()) {
    list.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  const hoy = new Date();
  const esHoy = (dia: number) => hoy.getFullYear() === año && hoy.getMonth() === mes && hoy.getDate() === dia;

  const stats = {
    confirmadas: citasMes.filter(c => c.estado === 'CONFIRMADA').length,
    pendientes: citasMes.filter(c => c.estado === 'PENDIENTE').length,
    hoy: citasMes.filter(c => {
      const f = new Date(c.fecha);
      return f.getDate() === hoy.getDate() && f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
    }).length,
    completadas: citasMes.filter(c => c.estado === 'COMPLETADA').length,
  };

  const nombreMes = mesActual.toLocaleDateString('es-CL', { month: 'long' });
  const fechaHoyLarga = hoy.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });

  const mesAnterior = () => setMesActual(new Date(año, mes - 1, 1));
  const mesSiguiente = () => setMesActual(new Date(año, mes + 1, 1));
  const irHoy = () => setMesActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const cells: ({ dia: number } | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= diasMes; d++) cells.push({ dia: d });

  return (
    <div className="px-8 py-8 font-[family-name:var(--font-manrope)]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--on-surface)">Agenda de visitas</h1>
          <p className="text-(--on-surface-variant) text-sm mt-1">
            Gestión de consultas domiciliarias · Hoy es {fechaHoyLarga}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-(--surface-container-lowest) rounded-lg border border-(--outline-variant) p-1 items-center gap-1">
            <button
              onClick={mesAnterior}
              aria-label="Mes anterior"
              className="px-2 py-1 text-(--on-surface-variant) hover:text-(--primary) leading-none"
            >
              ‹
            </button>
            <button
              onClick={irHoy}
              aria-live="polite"
              className="px-4 py-1.5 text-sm font-semibold text-(--on-surface) hover:bg-(--surface) rounded capitalize"
            >
              {nombreMes}
            </button>
            <button
              onClick={mesSiguiente}
              aria-label="Mes siguiente"
              className="px-2 py-1 text-(--on-surface-variant) hover:text-(--primary) leading-none"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        {/* Calendar */}
        <div className="flex-1 bg-(--surface-container-lowest) rounded-xl border border-(--outline-variant) overflow-hidden">
          <div className="grid grid-cols-7 border-b border-(--outline-variant) bg-(--surface)">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="py-3 text-center text-[10px] font-bold tracking-widest uppercase text-(--on-surface-variant)">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              if (!cell) return <div key={idx} className="h-32 border-r border-b border-(--outline-variant) bg-(--surface)/30 last:border-r-0"></div>;
              const dia = cell.dia;
              const citasDia = citasPorDia.get(dia) ?? [];
              const hoyCell = esHoy(dia);
              return (
                <div key={idx}
                  className={`h-32 border-r border-b border-(--outline-variant) p-2 flex flex-col gap-1 last:border-r-0 ${hoyCell ? 'ring-2 ring-(--primary) ring-inset bg-white relative z-10' : ''}`}>
                  <span className={`text-xs font-bold ${hoyCell ? 'text-(--primary)' : 'text-(--on-surface-variant)'}`}>
                    {String(dia).padStart(2, '0')}
                  </span>
                  <div className="flex flex-col gap-1 overflow-y-auto">
                    {citasDia.slice(0, 3).map(c => (
                      <button key={c.id} onClick={() => setCitaSeleccionada(c)}
                        className={`text-left p-1.5 rounded text-[10px] cursor-pointer hover:brightness-95 transition truncate ${estiloCitaCalendario(c.estado)} ${citaSeleccionada?.id === c.id ? 'ring-2 ring-offset-1 ring-(--primary)' : ''}`}>
                        <p className="font-bold truncate">{horaCorta(c.fecha)} · {c.mascota.nombre}</p>
                        <p className="opacity-80 truncate">{c.servicios.length > 1 ? `${c.servicios.length} servicios` : c.servicios[0]}</p>
                      </button>
                    ))}
                    {citasDia.length > 3 && (
                      <span className="text-[10px] text-(--on-surface-variant) px-1">+{citasDia.length - 3} más</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Side Panel */}
        <aside className="w-80 bg-(--surface-container-lowest) rounded-xl border border-(--outline-variant) p-6 flex flex-col gap-4 sticky top-6">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Detalles de la cita</h3>
            {citaSeleccionada && (
              <button onClick={() => setCitaSeleccionada(null)} className="text-(--on-surface-variant) hover:text-(--on-surface) text-lg leading-none">×</button>
            )}
          </div>

          {!citaSeleccionada ? (
            <div className="text-center py-8 text-(--on-surface-variant) text-sm">
              <div className="w-12 h-12 rounded-full bg-(--surface) flex items-center justify-center mx-auto mb-3">
                <IconCalendar />
              </div>
              <p>Selecciona una cita del calendario para ver sus detalles.</p>
            </div>
          ) : (
            <>
              {/* Encabezado tipo tarjeta */}
              <div className="border border-(--outline-variant) rounded-lg overflow-hidden">
                <div className="bg-(--surface) px-4 py-3 border-b border-(--outline-variant)">
                  <h4 className="font-bold text-lg text-(--on-surface) font-[family-name:var(--font-manrope)]">{citaSeleccionada.mascota.nombre}</h4>
                </div>
                <div className="px-4 py-3 space-y-2 text-sm">
                  <CitaCardRow label="Tipo animal" value={citaSeleccionada.mascota.tipo} />
                  <CitaCardRow label="Cita agendada" value={fechaCortaCita(citaSeleccionada.fecha)} />
                  <CitaCardRow label="Hora" value={horaCorta(citaSeleccionada.fecha)} />
                  <CitaCardRow
                    label="Estado de cita"
                    value={<CitaStatusBadge estado={citaSeleccionada.estado} />}
                  />
                  <div>
                    <p className="text-(--on-surface-variant) text-xs mb-1.5">Servicios solicitados:</p>
                    <ul className="space-y-1.5">
                      {citaSeleccionada.servicios.map(s => {
                        const estado = estadoServicio(s, citaSeleccionada, mascotas);
                        return (
                          <li key={s} className="flex items-center justify-between gap-2 text-sm text-(--on-surface)">
                            <span className="truncate">{s}</span>
                            <EstadoServicioChip estado={estado} />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tutor + Dirección */}
              <div className="space-y-2 text-xs border-t border-(--outline-variant) pt-3">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-(--on-surface-variant)">Tutor</span>
                  <p className="text-(--on-surface) mt-0.5">
                    <span className="font-medium">{citaSeleccionada.mascota.tutor.nombre}</span>
                    <span className="text-(--on-surface-variant)"> · {citaSeleccionada.mascota.tutor.telefono}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-(--on-surface-variant)">Dirección</span>
                  <p className="text-(--on-surface) mt-0.5">{citaSeleccionada.direccion}</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-(--outline-variant)">
                {citaSeleccionada.estado === 'PENDIENTE' && (
                  <>
                    <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'CANCELADA')}
                      className="border border-(--outline-variant) text-(--on-surface) py-2 rounded-lg font-semibold text-xs hover:bg-(--surface) transition">
                      Cancelar
                    </button>
                    <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'CONFIRMADA')}
                      className="bg-(--primary) text-white py-2 rounded-lg font-semibold text-xs hover:bg-(--primary-container) transition">
                      Confirmar
                    </button>
                  </>
                )}
                {citaSeleccionada.estado === 'CONFIRMADA' && (
                  <>
                    <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'CANCELADA')}
                      className="border border-(--outline-variant) text-(--on-surface) py-2 rounded-lg font-semibold text-xs hover:bg-(--surface) transition">
                      Cancelar
                    </button>
                    <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'COMPLETADA')}
                      className="bg-(--primary) text-white py-2 rounded-lg font-semibold text-xs hover:bg-(--primary-container) transition">
                      Atendida
                    </button>
                  </>
                )}
                {(citaSeleccionada.estado === 'COMPLETADA' || citaSeleccionada.estado === 'CANCELADA') && (
                  <button onClick={() => actualizarEstadoCita(citaSeleccionada.id, 'PENDIENTE')}
                    className="col-span-2 border border-(--outline-variant) text-(--on-surface) py-2 rounded-lg font-semibold text-xs hover:bg-(--surface) transition">
                    Reabrir como pendiente
                  </button>
                )}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        <StatMini label="CONFIRMADAS"  value={stats.confirmadas}  tone="confirmada" />
        <StatMini label="PENDIENTES"   value={stats.pendientes}   tone="pendiente" />
        <StatMini label="VISITAS HOY"  value={stats.hoy}          tone="hoy" />
        <StatMini label="COMPLETADAS"  value={stats.completadas}  tone="completada" />
      </div>

      {/* Leyenda de estados */}
      <div className="bg-(--surface-container-lowest) rounded-xl border border-(--outline-variant) px-6 py-5 mt-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-(--on-surface-variant) mb-4">Estados de cita</p>
        <div className="flex flex-wrap gap-3">
          <LegendItem tone="pendiente"   label="Pendiente"   hint="Aún sin confirmar" />
          <LegendItem tone="confirmada"  label="Confirmada"  hint="Lista para visitar" />
          <LegendItem tone="completada"  label="Completada"  hint="Atención registrada" />
          <LegendItem tone="cancelada"   label="Cancelada"   hint="No se realizará" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ tone, label, hint }: { tone: EstadoTone; label: string; hint: string }) {
  const styles = TONE_STYLES[tone];
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-(--outline-variant)">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${styles.dot}`} aria-hidden />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-(--on-surface)">{label}</span>
        <span className="text-[10px] text-(--on-surface-variant)">{hint}</span>
      </div>
    </div>
  );
}

function CitaCardRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-(--on-surface-variant) text-xs">{label}:</span>
      <span className="text-(--on-surface) text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function fechaCortaCita(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

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

type EstadoTone = 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'hoy';

const TONE_STYLES: Record<EstadoTone, { dot: string; cell: string; statBg: string; statText: string; statLabel: string; isInverted?: boolean }> = {
  pendiente: {
    dot: 'bg-(--secondary-container)',
    cell: 'bg-(--secondary-container)/35 text-(--on-surface) ring-1 ring-(--secondary-container)',
    statBg: 'bg-(--surface-container-lowest) border-(--outline-variant)',
    statText: 'text-(--on-surface)',
    statLabel: 'text-(--on-surface-variant)',
  },
  confirmada: {
    dot: 'bg-(--tertiary-fixed)',
    cell: 'bg-(--tertiary-fixed)/45 text-(--on-surface) ring-1 ring-(--tertiary-fixed)',
    statBg: 'bg-(--surface-container-lowest) border-(--outline-variant)',
    statText: 'text-(--on-surface)',
    statLabel: 'text-(--on-surface-variant)',
  },
  completada: {
    dot: 'bg-(--primary)',
    cell: 'bg-(--primary)/10 text-(--on-surface) ring-1 ring-(--primary)/30',
    statBg: 'bg-(--primary) border-(--primary)',
    statText: 'text-white',
    statLabel: 'text-white/70',
    isInverted: true,
  },
  cancelada: {
    dot: 'bg-(--on-surface-muted)',
    cell: 'bg-(--surface-container-high) text-(--on-surface-muted) ring-1 ring-(--outline-variant) line-through opacity-70',
    statBg: 'bg-(--surface-container-lowest) border-(--outline-variant)',
    statText: 'text-(--on-surface)',
    statLabel: 'text-(--on-surface-variant)',
  },
  hoy: {
    dot: 'bg-(--primary)',
    cell: '',
    statBg: 'bg-(--surface-container-lowest) border-(--primary)',
    statText: 'text-(--primary)',
    statLabel: 'text-(--primary)',
  },
};

function StatMini({ label, value, tone }: { label: string; value: number; tone: EstadoTone }) {
  const styles = TONE_STYLES[tone];
  return (
    <div className={`p-5 rounded-xl border ${styles.statBg}`}>
      <p className={`text-[10px] font-bold tracking-widest mb-2 ${styles.statLabel}`}>{label}</p>
      <p className={`text-3xl font-bold font-[family-name:var(--font-manrope)] ${styles.statText}`}>{String(value).padStart(2, '0')}</p>
    </div>
  );
}

function estiloCitaCalendario(estado: EstadoCita): string {
  const tone: EstadoTone =
    estado === 'CANCELADA' ? 'cancelada' :
    estado === 'COMPLETADA' ? 'completada' :
    estado === 'CONFIRMADA' ? 'confirmada' :
    'pendiente';
  return TONE_STYLES[tone].cell;
}

function horaCorta(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function AyudaView() {
  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)] mb-1">Centro de ayuda</h1>
        <p className="text-(--on-surface-variant) text-sm">Soporte y respuestas rápidas para Silvestra Vet.</p>
      </header>

      {/* FAQ */}
      <section className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-xl p-8 mb-6">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-(--outline-variant)">
          <span className="w-8 h-px bg-(--primary)" aria-hidden />
          <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-(--primary) font-[family-name:var(--font-manrope)]">
            Preguntas frecuentes
          </h2>
        </div>
        <div className="divide-y divide-(--outline-variant)">
          <Faq q="¿Cómo subo un examen?"
               a="Desde el Dashboard, en la sección «Subida Rápida», selecciona el paciente, elige el tipo de examen y arrastra el PDF. Al hacer clic en «Subir y publicar» el tutor recibe un correo automático." />
          <Faq q="¿Qué significan los estados de un examen?"
               a="Pendiente: aún no se ha procesado. En proceso: en análisis. Disponible: el resultado está listo y el tutor ya fue notificado." />
          <Faq q="¿Cómo cambio el estado de una cita?"
               a="En la Agenda, selecciona la cita en el calendario y usa los botones del panel lateral. En el Dashboard puedes hacerlo directamente desde la tabla de pacientes recientes." />
          <Faq q="¿Puedo eliminar o editar un examen?"
               a="Por ahora solo puedes cambiar su estado desde la tabla de exámenes. La edición y eliminación llegarán en próximas versiones." />
        </div>
      </section>

      {/* Contacto */}
      <section className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-xl p-8">
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-(--outline-variant)">
          <span className="w-8 h-px bg-(--primary)" aria-hidden />
          <h2 className="text-[11px] font-bold tracking-[0.15em] uppercase text-(--primary) font-[family-name:var(--font-manrope)]">
            Contacto de soporte
          </h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          <div className="min-w-0">
            <dt className="text-[10px] font-bold tracking-[0.15em] uppercase text-(--on-surface-variant) mb-1.5 font-[family-name:var(--font-manrope)]">
              Correo
            </dt>
            <dd>
              <a
                href="mailto:gabriel.munoz.r99@gmail.com"
                className="text-(--primary) font-semibold hover:underline underline-offset-4 break-all font-[family-name:var(--font-manrope)]"
              >
                gabriel.munoz.r99@gmail.com
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold tracking-[0.15em] uppercase text-(--on-surface-variant) mb-1.5 font-[family-name:var(--font-manrope)]">
              Horario
            </dt>
            <dd className="text-(--on-surface) font-medium">Lunes a viernes, 9:00 a 18:00 hrs</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Subcomponentes                                              */
/* ──────────────────────────────────────────────────────────── */

function NavItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition text-left ${active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function StatCard({ title, value, sub, primary = false }: { title: string; value: string | number; sub: string; primary?: boolean }) {
  return (
    <div className={`rounded-xl p-5 font-[family-name:var(--font-manrope)] ${primary ? 'bg-(--primary)' : 'bg-(--surface-container-lowest)'}`}>
      <p className={`text-xs font-semibold tracking-widest mb-3 ${primary ? 'text-white/70' : 'text-(--on-surface-variant)'}`}>{title}</p>
      <p className={`text-4xl font-bold mb-1 ${primary ? 'text-white' : 'text-(--on-surface)'}`}>{value}</p>
      <p className={`text-xs ${primary ? 'text-white/70' : 'text-(--on-surface-variant)'}`}>{sub}</p>
    </div>
  );
}

function Avatar({ nombre, large = false }: { nombre: string; large?: boolean }) {
  const size = large ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  return (
    <div className={`${size} rounded-full bg-(--surface-container-high) flex items-center justify-center font-bold text-(--on-surface-variant) flex-shrink-0 font-[family-name:var(--font-manrope)]`}>
      {nombre?.[0]?.toUpperCase() ?? '?'}
    </div>
  );
}

function FilterChip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
        active
          ? 'bg-(--primary) text-white'
          : 'border border-(--outline-variant) text-(--on-surface-variant) hover:bg-(--surface)'
      }`}>
      {children}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-4 py-3 text-xs font-semibold text-(--on-surface-variant) uppercase tracking-wider first:pl-6">{children}</th>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-(--on-surface-variant) tracking-widest uppercase mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function EstadoServicioChip({ estado }: { estado: 'DISPONIBLE' | 'PENDIENTE' | 'EN_PROCESO' | 'cancelado' }) {
  if (estado === 'DISPONIBLE') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-(--tertiary-fixed) text-(--on-tertiary-fixed)" style={{ letterSpacing: '0.05em' }}>
        Disponible
      </span>
    );
  }
  if (estado === 'EN_PROCESO') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800" style={{ letterSpacing: '0.05em' }}>
        En proceso
      </span>
    );
  }
  if (estado === 'cancelado') {
    return (
      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-(--surface-container-high) text-(--on-surface-muted)" style={{ letterSpacing: '0.05em' }}>
        Cancelado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-(--secondary-container) text-(--on-secondary-container)" style={{ letterSpacing: '0.05em' }}>
      Pendiente
    </span>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <p className="font-semibold text-(--on-surface) mb-1.5 font-[family-name:var(--font-manrope)]">{q}</p>
      <p
        className="text-(--on-surface-variant)"
        style={{ fontFamily: 'var(--font-newsreader)', fontSize: '1rem', lineHeight: 1.55 }}
      >
        {a}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Iconos                                                      */
/* ──────────────────────────────────────────────────────────── */

function IconGrid()     { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>; }
function IconPets()     { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3a2 2 0 100 4 2 2 0 000-4zM15 3a2 2 0 100 4 2 2 0 000-4zM4 8a2 2 0 100 4 2 2 0 000-4zM20 8a2 2 0 100 4 2 2 0 000-4zM12 12c-3.5 0-6 2-6 4.5C6 19 8.5 21 12 21s6-2 6-4.5C18 14 15.5 12 12 12z"/></svg>; }
function IconExams()    { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>; }
function IconCalendar() { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>; }
function IconSettings() { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>; }
function IconHelp()     { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>; }
function IconLogout()   { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>; }
function IconUpload()   { return <svg className="w-5 h-5 text-(--on-surface-variant)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>; }
function IconDoc()      { return <svg className="w-4 h-4 text-(--primary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>; }
function IconBadge()    { return <svg className="w-6 h-6 text-(--primary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0M9 14a3 3 0 116 0M9 14h6"/></svg>; }
function IconLock()     { return <svg className="w-6 h-6 text-(--primary)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0-1.657 1.343-3 3-3s3 1.343 3 3v3h-6v-3zm0 0V7a4 4 0 10-8 0v4M5 14h14a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6a1 1 0 011-1z"/></svg>; }
function IconInfo()     { return <svg className="w-5 h-5 flex-shrink-0 text-(--primary) mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8h.01M11 12h1v4h1"/></svg>; }
function IconEye()      { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>; }
function IconEyeOff()   { return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88"/></svg>; }
