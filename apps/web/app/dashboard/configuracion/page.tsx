'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getSesion } from '@/lib/session';
import DashboardNav from '@/components/DashboardNav';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol?: string;
}

export default function Configuracion() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Perfil
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilOk, setPerfilOk] = useState(false);
  const [perfilError, setPerfilError] = useState<string | null>(null);

  // Password
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirma, setPasswordConfirma] = useState('');
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirma, setVerConfirma] = useState(false);
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [passOk, setPassOk] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  useEffect(() => {
    const sesion = getSesion();
    if (!sesion) { router.push('/login'); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsuario(sesion);
    setNombre(sesion.nombre || '');
    setTelefono(sesion.telefono || '');
    setCargando(false);
  }, [router]);

  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    setPerfilError(null);
    setPerfilOk(false);

    const nombreT = nombre.trim();
    const telefonoT = telefono.trim();

    if (nombreT.length < 2) {
      setPerfilError('El nombre debe tener al menos 2 caracteres.');
      return;
    }
    if (telefonoT.length < 6) {
      setPerfilError('El teléfono no parece válido.');
      return;
    }

    setGuardandoPerfil(true);
    try {
      const res = await api.patch(`/usuarios/${usuario.id}`, {
        nombre: nombreT,
        telefono: telefonoT,
      });
      const actualizado = res.data;
      const nuevo = { ...usuario, nombre: actualizado.nombre, telefono: actualizado.telefono };
      setUsuario(nuevo);
      localStorage.setItem('usuario', JSON.stringify(nuevo));
      setPerfilOk(true);
      setTimeout(() => setPerfilOk(false), 3500);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setPerfilError(msg || 'No se pudo guardar el perfil. Intenta de nuevo.');
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const cambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;
    setPassError(null);
    setPassOk(false);

    if (!passwordActual) {
      setPassError('Ingresa tu contraseña actual.');
      return;
    }
    if (passwordNueva.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (passwordNueva !== passwordConfirma) {
      setPassError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (passwordActual === passwordNueva) {
      setPassError('La nueva contraseña debe ser distinta de la actual.');
      return;
    }

    setGuardandoPass(true);
    try {
      await api.patch(`/usuarios/${usuario.id}/password`, {
        passwordActual,
        passwordNueva,
      });
      setPassOk(true);
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirma('');
      setTimeout(() => setPassOk(false), 3500);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setPassError(msg || 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardandoPass(false);
    }
  };

  const iniciales = usuario?.nombre
    ?.trim()
    .split(/\s+/)
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '·';

  if (cargando) {
    return (
      <main className="dash-bg min-h-screen relative">
        <CfgStyles />
        <DashboardNav active="configuracion" />
        <div className="relative z-10 max-w-[1080px] mx-auto px-6 sm:px-8 py-12 space-y-6 animate-pulse">
          <div className="h-16 w-80 rounded-xl" style={{ background: 'var(--d-bg-card)' }} />
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-4 h-72 rounded-3xl" style={{ background: 'var(--d-bg-card)' }} />
            <div className="col-span-8 h-96 rounded-3xl" style={{ background: 'var(--d-bg-card)' }} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dash-bg min-h-screen relative overflow-hidden">
      <CfgStyles />

      {/* Hojas */}
      <div className="leaf-bg" aria-hidden="true">
        <svg className="l1" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 10 C 60 50, 40 110, 70 180 C 110 150, 160 100, 100 10 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.5" />
          <path d="M100 30 C 70 60, 60 110, 80 170" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <svg className="l2" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M30 100 C 80 40, 140 30, 180 60 C 150 130, 90 170, 30 100 Z" />
          <path d="M50 100 L 160 70" />
        </svg>
      </div>

      <DashboardNav active="configuracion" usuarioNombre={usuario?.nombre} />

      <div className="relative z-10 max-w-[1080px] mx-auto px-6 sm:px-10 py-12">
        {/* Header */}
        <div className="cfg-header" style={{ opacity: 0, animation: 'rise 700ms 60ms cubic-bezier(.2,.7,.2,1) forwards' }}>
          <div className="cfg-eyebrow">
            <span className="line" /> AJUSTES DE LA CUENTA
          </div>
          <h1 className="cfg-title">
            Tu <em>configuración</em>
          </h1>
          <p className="cfg-lead">
            Administra cómo te identificamos en Silvestra. Tu correo es el identificador único de la cuenta y no se puede modificar.
          </p>
        </div>

        <div className="cfg-grid">

          {/* Sidebar perfil */}
          <aside className="cfg-side">
            <div className="cfg-card profile-card">
              <svg className="card-leaf" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
                <path d="M50 10 C 70 30, 80 50, 50 90 C 20 50, 30 30, 50 10 Z" />
              </svg>
              <div className="avatar-circle">{iniciales}</div>
              <div className="profile-name">{usuario?.nombre}</div>
              <div className="profile-email">{usuario?.email}</div>
              <div className="profile-meta">
                <div className="pm-row">
                  <span className="pm-k">CUENTA</span>
                  <span className="pm-v">{usuario?.rol === 'ADMIN' ? 'Administrador' : 'Tutor'}</span>
                </div>
                <div className="pm-row">
                  <span className="pm-k">ID</span>
                  <span className="pm-v mono">{usuario?.id.slice(0, 8)}…</span>
                </div>
              </div>
            </div>

            <nav className="cfg-nav">
              <a href="#perfil" className="cfg-nav-item active">
                <span className="num">01</span> Datos personales
              </a>
              <a href="#password" className="cfg-nav-item">
                <span className="num">02</span> Contraseña
              </a>
              <a href="#email" className="cfg-nav-item">
                <span className="num">03</span> Correo electrónico
              </a>
            </nav>
          </aside>

          {/* Forms */}
          <div className="cfg-main">

            {/* Datos personales */}
            <section id="perfil" className="cfg-section" data-num="01">
              <div className="cfg-section-head">
                <span className="cfg-section-num">§ 01</span>
                <h2 className="cfg-section-title">Datos <em>personales</em></h2>
              </div>
              <p className="cfg-section-lead">Modifica tu nombre y teléfono de contacto.</p>

              <form onSubmit={guardarPerfil} className="cfg-form">
                <div className="field-row">
                  <div>
                    <label className="field-label">Nombre completo</label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Cómo te llamas"
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Teléfono</label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="field-input"
                    />
                  </div>
                </div>

                {perfilError && <div className="cfg-alert error">{perfilError}</div>}
                {perfilOk && <div className="cfg-alert success">Perfil actualizado correctamente.</div>}

                <div className="cfg-form-foot">
                  <button type="submit" disabled={guardandoPerfil} className="btn-primary">
                    {guardandoPerfil ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </section>

            {/* Password */}
            <section id="password" className="cfg-section" data-num="02">
              <div className="cfg-section-head">
                <span className="cfg-section-num">§ 02</span>
                <h2 className="cfg-section-title">Cambiar <em>contraseña</em></h2>
              </div>
              <p className="cfg-section-lead">
                Por seguridad, debes confirmar tu contraseña actual antes de definir una nueva. Mínimo 6 caracteres.
              </p>

              <form onSubmit={cambiarPassword} className="cfg-form">
                <div>
                  <label className="field-label">Contraseña actual</label>
                  <div className="password-wrap">
                    <input
                      type={verActual ? 'text' : 'password'}
                      value={passwordActual}
                      onChange={(e) => setPasswordActual(e.target.value)}
                      autoComplete="current-password"
                      className="field-input"
                    />
                    <button type="button" onClick={() => setVerActual(v => !v)} className="password-toggle" aria-label="Mostrar contraseña">
                      {verActual ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>

                <div className="field-row" style={{ marginTop: '20px' }}>
                  <div>
                    <label className="field-label">Nueva contraseña</label>
                    <div className="password-wrap">
                      <input
                        type={verNueva ? 'text' : 'password'}
                        value={passwordNueva}
                        onChange={(e) => setPasswordNueva(e.target.value)}
                        autoComplete="new-password"
                        className="field-input"
                      />
                      <button type="button" onClick={() => setVerNueva(v => !v)} className="password-toggle" aria-label="Mostrar contraseña">
                        {verNueva ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="field-label">Confirma la nueva</label>
                    <div className="password-wrap">
                      <input
                        type={verConfirma ? 'text' : 'password'}
                        value={passwordConfirma}
                        onChange={(e) => setPasswordConfirma(e.target.value)}
                        autoComplete="new-password"
                        className="field-input"
                      />
                      <button type="button" onClick={() => setVerConfirma(v => !v)} className="password-toggle" aria-label="Mostrar contraseña">
                        {verConfirma ? 'Ocultar' : 'Ver'}
                      </button>
                    </div>
                  </div>
                </div>

                {passError && <div className="cfg-alert error">{passError}</div>}
                {passOk && <div className="cfg-alert success">Contraseña actualizada correctamente.</div>}

                <div className="cfg-form-foot">
                  <button type="submit" disabled={guardandoPass} className="btn-primary">
                    {guardandoPass ? 'Actualizando…' : 'Cambiar contraseña'}
                  </button>
                </div>
              </form>
            </section>

            {/* Email (read-only) */}
            <section id="email" className="cfg-section" data-num="03">
              <div className="cfg-section-head">
                <span className="cfg-section-num">§ 03</span>
                <h2 className="cfg-section-title">Correo <em>electrónico</em></h2>
              </div>
              <p className="cfg-section-lead">
                Tu correo es el identificador con el que iniciamos sesión y enviamos confirmaciones. Si necesitas cambiarlo, contacta al equipo de soporte desde el centro de ayuda.
              </p>

              <div className="email-readonly">
                <div className="email-icon">@</div>
                <div className="email-info">
                  <div className="email-label">CORREO ACTUAL</div>
                  <div className="email-value">{usuario?.email}</div>
                </div>
                <button onClick={() => router.push('/dashboard/ayuda')} className="btn-ghost">
                  Ir a soporte
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}

function CfgStyles() {
  return (
    <style jsx global>{`
      .dash-bg {
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
        --d-amber: #c9930b;
        --d-amber-soft: #fcebbf;
        --d-rose: #b15f4a;
        --d-rose-soft: #fadcd2;
        background: var(--d-bg);
        color: var(--d-ink);
        font-family: var(--font-manrope), system-ui, sans-serif;
      }
      .dash-bg .leaf-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
      .dash-bg .leaf-bg svg { position: absolute; color: var(--d-green-leaf); }
      .dash-bg .leaf-bg svg.l1 { top: -40px; right: -60px; width: 320px; opacity: 0.10; transform: rotate(20deg); }
      .dash-bg .leaf-bg svg.l2 { bottom: -80px; left: -100px; width: 380px; opacity: 0.08; transform: rotate(-30deg); }
      @keyframes rise {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .dash-bg .cfg-header {
        margin-bottom: 48px;
        max-width: 720px;
      }
      .dash-bg .cfg-eyebrow {
        display: inline-flex; align-items: center; gap: 12px;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--d-green-mid);
        margin-bottom: 14px;
      }
      .dash-bg .cfg-eyebrow .line { width: 28px; height: 1px; background: var(--d-green-mid); }
      .dash-bg .cfg-title {
        font-size: clamp(2.2rem, 5vw, 3.2rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.05;
        color: var(--d-green-deep);
        margin-bottom: 14px;
      }
      .dash-bg .cfg-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 300;
        color: var(--d-green-mid);
      }
      .dash-bg .cfg-lead {
        font-size: 15px;
        color: var(--d-ink-soft);
        line-height: 1.6;
      }

      .dash-bg .cfg-grid {
        display: grid;
        grid-template-columns: 280px 1fr;
        gap: 48px;
        position: relative;
        z-index: 1;
      }
      @media (max-width: 900px) {
        .dash-bg .cfg-grid { grid-template-columns: 1fr; gap: 28px; }
      }

      /* Sidebar */
      .dash-bg .cfg-side {
        position: sticky; top: 32px; align-self: start;
      }
      .dash-bg .cfg-card {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 20px;
      }
      .dash-bg .profile-card {
        padding: 28px 24px;
        text-align: center;
        position: relative;
        overflow: hidden;
        margin-bottom: 18px;
      }
      .dash-bg .card-leaf {
        position: absolute;
        top: -20px; right: -20px;
        width: 100px;
        opacity: 0.07;
        color: var(--d-green-mid);
        pointer-events: none;
      }
      .dash-bg .avatar-circle {
        width: 80px; height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--d-green-mist), var(--d-green-glow));
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 16px;
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 400;
        font-size: 30px;
        color: var(--d-green-deep);
        box-shadow: 0 14px 30px -16px rgba(13, 40, 24, 0.4);
      }
      .dash-bg .profile-name {
        font-size: 17px; font-weight: 700;
        color: var(--d-green-deep);
        margin-bottom: 4px;
      }
      .dash-bg .profile-email {
        font-size: 12px;
        color: var(--d-ink-mute);
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        word-break: break-all;
        margin-bottom: 18px;
      }
      .dash-bg .profile-meta {
        border-top: 1px solid var(--d-rule-soft);
        padding-top: 14px;
        text-align: left;
      }
      .dash-bg .pm-row {
        display: flex; justify-content: space-between;
        padding: 4px 0;
        font-size: 11px;
      }
      .dash-bg .pm-k {
        color: var(--d-ink-mute);
        font-weight: 700;
        letter-spacing: 0.15em;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
      }
      .dash-bg .pm-v { color: var(--d-ink); font-weight: 600; }
      .dash-bg .pm-v.mono { font-family: var(--font-dm-mono), ui-monospace, monospace; font-weight: 500; }

      /* Sidebar nav */
      .dash-bg .cfg-nav {
        display: flex; flex-direction: column;
        gap: 2px;
      }
      .dash-bg .cfg-nav-item {
        display: flex; align-items: center; gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 13px; font-weight: 500;
        color: var(--d-ink-soft);
        text-decoration: none;
        transition: all .15s;
      }
      .dash-bg .cfg-nav-item:hover {
        background: var(--d-bg-card);
        color: var(--d-green-mid);
      }
      .dash-bg .cfg-nav-item.active {
        background: var(--d-bg-card);
        color: var(--d-green-deep);
        font-weight: 600;
        border: 1px solid var(--d-rule-soft);
      }
      .dash-bg .cfg-nav-item .num {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 10px;
        color: var(--d-ink-mute);
        letter-spacing: 0.08em;
      }

      /* Sections */
      .dash-bg .cfg-main { min-width: 0; }
      .dash-bg .cfg-section {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 24px;
        padding: 36px;
        margin-bottom: 24px;
        position: relative;
        overflow: hidden;
      }
      .dash-bg .cfg-section::before {
        content: attr(data-num);
        position: absolute;
        top: -10px; right: 16px;
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-size: 90px;
        color: var(--d-ink);
        opacity: 0.04;
        font-weight: 300;
        line-height: 1;
        z-index: 0;
        pointer-events: none;
      }
      .dash-bg .cfg-section-head {
        display: flex; align-items: baseline; gap: 14px;
        margin-bottom: 8px;
        position: relative; z-index: 1;
      }
      .dash-bg .cfg-section-num {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px;
        color: var(--d-ink-mute);
        letter-spacing: 0.08em;
      }
      .dash-bg .cfg-section-title {
        font-size: 22px; font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--d-green-deep);
      }
      .dash-bg .cfg-section-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 300;
        color: var(--d-green-mid);
      }
      .dash-bg .cfg-section-lead {
        font-size: 13px;
        color: var(--d-ink-mute);
        margin-bottom: 28px;
        position: relative; z-index: 1;
        line-height: 1.55;
      }
      .dash-bg .cfg-form { position: relative; z-index: 1; }

      .dash-bg .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      @media (max-width: 640px) {
        .dash-bg .field-row { grid-template-columns: 1fr; }
        .dash-bg .cfg-section { padding: 28px 22px; }
        .dash-bg .profile-card { padding: 24px 18px; }
      }
      .dash-bg .field-label {
        display: block;
        font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.18em;
        color: var(--d-ink-mute);
        margin-bottom: 8px;
      }
      .dash-bg .field-input {
        width: 100%;
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 12px;
        padding: 13px 16px;
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-size: 14px;
        color: var(--d-ink);
        outline: none;
        transition: border-color .2s, box-shadow .2s;
      }
      .dash-bg .field-input:focus {
        border-color: var(--d-green-mid);
        box-shadow: 0 0 0 4px rgba(31, 77, 51, 0.08);
      }

      .dash-bg .password-wrap { position: relative; }
      .dash-bg .password-wrap .field-input { padding-right: 70px; }
      .dash-bg .password-toggle {
        position: absolute;
        top: 50%; right: 12px;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        color: var(--d-ink-mute);
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0.05em;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: color .15s, background .15s;
      }
      .dash-bg .password-toggle:hover {
        color: var(--d-green-mid);
        background: var(--d-bg-soft);
      }

      .dash-bg .cfg-alert {
        margin-top: 18px;
        padding: 12px 14px;
        border-radius: 12px;
        font-size: 13px;
      }
      .dash-bg .cfg-alert.error {
        background: var(--d-rose-soft);
        color: var(--d-rose);
      }
      .dash-bg .cfg-alert.success {
        background: var(--d-green-glow);
        color: var(--d-green-mid);
      }

      .dash-bg .cfg-form-foot {
        margin-top: 24px;
        display: flex;
        justify-content: flex-end;
      }
      .dash-bg .btn-primary {
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-weight: 600;
        font-size: 0.88rem;
        padding: 0.85rem 1.45rem;
        border-radius: 14px;
        border: 1px solid var(--d-green-deep);
        cursor: pointer;
        background: var(--d-green-deep);
        color: var(--d-green-glow);
        transition: all .2s ease;
      }
      .dash-bg .btn-primary:hover:not(:disabled) {
        background: var(--d-green-mid);
        transform: translateY(-1px);
      }
      .dash-bg .btn-primary:disabled {
        opacity: 0.5; cursor: not-allowed;
      }
      .dash-bg .btn-ghost {
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-weight: 600;
        font-size: 0.84rem;
        padding: 0.65rem 1.1rem;
        border-radius: 12px;
        border: 1px solid var(--d-rule);
        background: transparent;
        color: var(--d-green-deep);
        cursor: pointer;
        transition: all .15s ease;
      }
      .dash-bg .btn-ghost:hover { border-color: var(--d-green-mid); background: var(--d-bg-soft); }

      /* Email read-only */
      .dash-bg .email-readonly {
        display: flex; align-items: center; gap: 16px;
        padding: 18px;
        background: var(--d-bg-soft);
        border-radius: 14px;
        border: 1px dashed var(--d-rule);
        position: relative; z-index: 1;
      }
      .dash-bg .email-icon {
        width: 44px; height: 44px;
        border-radius: 50%;
        background: var(--d-green-mid);
        color: var(--d-green-glow);
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-size: 22px;
        font-weight: 400;
        flex-shrink: 0;
      }
      .dash-bg .email-info { flex: 1; min-width: 0; }
      .dash-bg .email-label {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.2em;
        color: var(--d-ink-mute);
        margin-bottom: 4px;
      }
      .dash-bg .email-value {
        font-size: 14px;
        font-weight: 600;
        color: var(--d-ink);
        word-break: break-all;
      }
    `}</style>
  );
}
