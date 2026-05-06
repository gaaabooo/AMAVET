'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Logo from '@/components/Logo';

interface Usuario {
  id: string;
  nombre: string;
  email?: string;
  rol?: string;
}

interface Examen {
  id: string;
  tipo: string;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'DISPONIBLE';
  archivoUrl: string | null;
  creadoEn: string;
}

interface Mascota {
  id: string;
  nombre: string;
  tipo: string;
  raza?: string;
  edad?: number;
  examenes: Examen[];
}

const ANIMAL_ICON: Record<string, string> = {
  perro: '🐶', gato: '🐱', conejo: '🐰', ave: '🐦', pájaro: '🐦',
  pajaro: '🐦', hamster: '🐹', hámster: '🐹', tortuga: '🐢',
  pez: '🐟', hurón: '🦔', huron: '🦔',
};

function getAnimalIcon(tipo: string): string {
  const key = tipo.toLowerCase().trim();
  return ANIMAL_ICON[key] ?? '🐾';
}

export default function Dashboard() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mascotas, setMascotas] = useState<Mascota[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviandoMascota, setEnviandoMascota] = useState(false);
  const [errorMascota, setErrorMascota] = useState<string | null>(null);
  const [nuevaMascota, setNuevaMascota] = useState({ nombre: '', tipo: '', raza: '', edad: '' });

  const cargarMascotas = useCallback(async (tutorId: string) => {
    try {
      const res = await api.get(`/mascotas/tutor/${tutorId}`);
      setMascotas(res.data);
      setErrorCarga(false);
    } catch {
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!u || !token) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(u) as Usuario;
    setUsuario(parsed);
    cargarMascotas(parsed.id);
  }, [router, cargarMascotas]);

  const crearMascota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    setEnviandoMascota(true);
    setErrorMascota(null);
    try {
      await api.post('/mascotas', {
        ...nuevaMascota,
        edad: nuevaMascota.edad ? Number(nuevaMascota.edad) : undefined,
        tutorId: usuario.id,
      });
      setMostrarForm(false);
      setNuevaMascota({ nombre: '', tipo: '', raza: '', edad: '' });
      await cargarMascotas(usuario.id);
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErrorMascota(msg || 'No pudimos guardar la mascota. Intenta nuevamente.');
    } finally {
      setEnviandoMascota(false);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-(--surface) font-[family-name:var(--font-manrope)]">
      <nav className="bg-(--surface-container-lowest) border-b border-(--outline-variant) px-6 py-4 flex justify-between items-center">
        <Logo size="sm" variant="light" />
        <div className="flex items-center gap-4">
          <span className="text-(--on-surface-variant) text-sm hidden sm:inline">
            Hola, <span className="font-semibold text-(--on-surface)">{usuario?.nombre ?? '…'}</span>
          </span>
          <button
            onClick={cerrarSesion}
            className="text-sm font-medium text-(--on-surface-muted) hover:text-(--primary) transition-colors duration-150 py-2 px-1"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-(--primary) mb-3">
            <span className="w-8 h-px bg-(--primary)" aria-hidden="true" />
            Tu panel
          </span>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <h1
              className="text-3xl sm:text-4xl font-bold text-(--on-surface) leading-tight"
              style={{ letterSpacing: '-0.015em' }}
            >
              Mis{' '}
              <span className="font-light italic" style={{ fontFamily: 'var(--font-newsreader)', color: 'var(--primary)' }}>
                mascotas
              </span>
            </h1>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push('/dashboard/agendar')}
                className="border border-(--primary) text-(--primary) hover:bg-(--surface-container-low) px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
              >
                Agendar visita
              </button>
              <button
                onClick={() => {
                  setErrorMascota(null);
                  setMostrarForm((v) => !v);
                }}
                aria-expanded={mostrarForm}
                className="bg-(--primary) hover:bg-[#1b4332] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
              >
                {mostrarForm ? 'Cancelar' : '+ Agregar mascota'}
              </button>
            </div>
          </div>
        </header>

        {mostrarForm && (
          <section
            aria-label="Nueva mascota"
            className="bg-(--surface-container-lowest) border border-(--outline-variant) rounded-2xl p-6 sm:p-8 mb-10"
          >
            <h2 className="text-lg font-semibold text-(--on-surface) mb-1">Nueva mascota</h2>
            <p className="text-sm text-(--on-surface-variant) mb-6">
              Completa los datos de tu mascota. Podrás editarlos más tarde.
            </p>

            {errorMascota && (
              <div
                role="alert"
                className="bg-(--error-container) text-(--on-error-container) text-sm p-3 rounded-lg mb-5"
              >
                {errorMascota}
              </div>
            )}

            <form onSubmit={crearMascota} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="mascota-nombre"
                  className="block text-sm font-medium text-(--on-surface-variant) mb-1.5"
                >
                  Nombre
                </label>
                <input
                  id="mascota-nombre"
                  required
                  autoFocus
                  placeholder="Ej. Lola"
                  value={nuevaMascota.nombre}
                  onChange={(e) => setNuevaMascota({ ...nuevaMascota, nombre: e.target.value })}
                  className="sv-input"
                />
              </div>
              <div>
                <label
                  htmlFor="mascota-tipo"
                  className="block text-sm font-medium text-(--on-surface-variant) mb-1.5"
                >
                  Tipo
                </label>
                <input
                  id="mascota-tipo"
                  required
                  placeholder="Perro, gato, conejo…"
                  value={nuevaMascota.tipo}
                  onChange={(e) => setNuevaMascota({ ...nuevaMascota, tipo: e.target.value })}
                  className="sv-input"
                />
              </div>
              <div>
                <label
                  htmlFor="mascota-raza"
                  className="block text-sm font-medium text-(--on-surface-variant) mb-1.5"
                >
                  Raza{' '}
                  <span className="text-(--on-surface-muted) font-normal">(opcional)</span>
                </label>
                <input
                  id="mascota-raza"
                  placeholder="Ej. Beagle"
                  value={nuevaMascota.raza}
                  onChange={(e) => setNuevaMascota({ ...nuevaMascota, raza: e.target.value })}
                  className="sv-input"
                />
              </div>
              <div>
                <label
                  htmlFor="mascota-edad"
                  className="block text-sm font-medium text-(--on-surface-variant) mb-1.5"
                >
                  Edad{' '}
                  <span className="text-(--on-surface-muted) font-normal">(años)</span>
                </label>
                <input
                  id="mascota-edad"
                  type="number"
                  min={0}
                  max={40}
                  inputMode="numeric"
                  placeholder="3"
                  value={nuevaMascota.edad}
                  onChange={(e) => setNuevaMascota({ ...nuevaMascota, edad: e.target.value })}
                  className="sv-input"
                />
              </div>
              <button
                type="submit"
                disabled={enviandoMascota}
                className="sm:col-span-2 bg-(--primary) hover:bg-[#1b4332] text-white py-3 rounded-lg font-semibold transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {enviandoMascota ? 'Guardando…' : 'Guardar mascota'}
              </button>
            </form>
          </section>
        )}

        {cargando ? (
          <div aria-busy="true" aria-label="Cargando mascotas" className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-(--outline-variant) bg-(--surface-container-lowest) p-6 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-(--surface-container-high)" />
                    <div className="space-y-2">
                      <div className="h-5 w-32 rounded bg-(--surface-container-high)" />
                      <div className="h-4 w-48 rounded bg-(--surface-container-low)" />
                    </div>
                  </div>
                  <div className="h-6 w-20 rounded-full bg-(--surface-container-low)" />
                </div>
              </div>
            ))}
          </div>
        ) : errorCarga ? (
          <div
            role="alert"
            className="rounded-xl border border-(--outline-variant) bg-(--error-container) text-(--on-error-container) p-8 text-center"
          >
            <p className="font-semibold mb-2">No pudimos cargar tus mascotas</p>
            <p className="text-sm mb-4">Revisa tu conexión e intenta nuevamente.</p>
            <button
              onClick={() => usuario && cargarMascotas(usuario.id)}
              className="bg-(--primary) hover:bg-[#1b4332] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150"
            >
              Reintentar
            </button>
          </div>
        ) : mascotas.length === 0 ? (
          <section
            className="rounded-2xl border border-(--outline-variant) bg-(--surface-container-lowest) p-10 sm:p-14 text-center"
            aria-label="Sin mascotas registradas"
          >
            <div className="w-16 h-16 rounded-2xl bg-(--surface-container-low) flex items-center justify-center mx-auto mb-5 text-3xl">
              🐾
            </div>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-(--primary) mb-3 justify-center">
              <span className="w-8 h-px bg-(--primary)" aria-hidden="true" />
              Empecemos
            </span>
            <h2
              className="text-2xl sm:text-3xl font-bold text-(--on-surface) leading-tight mb-3"
              style={{ letterSpacing: '-0.015em' }}
            >
              Aún no tienes una{' '}
              <span className="font-light italic" style={{ fontFamily: 'var(--font-newsreader)', color: 'var(--primary)' }}>
                mascota registrada
              </span>
            </h2>
            <p className="text-(--on-surface-variant) text-sm max-w-md mx-auto mb-6">
              Agrega su nombre, tipo y edad para empezar a llevar su ficha clínica
              y agendar visitas a domicilio.
            </p>
            <button
              onClick={() => {
                setErrorMascota(null);
                setMostrarForm(true);
              }}
              className="bg-(--primary) hover:bg-[#1b4332] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
            >
              + Agregar mi primera mascota
            </button>
          </section>
        ) : (
          <ul className="space-y-3">
            {mascotas.map((mascota) => {
              const detalles = [
                mascota.raza,
                mascota.edad != null
                  ? `${mascota.edad} ${mascota.edad === 1 ? 'año' : 'años'}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ');
              const totalExamenes = mascota.examenes.length;
              const disponibles = mascota.examenes.filter((e) => e.estado === 'DISPONIBLE').length;
              const icon = getAnimalIcon(mascota.tipo);
              return (
                <li key={mascota.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/mascotas/${mascota.id}`)}
                    className="w-full text-left bg-(--surface-container-lowest) border border-(--outline-variant) rounded-xl p-5 transition-all duration-150 hover:border-(--primary) hover:-translate-y-px focus:outline-none focus-visible:border-(--primary) focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface)"
                    aria-label={`Ver ficha de ${mascota.nombre}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-(--surface-container-low) flex items-center justify-center text-2xl flex-shrink-0">
                        {icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-(--on-surface) truncate">
                            {mascota.nombre}
                          </h3>
                          <span className="text-xs font-medium text-(--on-surface-muted) bg-(--surface-container-low) px-2 py-0.5 rounded-full">
                            {mascota.tipo}
                          </span>
                        </div>
                        {detalles && (
                          <p className="text-(--on-surface-muted) text-sm mt-0.5 truncate">
                            {detalles}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {disponibles > 0 ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-(--tertiary-fixed) text-(--on-tertiary-fixed) text-xs font-bold px-2.5 py-1"
                            style={{ letterSpacing: '0.05em' }}
                          >
                            {disponibles} disponible{disponibles === 1 ? '' : 's'}
                          </span>
                        ) : null}
                        <span className="text-(--on-surface-muted) text-sm hidden sm:inline">
                          {totalExamenes === 0
                            ? 'Sin exámenes'
                            : totalExamenes === 1
                            ? '1 examen'
                            : `${totalExamenes} exámenes`}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          aria-hidden="true"
                          className="text-(--on-surface-muted)"
                        >
                          <path
                            d="M6 4l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
