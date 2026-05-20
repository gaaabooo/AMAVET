'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import Logo from '../../../components/Logo';
import { AuthCardStyles } from '../_components/AuthCardStyles';

export default function OlvidePassword() {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      await api.post('/auth/olvide-password', { email: email.trim().toLowerCase() });
      // Mensaje neutro: se muestra exista o no el correo (anti-enumeración).
      setEnviado(true);
    } catch {
      // Aun si el backend falla, no revelamos nada del estado del email.
      setError('No pudimos procesar la solicitud. Intenta nuevamente en unos minutos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="cp-bg">
      <AuthCardStyles />
      <div className="cp-card">
        <div className="cp-head">
          <Logo size="sm" variant="light" />
        </div>

        <span className="cp-eyebrow"><span className="line" /> RECUPERAR ACCESO</span>

        {enviado ? (
          <>
            <h1 className="cp-title">Revisa tu <em>correo</em></h1>
            <p className="cp-subtitle">
              Si el correo está registrado, te enviamos un enlace para
              restablecer tu contraseña. El enlace expira en 15 minutos.
            </p>
            <Link href="/login" className="cp-btn cp-btn-link">
              Volver al inicio de sesión
            </Link>
          </>
        ) : (
          <>
            <h1 className="cp-title">¿Olvidaste tu <em>contraseña?</em></h1>
            <p className="cp-subtitle">
              Ingresa el correo de tu cuenta y te enviaremos un enlace para
              crear una contraseña nueva.
            </p>

            {error && (
              <div role="alert" className="cp-alert">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="cp-form">
              <div className="cp-field">
                <label htmlFor="email" className="cp-label">Correo electrónico</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@ejemplo.com"
                  className="cp-input"
                />
              </div>

              <button type="submit" disabled={cargando} className="cp-btn">
                {cargando ? 'Enviando…' : 'Enviar enlace'}
              </button>
            </form>

            <div className="cp-foot">
              <Link href="/login" className="cp-foot-link">Volver al inicio de sesión</Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
