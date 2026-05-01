'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  tutor: { nombre: string; email: string };
  examenes: Examen[];
}

interface Examen {
  id: string;
  tipo: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE';
  archivoUrl: string | null;
  mascota: { nombre: string };
}

export default function Admin() {
  const router = useRouter();
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [examenes, setExamenes] = useState<Examen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [vista, setVista] = useState<'mascotas' | 'examenes'>('mascotas');
  const [nuevoExamen, setNuevoExamen] = useState({ tipo: '', mascotaId: '' });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!u || !token) { router.push('/login'); return; }
    const parsed = JSON.parse(u);
    if (parsed.rol !== 'ADMIN') { router.push('/dashboard'); return; }
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
  };

  const crearExamen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/examenes', nuevoExamen);
      setNuevoExamen({ tipo: '', mascotaId: '' });
      setMensaje('✅ Examen creado correctamente');
      cargarDatos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const actualizarEstado = async (id: string, estado: string) => {
    try {
      await api.patch(`/examenes/${id}/estado`, { estado });
      setMensaje('✅ Estado actualizado');
      cargarDatos();
      setTimeout(() => setMensaje(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  const estadoBadge = (estado: string) => {
    const estilos: any = {
      PENDIENTE: 'bg-yellow-100 text-yellow-700',
      EN_PROCESO: 'bg-blue-100 text-blue-700',
      DISPONIBLE: 'bg-green-100 text-green-700',
    };
    const labels: any = {
      PENDIENTE: 'Pendiente',
      EN_PROCESO: 'En Proceso',
      DISPONIBLE: 'Disponible',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${estilos[estado]}`}>{labels[estado]}</span>;
  };

  if (cargando) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <span className="font-bold text-green-800 text-xl">AMAVET · Admin</span>
        <button onClick={cerrarSesion} className="text-sm text-red-500 hover:underline">Cerrar sesión</button>
      </nav>

      <div className="max-w-5xl mx-auto p-6">
        {mensaje && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{mensaje}</div>}

        <div className="flex gap-2 mb-6">
          <button onClick={() => setVista('mascotas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${vista === 'mascotas' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border'}`}>
            Mascotas
          </button>
          <button onClick={() => setVista('examenes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${vista === 'examenes' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border'}`}>
            Exámenes
          </button>
        </div>

        {vista === 'mascotas' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Todas las Mascotas</h1>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Mascota</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Tipo</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Tutor</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Exámenes</th>
                  </tr>
                </thead>
                <tbody>
                  {mascotas.map(m => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{m.nombre}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{m.tipo}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{m.tutor?.nombre}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{m.examenes?.length || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {vista === 'examenes' && (
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Exámenes</h1>

            <div className="bg-white rounded-xl shadow p-6 mb-6">
              <h2 className="font-semibold text-gray-700 mb-4">Crear Nuevo Examen</h2>
              <form onSubmit={crearExamen} className="grid grid-cols-3 gap-4">
                <select required value={nuevoExamen.mascotaId}
                  onChange={e => setNuevoExamen({ ...nuevoExamen, mascotaId: e.target.value })}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Seleccionar mascota</option>
                  {mascotas.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.tutor?.nombre})</option>
                  ))}
                </select>
                <input required placeholder="Tipo de examen" value={nuevoExamen.tipo}
                  onChange={e => setNuevoExamen({ ...nuevoExamen, tipo: e.target.value })}
                  className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                <button type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition">
                  Crear Examen
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Mascota</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Tipo</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Estado</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {examenes.map(ex => (
                    <tr key={ex.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{ex.mascota?.nombre}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">{ex.tipo}</td>
                      <td className="px-4 py-3">{estadoBadge(ex.estado)}</td>
                      <td className="px-4 py-3">
                        <select value={ex.estado}
                          onChange={e => actualizarEstado(ex.id, e.target.value)}
                          className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                          <option value="PENDIENTE">Pendiente</option>
                          <option value="EN_PROCESO">En Proceso</option>
                          <option value="DISPONIBLE">Disponible</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}