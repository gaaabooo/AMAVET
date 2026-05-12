'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { getSesion, SesionUsuario, tieneTelefonoValido } from '../../../lib/session';
import Logo from '../../../components/Logo';

export default function CompletarPerfil() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const sesion = getSesion();
    if (!sesion) { router.push('/login'); return; }
    if (tieneTelefonoValido(sesion.telefono)) { router.push('/dashboard'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuario(sesion);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    setCargando(true);
    setError('');
    try {
      const res = await api.patch(`/usuarios/${usuario.id}`, { telefono: telefono.trim() });
      const actualizado: SesionUsuario = { ...usuario, telefono: res.data.telefono };
      localStorage.setItem('usuario', JSON.stringify(actualizado));
      router.push('/dashboard');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || 'No se pudo guardar el teléfono. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (!usuario) return null;

  return (
    <main className="cp-bg">
      <CompletarPerfilStyles />
      <div className="cp-card">
        <div className="cp-head">
          <Logo size="sm" variant="light" />
        </div>

        <span className="cp-eyebrow"><span className="line" /> ÚLTIMO PASO</span>
        <h1 className="cp-title">Hola, <em>{usuario.nombre}</em></h1>
        <p className="cp-subtitle">
          Necesitamos tu número de teléfono para coordinar las visitas a domicilio de tu mascota.
        </p>

        {error && (
          <div role="alert" className="cp-alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="cp-form">
          <div className="cp-field">
            <label htmlFor="telefono" className="cp-label">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              required
              minLength={6}
              autoComplete="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+56 9 1234 5678"
              className="cp-input"
            />
          </div>

          <button type="submit" disabled={cargando} className="cp-btn">
            {cargando ? 'Guardando…' : 'Continuar al panel'}
          </button>
        </form>
      </div>
    </main>
  );
}

function CompletarPerfilStyles() {
  return (
    <style jsx global>{`
      .cp-bg {
        --cream: #f5f1e8;
        --green-deep: #0d2818;
        --green-mid: #1e4030;
        --ink: #1a2418;
        --ink-soft: #4a5042;
        --ink-mute: #8a8e80;
        --rule: rgba(13, 40, 24, 0.12);
        --rule-soft: rgba(13, 40, 24, 0.06);
        min-height: 100vh;
        background: var(--cream);
        color: var(--ink);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        font-family: var(--font-manrope), system-ui, sans-serif;
      }
      .cp-card {
        width: 100%;
        max-width: 440px;
        background: #fff;
        border: 1px solid var(--rule);
        border-radius: 18px;
        padding: 40px 36px;
      }
      .cp-head { margin-bottom: 28px; }
      .cp-eyebrow {
        display: inline-flex; align-items: center; gap: 10px;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px; font-weight: 500;
        letter-spacing: 0.22em;
        color: var(--green-deep);
        margin-bottom: 16px;
      }
      .cp-eyebrow .line { width: 28px; height: 1px; background: var(--green-deep); }
      .cp-title {
        font-size: clamp(26px, 4vw, 32px);
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.1;
        margin: 0 0 12px;
      }
      .cp-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 400;
        color: var(--green-mid);
      }
      .cp-subtitle {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 15.5px;
        line-height: 1.55;
        color: var(--ink-soft);
        margin: 0 0 28px;
      }
      .cp-alert {
        padding: 12px 14px;
        background: rgba(180, 60, 50, 0.08);
        border: 1px solid rgba(180, 60, 50, 0.2);
        border-radius: 10px;
        color: #8a3e35;
        font-size: 13.5px;
        margin-bottom: 20px;
      }
      .cp-form { display: flex; flex-direction: column; gap: 24px; }
      .cp-field { display: flex; flex-direction: column; }
      .cp-label {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px; font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ink-mute);
        margin-bottom: 8px;
      }
      .cp-input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--rule);
        padding: 10px 0 12px;
        font-size: 15.5px;
        color: var(--ink);
        font-family: inherit;
        outline: none;
        transition: border-color .25s, padding .25s;
      }
      .cp-input::placeholder {
        color: var(--ink-mute);
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
      }
      .cp-input:focus {
        border-bottom-color: var(--green-deep);
        border-bottom-width: 2px;
        padding-bottom: 11px;
      }
      .cp-btn {
        width: 100%;
        background: var(--green-deep);
        color: var(--cream);
        border: none;
        border-radius: 999px;
        padding: 15px 24px;
        font-size: 14.5px;
        font-weight: 600;
        cursor: pointer;
        transition: background .25s, transform .15s;
        font-family: inherit;
      }
      .cp-btn:hover:not(:disabled) {
        background: var(--green-mid);
        transform: translateY(-1px);
      }
      .cp-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    `}</style>
  );
}
