'use client';

import Link from 'next/link';
import Logo from './Logo';

const NAV = [
  {
    title: 'Documentos',
    links: [
      { href: '/legal/privacidad', label: 'Privacidad' },
      { href: '/legal/terminos', label: 'Términos' },
    ],
  },
  {
    title: 'Servicio',
    links: [
      { href: '/cobertura', label: 'Área de cobertura' },
      { href: '/contacto', label: 'Contacto' },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { href: '/login', label: 'Iniciar sesión' },
      { href: '/registro', label: 'Crear cuenta' },
    ],
  },
];

export default function LegalFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="lfoot">
      <div className="lfoot-waves" aria-hidden>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path
            className="lfoot-wave lfoot-wave-1"
            d="M0,60 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
            fill="rgba(212, 196, 122, 0.08)"
          />
          <path
            className="lfoot-wave lfoot-wave-2"
            d="M0,80 C240,40 480,110 720,80 C960,50 1200,110 1440,80 L1440,120 L0,120 Z"
            fill="rgba(212, 196, 122, 0.05)"
          />
        </svg>
      </div>

      <div className="lfoot-photo" aria-hidden>
        <div className="lfoot-photo-img" />
        <div className="lfoot-photo-overlay" />
      </div>

      <div className="lfoot-inner">
        <section className="lfoot-mast">
          <Link href="/" className="lfoot-mast-mark" aria-label="Inicio">
            <Logo size="md" variant="dark" />
          </Link>
          <p className="lfoot-mast-author">
            <em>Médico Veterinaria</em>
            <br />
            Amanda Castañeda Urbina
          </p>
        </section>

        <div className="lfoot-divider" aria-hidden>
          <span className="lfoot-divider-line" />
          <span className="lfoot-divider-mark">✦</span>
          <span className="lfoot-divider-line" />
        </div>

        <section className="lfoot-grid">
          <div className="lfoot-col lfoot-brand-col">
            <span className="lfoot-eyebrow">Veterinario a domicilio</span>
            <p className="lfoot-tagline">
              Atendemos a tu mascota en la calma de tu hogar, en la Región de
              Valparaíso.
            </p>
            <Link href="/contacto" className="lfoot-cta">
              Hablemos
              <span className="lfoot-cta-arrow" aria-hidden>
                →
              </span>
            </Link>
            <div className="lfoot-contact">
              <div className="lfoot-contact-item">
                <span className="lfoot-contact-l">Teléfono</span>
                <a href="tel:+56912345678" className="lfoot-contact-v">
                  +56 9 1234 5678
                </a>
              </div>
              <div className="lfoot-contact-item">
                <span className="lfoot-contact-l">Correo</span>
                <a
                  href="mailto:hola@silvestravet.cl"
                  className="lfoot-contact-v"
                >
                  hola@silvestravet.cl
                </a>
              </div>
              <div className="lfoot-contact-item">
                <span className="lfoot-contact-l">Horario</span>
                <span className="lfoot-contact-v lfoot-contact-static">
                  Lun a Vie · 09:00 — 19:00
                </span>
              </div>
            </div>
          </div>

          {NAV.map((col) => (
            <div key={col.title} className="lfoot-col">
              <span className="lfoot-eyebrow">{col.title}</span>
              <ul className="lfoot-links">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="lfoot-link">
                      <span className="lfoot-link-arrow" aria-hidden>
                        →
                      </span>
                      <span className="lfoot-link-text">{l.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="lfoot-bar">
          <p className="lfoot-bar-copy">
            © {year} Silvestra Vet. Todos los derechos reservados.
          </p>
          <p className="lfoot-bar-loc">
            <span className="lfoot-bar-dot" aria-hidden />
            Valparaíso · Chile
          </p>
        </section>
      </div>

      <style>{`
        .lfoot {
          position: relative;
          background: #0d2818;
          color: #f5f1e8;
          padding: 5rem 2rem 2rem;
          overflow: hidden;
          isolation: isolate;
        }
        .lfoot::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(212, 196, 122, 0.5),
            transparent
          );
        }

        /* WAVES */
        .lfoot-waves {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          pointer-events: none;
          z-index: 0;
        }
        .lfoot-waves svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .lfoot-wave-1 {
          animation: lfootWaveDrift 18s ease-in-out infinite;
          transform-origin: center;
        }
        .lfoot-wave-2 {
          animation: lfootWaveDrift 24s ease-in-out infinite reverse;
        }
        @keyframes lfootWaveDrift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-30px); }
        }

        /* PHOTO BG (veterinaria atendiendo) */
        .lfoot-photo {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .lfoot-photo-img {
          position: absolute;
          inset: -4%;
          background:
            url('/vet-kitten-footer.jpg') center 35% / cover no-repeat;
          filter: hue-rotate(-8deg) saturate(0.65) brightness(0.5);
          transform: scale(1.08);
          animation: lfootPhotoParallax 22s ease-in-out infinite alternate;
        }
        @keyframes lfootPhotoParallax {
          0%   { transform: scale(1.08) translateY(0); }
          100% { transform: scale(1.12) translateY(-2%); }
        }
        .lfoot-photo-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              180deg,
              rgba(13, 40, 24, 0.95) 0%,
              rgba(13, 40, 24, 0.7) 35%,
              rgba(13, 40, 24, 0.78) 70%,
              rgba(13, 40, 24, 0.96) 100%
            ),
            radial-gradient(
              ellipse at 70% 50%,
              rgba(212, 196, 122, 0.08),
              transparent 60%
            );
        }

        .lfoot-inner {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* MAST */
        .lfoot-mast {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 0 2.25rem;
          text-align: center;
        }
        .lfoot-mast-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 0.75rem;
          border-radius: 12px;
          transition: background 0.3s, transform 0.3s;
        }
        .lfoot-mast-mark:hover {
          background: rgba(245, 241, 232, 0.05);
          transform: translateY(-2px);
        }
        .lfoot-mast-author {
          font-family: var(--font-newsreader);
          font-size: 1.05rem;
          line-height: 1.5;
          color: rgba(245, 241, 232, 0.85);
          letter-spacing: 0.01em;
        }
        .lfoot-mast-author em {
          font-style: italic;
          color: #d4c47a;
          font-weight: 300;
        }

        /* DIVIDER */
        .lfoot-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 0 auto 3.5rem;
          max-width: 320px;
        }
        .lfoot-divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(212, 196, 122, 0.4),
            transparent
          );
        }
        .lfoot-divider-mark {
          font-family: var(--font-newsreader);
          font-style: italic;
          color: #d4c47a;
          font-size: 1rem;
          opacity: 0.7;
          animation: lfootMarkPulse 4s ease-in-out infinite;
        }
        @keyframes lfootMarkPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }

        /* GRID */
        .lfoot-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 1fr;
          gap: 3rem;
          padding-bottom: 3rem;
          border-bottom: 1px solid rgba(245, 241, 232, 0.1);
        }
        .lfoot-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .lfoot-eyebrow {
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.22em;
          color: #d4c47a;
        }
        .lfoot-tagline {
          font-family: var(--font-newsreader);
          font-size: 1.05rem;
          line-height: 1.55;
          color: rgba(245, 241, 232, 0.78);
          max-width: 32ch;
        }

        .lfoot-cta {
          display: inline-flex;
          align-items: center;
          gap: 0.625rem;
          align-self: flex-start;
          padding: 0.75rem 1.5rem;
          background: rgba(245, 241, 232, 0.06);
          border: 1px solid rgba(212, 196, 122, 0.4);
          border-radius: 100px;
          font-family: var(--font-manrope);
          font-size: 0.85rem;
          font-weight: 600;
          color: #f5f1e8;
          text-decoration: none;
          transition: all 0.3s;
        }
        .lfoot-cta:hover {
          background: #d4c47a;
          border-color: #d4c47a;
          color: #0d2818;
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(212, 196, 122, 0.25);
        }
        .lfoot-cta-arrow {
          transition: transform 0.3s;
        }
        .lfoot-cta:hover .lfoot-cta-arrow {
          transform: translateX(4px);
        }

        .lfoot-contact {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
          margin-top: 0.5rem;
        }
        .lfoot-contact-item {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .lfoot-contact-l {
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.6rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: rgba(245, 241, 232, 0.45);
        }
        .lfoot-contact-v {
          font-size: 0.9rem;
          font-weight: 500;
          color: #f5f1e8;
          text-decoration: none;
          letter-spacing: 0.005em;
          transition: color 0.25s;
        }
        a.lfoot-contact-v:hover { color: #d4c47a; }
        .lfoot-contact-static { color: rgba(245, 241, 232, 0.7); }

        /* LINKS */
        .lfoot-links {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .lfoot-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0;
          font-family: var(--font-manrope);
          font-size: 0.92rem;
          color: rgba(245, 241, 232, 0.72);
          text-decoration: none;
          transition: color 0.25s;
        }
        .lfoot-link:hover { color: #d4c47a; }
        .lfoot-link-arrow {
          display: inline-block;
          width: 0;
          opacity: 0;
          transform: translateX(-6px);
          color: #d4c47a;
          font-size: 0.85rem;
          transition: width 0.3s cubic-bezier(0.65, 0, 0.35, 1),
                      opacity 0.3s,
                      transform 0.3s;
        }
        .lfoot-link:hover .lfoot-link-arrow {
          width: 1rem;
          opacity: 1;
          transform: translateX(0);
        }
        .lfoot-link-text {
          transition: transform 0.3s;
        }
        .lfoot-link:hover .lfoot-link-text {
          transform: translateX(2px);
        }

        /* BAR */
        .lfoot-bar {
          padding-top: 2rem;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .lfoot-bar-copy {
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          color: rgba(245, 241, 232, 0.4);
        }
        .lfoot-bar-loc {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(245, 241, 232, 0.55);
        }
        .lfoot-bar-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d4c47a;
          box-shadow: 0 0 0 0 rgba(212, 196, 122, 0.7);
          animation: lfootDotPulse 2.5s ease-in-out infinite;
        }
        @keyframes lfootDotPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 196, 122, 0.55); }
          50% { box-shadow: 0 0 0 6px rgba(212, 196, 122, 0); }
        }

        @media (max-width: 980px) {
          .lfoot-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2.25rem;
          }
          .lfoot-brand-col {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 600px) {
          .lfoot { padding: 4rem 1.5rem 2rem; }
          .lfoot-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .lfoot-bar {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
}
