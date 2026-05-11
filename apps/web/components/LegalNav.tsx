'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from './Logo';

export default function LegalNav() {
  const [progress, setProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const pct = total > 0 ? (h.scrollTop / total) * 100 : 0;
      setProgress(pct);
      setScrolled(h.scrollTop > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`lnav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="lnav-inner">
        <Link href="/" aria-label="Volver al inicio" className="lnav-brand">
          <span className="lnav-brand-mark">
            <Logo size="sm" variant="light" />
          </span>
        </Link>

        <Link href="/" className="lnav-back">
          <span className="lnav-back-arrow" aria-hidden>
            ←
          </span>
          <span className="lnav-back-text">Volver al inicio</span>
        </Link>
      </div>

      <div
        className="lnav-progress"
        style={{ width: `${progress}%` }}
        aria-hidden
      />

      <style>{`
        .lnav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(245, 241, 232, 0.7);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid transparent;
          transition: background 0.4s, border-color 0.4s, padding 0.3s;
        }
        .lnav.is-scrolled {
          background: rgba(245, 241, 232, 0.94);
          border-bottom-color: #d8d2c2;
        }
        .lnav-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 1.125rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          transition: padding 0.3s;
        }
        .lnav.is-scrolled .lnav-inner { padding: 0.875rem 2rem; }

        /* BRAND */
        .lnav-brand {
          display: inline-flex;
          align-items: center;
          text-decoration: none;
        }
        .lnav-brand-mark {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.5rem;
          border-radius: 8px;
          transition: background 0.25s, transform 0.25s;
        }
        .lnav-brand:hover .lnav-brand-mark {
          background: rgba(1, 45, 29, 0.06);
          transform: translateY(-1px);
        }

        /* BACK */
        .lnav-back {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.1rem;
          font-family: var(--font-manrope);
          font-size: 0.85rem;
          font-weight: 600;
          color: #f5f1e8;
          background: #012d1d;
          border-radius: 100px;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.65, 0, 0.35, 1);
          box-shadow: 0 2px 0 0 rgba(1, 45, 29, 0.15);
        }
        .lnav-back:hover {
          background: #0d2818;
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(13, 40, 24, 0.25);
        }
        .lnav-back-arrow {
          display: inline-block;
          transition: transform 0.3s;
        }
        .lnav-back:hover .lnav-back-arrow {
          transform: translateX(-3px);
        }

        /* PROGRESS BAR */
        .lnav-progress {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 2px;
          background: linear-gradient(90deg, #012d1d, #735c00, #d4c47a);
          background-size: 200% 100%;
          animation: lnavProgressShift 4s ease-in-out infinite;
          transition: width 0.1s linear;
          box-shadow: 0 0 8px rgba(115, 92, 0, 0.4);
        }
        @keyframes lnavProgressShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @media (max-width: 600px) {
          .lnav-inner { gap: 1rem; }
          .lnav-back-text { display: none; }
          .lnav-back { padding: 0.55rem 0.85rem; }
        }
      `}</style>
    </nav>
  );
}
