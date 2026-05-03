'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ExamStatusBadge from '@/components/ExamStatusBadge';

interface Tutor {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  creadoEn: string;
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
  const [usuario, setUsuario] = useState<any>(null);
  const [vista, setVista] = useState<Vista>('dashboard');
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [tutores, setTutores] = useState<Tutor[]>([]);
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

  const [modalNuevaMascota, setModalNuevaMascota] = useState(false);
  const [nuevaMascota, setNuevaMascota] = useState({ tutorId: '', nombre: '', tipo: '', raza: '', edad: '' });

  const [citas, setCitas] = useState<Cita[]>([]);
  const [mesActual, setMesActual] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!u || !token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (parsed.rol !== 'ADMIN') { router.push('/dashboard'); return; }
    setUsuario(parsed);
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
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
      console.error(err);
    } finally {
      setCargando(false);
    }
    try {
      const tutoresRes = await api.get('/usuarios/tutores');
      setTutores(tutoresRes.data);
    } catch {
      // el endpoint de tutores puede no estar disponible aún
    }
  };

  const actualizarEstadoCita = async (id: string, estado: EstadoCita) => {
    try {
      await api.patch(`/citas/${id}/estado`, { estado });
      mostrarMensaje('ok', `✅ Cita marcada como ${estado.toLowerCase()}`);
      cargarDatos();
      setCitaSeleccionada(prev => (prev && prev.id === id ? { ...prev, estado } : prev));
    } catch (err: any) {
      mostrarMensaje('error', `❌ ${err.response?.data?.message || 'Error al actualizar la cita'}`);
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
        mostrarMensaje('ok', '✅ Resultado subido — el tutor fue notificado por correo');
      } else {
        // Servicio sin PDF: crear registro de examen como marca de "atendido"
        // (no aparecerá en la vista Exámenes porque se filtra por SERVICIOS_EXAMEN)
        await api.post('/examenes', { tipo: uploadTipo, mascotaId: uploadMascotaId });
        mostrarMensaje('ok', '✅ Servicio registrado correctamente');
      }
      setUploadMascotaId('');
      setUploadTipo('');
      setUploadArchivo(null);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', `❌ ${err.response?.data?.message || 'Error al registrar el servicio'}`);
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
      mostrarMensaje('ok', '🗑️ PDF eliminado — el examen volvió a estado pendiente');
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', `❌ ${err.response?.data?.message || 'Error al eliminar el PDF'}`);
    }
  };

  const crearMascota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaMascota.tutorId || !nuevaMascota.nombre || !nuevaMascota.tipo) return;
    try {
      await api.post('/mascotas', {
        nombre: nuevaMascota.nombre,
        tipo: nuevaMascota.tipo,
        raza: nuevaMascota.raza || undefined,
        edad: nuevaMascota.edad ? Number(nuevaMascota.edad) : undefined,
        tutorId: nuevaMascota.tutorId,
      });
      mostrarMensaje('ok', '✅ Mascota registrada correctamente');
      setNuevaMascota({ tutorId: '', nombre: '', tipo: '', raza: '', edad: '' });
      setModalNuevaMascota(false);
      cargarDatos();
    } catch (err: any) {
      mostrarMensaje('error', `❌ ${err.response?.data?.message || 'Error al crear la mascota'}`);
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
      <aside className="w-60 bg-(--primary) flex flex-col fixed top-0 left-0 h-full z-10">

        <div className="px-6 py-5">
          <span className="font-bold text-white text-xl font-[family-name:var(--font-manrope)]">AMAVET</span>
        </div>

        <div className="px-6 py-4 border-t border-b border-white/10">
          <p className="text-white font-semibold text-sm">{usuario?.nombre || 'Dra. Amavet'}</p>
          <p className="text-white/50 text-xs mt-0.5">Clinical Excellence</p>
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
      <main className="flex-1 ml-60 bg-(--surface) min-h-screen">

        {/* Mensaje global */}
        {mensaje && (
          <div className="px-8 pt-6">
            <div className={`p-3 rounded-lg text-sm ${mensaje.tipo === 'ok' ? 'bg-(--tertiary-fixed) text-(--on-surface)' : 'bg-(--error-container) text-(--on-surface)'}`}>
              {mensaje.texto}
            </div>
          </div>
        )}

        {vista === 'dashboard' && (
          <DashboardView
            usuario={usuario}
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
            actualizarEstado={actualizarEstado}
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
            onNueva={() => setModalNuevaMascota(true)}
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

        {vista === 'configuracion' && <ConfiguracionView usuario={usuario} cerrarSesion={cerrarSesion} />}
        {vista === 'ayuda' && <AyudaView />}
      </main>

      {/* Modal Nueva Mascota */}
      {modalNuevaMascota && (
        <div className="fixed inset-0 bg-black/40 z-20 flex items-center justify-center p-4" onClick={() => setModalNuevaMascota(false)}>
          <div className="bg-(--surface-container-lowest) rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-xl text-(--on-surface) mb-1 font-[family-name:var(--font-manrope)]">Nueva Mascota</h2>
            <p className="text-sm text-(--on-surface-variant) mb-5">Registra una mascota asociada a un tutor existente.</p>
            <form onSubmit={crearMascota} className="space-y-4">
              <Field label="Tutor">
                <select required value={nuevaMascota.tutorId}
                  onChange={e => setNuevaMascota({ ...nuevaMascota, tutorId: e.target.value })}
                  className="w-full border border-(--outline-variant) rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 bg-white">
                  <option value="">Seleccionar tutor...</option>
                  {tutores.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre} — {t.email}</option>
                  ))}
                </select>
                {tutores.length === 0 && (
                  <p className="text-xs text-(--on-surface-variant) mt-1">No hay tutores registrados aún.</p>
                )}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre">
                  <Input required value={nuevaMascota.nombre} onChange={e => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })} placeholder="Max" />
                </Field>
                <Field label="Tipo de animal">
                  <Input required value={nuevaMascota.tipo} onChange={e => setNuevaMascota({ ...nuevaMascota, tipo: e.target.value })} placeholder="Perro" />
                </Field>
                <Field label="Raza (opcional)">
                  <Input value={nuevaMascota.raza} onChange={e => setNuevaMascota({ ...nuevaMascota, raza: e.target.value })} placeholder="Labrador" />
                </Field>
                <Field label="Edad (opcional)">
                  <Input type="number" value={nuevaMascota.edad} onChange={e => setNuevaMascota({ ...nuevaMascota, edad: e.target.value })} placeholder="3" />
                </Field>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalNuevaMascota(false)}
                  className="flex-1 border border-(--outline-variant) text-(--on-surface) py-2.5 rounded-lg font-medium text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={!nuevaMascota.tutorId || !nuevaMascota.nombre || !nuevaMascota.tipo}
                  className="flex-1 bg-(--primary) hover:bg-(--primary-container) text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  Registrar mascota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Vistas                                                      */
/* ──────────────────────────────────────────────────────────── */

function DashboardView({
  usuario, mascotas, citas, recentMascotas, pendientes, citasHoy,
  uploadMascotaId, setUploadMascotaId, uploadTipo, setUploadTipo,
  uploadArchivo, setUploadArchivo, dragging, setDragging,
  subiendo, fileInputRef, subirResultado, actualizarEstado, actualizarEstadoCita,
}: any) {
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
            // Para servicios sin PDF: si ya hay un Examen del mismo tipo creado después de la cita, ya fue registrado
            // Para servicios con PDF: si ya hay un Examen del mismo tipo con archivoUrl creado después de la cita, ya fue subido
            const yaRegistrado = mascota?.examenes.some(ex => {
              if (ex.tipo !== s) return false;
              if (new Date(ex.creadoEn) < new Date(c.creadoEn)) return false;
              if (SERVICIOS_CON_PDF.has(s)) return ex.estado === 'DISPONIBLE';
              return true;
            });
            if (!yaRegistrado) pendientes.push(s);
          }
        }
        return Array.from(new Set(pendientes)).sort();
      })()
    : [];
  return (
    <>
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Panel de Control</h1>
        <p className="text-(--on-surface-variant) text-sm mt-1">Resumen de actividad y pacientes recientes.</p>
      </div>

      <div className="px-8 grid grid-cols-3 gap-4 mb-6">
        <StatCard title="PACIENTES ACTIVOS"   value={mascotas.length} sub="mascotas registradas" />
        <StatCard title="EXÁMENES PENDIENTES" value={pendientes}      sub="Requieren revisión" />
        <StatCard title="CITAS HOY"           value={citasHoy ?? 0}   sub={citasHoy === 1 ? 'Visita programada para hoy' : 'Visitas programadas para hoy'} primary />
      </div>

      <div className="px-8 pb-8 grid grid-cols-[320px_1fr] gap-6 items-start">

        {/* Quick Upload */}
        <div className="bg-(--surface-container-lowest) rounded-xl p-6">
          <h2 className="font-bold text-(--on-surface) mb-5 font-[family-name:var(--font-manrope)]">↑ Subida Rápida</h2>
          <form onSubmit={subirResultado} className="space-y-4">

            <Field label="Seleccionar paciente">
              <select required value={uploadMascotaId}
                onChange={e => {
                  setUploadMascotaId(e.target.value);
                  setUploadTipo('');
                }}
                className="w-full border border-(--outline-variant) rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 bg-white">
                <option value="">Buscar mascota o tutor...</option>
                {mascotas.map((m: Mascota) => (
                  <option key={m.id} value={m.id}>{m.nombre} ({m.tutor?.nombre})</option>
                ))}
              </select>
            </Field>

            <Field label="Tipo de servicio / Examen">
              <select required value={uploadTipo}
                onChange={(e: any) => setUploadTipo(e.target.value)}
                disabled={!uploadMascotaId || serviciosSolicitados.length === 0}
                className="w-full border border-(--outline-variant) rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) text-(--on-surface) bg-white disabled:bg-(--surface) disabled:cursor-not-allowed">
                <option value="">
                  {!uploadMascotaId
                    ? 'Selecciona un paciente primero...'
                    : serviciosSolicitados.length === 0
                      ? 'Sin servicios solicitados'
                      : 'Seleccionar servicio...'}
                </option>
                {serviciosSolicitados.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {uploadMascotaId && serviciosSolicitados.length === 0 && (
                <p className="text-xs text-(--on-surface-variant) mt-1.5">
                  Esta mascota no tiene servicios solicitados en citas activas.
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
                  <div>
                    <p className="text-sm font-medium text-(--on-surface)">📄 {uploadArchivo.name}</p>
                    <p className="text-xs text-(--on-surface-variant) mt-1">{(uploadArchivo.size / 1024).toFixed(0)} KB · listo para subir</p>
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
            <h2 className="font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Pacientes Recientes</h2>
            <p className="text-xs text-(--on-surface-variant) mt-1">Mascotas ordenadas por última actividad.</p>
          </div>
          <table className="w-full">
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
                        <CitaEstadoBadge estado={citaMasReciente.estado} />
                      ) : <span className="text-xs text-(--on-surface-variant)">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {citaMasReciente && examenesDeCita.length === 0 && (
                        <span className="text-xs text-(--on-surface-variant)">Sin exámenes</span>
                      )}
                      {citaMasReciente && examenesDeCita.length > 0 && (
                        <ul className="space-y-1">
                          {examenesDeCita.map(tipoEx => {
                            const exsMismotipo = m.examenes.filter(e => e.tipo === tipoEx && new Date(e.creadoEn) >= new Date(citaMasReciente.creadoEn));
                            const subido = exsMismotipo.some(e => e.estado === 'DISPONIBLE');
                            const cancelado = citaMasReciente.estado === 'CANCELADA';
                            const icono = cancelado ? '❌' : subido ? '✅' : '⏸️';
                            return (
                              <li key={tipoEx} className="flex items-center justify-between gap-2 text-xs text-(--on-surface)">
                                <span>{tipoEx}</span>
                                <span className="flex-shrink-0 text-sm leading-none">{icono}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      {!citaMasReciente && <span className="text-xs text-(--on-surface-variant)">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      {citaMasReciente ? (
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => actualizarEstadoCita(citaMasReciente.id, 'COMPLETADA')}
                            disabled={citaMasReciente.estado === 'COMPLETADA'}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            Atendido
                          </button>
                          <button
                            onClick={() => actualizarEstadoCita(citaMasReciente.id, 'PENDIENTE')}
                            disabled={citaMasReciente.estado === 'PENDIENTE'}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            Pospuesto
                          </button>
                          <button
                            onClick={() => actualizarEstadoCita(citaMasReciente.id, 'CANCELADA')}
                            disabled={citaMasReciente.estado === 'CANCELADA'}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            Cancelado
                          </button>
                        </div>
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
    </>
  );
}

function MascotasView({ mascotas, total, orden, setOrden, busqueda, setBusqueda, onNueva }: any) {
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Mascotas</h1>
        <p className="text-(--on-surface-variant) text-sm mt-1">{total} registradas — {mascotas.filter((m: Mascota) => fueAtendida(m)).length} atendidas</p>
      </div>

      {/* Filtros */}
      <div className="bg-(--surface-container-lowest) rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, raza, tutor..."
            className="w-full border border-(--outline-variant) rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 bg-white" />
        </div>
        <FilterChip active={orden === 'fecha'}        onClick={() => setOrden('fecha')}>Por fecha</FilterChip>
        <FilterChip active={orden === 'tipo'}         onClick={() => setOrden('tipo')}>Por tipo de animal</FilterChip>
        <FilterChip active={orden === 'atendido'}     onClick={() => setOrden('atendido')}>Atendidas primero</FilterChip>
        <FilterChip active={orden === 'sin-atender'}  onClick={() => setOrden('sin-atender')}>Sin atender primero</FilterChip>
      </div>

      {/* Grid de mascotas */}
      {mascotas.length === 0 ? (
        <div className="bg-(--surface-container-lowest) rounded-xl p-12 text-center text-(--on-surface-variant)">
          <p className="text-sm">No se encontraron mascotas con esos criterios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
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

function ExamenesView({ examenes, total, estado, setEstado, busqueda, setBusqueda, actualizarEstado, borrarPdf }: any) {
  const conteo = (e: string) => total > 0 ? examenes.filter((x: Examen) => estado === 'TODOS' ? true : x.estado === e).length : 0;
  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Exámenes</h1>
        <p className="text-(--on-surface-variant) text-sm mt-1">{total} exámenes en total</p>
      </div>

      <div className="bg-(--surface-container-lowest) rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por mascota, tutor o tipo de examen..."
            className="w-full border border-(--outline-variant) rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 bg-white" />
        </div>
        <FilterChip active={estado === 'TODOS'}      onClick={() => setEstado('TODOS')}>Todos</FilterChip>
        <FilterChip active={estado === 'PENDIENTE'}  onClick={() => setEstado('PENDIENTE')}>Pendientes</FilterChip>
        <FilterChip active={estado === 'EN_PROCESO'} onClick={() => setEstado('EN_PROCESO')}>En proceso</FilterChip>
        <FilterChip active={estado === 'DISPONIBLE'} onClick={() => setEstado('DISPONIBLE')}>Disponibles</FilterChip>
      </div>

      <div className="bg-(--surface-container-lowest) rounded-xl overflow-hidden">
        <table className="w-full">
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
                  <div className="flex items-center gap-2">
                    <select value={ex.estado}
                      onChange={e => actualizarEstado(ex.id, e.target.value)}
                      className="border border-(--outline-variant) rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-(--primary) text-gray-900 bg-white">
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="EN_PROCESO">En Proceso</option>
                      <option value="DISPONIBLE">Disponible</option>
                    </select>
                    {ex.archivoUrl && (
                      <>
                        <a href={ex.archivoUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs bg-(--primary) hover:bg-(--primary-container) text-white px-3 py-1 rounded-lg transition">
                          Ver PDF
                        </a>
                        <button
                          onClick={() => { if (confirm('¿Eliminar el PDF y volver a estado pendiente?')) borrarPdf(ex.id); }}
                          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition">
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

function ConfiguracionView({ usuario, cerrarSesion }: { usuario: any; cerrarSesion: () => void }) {
  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)] mb-1">Configuración</h1>
      <p className="text-(--on-surface-variant) text-sm mb-6">Información de tu cuenta y preferencias.</p>

      <div className="bg-(--surface-container-lowest) rounded-xl p-6 mb-4">
        <h2 className="font-bold text-(--on-surface) mb-4">Mi cuenta</h2>
        <div className="space-y-3 text-sm">
          <Row label="Nombre" value={usuario?.nombre} />
          <Row label="Correo" value={usuario?.email} />
          <Row label="Rol" value={usuario?.rol} />
        </div>
      </div>

      <div className="bg-(--surface-container-lowest) rounded-xl p-6">
        <h2 className="font-bold text-(--on-surface) mb-2">Sesión</h2>
        <p className="text-sm text-(--on-surface-variant) mb-4">Cierra tu sesión para proteger tu cuenta cuando termines de trabajar.</p>
        <button onClick={cerrarSesion}
          className="border border-(--outline-variant) text-(--on-surface) hover:bg-(--surface) px-4 py-2 rounded-lg text-sm font-medium transition">
          Cerrar sesión
        </button>
      </div>
    </div>
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

  const nombreMes = mesActual.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  const mesAnterior = () => setMesActual(new Date(año, mes - 1, 1));
  const mesSiguiente = () => setMesActual(new Date(año, mes + 1, 1));
  const irHoy = () => setMesActual(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const cells: ({ dia: number } | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= diasMes; d++) cells.push({ dia: d });

  return (
    <div className="px-8 py-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Agenda de Visitas</h1>
          <p className="text-(--on-surface-variant) text-sm mt-1 capitalize">Gestión de consultas domiciliarias — {nombreMes}.</p>
        </div>
        <div className="flex bg-(--surface-container-lowest) rounded-lg border border-(--outline-variant) p-1 items-center">
          <button onClick={mesAnterior} className="px-2 py-1 text-(--on-surface-variant) hover:text-(--primary)">‹</button>
          <button onClick={irHoy} className="px-3 py-1 text-xs font-bold text-(--on-surface) hover:bg-(--surface) rounded">Hoy</button>
          <button onClick={mesSiguiente} className="px-2 py-1 text-(--on-surface-variant) hover:text-(--primary)">›</button>
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
                        className={`text-left p-1.5 rounded text-[10px] border-l-2 cursor-pointer hover:brightness-95 transition truncate ${estiloCitaCalendario(c.servicios, c.estado)} ${citaSeleccionada?.id === c.id ? 'ring-1 ring-offset-1 ring-black/20' : ''}`}>
                        <p className="font-bold truncate">{horaCorta(c.fecha)} · {c.mascota.nombre}</p>
                        <p className="opacity-70 truncate">{c.servicios.length > 1 ? `${c.servicios.length} servicios` : c.servicios[0]}</p>
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
            <h3 className="font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Detalles de la Cita</h3>
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
                    value={
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${estiloEstado(citaSeleccionada.estado)}`}>
                        {textoEstadoCita(citaSeleccionada.estado)}
                      </span>
                    }
                  />
                  <div>
                    <p className="text-(--on-surface-variant) text-xs mb-1.5">Servicios solicitados:</p>
                    <ul className="space-y-1">
                      {citaSeleccionada.servicios.map(s => {
                        const estado = estadoServicio(s, citaSeleccionada, mascotas);
                        const icono = estado === 'atendido' ? '✅' : estado === 'cancelado' ? '❌' : '⏸️';
                        return (
                          <li key={s} className="flex items-center justify-between gap-2 text-sm text-(--on-surface)">
                            <span>{s}</span>
                            <span className="text-base leading-none flex-shrink-0">{icono}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tutor + Dirección */}
              <div className="space-y-2 text-xs text-(--on-surface-variant) border-t border-(--outline-variant) pt-3">
                <p>👤 <span className="font-medium text-(--on-surface)">{citaSeleccionada.mascota.tutor.nombre}</span> · {citaSeleccionada.mascota.tutor.telefono}</p>
                <p>📍 {citaSeleccionada.direccion}</p>
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
        <StatMini label="CONFIRMADAS"  value={stats.confirmadas}  color="emerald" />
        <StatMini label="PENDIENTES"   value={stats.pendientes}   color="amber" />
        <StatMini label="VISITAS HOY"  value={stats.hoy}          color="blue" />
        <StatMini label="COMPLETADAS"  value={stats.completadas}  color="primary" />
      </div>

      {/* Leyenda de colores */}
      <div className="bg-(--surface-container-lowest) rounded-xl border border-(--outline-variant) px-6 py-5 mt-4">
        <p className="text-[10px] font-bold tracking-widest uppercase text-(--on-surface-variant) mb-4">Servicios agendados</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { label: 'Colocación de chips',    dot: 'bg-indigo-400',  chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
            { label: 'Control Médico',         dot: 'bg-sky-400',     chip: 'bg-sky-50 text-sky-700 ring-sky-200' },
            { label: 'Curación de heridas',    dot: 'bg-emerald-400', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
            { label: 'Examen Hemograma',       dot: 'bg-amber-400',   chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
            { label: 'Examen T4',              dot: 'bg-yellow-400',  chip: 'bg-yellow-50 text-yellow-700 ring-yellow-200' },
            { label: 'Examen TSH',             dot: 'bg-orange-400',  chip: 'bg-orange-50 text-orange-700 ring-orange-200' },
            { label: 'Perfil Bioquímico',      dot: 'bg-pink-400',    chip: 'bg-pink-50 text-pink-700 ring-pink-200' },
            { label: 'Test de Distemper',      dot: 'bg-violet-400',  chip: 'bg-violet-50 text-violet-700 ring-violet-200' },
            { label: 'Test de leucemia',       dot: 'bg-purple-400',  chip: 'bg-purple-50 text-purple-700 ring-purple-200' },
            { label: 'Test de Parvovirus',     dot: 'bg-fuchsia-400', chip: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200' },
            { label: 'Test de SIDA Felino',    dot: 'bg-rose-400',    chip: 'bg-rose-50 text-rose-700 ring-rose-200' },
            { label: 'Múltiples servicios',    dot: 'bg-red-500',     chip: 'bg-red-50 text-red-700 ring-red-200' },
          ].map(({ label, dot, chip }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg ring-1 ${chip}`}>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
              <span className="text-[11px] font-semibold leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetalleRow({ icon, label, value, sub }: { icon: string; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-base mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold tracking-wider uppercase text-(--on-surface-variant) mb-0.5">{label}</p>
        <div className="text-sm text-(--on-surface) font-medium">{value}</div>
        {sub && <p className="text-xs text-(--on-surface-variant) mt-0.5">{sub}</p>}
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

function textoEstadoCita(estado: EstadoCita) {
  if (estado === 'COMPLETADA') return 'Atendida';
  if (estado === 'CONFIRMADA') return 'Confirmada';
  if (estado === 'CANCELADA')  return 'Cancelada';
  return 'Pendiente';
}

function estadoServicio(servicio: string, cita: Cita, mascotas: Mascota[]): 'atendido' | 'pendiente' | 'cancelado' {
  if (cita.estado === 'CANCELADA') return 'cancelado';
  if (SERVICIOS_EXAMEN.has(servicio)) {
    const mascota = mascotas.find(m => m.id === cita.mascotaId);
    const tieneDisponible = mascota?.examenes.some(e => e.tipo === servicio && new Date(e.creadoEn) >= new Date(cita.creadoEn) && e.estado === 'DISPONIBLE');
    return tieneDisponible ? 'atendido' : 'pendiente';
  }
  if (cita.estado !== 'COMPLETADA') return 'pendiente';
  return 'atendido';
}

function StatMini({ label, value, color }: { label: string; value: number; color: 'emerald' | 'amber' | 'blue' | 'primary' }) {
  const styles = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    primary: { bg: 'bg-(--primary)', text: 'text-white' },
  } as const;
  const isPrimary = color === 'primary';
  return (
    <div className={`p-5 rounded-xl border ${isPrimary ? 'bg-(--primary) border-(--primary)' : 'bg-(--surface-container-lowest) border-(--outline-variant)'}`}>
      <p className={`text-[10px] font-bold tracking-widest mb-2 ${isPrimary ? 'text-white/70' : 'text-(--on-surface-variant)'}`}>{label}</p>
      <p className={`text-3xl font-bold font-[family-name:var(--font-manrope)] ${isPrimary ? 'text-white' : 'text-(--on-surface)'}`}>{String(value).padStart(2, '0')}</p>
    </div>
  );
}

const COLOR_SERVICIO: Record<string, { bg: string; text: string; border: string }> = {
  'Colocación de chips':     { bg: 'bg-indigo-100',  text: 'text-indigo-800',  border: 'border-indigo-400' },
  'Control Médico':          { bg: 'bg-sky-100',     text: 'text-sky-800',     border: 'border-sky-400' },
  'Curación de heridas':     { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-400' },
  'Examen Hemograma':        { bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-400' },
  'Examen T4':               { bg: 'bg-yellow-100',  text: 'text-yellow-800',  border: 'border-yellow-400' },
  'Examen TSH':              { bg: 'bg-orange-100',  text: 'text-orange-800',  border: 'border-orange-400' },
  'Perfil Bioquímico':       { bg: 'bg-pink-100',    text: 'text-pink-800',    border: 'border-pink-400' },
  'Test de Distemper':       { bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-400' },
  'Test de leucemia':        { bg: 'bg-purple-100',  text: 'text-purple-800',  border: 'border-purple-400' },
  'Test de Parvovirus':      { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-400' },
  'Test de SIDA Felino':     { bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-400' },
};
const COLOR_MULTIPLE = { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400' };
const COLOR_DEFAULT  = { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };

function colorCita(servicios: string[]) {
  if (servicios.length > 1) return COLOR_MULTIPLE;
  return COLOR_SERVICIO[servicios[0]] ?? COLOR_DEFAULT;
}

function estiloCitaCalendario(servicios: string[], estado: EstadoCita) {
  if (estado === 'CANCELADA') return 'bg-gray-100 text-gray-400 border-gray-300 line-through opacity-60';
  if (estado === 'COMPLETADA') return 'bg-gray-100 text-gray-500 border-gray-300 opacity-80';
  const { bg, text, border } = colorCita(servicios);
  return `${bg} ${text} ${border}`;
}

function estiloEstado(estado: EstadoCita) {
  if (estado === 'CONFIRMADA') return 'bg-emerald-100 text-emerald-700';
  if (estado === 'COMPLETADA') return 'bg-emerald-100 text-emerald-700';
  if (estado === 'CANCELADA')  return 'bg-(--error-container) text-(--on-error-container)';
  return 'bg-(--secondary-container) text-(--on-secondary-container)';
}

function CitaEstadoBadge({ estado }: { estado: EstadoCita }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${estiloEstado(estado)}`}>
      {textoEstadoCita(estado)}
    </span>
  );
}

function horaCorta(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function fechaLarga(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + horaCorta(iso);
}

function AyudaView() {
  return (
    <div className="px-8 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)] mb-1">Centro de ayuda</h1>
      <p className="text-(--on-surface-variant) text-sm mb-6">Soporte y respuestas rápidas para AMAVET.</p>

      <div className="bg-(--surface-container-lowest) rounded-xl p-6 mb-4">
        <h2 className="font-bold text-(--on-surface) mb-4">Preguntas frecuentes</h2>
        <div className="space-y-4 text-sm">
          <Faq q="¿Cómo subo un examen?"
               a="Desde el Dashboard, en la sección «Subida Rápida», selecciona el paciente, escribe el tipo de examen y arrastra el PDF. Al hacer clic en «Subir y publicar» el tutor recibe un correo automático." />
          <Faq q="¿Cómo registro una mascota nueva?"
               a="Haz clic en «+ Nueva Mascota» en la barra lateral. Selecciona un tutor ya registrado y completa los datos del animal. La raza y la edad son opcionales." />
          <Faq q="¿Qué significan los estados de un examen?"
               a="Pendiente: aún no se ha procesado. En Proceso: en análisis. Disponible: el resultado está listo y el tutor ya fue notificado." />
          <Faq q="¿Puedo eliminar o editar un examen?"
               a="Por ahora solo puedes cambiar su estado desde la tabla de exámenes. La edición y eliminación llegarán en próximas versiones." />
        </div>
      </div>

      <div className="bg-(--surface-container-lowest) rounded-xl p-6">
        <h2 className="font-bold text-(--on-surface) mb-3">Contacto</h2>
        <div className="space-y-2 text-sm text-(--on-surface-variant)">
          <p>Soporte: <span className="text-(--on-surface) font-medium">soporte@amavet.cl</span></p>
          <p>Horario: lunes a viernes, 9:00 a 18:00 hrs</p>
        </div>
      </div>
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
    <div className={`rounded-xl p-5 ${primary ? 'bg-(--primary)' : 'bg-(--surface-container-lowest)'}`}>
      <p className={`text-xs font-semibold tracking-widest mb-3 ${primary ? 'text-white/70' : 'text-(--on-surface-variant)'}`}>{title}</p>
      <p className={`text-4xl font-bold mb-1 font-[family-name:var(--font-manrope)] ${primary ? 'text-white' : 'text-(--on-surface)'}`}>{value}</p>
      <p className={`text-xs ${primary ? 'text-white/70' : 'text-(--on-surface-variant)'}`}>{sub}</p>
    </div>
  );
}

function Avatar({ nombre, large = false }: { nombre: string; large?: boolean }) {
  const size = large ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  return (
    <div className={`${size} rounded-full bg-(--surface-container-high) flex items-center justify-center font-bold text-(--on-surface-variant) flex-shrink-0`}>
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

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      className="w-full border border-(--outline-variant) rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 placeholder-gray-400 bg-white" />
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between border-b border-(--outline-variant) pb-2 last:border-0 last:pb-0">
      <span className="text-(--on-surface-variant)">{label}</span>
      <span className="text-(--on-surface) font-medium">{value || '—'}</span>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="border-b border-(--outline-variant) pb-4 last:border-0 last:pb-0">
      <p className="font-semibold text-(--on-surface) mb-1">{q}</p>
      <p className="text-(--on-surface-variant)">{a}</p>
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
