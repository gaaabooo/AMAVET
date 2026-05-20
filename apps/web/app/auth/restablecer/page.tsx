'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../lib/api';
import Logo from '../../../components/Logo';
import { AuthCardStyles } from '../_components/AuthCardStyles';

const MIN_PASSWORD = 8;

function RestablecerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await api.post('/auth/restablecer-password', { token, passwordNueva: password });
      router.push('/login?reset=ok');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || 'No se pudo restablecer la contraseña. El enlace pudo expirar.');
    } finally {
      setCargando(false);
    }
  };

  // Sin token en la URL no hay nada que hacer: el enlace llegó incompleto.
  if (!token) {
    return (
      <div className="cp-card">
        <div className="cp-head">
          <Logo size="sm" variant="light" />
        </div>
        <span className="cp-eyebrow"><span className="line" /> ENLACE INVÁLIDO</span>
        <h1 className="cp-title">Enlace <em>incompleto</em></h1>
        <p className="cp-subtitle">
          El enlace para restablecer la contraseña no es válido. Solicita uno nuevo.
        </p>
        <Link href="/auth/olvide-password" className="cp-btn cp-btn-link">
          Solicitar un enlace nuevo
        </Link>
      </div>
    );
  }

  return (
    <div className="cp-card">
      <div className="cp-head">
        <Logo size="sm" variant="light" />
      </div>

      <span className="cp-eyebrow"><span className="line" /> NUEVA CONTRASEÑA</span>
      <h1 className="cp-title">Crea tu <em>contraseña</em></h1>
      <p className="cp-subtitle">
        Elige una contraseña nueva para tu cuenta. Por seguridad, se cerrarán
        las demás sesiones abiertas.
      </p>

      {error && (
        <div role="alert" className="cp-alert">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="cp-form">
        <div className="cp-field">
          <label htmlFor="password" className="cp-label">Contraseña nueva</label>
          <div className="cp-pass-wrap">
            <input
              id="password"
              name="password"
              type={mostrar ? 'text' : 'password'}
              required
              minLength={MIN_PASSWORD}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="cp-input"
            />
            <button
              type="button"
              onClick={() => setMostrar((v) => !v)}
              className="cp-pass-toggle"
              aria-label={mostrar ? 'Ocultar' : 'Mostrar'}
            >
              {mostrar ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
        </div>

        <div className="cp-field">
          <label htmlFor="confirmar" className="cp-label">Confirmar contraseña</label>
          <input
            id="confirmar"
            name="confirmar"
            type={mostrar ? 'text' : 'password'}
            required
            minLength={MIN_PASSWORD}
            maxLength={72}
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Repite la contraseña"
            className="cp-input"
          />
        </div>

        <button type="submit" disabled={cargando} className="cp-btn">
          {cargando ? 'Guardando…' : 'Restablecer contraseña'}
        </button>
      </form>

      <div className="cp-foot">
        <Link href="/login" className="cp-foot-link">Volver al inicio de sesión</Link>
      </div>
    </div>
  );
}

export default function RestablecerPassword() {
  return (
    <main className="cp-bg">
      <AuthCardStyles />
      <Suspense fallback={null}>
        <RestablecerForm />
      </Suspense>
    </main>
  );
}
