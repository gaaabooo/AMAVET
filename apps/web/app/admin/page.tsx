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

type Vista = 'dashboard' | 'mascotas' | 'examenes' | 'configuracion' | 'ayuda';

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
      const [mascRes, examRes] = await Promise.all([
        api.get('/mascotas'),
        api.get('/examenes'),
      ]);
      setMascotas(mascRes.data);
      setExamenes(examRes.data);
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
      const { data: examen } = await api.post('/examenes', { tipo: uploadTipo, mascotaId: uploadMascotaId });
      if (esExamen && uploadArchivo) {
        const formData = new FormData();
        formData.append('archivo', uploadArchivo);
        await api.post(`/examenes/${examen.id}/subir`, formData);
        mostrarMensaje('ok', '✅ Resultado subido — el tutor fue notificado por correo');
      } else {
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

  const examenesFiltrados = useMemo(() => {
    let result = [...examenes];
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
  }, [examenes, examenEstado, examenBusqueda]);

  const pendientes = examenes.filter(e => e.estado !== 'DISPONIBLE').length;

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
            recentMascotas={recentMascotas}
            pendientes={pendientes}
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
  usuario, mascotas, recentMascotas, pendientes,
  uploadMascotaId, setUploadMascotaId, uploadTipo, setUploadTipo,
  uploadArchivo, setUploadArchivo, dragging, setDragging,
  subiendo, fileInputRef, subirResultado, actualizarEstado,
}: any) {
  const SERVICIOS_CON_PDF = new Set([
    'Examen Hemograma', 'Examen T4', 'Examen TSH',
    'Perfil Bioquímico',
    'Test de Distemper', 'Test de leucemia', 'Test de Parvovirus', 'Test de SIDA Felino',
  ]);
  const esExamen = SERVICIOS_CON_PDF.has(uploadTipo);
  return (
    <>
      <div className="px-8 pt-8 pb-6">
        <h1 className="text-2xl font-bold text-(--on-surface) font-[family-name:var(--font-manrope)]">Panel de Control</h1>
        <p className="text-(--on-surface-variant) text-sm mt-1">Resumen de actividad y pacientes recientes.</p>
      </div>

      <div className="px-8 grid grid-cols-3 gap-4 mb-6">
        <StatCard title="PACIENTES ACTIVOS"   value={mascotas.length} sub="mascotas registradas" />
        <StatCard title="EXÁMENES PENDIENTES" value={pendientes}      sub="Requieren revisión" />
        <StatCard title="CITAS HOY"           value="—"               sub="Módulo próximamente" primary />
      </div>

      <div className="px-8 pb-8 grid grid-cols-[320px_1fr] gap-6 items-start">

        {/* Quick Upload */}
        <div className="bg-(--surface-container-lowest) rounded-xl p-6">
          <h2 className="font-bold text-(--on-surface) mb-5 font-[family-name:var(--font-manrope)]">↑ Subida Rápida</h2>
          <form onSubmit={subirResultado} className="space-y-4">

            <Field label="Seleccionar paciente">
              <select required value={uploadMascotaId}
                onChange={e => setUploadMascotaId(e.target.value)}
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
                className="w-full border border-(--outline-variant) rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--primary) text-(--on-surface) bg-white">
                <option value="">Seleccionar servicio...</option>
                <option value="Colocación de chips">Colocación de chips</option>
                <option value="Control Médico">Control Médico</option>
                <option value="Curación de heridas">Curación de heridas</option>
                <option value="Examen Hemograma">Examen Hemograma</option>
                <option value="Examen T4">Examen T4</option>
                <option value="Examen TSH">Examen TSH</option>
                <option value="Perfil Bioquímico">Perfil Bioquímico</option>
                <option value="Test de Distemper">Test de Distemper</option>
                <option value="Test de leucemia">Test de leucemia</option>
                <option value="Test de Parvovirus">Test de Parvovirus</option>
                <option value="Test de SIDA Felino">Test de SIDA Felino</option>
              </select>
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
                <Th>Último Examen</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {recentMascotas.map((m: Mascota) => {
                const ue = ultimoExamen(m);
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
                    <td className="px-4 py-4 text-sm text-(--on-surface-variant)">{ue ? fechaCorta(ue.creadoEn) : 'Sin exámenes'}</td>
                    <td className="px-4 py-4">{ue ? <ExamStatusBadge estado={ue.estado} /> : <span className="text-xs text-(--on-surface-variant)">—</span>}</td>
                    <td className="px-4 py-4">
                      {ue ? (
                        <select value={ue.estado}
                          onChange={e => actualizarEstado(ue.id, e.target.value)}
                          className="border border-(--outline-variant) rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-(--primary) text-gray-900 bg-white">
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="EN_PROCESO">En Proceso</option>
                          <option value="DISPONIBLE">Disponible</option>
                        </select>
                      ) : <span className="text-xs text-(--on-surface-variant)">—</span>}
                    </td>
                  </tr>
                );
              })}
              {recentMascotas.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-(--on-surface-variant) text-sm">No hay mascotas registradas aún</td></tr>
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

function ExamenesView({ examenes, total, estado, setEstado, busqueda, setBusqueda, actualizarEstado }: any) {
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
                      <a href={ex.archivoUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-(--primary) hover:bg-(--primary-container) text-white px-3 py-1 rounded-lg transition">
                        Ver PDF
                      </a>
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
function IconSettings() { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>; }
function IconHelp()     { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>; }
function IconLogout()   { return <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>; }
function IconUpload()   { return <svg className="w-5 h-5 text-(--on-surface-variant)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>; }
