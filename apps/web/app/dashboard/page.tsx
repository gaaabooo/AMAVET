'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ExamStatusBadge from '@/components/ExamStatusBadge';

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  raza?: string;
  edad?: number;
  examenes: Examen[];
}

interface Examen {
  id: string;
  tipo: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE';
  archivoUrl: string | null;
  creadoEn: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevaMascota, setNuevaMascota] = useState({ nombre: '', tipo: '', raza: '', edad: '' });

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!u || !token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    setUsuario(parsed);
    cargarMascotas(parsed.id);
  }, []);

  const cargarMascotas = async (tutorId: string) => {
    try {
      const res = await api.get(`/mascotas/tutor/${tutorId}`);
      setMascotas(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  const crearMascota = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/mascotas', { ...nuevaMascota, edad: Number(nuevaMascota.edad), tutorId: usuario.id });
      setMostrarForm(false);
      setNuevaMascota({ nombre: '', tipo: '', raza: '', edad: '' });
      cargarMascotas(usuario.id);
    } catch (err) {
      console.error(err);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <main className="min-h-screen bg-(--surface)">
      <nav className="bg-(--surface-container-lowest) border-b border-(--outline-variant) px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-(--primary) text-xl">AMAVET</span>
        <div className="flex items-center gap-4">
          <span className="text-(--on-surface-variant) text-sm">Hola, {usuario?.nombre}</span>
          <button onClick={cerrarSesion} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-(--on-surface)">Mis Mascotas</h1>
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-(--primary) hover:bg-(--primary-container) text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Agregar Mascota
          </button>
        </div>

        {mostrarForm && (
          <div className="bg-(--surface-container-lowest) rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold text-(--on-surface-variant) mb-4">Nueva Mascota</h2>
            <form onSubmit={crearMascota} className="grid grid-cols-2 gap-4">
              <input required placeholder="Nombre" value={nuevaMascota.nombre}
                onChange={e => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })}
                className="border border-(--outline-variant) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 placeholder-gray-400" />
              <input required placeholder="Tipo (Perro, Gato...)" value={nuevaMascota.tipo}
                onChange={e => setNuevaMascota({ ...nuevaMascota, tipo: e.target.value })}
                className="border border-(--outline-variant) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 placeholder-gray-400" />
              <input placeholder="Raza" value={nuevaMascota.raza}
                onChange={e => setNuevaMascota({ ...nuevaMascota, raza: e.target.value })}
                className="border border-(--outline-variant) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 placeholder-gray-400" />
              <input required placeholder="Edad" type="number" value={nuevaMascota.edad}
                onChange={e => setNuevaMascota({ ...nuevaMascota, edad: e.target.value })}
                className="border border-(--outline-variant) rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-(--primary) text-gray-900 placeholder-gray-400" />
              <button type="submit"
                className="col-span-2 bg-(--primary) hover:bg-(--primary-container) text-white py-2 rounded-lg font-medium transition">
                Guardar Mascota
              </button>
            </form>
          </div>
        )}

        {mascotas.length === 0 ? (
          <div className="text-center py-16 text-(--on-surface-variant)">
            <p className="text-lg">No tienes mascotas registradas aún</p>
            <p className="text-sm mt-1">Agrega tu primera mascota para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mascotas.map(mascota => (
              <div key={mascota.id} className="bg-(--surface-container-lowest) rounded-xl shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-(--on-surface)">{mascota.nombre}</h2>
                    <p className="text-(--on-surface-variant) text-sm">
                      {mascota.tipo}{mascota.raza ? ` · ${mascota.raza}` : ''}{mascota.edad != null ? ` · ${mascota.edad} años` : ''}
                    </p>
                  </div>
                </div>
                {mascota.examenes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-(--on-surface-variant) mb-2">Exámenes</h3>
                    <div className="space-y-2">
                      {mascota.examenes.map(examen => (
                        <div key={examen.id} className="flex justify-between items-center bg-(--surface) rounded-lg p-3">
                          <div>
                            <p className="text-sm font-medium text-(--on-surface)">{examen.tipo}</p>
                            <p className="text-xs text-(--on-surface-variant)">{new Date(examen.creadoEn).toLocaleDateString('es-CL')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <ExamStatusBadge estado={examen.estado} />
                            {examen.estado === 'DISPONIBLE' && examen.archivoUrl && (
                              <a href={examen.archivoUrl} target="_blank"
                                className="text-xs bg-(--primary) text-white px-3 py-1 rounded-lg hover:bg-(--primary-container)">
                                Descargar
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
