'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';
import Logo from '../../../components/Logo';
import { AuthCardStyles } from '../_components/AuthCardStyles';
import Turnstile, { type TurnstileHandle } from '../_components/Turnstile';

export default function OlvidePassword() {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef<TurnstileHandle>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      await api.post('/auth/olvide-password', {
        email: email.trim().toLowerCase(),
        captchaToken,
      });
      // Mensaje neutro: se muestra exista o no el correo (anti-enumeración).
      setEnviado(true);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      // El 403 del captcha sí se le informa al usuario (necesita reintentar la
      // verificación). Cualquier otro error mantiene el mensaje neutro para no
      // revelar nada del estado del email.
      if (status === 403) {
        setError('No pudimos verificar el captcha. Recarga la página e inténtalo de nuevo.');
      } else {
        setError('No pudimos procesar la solicitud. Intenta nuevamente en unos minutos.');
      }
      // El token de captcha es de un solo uso: pedir uno nuevo tras el fallo.
      captchaRef.current?.reset();
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

              <Turnstile ref={captchaRef} onToken={setCaptchaToken} />

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
