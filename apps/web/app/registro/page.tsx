'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { getSupabase } from '../../lib/supabase';
import Logo from '../../components/Logo';
import Turnstile, { type TurnstileHandle } from '../auth/_components/Turnstile';

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<TurnstileHandle>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGoogle = async () => {
    setCargando(true);
    setError('');
    try {
      const { error: oauthError } = await getSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });
      if (oauthError) setError('No se pudo conectar con Google. Intenta de nuevo.');
    } catch {
      setError('Error al conectar con Google.');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const res = await api.post('/auth/registro', { ...form, captchaToken });
      // Si el correo ya estaba registrado el backend NO devuelve token (para
      // no permitir enumerar cuentas). Redirigimos a login con un mensaje
      // neutro que cubre tanto "nuevo" como "ya existía".
      if (!res.data?.token) {
        router.push('/login?registro=pendiente');
        return;
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      router.push('/dashboard');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || 'Error al registrarse');
      // El token de captcha es de un solo uso: tras un envío fallido hay que
      // pedir uno nuevo o el reintento sería rechazado por duplicado.
      captchaRef.current?.reset();
    } finally {
      setCargando(false);
    }
  };

  const passLength = form.password.length;
  const passStrength = passLength === 0 ? 0 : passLength < 8 ? 1 : passLength < 12 ? 2 : 3;

  return (
    <main className="auth-bg min-h-screen relative">
      <AuthStyles />

      {/* Hojas decorativas */}
      <div className="leaf-bg" aria-hidden="true">
        <svg className="l1" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 20c-30 0-55 25-55 55 0 35 25 55 55 80 30-25 55-45 55-80 0-30-25-55-55-55zm0 30c14 0 25 11 25 25s-11 25-25 25-25-11-25-25 11-25 25-25z" />
        </svg>
        <svg className="l2" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 20c-30 0-55 25-55 55 0 35 25 55 55 80 30-25 55-45 55-80 0-30-25-55-55-55zm0 30c14 0 25 11 25 25s-11 25-25 25-25-11-25-25 11-25 25-25z" />
        </svg>
        <svg className="l3" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 20c-30 0-55 25-55 55 0 35 25 55 55 80 30-25 55-45 55-80 0-30-25-55-55-55zm0 30c14 0 25 11 25 25s-11 25-25 25-25-11-25-25 11-25 25-25z" />
        </svg>
      </div>

      <div className="auth-shell">
        {/* Panel izquierdo · marca */}
        <aside className="brand-panel">
          <Link href="/" className="brand-link">
            <Logo size="md" variant="dark" />
            <span className="brand-tag">Veterinario a domicilio</span>
          </Link>

          <div className="brand-quote">
            <span className="quote-eyebrow"><span className="line" /> ÚNETE A SILVESTRA</span>
            <p className="quote-body">
              Crea tu cuenta y comienza a <em>cuidar mejor</em> de quien más quieres.
            </p>
          </div>

          <div className="brand-meta">
            <div className="meta-row">
              <span className="meta-num">01</span>
              <span className="meta-text">Registro gratuito en menos de 1 minuto</span>
            </div>
            <div className="meta-row">
              <span className="meta-num">02</span>
              <span className="meta-text">Agenda visitas a domicilio sin esperas</span>
            </div>
            <div className="meta-row">
              <span className="meta-num">03</span>
              <span className="meta-text">Historial clínico siempre disponible</span>
            </div>
          </div>

          <div className="brand-foot">
            <span>© Silvestra Vet</span>
            <span>Valparaíso · Chile</span>
          </div>
        </aside>

        {/* Panel derecho · formulario */}
        <section className="form-panel">
          <div className="form-card">
            <span className="eyebrow"><span className="line" /> CREA TU CUENTA</span>

            <h1 className="title">
              Bienvenido <em>a Silvestra Vet</em>
            </h1>
            <p className="subtitle">
              Registra a tu mascota y agenda visitas a domicilio en minutos.
            </p>

            {error && (
              <div role="alert" className="alert">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M8 4v5M8 11.2v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="form">
              <div className="field">
                <label htmlFor="reg-nombre" className="label">Nombre completo</label>
                <input
                  id="reg-nombre"
                  name="nombre"
                  type="text"
                  required
                  autoComplete="name"
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className="input"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-email" className="label">Correo electrónico</label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  onChange={handleChange}
                  placeholder="juan@ejemplo.com"
                  className="input"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-telefono" className="label">Teléfono</label>
                <input
                  id="reg-telefono"
                  name="telefono"
                  type="tel"
                  required
                  autoComplete="tel"
                  onChange={handleChange}
                  placeholder="+56 9 1234 5678"
                  className="input"
                />
              </div>

              <div className="field">
                <label htmlFor="reg-password" className="label">Contraseña</label>
                <div className="pass-wrap">
                  <input
                    id="reg-password"
                    name="password"
                    type={mostrarPass ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    onChange={handleChange}
                    placeholder="Mínimo 8 caracteres"
                    className="input"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPass((v) => !v)}
                    className="pass-toggle"
                    aria-label={mostrarPass ? 'Ocultar' : 'Mostrar'}
                  >
                    {mostrarPass ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                {passLength > 0 && (
                  <div className="pass-meter">
                    <div className={`bar ${passStrength >= 1 ? 'on' : ''}`} />
                    <div className={`bar ${passStrength >= 2 ? 'on' : ''}`} />
                    <div className={`bar ${passStrength >= 3 ? 'on' : ''}`} />
                    <span className="pass-meter-label">
                      {passStrength === 1 && 'Muy corta'}
                      {passStrength === 2 && 'Aceptable'}
                      {passStrength === 3 && 'Segura'}
                    </span>
                  </div>
                )}
              </div>

              <p className="legal">
                Al crear una cuenta aceptas nuestros{' '}
                <Link href="/legal/terminos" className="legal-link">Términos</Link>
                {' '}y nuestra{' '}
                <Link href="/legal/privacidad" className="legal-link">Política de privacidad</Link>.
              </p>

              <Turnstile ref={captchaRef} onToken={setCaptchaToken} />

              <button
                type="submit"
                disabled={cargando}
                className="btn-primary"
              >
                {cargando ? (
                  <span className="btn-loading">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </span>
                ) : (
                  <>
                    Crear cuenta
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="google-divider">
              <span className="divider-line" /><span className="divider-text">o continúa con</span><span className="divider-line" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={cargando}
              className="btn-google"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
              </svg>
              Continuar con Google
            </button>

            <div className="card-foot">
              <span>¿Ya tienes cuenta?</span>
              <Link href="/login" className="foot-link">
                Inicia sesión
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

          <Link href="/" className="back-home">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Volver al inicio
          </Link>
        </section>
      </div>
    </main>
  );
}

function AuthStyles() {
  return (
    <style jsx global>{`
      .auth-bg {
        --cream: #f5f1e8;
        --paper: #ede7d8;
        --green-deep: #0d2818;
        --green-mid: #1e4030;
        --green-leaf: #2d5040;
        --ink: #1a2418;
        --ink-soft: #4a5042;
        --ink-mute: #8a8e80;
        --rule: rgba(13, 40, 24, 0.12);
        --rule-soft: rgba(13, 40, 24, 0.06);
        background: var(--cream);
        color: var(--ink);
        font-family: var(--font-manrope), system-ui, sans-serif;
      }

      .auth-bg .leaf-bg {
        position: absolute; inset: 0; pointer-events: none; z-index: 0;
        overflow: hidden;
      }
      .auth-bg .leaf-bg svg { position: absolute; color: var(--green-leaf); }
      .auth-bg .leaf-bg svg.l1 { top: -60px; right: -80px; width: 360px; opacity: 0.08; transform: rotate(20deg); }
      .auth-bg .leaf-bg svg.l2 { bottom: -100px; left: 40%; width: 320px; opacity: 0.06; transform: rotate(-25deg); }
      .auth-bg .leaf-bg svg.l3 { top: 30%; left: -60px; width: 240px; opacity: 0.05; transform: rotate(60deg); }

      @keyframes rise {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .auth-bg .auth-shell {
        position: relative; z-index: 1;
        display: grid;
        grid-template-columns: minmax(380px, 1fr) minmax(0, 1.05fr);
        min-height: 100vh;
        width: 100%;
      }
      @media (max-width: 960px) {
        .auth-bg .auth-shell { grid-template-columns: 1fr; min-height: auto; }
      }

      .auth-bg .brand-panel {
        background: var(--green-deep);
        color: var(--cream);
        padding: 56px 56px 40px;
        display: flex; flex-direction: column;
        position: relative;
        overflow: hidden;
      }
      .auth-bg .brand-panel::before {
        content: '';
        position: absolute;
        top: 0; right: 0; bottom: 0;
        width: 1px;
        background: linear-gradient(to bottom, transparent, rgba(245,241,232,0.15), transparent);
      }
      .auth-bg .brand-panel::after {
        content: '';
        position: absolute;
        top: -100px; right: -100px;
        width: 320px; height: 320px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(245,241,232,0.06), transparent 70%);
        pointer-events: none;
      }
      @media (max-width: 960px) {
        .auth-bg .brand-panel { padding: 36px 28px; min-height: 280px; }
      }

      .auth-bg .brand-link {
        display: inline-flex; align-items: center; gap: 16px;
        text-decoration: none; color: var(--cream);
        margin-bottom: 56px;
      }
      .auth-bg .brand-tag {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-size: 14px;
        color: rgba(245,241,232,0.7);
        padding-left: 16px;
        border-left: 1px solid rgba(245,241,232,0.2);
        line-height: 1.3;
      }

      .auth-bg .brand-quote {
        margin-top: auto;
        animation: rise 800ms 100ms cubic-bezier(.2,.7,.2,1) both;
      }
      .auth-bg .quote-eyebrow {
        display: inline-flex; align-items: center; gap: 10px;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px; font-weight: 500;
        letter-spacing: 0.22em;
        color: rgba(245,241,232,0.55);
        margin-bottom: 24px;
      }
      .auth-bg .quote-eyebrow .line {
        width: 28px; height: 1px;
        background: rgba(245,241,232,0.35);
      }
      .auth-bg .quote-body {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: clamp(28px, 3.4vw, 40px);
        line-height: 1.18;
        font-weight: 400;
        color: var(--cream);
        max-width: 460px;
        letter-spacing: -0.01em;
      }
      .auth-bg .quote-body em {
        font-style: italic;
        color: rgba(245,241,232,0.78);
      }

      .auth-bg .brand-meta {
        margin-top: 40px;
        display: flex; flex-direction: column; gap: 14px;
        padding-top: 28px;
        border-top: 1px solid rgba(245,241,232,0.12);
      }
      .auth-bg .meta-row {
        display: flex; align-items: baseline; gap: 16px;
        font-size: 14px;
        color: rgba(245,241,232,0.85);
      }
      .auth-bg .meta-num {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px;
        color: rgba(245,241,232,0.45);
        letter-spacing: 0.08em;
      }

      .auth-bg .brand-foot {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid rgba(245,241,232,0.08);
        display: flex; justify-content: space-between;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px;
        color: rgba(245,241,232,0.4);
        letter-spacing: 0.08em;
      }

      .auth-bg .form-panel {
        padding: 56px;
        display: flex; flex-direction: column;
        justify-content: center;
        position: relative;
      }
      @media (max-width: 960px) {
        .auth-bg .form-panel { padding: 40px 24px; }
      }

      .auth-bg .form-card {
        width: 100%;
        max-width: 440px;
        margin: 0 auto;
        animation: rise 700ms 120ms cubic-bezier(.2,.7,.2,1) both;
      }

      .auth-bg .eyebrow {
        display: inline-flex; align-items: center; gap: 10px;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px; font-weight: 500;
        letter-spacing: 0.22em;
        color: var(--green-deep);
        margin-bottom: 20px;
      }
      .auth-bg .eyebrow .line {
        width: 28px; height: 1px; background: var(--green-deep);
      }

      .auth-bg .title {
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-size: clamp(32px, 3.4vw, 42px);
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.1;
        color: var(--ink);
        margin: 0 0 14px;
      }
      .auth-bg .title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 400;
        color: var(--green-mid);
      }
      .auth-bg .subtitle {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 16px;
        line-height: 1.55;
        color: var(--ink-soft);
        margin: 0 0 28px;
        max-width: 380px;
      }

      .auth-bg .alert {
        display: flex; align-items: center; gap: 10px;
        padding: 12px 14px;
        background: rgba(180, 60, 50, 0.08);
        border: 1px solid rgba(180, 60, 50, 0.2);
        border-radius: 10px;
        color: #8a3e35;
        font-size: 13.5px;
        margin-bottom: 20px;
      }

      .auth-bg .form { display: flex; flex-direction: column; gap: 18px; }
      .auth-bg .field { display: flex; flex-direction: column; }

      .auth-bg .label {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px; font-weight: 500;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: var(--ink-mute);
        margin-bottom: 8px;
      }

      .auth-bg .input {
        width: 100%;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--rule);
        padding: 10px 0 12px;
        font-size: 15.5px;
        color: var(--ink);
        font-family: inherit;
        transition: border-color .25s, padding .25s;
        outline: none;
      }
      .auth-bg .input::placeholder {
        color: var(--ink-mute);
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-size: 15px;
      }
      .auth-bg .input:focus {
        border-bottom-color: var(--green-deep);
        border-bottom-width: 2px;
        padding-bottom: 11px;
      }

      .auth-bg .pass-wrap { position: relative; }
      .auth-bg .pass-toggle {
        position: absolute;
        right: 0; top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px;
        letter-spacing: 0.12em;
        color: var(--ink-mute);
        cursor: pointer;
        padding: 4px 6px;
        transition: color .2s;
        text-transform: uppercase;
      }
      .auth-bg .pass-toggle:hover { color: var(--green-deep); }

      .auth-bg .pass-meter {
        display: flex; align-items: center; gap: 6px;
        margin-top: 10px;
      }
      .auth-bg .pass-meter .bar {
        flex: 1; height: 3px;
        background: var(--rule);
        border-radius: 999px;
        transition: background .25s;
      }
      .auth-bg .pass-meter .bar.on { background: var(--green-deep); }
      .auth-bg .pass-meter-label {
        margin-left: 6px;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px;
        letter-spacing: 0.1em;
        color: var(--ink-mute);
        text-transform: uppercase;
      }

      .auth-bg .legal {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--ink-mute);
        margin: 4px 0 4px;
      }
      .auth-bg .legal-link {
        color: var(--green-deep);
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 3px;
      }
      .auth-bg .legal-link:hover { color: var(--green-mid); }

      .auth-bg .btn-primary {
        margin-top: 8px;
        width: 100%;
        display: inline-flex; align-items: center; justify-content: center;
        gap: 10px;
        background: var(--green-deep);
        color: var(--cream);
        border: none;
        border-radius: 999px;
        padding: 16px 24px;
        font-size: 14.5px;
        font-weight: 600;
        letter-spacing: 0.01em;
        cursor: pointer;
        transition: background .25s, transform .15s;
        font-family: inherit;
      }
      .auth-bg .btn-primary:hover:not(:disabled) {
        background: var(--green-mid);
        transform: translateY(-1px);
      }
      .auth-bg .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }

      .auth-bg .btn-loading {
        display: inline-flex; gap: 6px; padding: 2px 0;
      }
      .auth-bg .btn-loading .dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--cream);
        animation: pulseDot 1.2s infinite ease-in-out;
      }
      .auth-bg .btn-loading .dot:nth-child(2) { animation-delay: 0.2s; }
      .auth-bg .btn-loading .dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes pulseDot {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }

      .auth-bg .card-foot {
        margin-top: 28px;
        padding-top: 22px;
        border-top: 1px solid var(--rule-soft);
        display: flex; align-items: center; justify-content: center;
        gap: 8px;
        font-size: 14px;
        color: var(--ink-soft);
      }
      .auth-bg .foot-link {
        display: inline-flex; align-items: center; gap: 6px;
        color: var(--green-deep);
        font-weight: 600;
        text-decoration: none;
        transition: gap .2s;
      }
      .auth-bg .foot-link:hover { gap: 10px; }

      .auth-bg .back-home {
        position: absolute;
        top: 28px; left: 28px;
        display: inline-flex; align-items: center; gap: 6px;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px; font-weight: 500;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--ink-mute);
        text-decoration: none;
        transition: color .2s;
      }
      .auth-bg .back-home:hover { color: var(--green-deep); }
      @media (max-width: 960px) {
        .auth-bg .back-home { position: static; margin: 16px auto 0; }
      }

      .auth-bg .google-divider {
        display: flex; align-items: center; gap: 12px;
        margin: 22px 0 16px;
      }
      .auth-bg .divider-line { flex: 1; height: 1px; background: var(--rule-soft); }
      .auth-bg .divider-text {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10px; letter-spacing: 0.14em;
        color: var(--ink-mute); white-space: nowrap;
      }
      .auth-bg .btn-google {
        width: 100%;
        display: inline-flex; align-items: center; justify-content: center;
        gap: 10px;
        background: transparent;
        color: var(--ink);
        border: 1px solid var(--rule);
        border-radius: 999px;
        padding: 13px 24px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: border-color .2s, background .2s;
        font-family: inherit;
      }
      .auth-bg .btn-google:hover:not(:disabled) {
        border-color: var(--green-mid);
        background: var(--rule-soft);
      }
      .auth-bg .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
    `}</style>
  );
}
