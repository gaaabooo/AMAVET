'use client';
import { useRouter } from 'next/navigation';
import Logo from './Logo';

export type DashboardNavKey = 'mascotas' | 'agendar' | 'ayuda' | 'configuracion';

interface Props {
  active?: DashboardNavKey;
  usuarioNombre?: string;
}

const LINKS: { key: DashboardNavKey; label: string; href: string; icon: React.ReactNode }[] = [
  {
    key: 'mascotas',
    label: 'Mis mascotas',
    href: '/dashboard',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 13V7l6-5 6 5v6a1 1 0 01-1 1h-3v-5H6v5H3a1 1 0 01-1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    key: 'agendar',
    label: 'Agendar',
    href: '/dashboard/agendar',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M2 6h12M5 2v3M11 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'ayuda',
    label: 'Ayuda',
    href: '/dashboard/ayuda',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 6.5a2 2 0 014 .5c0 1-1 1.2-1.5 1.7-.3.3-.5.6-.5 1M8 11.5h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: 'configuracion',
    label: 'Configuración',
    href: '/dashboard/configuracion',
    icon: (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M8 2v1.5M8 12.5V14M14 8h-1.5M3.5 8H2M12.2 3.8l-1 1M4.8 11.2l-1 1M12.2 12.2l-1-1M4.8 4.8l-1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function DashboardNav({ active, usuarioNombre }: Props) {
  const router = useRouter();

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  const iniciales = usuarioNombre
    ?.trim()
    .split(/\s+/)
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'S';

  const primerNombre = usuarioNombre?.trim().split(/\s+/)[0] ?? '';

  return (
    <>
      <nav className="dashnav">
        <button
          onClick={() => router.push('/dashboard')}
          aria-label="Ir al dashboard"
          className="dashnav-logo"
        >
          <Logo size="sm" variant="dark" />
        </button>

        <div className="dashnav-links">
          {LINKS.map(link => (
            <button
              key={link.key}
              onClick={() => router.push(link.href)}
              className={`dashnav-link ${active === link.key ? 'active' : ''}`}
              aria-current={active === link.key ? 'page' : undefined}
            >
              <span className="dashnav-link-icon">{link.icon}</span>
              <span className="dashnav-link-label">{link.label}</span>
            </button>
          ))}
        </div>

        <div className="dashnav-right">
          {usuarioNombre && (
            <button
              onClick={() => router.push('/dashboard/configuracion')}
              className="dashnav-user"
              title="Ir a configuración"
            >
              <span className="dashnav-avatar">{iniciales}</span>
              <span className="dashnav-username">{primerNombre}</span>
            </button>
          )}
          <button
            onClick={cerrarSesion}
            className="dashnav-logout"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M6 2H2v10h4M9 4l3 3-3 3M6 7h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </nav>

      <style jsx global>{`
        .dashnav {
          position: relative;
          z-index: 30;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          background: var(--d-green-deep, #0d2818);
          padding: 12px 24px;
          border-bottom: 1px solid rgba(216, 233, 200, 0.08);
          font-family: var(--font-manrope), system-ui, sans-serif;
        }
        @media (min-width: 720px) {
          .dashnav { padding: 14px 32px; }
        }

        .dashnav-logo {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex; align-items: center;
        }

        .dashnav-links {
          display: flex; align-items: center;
          gap: 4px;
          background: rgba(216, 233, 200, 0.08);
          border: 1px solid rgba(216, 233, 200, 0.06);
          border-radius: 999px;
          padding: 4px;
        }
        .dashnav-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(216, 233, 200, 0.65);
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          transition: all .2s ease;
          white-space: nowrap;
        }
        .dashnav-link:hover { color: var(--d-green-glow, #d8e9c8); }
        .dashnav-link.active {
          background: var(--d-green-glow, #d8e9c8);
          color: var(--d-green-deep, #0d2818);
          font-weight: 600;
        }
        .dashnav-link-icon { display: inline-flex; }
        .dashnav-link-icon svg { width: 14px; height: 14px; }

        .dashnav-right {
          display: flex; align-items: center; gap: 10px;
        }
        .dashnav-user {
          display: flex; align-items: center; gap: 10px;
          padding: 4px 14px 4px 4px;
          background: rgba(216, 233, 200, 0.08);
          border: 1px solid rgba(216, 233, 200, 0.06);
          border-radius: 999px;
          cursor: pointer;
          font-family: inherit;
          transition: background .2s, border-color .2s;
        }
        .dashnav-user:hover {
          background: rgba(216, 233, 200, 0.14);
          border-color: rgba(216, 233, 200, 0.18);
        }
        .dashnav-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--d-green-mist, #c8dcc7), var(--d-green-glow, #d8e9c8));
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-newsreader), Georgia, serif;
          font-style: italic;
          font-size: 13px; font-weight: 400;
          color: var(--d-green-deep, #0d2818);
        }
        .dashnav-username {
          font-size: 13px; font-weight: 600;
          color: var(--d-green-glow, #d8e9c8);
        }

        .dashnav-logout {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: transparent;
          border: 1px solid rgba(216, 233, 200, 0.2);
          color: rgba(216, 233, 200, 0.7);
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s ease;
        }
        .dashnav-logout:hover {
          color: var(--d-green-glow, #d8e9c8);
          border-color: var(--d-green-glow, #d8e9c8);
          background: rgba(216, 233, 200, 0.08);
        }

        @media (max-width: 880px) {
          .dashnav-link-label { display: none; }
          .dashnav-link { padding: 9px 12px; }
          .dashnav-username { display: none; }
          .dashnav-user { padding: 4px; }
        }
        @media (max-width: 540px) {
          .dashnav { padding: 10px 16px; flex-wrap: wrap; }
          .dashnav-links { order: 3; flex-basis: 100%; justify-content: center; }
        }
      `}</style>
    </>
  );
}
