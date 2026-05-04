'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import Logo from '../../components/Logo';

export default function Registro() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const res = await api.post('/auth/registro', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      router.push('/dashboard');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || 'Error al registrarse');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-(--surface) flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-6 left-6">
        <Logo size="sm" variant="light" />
      </Link>

      <div
        className="bg-(--surface-container-lowest) rounded-2xl p-10 w-full max-w-md"
        style={{ boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)' }}
      >
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-(--primary) mb-4">
          <span className="w-8 h-px bg-(--primary)" aria-hidden />
          Crea tu cuenta
        </span>

        <h1
          className="text-3xl font-bold text-(--on-surface) mb-2 leading-tight"
          style={{ letterSpacing: '-0.015em' }}
        >
          Bienvenido{' '}
          <span
            className="font-light italic text-(--primary)"
            style={{ fontFamily: 'var(--font-newsreader)' }}
          >
            a Silvestra Vet
          </span>
        </h1>
        <p
          className="text-(--on-surface-variant) mb-8"
          style={{ fontFamily: 'var(--font-newsreader)', fontSize: '1.0625rem' }}
        >
          Registra a tu mascota y agenda visitas a domicilio en minutos.
        </p>

        {error && (
          <div
            role="alert"
            className="bg-(--error-container) text-(--on-surface) text-sm p-3 rounded-lg mb-5"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reg-nombre"
              className="block text-sm font-medium text-(--on-surface-variant) mb-1.5"
            >
              Nombre completo
            </label>
            <input
              id="reg-nombre"
              name="nombre"
              type="text"
              required
              autoComplete="name"
              onChange={handleChange}
              placeholder="Juan Pérez"
              className="sv-input"
            />
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-sm font-medium text-(--on-surface-variant) mb-1.5"
            >
              Correo electrónico
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              onChange={handleChange}
              placeholder="juan@ejemplo.com"
              className="sv-input"
            />
          </div>

          <div>
            <label
              htmlFor="reg-telefono"
              className="block text-sm font-medium text-(--on-surface-variant) mb-1.5"
            >
              Teléfono
            </label>
            <input
              id="reg-telefono"
              name="telefono"
              type="tel"
              required
              autoComplete="tel"
              onChange={handleChange}
              placeholder="+56 9 1234 5678"
              className="sv-input"
            />
          </div>

          <div>
            <label
              htmlFor="reg-password"
              className="block text-sm font-medium text-(--on-surface-variant) mb-1.5"
            >
              Contraseña
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              onChange={handleChange}
              placeholder="Mínimo 8 caracteres"
              className="sv-input"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-(--primary) hover:bg-(--primary-container) text-white font-semibold py-3 rounded-lg transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-(--on-surface-variant) mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="text-(--primary) font-semibold hover:underline underline-offset-4"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
