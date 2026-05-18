'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getSesion, tieneTelefonoValido } from '@/lib/session';
import { getAnimalIcon } from '@/lib/utils/animals';
import DashboardNav from '@/components/DashboardNav';

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
    const sesion = getSesion();
    if (!sesion) { router.push('/login'); return; }
    // Tutores de Google sin teléfono real (sentinel PENDIENTE) deben completarlo
    // antes de operar; el admin necesita el número para coordinar visitas.
    if (sesion.rol === 'TUTOR' && !tieneTelefonoValido(sesion.telefono)) {
      router.push('/auth/completar-perfil');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuario(sesion);
    cargarMascotas(sesion.id);
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

  const totalMascotas = mascotas.length;
  const resultadosNuevos = mascotas.reduce(
    (acc, m) => acc + m.examenes.filter((e) => e.estado === 'DISPONIBLE').length,
    0
  );
  const totalExamenes = mascotas.reduce((acc, m) => acc + m.examenes.length, 0);

  return (
    <main className="dash-root min-h-screen relative overflow-hidden">
      {/* Tokens locales del dashboard botánico */}
      <style jsx>{`
        .dash-root {
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
          --d-error-bg: #fde7e1;
          --d-error-ink: #6b1d10;
          background: var(--d-bg);
          color: var(--d-ink);
          font-family: var(--font-manrope), system-ui, sans-serif;
        }
        .leaf-bg {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          overflow: hidden;
        }
        .leaf-bg svg {
          position: absolute;
          color: var(--d-green-leaf);
        }
        .leaf-bg svg.l1 { top: -40px; right: -60px; width: 320px; opacity: 0.10; transform: rotate(20deg); }
        .leaf-bg svg.l2 { bottom: -80px; left: -100px; width: 380px; opacity: 0.08; transform: rotate(-30deg); }
        .leaf-bg svg.l3 { top: 38%; right: 4%; width: 140px; opacity: 0.06; transform: rotate(80deg); }
        @keyframes rise {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Hojas decorativas de fondo */}
      <div className="leaf-bg" aria-hidden="true">
        <svg className="l1" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 10 C 60 50, 40 110, 70 180 C 110 150, 160 100, 100 10 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.5" />
          <path d="M100 30 C 70 60, 60 110, 80 170" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <svg className="l2" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M30 100 C 80 40, 140 30, 180 60 C 150 130, 90 170, 30 100 Z" />
          <path d="M50 100 L 160 70" />
          <path d="M70 130 L 150 90" />
        </svg>
        <svg className="l3" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M50 5 C 25 30, 25 70, 50 95 C 75 70, 75 30, 50 5 Z" />
          <path d="M50 10 L 50 95" />
        </svg>
      </div>

      <DashboardNav active="mascotas" usuarioNombre={usuario?.nombre} />

      <div className="relative z-10 max-w-[1100px] mx-auto px-6 sm:px-8 py-12 sm:py-14">

        {/* Header con stats */}
        <header
          className="grid sm:grid-cols-[1fr_auto] gap-8 sm:items-end mb-10"
          style={{ opacity: 0, animation: 'rise 600ms 60ms cubic-bezier(.2,.7,.2,1) forwards' }}
        >
          <div>
            <div
              className="inline-flex items-center gap-2.5 text-[11px] font-bold uppercase mb-5"
              style={{ letterSpacing: '0.18em', color: 'var(--d-green-mid)' }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: 'var(--d-green-leaf)',
                  boxShadow: '0 0 0 4px var(--d-green-mist)',
                }}
              />
              Tu panel
            </div>
            <h1
              className="font-semibold leading-[1.05]"
              style={{
                fontFamily: 'var(--font-manrope), system-ui, sans-serif',
                fontSize: 'clamp(2.3rem, 5vw, 3.4rem)',
                letterSpacing: '-0.03em',
                color: 'var(--d-green-deep)',
              }}
            >
              Mis{' '}
              <span
                className="relative inline-block"
                style={{ color: 'var(--d-green-leaf)', fontWeight: 500 }}
              >
                mascotas
                <span
                  aria-hidden
                  className="absolute left-0 right-0 rounded-sm"
                  style={{
                    bottom: '4px',
                    height: '12px',
                    background: 'var(--d-green-glow)',
                    zIndex: -1,
                  }}
                />
              </span>
            </h1>
          </div>

          {!cargando && !errorCarga && mascotas.length > 0 && (
            <div className="flex gap-7 sm:gap-9 sm:text-right">
              <Stat num={String(totalMascotas).padStart(2, '0')} label="Mascotas" />
              <Stat num={String(resultadosNuevos).padStart(2, '0')} label="Resultados nuevos" highlight={resultadosNuevos > 0} />
              <Stat num={String(totalExamenes).padStart(2, '0')} label="Exámenes" />
            </div>
          )}
        </header>

        {/* Acciones — solo cuando ya hay mascotas o el form está abierto.
            Si no hay mascotas, la única acción vive dentro del estado vacío. */}
        {(mascotas.length > 0 || mostrarForm) && !cargando && !errorCarga && (
          <div
            className="flex flex-wrap gap-2.5 mb-10"
            style={{ opacity: 0, animation: 'rise 600ms 180ms cubic-bezier(.2,.7,.2,1) forwards' }}
          >
            <button
              onClick={() => {
                setErrorMascota(null);
                setMostrarForm((v) => !v);
              }}
              aria-expanded={mostrarForm}
              className="font-semibold text-sm rounded-2xl px-5 py-3 transition-all"
              style={{
                background: mostrarForm ? 'var(--d-bg-soft)' : 'var(--d-green-deep)',
                color: mostrarForm ? 'var(--d-green-deep)' : 'var(--d-green-glow)',
                border: '1px solid ' + (mostrarForm ? 'var(--d-rule)' : 'var(--d-green-deep)'),
              }}
              onMouseEnter={(e) => {
                if (!mostrarForm) {
                  e.currentTarget.style.background = 'var(--d-green-mid)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!mostrarForm) {
                  e.currentTarget.style.background = 'var(--d-green-deep)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {mostrarForm ? 'Cancelar' : '+ Agregar mascota'}
            </button>
            {mascotas.length > 0 && (
              <button
                onClick={() => router.push('/dashboard/agendar')}
                className="font-semibold text-sm rounded-2xl px-5 py-3 transition-all"
                style={{
                  background: 'var(--d-bg-card)',
                  color: 'var(--d-green-deep)',
                  border: '1px solid var(--d-rule)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--d-green-mid)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--d-rule)')}
              >
                Agendar visita
              </button>
            )}
          </div>
        )}

        {/* Form nuevo registro */}
        {mostrarForm && (
          <section
            aria-label="Nueva mascota"
            className="rounded-3xl p-6 sm:p-8 mb-10 relative overflow-hidden"
            style={{
              background: 'var(--d-bg-card)',
              border: '1px solid var(--d-rule-soft)',
              boxShadow: '0 18px 38px -28px rgba(13, 40, 24, 0.18)',
            }}
          >
            {/* Hojita decorativa esquina */}
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute -top-2 -right-3 w-20 h-20 pointer-events-none"
              style={{ color: 'var(--d-green-glow)' }}
            >
              <path
                d="M50 10 C 25 30, 20 70, 45 90 C 70 75, 80 35, 50 10 Z"
                fill="currentColor"
                opacity="0.6"
              />
              <path d="M50 15 L 50 88" />
            </svg>

            <h2
              className="text-lg font-semibold mb-1 relative"
              style={{ color: 'var(--d-green-deep)', letterSpacing: '-0.01em' }}
            >
              Nueva mascota
            </h2>
            <p className="text-sm mb-6 relative" style={{ color: 'var(--d-ink-soft)' }}>
              Completa los datos de tu compañero. Podrás editarlos más tarde.
            </p>

            {errorMascota && (
              <div
                role="alert"
                className="text-sm p-3 rounded-xl mb-5 relative"
                style={{
                  background: 'var(--d-error-bg)',
                  color: 'var(--d-error-ink)',
                }}
              >
                {errorMascota}
              </div>
            )}

            <form onSubmit={crearMascota} className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
              <Field
                id="mascota-nombre"
                label="Nombre"
                value={nuevaMascota.nombre}
                onChange={(v) => setNuevaMascota({ ...nuevaMascota, nombre: v })}
                placeholder="Ej. Lola"
                required
                autoFocus
              />
              <Field
                id="mascota-tipo"
                label="Tipo"
                value={nuevaMascota.tipo}
                onChange={(v) => setNuevaMascota({ ...nuevaMascota, tipo: v })}
                placeholder="Perro, gato, conejo…"
                required
              />
              <Field
                id="mascota-raza"
                label="Raza"
                hint="(opcional)"
                value={nuevaMascota.raza}
                onChange={(v) => setNuevaMascota({ ...nuevaMascota, raza: v })}
                placeholder="Ej. Beagle"
              />
              <Field
                id="mascota-edad"
                label="Edad"
                hint="(años)"
                value={nuevaMascota.edad}
                onChange={(v) => setNuevaMascota({ ...nuevaMascota, edad: v })}
                placeholder="3"
                type="number"
                min={0}
                max={40}
              />
              <button
                type="submit"
                disabled={enviandoMascota}
                className="sm:col-span-2 py-3.5 rounded-2xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{
                  background: 'var(--d-green-deep)',
                  color: 'var(--d-green-glow)',
                }}
                onMouseEnter={(e) => {
                  if (!enviandoMascota) e.currentTarget.style.background = 'var(--d-green-mid)';
                }}
                onMouseLeave={(e) => {
                  if (!enviandoMascota) e.currentTarget.style.background = 'var(--d-green-deep)';
                }}
              >
                {enviandoMascota ? 'Guardando…' : 'Guardar mascota'}
              </button>
            </form>
          </section>
        )}

        {/* Sección de lista */}
        {!cargando && !errorCarga && mascotas.length > 0 && (
          <div
            className="flex items-baseline justify-between mb-5"
            style={{ opacity: 0, animation: 'rise 600ms 280ms cubic-bezier(.2,.7,.2,1) forwards' }}
          >
            <h2
              className="font-semibold text-base"
              style={{ color: 'var(--d-green-deep)', letterSpacing: '-0.01em' }}
            >
              Tus compañeros
            </h2>
            <span
              className="text-xs px-3 py-1 rounded-full"
              style={{
                fontFamily: 'var(--font-dm-mono), ui-monospace, monospace',
                background: 'var(--d-bg-soft)',
                color: 'var(--d-ink-mute)',
                letterSpacing: '0.02em',
              }}
            >
              {mascotas.length} {mascotas.length === 1 ? 'ficha' : 'fichas'}
            </span>
          </div>
        )}

        {/* Loading */}
        {cargando ? (
          <div aria-busy="true" aria-label="Cargando mascotas" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-3xl p-6 animate-pulse"
                style={{
                  background: 'var(--d-bg-card)',
                  border: '1px solid var(--d-rule-soft)',
                  height: '230px',
                }}
              >
                <div className="flex gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl" style={{ background: 'var(--d-bg-soft)' }} />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-24 rounded" style={{ background: 'var(--d-bg-soft)' }} />
                    <div className="h-3 w-16 rounded" style={{ background: 'var(--d-rule-soft)' }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded" style={{ background: 'var(--d-rule-soft)' }} />
                  <div className="h-3 w-3/4 rounded" style={{ background: 'var(--d-rule-soft)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : errorCarga ? (
          <div
            role="alert"
            className="rounded-3xl p-10 text-center"
            style={{
              background: 'var(--d-error-bg)',
              color: 'var(--d-error-ink)',
              border: '1px solid #f5c4b8',
            }}
          >
            <p className="font-semibold mb-2">No pudimos cargar tus mascotas</p>
            <p className="text-sm mb-5 opacity-90">Revisa tu conexión e intenta nuevamente.</p>
            <button
              onClick={() => usuario && cargarMascotas(usuario.id)}
              className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors"
              style={{ background: 'var(--d-green-deep)', color: 'var(--d-green-glow)' }}
            >
              Reintentar
            </button>
          </div>
        ) : mascotas.length === 0 ? (
          // Estado vacío
          <section
            aria-label="Sin mascotas registradas"
            className="rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
            style={{
              background: 'var(--d-bg-card)',
              border: '1px solid var(--d-rule-soft)',
            }}
          >
            <svg
              aria-hidden
              viewBox="0 0 200 200"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute pointer-events-none"
              style={{
                bottom: -30,
                left: -20,
                width: 180,
                color: 'var(--d-green-glow)',
                transform: 'rotate(-30deg)',
              }}
            >
              <path
                d="M100 10 C 50 60, 40 130, 80 180 C 130 150, 170 90, 100 10 Z"
                fill="currentColor"
                opacity="0.55"
              />
              <path d="M100 20 L 100 175" />
            </svg>
            <div
              className="relative w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center text-3xl"
              style={{ background: 'linear-gradient(135deg, var(--d-green-mist), var(--d-green-glow))' }}
            >
              🌿
            </div>
            <span
              className="relative inline-flex items-center gap-2 text-[11px] font-bold uppercase mb-3 justify-center"
              style={{ letterSpacing: '0.18em', color: 'var(--d-green-mid)' }}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{
                  background: 'var(--d-green-leaf)',
                  boxShadow: '0 0 0 4px var(--d-green-mist)',
                }}
              />
              Empecemos
            </span>
            <h2
              className="relative text-2xl sm:text-[1.7rem] font-semibold leading-tight mb-3"
              style={{ color: 'var(--d-green-deep)', letterSpacing: '-0.02em' }}
            >
              Aún no tienes una{' '}
              <span style={{ color: 'var(--d-green-leaf)', fontWeight: 500 }}>
                mascota registrada
              </span>
            </h2>
            <p
              className="relative text-sm max-w-md mx-auto mb-7 leading-relaxed"
              style={{ color: 'var(--d-ink-soft)' }}
            >
              Agrega su nombre, tipo y edad para empezar a llevar su ficha clínica
              y agendar visitas a domicilio.
            </p>
            <button
              onClick={() => {
                setErrorMascota(null);
                setMostrarForm(true);
              }}
              className="relative px-6 py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{ background: 'var(--d-green-deep)', color: 'var(--d-green-glow)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--d-green-mid)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--d-green-deep)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              + Agregar mi primera mascota
            </button>
          </section>
        ) : (
          // Grid de mascotas
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mascotas.map((mascota, idx) => {
              const totalEx = mascota.examenes.length;
              const disponibles = mascota.examenes.filter((e) => e.estado === 'DISPONIBLE').length;
              const icon = getAnimalIcon(mascota.tipo);
              return (
                <li key={mascota.id} style={{
                  opacity: 0,
                  animation: `rise 600ms ${360 + idx * 80}ms cubic-bezier(.2,.7,.2,1) forwards`,
                }}>
                  <PetCard
                    mascota={mascota}
                    icon={icon}
                    disponibles={disponibles}
                    totalEx={totalEx}
                    onClick={() => router.push(`/dashboard/mascotas/${mascota.id}`)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

/* ───────── Subcomponentes ───────── */

function Stat({ num, label, highlight = false }: { num: string; label: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col">
      <span
        className="font-bold text-[2rem] leading-none"
        style={{
          color: highlight ? 'var(--d-green-leaf)' : 'var(--d-green-deep)',
          letterSpacing: '-0.02em',
        }}
      >
        {num}
      </span>
      <span
        className="text-[0.66rem] uppercase mt-1.5"
        style={{
          fontFamily: 'var(--font-dm-mono), ui-monospace, monospace',
          letterSpacing: '0.1em',
          color: 'var(--d-ink-mute)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Field({
  id, label, hint, value, onChange, placeholder, required, autoFocus, type = 'text', min, max,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  type?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase mb-2"
        style={{ letterSpacing: '0.1em', color: 'var(--d-ink-mute)' }}
      >
        {label}
        {hint && (
          <span className="font-normal ml-1.5 normal-case" style={{ letterSpacing: 0 }}>
            {hint}
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        min={min}
        max={max}
        inputMode={type === 'number' ? 'numeric' : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
        style={{
          background: 'var(--d-bg)',
          color: 'var(--d-ink)',
          border: '1px solid var(--d-rule)',
          fontFamily: 'var(--font-manrope), system-ui, sans-serif',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--d-green-mid)';
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--d-green-glow)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--d-rule)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
    </div>
  );
}

function PetCard({
  mascota,
  icon,
  disponibles,
  totalEx,
  onClick,
}: {
  mascota: Mascota;
  icon: string;
  disponibles: number;
  totalEx: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Ver ficha de ${mascota.nombre}`}
      className="pet-card w-full text-left rounded-3xl p-6 relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {/* Hoja decorativa */}
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pet-card__leaf absolute pointer-events-none"
      >
        <path
          d="M50 10 C 25 30, 20 70, 45 90 C 70 75, 80 35, 50 10 Z"
          fill="currentColor"
          opacity="0.55"
        />
        <path d="M50 15 L 50 88" />
      </svg>

      {/* Cabecera */}
      <div className="flex items-center gap-3.5 mb-5 relative">
        <div
          className="rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            width: 52,
            height: 52,
            background: 'linear-gradient(135deg, var(--d-green-mist), var(--d-green-glow))',
          }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div
            className="pet-card__name font-bold text-[1.4rem] leading-[1.1] truncate"
            style={{ color: 'var(--d-green-deep)', letterSpacing: '-0.02em' }}
          >
            {mascota.nombre}
          </div>
          <div
            className="text-[0.7rem] mt-1 uppercase truncate"
            style={{
              fontFamily: 'var(--font-dm-mono), ui-monospace, monospace',
              color: 'var(--d-green-mid)',
              letterSpacing: '0.1em',
            }}
          >
            {[mascota.tipo, mascota.raza].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div
        className="grid grid-cols-2 gap-2 py-4 mb-4 relative"
        style={{
          borderTop: '1px solid var(--d-rule-soft)',
          borderBottom: '1px solid var(--d-rule-soft)',
        }}
      >
        <MetaItem
          k="Edad"
          v={
            mascota.edad != null
              ? `${mascota.edad} ${mascota.edad === 1 ? 'año' : 'años'}`
              : '—'
          }
        />
        <MetaItem
          k="Exámenes"
          v={totalEx === 0 ? 'Sin registros' : `${totalEx} ${totalEx === 1 ? 'total' : 'totales'}`}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center relative">
        {disponibles > 0 ? (
          <span
            className="inline-flex items-center gap-1.5 text-[0.74rem] font-semibold px-2.5 py-1 rounded-full"
            style={{
              background: 'var(--d-green-glow)',
              color: 'var(--d-green-deep)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'currentColor' }}
            />
            {disponibles} {disponibles === 1 ? 'disponible' : 'disponibles'}
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 text-[0.74rem] font-medium px-2.5 py-1 rounded-full"
            style={{
              background: 'var(--d-bg-soft)',
              color: 'var(--d-ink-soft)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: 'currentColor' }}
            />
            Al día
          </span>
        )}
        <span className="pet-card__arrow w-9 h-9 rounded-full flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M6 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      {/* Animaciones de hover en cascada CSS */}
      <style jsx>{`
        .pet-card {
          background: var(--d-bg-card);
          border: 1px solid var(--d-rule-soft);
          transition: transform 0.3s cubic-bezier(.2,.7,.2,1),
                      border-color 0.3s ease,
                      box-shadow 0.3s ease;
          cursor: pointer;
        }
        .pet-card:hover {
          border-color: var(--d-green-leaf);
          transform: translateY(-3px);
          box-shadow: 0 18px 38px -22px rgba(13, 40, 24, 0.35);
        }

        .pet-card__leaf {
          top: -12px;
          right: -16px;
          width: 92px;
          height: 92px;
          color: var(--d-green-glow);
          transform-origin: 70% 30%;
          transition: transform 0.5s cubic-bezier(.2,.7,.2,1),
                      color 0.4s ease;
        }
        .pet-card:hover .pet-card__leaf {
          transform: rotate(20deg) scale(1.12);
          color: var(--d-green-mist);
        }

        .pet-card__name {
          transition: color 0.25s ease;
        }
        .pet-card:hover .pet-card__name {
          color: var(--d-green-leaf);
        }

        .pet-card__arrow {
          background: var(--d-bg-soft);
          color: var(--d-green-deep);
          transition: background-color 0.25s ease,
                      color 0.25s ease,
                      transform 0.3s cubic-bezier(.2,.7,.2,1);
        }
        .pet-card:hover .pet-card__arrow {
          background: var(--d-green-deep);
          color: var(--d-green-glow);
          transform: translateX(4px);
        }
      `}</style>
    </button>
  );
}

function MetaItem({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div
        className="text-[0.6rem] uppercase mb-0.5"
        style={{
          fontFamily: 'var(--font-dm-mono), ui-monospace, monospace',
          letterSpacing: '0.12em',
          color: 'var(--d-ink-mute)',
        }}
      >
        {k}
      </div>
      <div className="font-semibold text-[0.92rem]" style={{ color: 'var(--d-ink)' }}>
        {v}
      </div>
    </div>
  );
}
