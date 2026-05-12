'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '../../../lib/supabase';
import { tieneTelefonoValido } from '../../../lib/session';
import api from '../../../lib/api';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    getSupabase().auth.getSession().then(async ({ data, error: sessionError }) => {
      if (sessionError || !data.session?.access_token) {
        setError('No se pudo completar el inicio de sesión. Intenta de nuevo.');
        return;
      }

      try {
        const res = await api.post('/auth/google', {
          accessToken: data.session.access_token,
        });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        const completo = tieneTelefonoValido(res.data.usuario?.telefono);
        router.push(completo ? '/dashboard' : '/auth/completar-perfil');
      } catch {
        setError('Tu cuenta no está habilitada para acceder. Contacta al administrador.');
      }
    });
  }, [router]);

  if (error) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
        <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 24px' }}>
          <p style={{ color: '#8a3e35', marginBottom: 16 }}>{error}</p>
          <a href="/login" style={{ color: '#0d2818', fontWeight: 600 }}>Volver al inicio de sesión</a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <p style={{ color: '#4a5042', fontSize: 15 }}>Iniciando sesión…</p>
    </main>
  );
}
