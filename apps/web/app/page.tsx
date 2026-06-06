'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '../components/Logo';

export default function Home() {
  const [navOpaque, setNavOpaque] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavOpaque(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleAcc = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.parentElement?.classList.toggle('open');
  };

  return (
    <main className="land-bg">
      <LandingStyles />

      <nav className={`land-nav ${navOpaque ? 'opaque' : 'transparent'}`}>
        <Link href="/" className="brand">
          <Logo size="sm" variant={navOpaque ? 'light' : 'dark'} />
          <small>Veterinario a domicilio</small>
        </Link>
        <div className="nav-actions">
          <Link href="/login" className="btn btn-ghost">Iniciar sesión</Link>
          <Link href="/registro" className="btn btn-primary">
            Registrarse
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* HERO CINEMÁTICO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content">
          <div className="hero-eyebrow hero-anim ha1">SILVESTRA VET — VALPARAÍSO, CHILE</div>
          <h1 className="hero-title hero-anim ha2">
            Su casa, <em>su consulta.</em>
          </h1>
          <div className="hero-bottom">
            <p className="hero-lead hero-anim ha3">
              Atención veterinaria clínica donde tu mascota ya se siente segura. Sin jaulas, sin traslados, sin sala de espera.
            </p>
            <div className="hero-actions hero-anim ha4">
              <Link href="/registro" className="btn btn-cream">
                Agendar visita
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#beneficios" className="btn btn-outline">Cómo funciona</a>
            </div>
          </div>
        </div>
        <div className="hero-scroll hero-anim ha4">
          <span>SCROLL</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="social">
        <div className="social-grid">
          <div className="social-stat">
            <div className="num">+100</div>
            <div className="label">MASCOTAS ATENDIDAS</div>
          </div>
          <div className="social-stat">
            <div className="num">5.0<em>★</em></div>
            <div className="label">CALIFICACIÓN PROMEDIO</div>
          </div>
          <div className="social-stat">
            <div className="num">06</div>
            <div className="label">PROCEDIMIENTOS CLÍNICOS</div>
          </div>
          <div className="social-stat">
            <div className="num">0</div>
            <div className="label">SALAS DE ESPERA</div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS — 2x2 con números enormes */}
      <section className="beneficios" id="beneficios">
        <div className="beneficios-shell">
          <div className="ben-head">
            <span className="eyebrow">POR QUÉ A DOMICILIO</span>
            <h2 className="section-title">El bienestar empieza <em>en un entorno tranquilo</em></h2>
            <p className="section-lead">Cuatro razones por las que cientos de tutores eligieron Silvestra Vet en lugar de la clínica tradicional.</p>
          </div>
          <div className="ben-grid">
            <div className="ben-card">
              <div className="ben-num">01</div>
              <div>
                <div className="ben-tag">EN CASA</div>
                <h3 className="ben-title">Sin jaula, sin traslado, <em>sin sala de espera</em></h3>
              </div>
              <p className="ben-text">Tu mascota recibe atención en su propio espacio, tranquila y acompañada. Sin viajes, sin estrés y sin cambiar su rutina.</p>
            </div>
            <div className="ben-card dark">
              <div className="ben-num">02</div>
              <div>
                <div className="ben-tag">DEDICACIÓN</div>
                <h3 className="ben-title">Atención con <em>tiempo y calma</em></h3>
              </div>
              <p className="ben-text">Cada visita se realiza con dedicación, respetando el ritmo de tu mascota y resolviendo tus dudas sin apuros.</p>
            </div>
            <div className="ben-card dark">
              <div className="ben-num">03</div>
              <div>
                <div className="ben-tag">COMODIDAD</div>
                <h3 className="ben-title">Nosotros vamos <em>hasta tu hogar</em></h3>
              </div>
              <p className="ben-text">Evita traslados, esperas y estacionamientos. Tú solo agendas la visita; la atención llega donde tu mascota se siente segura.</p>
            </div>
            <div className="ben-card">
              <div className="ben-num">04</div>
              <div>
                <div className="ben-tag">RESPALDO CLÍNICO</div>
                <h3 className="ben-title">Atención profesional y <em>criterio clínico</em></h3>
              </div>
              <p className="ben-text">Servicio realizado por médica veterinaria titulada, con formación basada en el cuidado animal, la salud pública y el bienestar del entorno.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS — acordeón */}
      <section className="servicios">
        <div className="serv-shell">
          <div className="serv-head">
            <span className="eyebrow">SERVICIOS MÉDICOS</span>
            <h2 className="section-title">Procedimientos clínicos, <em>con el rigor de una clínica</em></h2>
            <p className="section-lead">
              Cada visita sigue protocolos clínicos verificables. Los exámenes se procesan en laboratorio externo certificado y los resultados llegan a tu cuenta en PDF. Haz clic para conocer más.
            </p>
          </div>
          <ul className="acc-list">
            <li className="acc-item open">
              <button className="acc-trigger" onClick={toggleAcc}>
                <span className="acc-num">01</span>
                <span className="acc-name">Vacunación</span>
                <span className="acc-toggle">+</span>
              </button>
              <div className="acc-content">
                <p className="acc-body">Esquemas completos para cachorros y adultos. Cumplimos calendario nacional y aplicamos refuerzos según especie, raza y edad.</p>
              </div>
            </li>
            <li className="acc-item">
              <button className="acc-trigger" onClick={toggleAcc}>
                <span className="acc-num">02</span>
                <span className="acc-name">Desparasitación interna</span>
                <span className="acc-toggle">+</span>
              </button>
              <div className="acc-content">
                <p className="acc-body">Antiparasitarios de amplio espectro contra giardia, anquilostomas, áscaris y tenias. Pauta personalizada según peso y estilo de vida.</p>
              </div>
            </li>
            <li className="acc-item">
              <button className="acc-trigger" onClick={toggleAcc}>
                <span className="acc-num">03</span>
                <span className="acc-name">Control clínico</span>
                <span className="acc-toggle">+</span>
              </button>
              <div className="acc-content">
                <p className="acc-body">Examen físico completo: auscultación cardíaca y pulmonar, palpación abdominal, evaluación de mucosas, peso, temperatura y dentición.</p>
              </div>
            </li>
            <li className="acc-item">
              <button className="acc-trigger" onClick={toggleAcc}>
                <span className="acc-num">04</span>
                <span className="acc-name">Curación de heridas</span>
                <span className="acc-toggle">+</span>
              </button>
              <div className="acc-content">
                <p className="acc-body">Limpieza, desinfección, sutura simple si corresponde y vendaje profesional. Tratamos lesiones menores sin necesidad de traslado.</p>
              </div>
            </li>
            <li className="acc-item">
              <button className="acc-trigger" onClick={toggleAcc}>
                <span className="acc-num">05</span>
                <span className="acc-name">Microchip</span>
                <span className="acc-toggle">+</span>
              </button>
              <div className="acc-content">
                <p className="acc-body">Identificación permanente bajo norma ISO 11784/11785, con registro inmediato en la base nacional.</p>
              </div>
            </li>
            <li className="acc-item">
              <button className="acc-trigger" onClick={toggleAcc}>
                <span className="acc-num">06</span>
                <span className="acc-name">Toma de muestras para laboratorio</span>
                <span className="acc-toggle">+</span>
              </button>
              <div className="acc-content">
                <p className="acc-body">Sangre y orina para análisis clínicos. Trabajamos con laboratorio veterinario certificado.</p>
                <ul className="acc-panel">
                  <li>Hemograma completo</li>
                  <li>Perfil bioquímico</li>
                  <li>TSH</li>
                  <li>T4 total y libre</li>
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="cta-inner">
          <span className="eyebrow">AGENDA TU VISITA HOY</span>
          <h2 className="cta-title">Tu mascota merece <em>atención en casa</em></h2>
          <p className="cta-lead">Asegura tranquilidad clínica con la calma que tu mascota necesita. Sin esperas, sin traslados, sin estrés.</p>
          <div className="cta-actions">
            <Link href="/registro" className="btn btn-primary">
              Crear cuenta
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/login" className="btn btn-ghost">Iniciar sesión</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="land-foot">
        {/* Hojas decorativas */}
        <div className="foot-leaves" aria-hidden="true">
          <svg className="fl1" viewBox="0 0 200 200" fill="currentColor">
            <path d="M100 20c-30 0-55 25-55 55 0 35 25 55 55 80 30-25 55-45 55-80 0-30-25-55-55-55zm0 30c14 0 25 11 25 25s-11 25-25 25-25-11-25-25 11-25 25-25z" />
          </svg>
          <svg className="fl2" viewBox="0 0 200 200" fill="currentColor">
            <path d="M100 20c-30 0-55 25-55 55 0 35 25 55 55 80 30-25 55-45 55-80 0-30-25-55-55-55zm0 30c14 0 25 11 25 25s-11 25-25 25-25-11-25-25 11-25 25-25z" />
          </svg>
        </div>

        {/* Sello editorial */}
        <div className="foot-mast">
          <div className="foot-mast-mark">
            <Logo size="md" variant="dark" />
          </div>
          <div className="foot-mast-author">
            <span className="foot-mast-author-label">MÉDICO VETERINARIA</span>
            <span className="foot-mast-author-name">Amanda Castañeda Urbina</span>
          </div>
          <p className="foot-mast-line">
            Veterinaria a domicilio en Valparaíso.<br />
            Cuidado clínico <em>en el lugar más conocido</em> por tu mascota.
          </p>
        </div>

        <div className="foot-divider" aria-hidden="true" />

        {/* Grid principal */}
        <div className="foot-grid">
          {/* Columna marca */}
          <div className="foot-brand-col">
            <p className="foot-blurb">
              Atención veterinaria clínica en tu casa. Sin estrés para tu mascota, sin traslados para ti.
            </p>
            <div className="foot-cta">
              <Link href="/registro" className="foot-cta-btn">
                Agendar visita
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <span className="foot-cta-meta">Sin compromisos · Cuenta gratuita</span>
            </div>
          </div>

          {/* Columnas de links */}
          <div className="foot-cols">
            <div className="foot-col">
              <div className="foot-tag"><span className="dot" /> SERVICIO</div>
              <Link href="/cobertura" className="foot-link">
                <span>Área de cobertura</span>
                <span className="arrow">→</span>
              </Link>
              <Link href="/registro" className="foot-link">
                <span>Crear cuenta</span>
                <span className="arrow">→</span>
              </Link>
              <Link href="/login" className="foot-link">
                <span>Acceder</span>
                <span className="arrow">→</span>
              </Link>
              <Link href="/contacto" className="foot-link">
                <span>Contacto</span>
                <span className="arrow">→</span>
              </Link>
            </div>

            <div className="foot-col">
              <div className="foot-tag"><span className="dot" /> LEGAL</div>
              <Link href="/legal/privacidad" className="foot-link">
                <span>Política de privacidad</span>
                <span className="arrow">→</span>
              </Link>
              <Link href="/legal/terminos" className="foot-link">
                <span>Términos de servicio</span>
                <span className="arrow">→</span>
              </Link>
              <a href="mailto:privacidad@silvestravet.cl" className="foot-link">
                <span>Datos personales</span>
                <span className="arrow">→</span>
              </a>
            </div>

            <div className="foot-col">
              <div className="foot-tag"><span className="dot" /> CONTACTO</div>
              <a href="tel:+56912345678" className="foot-link contact-link">
                <span className="contact-label">TELÉFONO</span>
                <span className="contact-value">+56 9 1234 5678</span>
              </a>
              <a href="mailto:hola@silvestravet.cl" className="foot-link contact-link">
                <span className="contact-label">CORREO</span>
                <span className="contact-value">hola@silvestravet.cl</span>
              </a>
              <div className="foot-link contact-link static">
                <span className="contact-label">HORARIO</span>
                <span className="contact-value">Lun a Vie · 09:00 — 19:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div className="foot-bar">
          <div className="foot-bar-inner">
            <div className="foot-bar-meta">
              <span>© 2026 — SILVESTRA VET SPA</span>
              <span className="foot-bar-sep">·</span>
              <span>Todos los derechos reservados</span>
            </div>
            <div className="foot-bar-place">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="8" cy="8" r="2" fill="currentColor" />
              </svg>
              <span>VALPARAÍSO · CHILE</span>
              <span className="foot-bar-sep">·</span>
              <span className="foot-bar-italic">Hecho con cuidado clínico.</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

function LandingStyles() {
  return (
    <style jsx global>{`
      .land-bg {
        --cream: #f5f1e8;
        --paper: #ede7d8;
        --green-deep: #0d2818;
        --green-mid: #1e4030;
        --green-leaf: #2d5040;
        --ink: #1a2418;
        --ink-soft: #4a5042;
        --ink-mute: #8a8e80;
        --rule: rgba(13, 40, 24, 0.12);
        background: var(--cream);
        color: var(--ink);
        font-family: var(--font-manrope), system-ui, sans-serif;
        line-height: 1.5;
      }

      /* NAV transparente que se vuelve opaca */
      .land-nav {
        position: fixed; top: 0; left: 0; right: 0; z-index: 50;
        padding: 20px 40px;
        display: flex; justify-content: space-between; align-items: center;
        transition: all .35s;
      }
      .land-nav.transparent {
        color: var(--cream);
        background: transparent;
        border-bottom: 1px solid transparent;
      }
      .land-nav.opaque {
        background: rgba(245, 241, 232, 0.92);
        backdrop-filter: blur(16px);
        color: var(--ink);
        border-bottom: 1px solid var(--rule);
        padding: 14px 40px;
      }
      .land-nav .brand {
        display: inline-flex; align-items: center; gap: 14px;
        text-decoration: none; color: inherit;
      }
      .land-nav .brand small {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 400;
        font-size: 13px; opacity: 0.75;
        padding-left: 14px;
        border-left: 1px solid currentColor;
        line-height: 1.3;
      }
      .land-nav.transparent .brand small {
        border-left-color: rgba(245, 241, 232, 0.3);
      }
      .land-nav.opaque .brand small {
        border-left-color: var(--rule);
      }
      .nav-actions { display: flex; gap: 8px; }

      .btn {
        padding: 10px 20px; border-radius: 999px;
        font-size: 13.5px; font-weight: 600;
        text-decoration: none;
        transition: all .25s;
        display: inline-flex; align-items: center; gap: 8px;
        border: 1px solid transparent;
        font-family: var(--font-manrope), system-ui, sans-serif;
        cursor: pointer;
      }
      .land-nav.transparent .btn-ghost {
        color: var(--cream);
        border-color: rgba(245, 241, 232, 0.4);
      }
      .land-nav.transparent .btn-ghost:hover {
        background: rgba(245, 241, 232, 0.1);
      }
      .land-nav.transparent .btn-primary {
        background: var(--cream);
        color: var(--green-deep);
      }
      .land-nav.transparent .btn-primary:hover {
        background: #e8e2d0;
      }
      .land-nav.opaque .btn-ghost {
        color: var(--green-deep);
        border-color: var(--rule);
      }
      .land-nav.opaque .btn-ghost:hover {
        background: rgba(13, 40, 24, 0.06);
      }
      .land-nav.opaque .btn-primary {
        background: var(--green-deep);
        color: var(--cream);
      }
      .land-nav.opaque .btn-primary:hover {
        background: var(--green-mid);
      }

      /* HERO CINEMÁTICO */
      .hero {
        position: relative; height: 100vh; min-height: 700px;
        overflow: hidden;
        display: flex; align-items: flex-end;
        color: var(--cream);
        padding: 80px 40px;
      }
      .hero-bg {
        position: absolute; inset: 0; z-index: 0;
        background:
          linear-gradient(180deg, rgba(13, 40, 24, 0.4) 0%, rgba(13, 40, 24, 0.85) 100%),
          url('/close-up-veterinarian-taking-care-dog.jpg') center/cover no-repeat;
        filter: hue-rotate(-5deg) saturate(0.85);
        transform: scale(1.05);
        animation: heroParallax 20s ease-in-out infinite alternate;
      }
      @keyframes heroParallax {
        0% { transform: scale(1.05) translateY(0); }
        100% { transform: scale(1.1) translateY(-2%); }
      }
      .hero-bg::after {
        content: '';
        position: absolute; inset: 0;
        background: radial-gradient(ellipse at 50% 100%, transparent, rgba(13, 40, 24, 0.6));
      }
      .hero-content {
        position: relative; z-index: 1;
        max-width: 1320px; margin: 0 auto; width: 100%;
      }
      .hero-eyebrow {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px; letter-spacing: 0.32em;
        color: rgba(245, 241, 232, 0.7);
        text-transform: uppercase; margin-bottom: 28px;
        display: inline-flex; align-items: center; gap: 14px;
      }
      .hero-eyebrow::before {
        content: ''; width: 40px; height: 1px;
        background: rgba(245, 241, 232, 0.5);
      }
      .hero-title {
        font-size: clamp(56px, 9vw, 140px);
        font-weight: 300; letter-spacing: -0.04em; line-height: 0.92;
        margin-bottom: 32px;
        color: var(--cream);
        max-width: 14ch;
      }
      .hero-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        color: rgba(245, 241, 232, 0.78);
        font-weight: 300;
      }
      .hero-bottom {
        display: grid; grid-template-columns: 1fr auto;
        gap: 40px; align-items: end;
      }
      @media (max-width: 720px) {
        .hero-bottom { grid-template-columns: 1fr; }
      }
      .hero-lead {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 22px; line-height: 1.45;
        color: rgba(245, 241, 232, 0.85); max-width: 480px;
      }
      .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
      .btn-cream {
        background: var(--cream); color: var(--green-deep);
        padding: 16px 28px; font-size: 14px;
      }
      .btn-cream:hover { background: #e8e2d0; transform: translateY(-2px); }
      .btn-outline {
        color: var(--cream);
        border-color: rgba(245, 241, 232, 0.4);
        padding: 16px 28px; font-size: 14px;
      }
      .btn-outline:hover { background: rgba(245, 241, 232, 0.1); }

      .hero-scroll {
        position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
        color: rgba(245, 241, 232, 0.6); z-index: 1;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
        display: flex; flex-direction: column; align-items: center; gap: 8px;
        animation: scrollBounce 2s ease-in-out infinite;
      }
      @keyframes scrollBounce {
        0%, 100% { transform: translate(-50%, 0); opacity: 0.6; }
        50% { transform: translate(-50%, 6px); opacity: 1; }
      }
      .hero-scroll-line {
        width: 1px; height: 40px;
        background: linear-gradient(to bottom, rgba(245, 241, 232, 0.5), transparent);
      }

      /* SOCIAL PROOF */
      .social {
        background: var(--cream);
        padding: 80px 40px;
        border-bottom: 1px solid var(--rule);
      }
      .social-grid {
        max-width: 1320px; margin: 0 auto;
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 48px;
      }
      @media (max-width: 720px) {
        .social-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
      }
      .social-stat {
        border-top: 1px solid var(--green-deep);
        padding-top: 16px;
      }
      .social-stat .num {
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-weight: 600;
        font-size: 48px; letter-spacing: -0.025em;
        color: var(--green-deep); line-height: 1;
      }
      .social-stat .num em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 400;
      }
      .social-stat .label {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px; letter-spacing: 0.18em;
        color: var(--ink-mute);
        text-transform: uppercase; margin-top: 10px;
      }

      /* BENEFICIOS — 2x2 con números enormes */
      .beneficios {
        padding: 140px 40px;
        background: var(--cream);
      }
      .beneficios-shell { max-width: 1320px; margin: 0 auto; }
      .ben-head { max-width: 720px; margin-bottom: 80px; }

      .eyebrow {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px; letter-spacing: 0.22em;
        color: var(--green-deep);
        text-transform: uppercase; margin-bottom: 24px;
        display: inline-flex; align-items: center; gap: 12px;
      }
      .eyebrow::before {
        content: ''; width: 32px; height: 1px; background: var(--green-deep);
      }
      .section-title {
        font-size: clamp(40px, 5vw, 64px);
        font-weight: 600; letter-spacing: -0.025em; line-height: 1.0;
        margin-bottom: 20px;
      }
      .section-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 400;
        color: var(--green-mid);
      }
      .section-lead {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 18px; line-height: 1.6; color: var(--ink-soft);
      }

      .ben-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 0;
        border-top: 1px solid var(--rule);
        border-left: 1px solid var(--rule);
      }
      @media (max-width: 720px) {
        .ben-grid { grid-template-columns: 1fr; }
      }
      .ben-card {
        padding: 56px 48px;
        border-right: 1px solid var(--rule);
        border-bottom: 1px solid var(--rule);
        position: relative; overflow: hidden;
        transition: background .35s;
        cursor: pointer;
        min-height: 360px;
        display: flex; flex-direction: column; justify-content: space-between;
      }
      .ben-card:hover { background: var(--paper); }
      .ben-card.dark { background: var(--green-deep); color: var(--cream); }
      .ben-card.dark:hover { background: var(--green-mid); }
      .ben-num {
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-weight: 200;
        font-size: clamp(120px, 14vw, 200px);
        line-height: 0.85; color: var(--green-deep);
        letter-spacing: -0.05em; opacity: 0.08;
        position: absolute; top: 20px; right: 32px;
        pointer-events: none;
      }
      .ben-card.dark .ben-num { color: var(--cream); opacity: 0.1; }
      .ben-tag {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px; letter-spacing: 0.22em;
        color: var(--ink-mute);
        text-transform: uppercase; margin-bottom: 16px;
        position: relative; z-index: 1;
      }
      .ben-card.dark .ben-tag { color: rgba(245, 241, 232, 0.55); }
      .ben-title {
        font-size: 32px; font-weight: 600;
        letter-spacing: -0.015em; line-height: 1.12;
        margin-bottom: 16px;
        position: relative; z-index: 1;
        max-width: 14ch;
      }
      .ben-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 400;
        color: var(--green-mid);
      }
      .ben-card.dark .ben-title em { color: rgba(245, 241, 232, 0.85); }
      .ben-text {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 16px; line-height: 1.55;
        color: var(--ink-soft);
        max-width: 340px;
        position: relative; z-index: 1;
      }
      .ben-card.dark .ben-text { color: rgba(245, 241, 232, 0.7); }

      /* SERVICIOS — acordeón */
      .servicios {
        background: var(--green-deep);
        color: var(--cream);
        padding: 140px 40px;
        position: relative; overflow: hidden;
      }
      .servicios::before {
        content: ''; position: absolute; inset: 0;
        background:
          radial-gradient(ellipse at 80% 20%, rgba(45, 80, 64, 0.4), transparent 60%),
          radial-gradient(ellipse at 20% 80%, rgba(30, 64, 48, 0.5), transparent 60%);
        pointer-events: none;
      }
      .serv-shell {
        max-width: 1320px; margin: 0 auto;
        position: relative; z-index: 1;
      }
      .serv-head { max-width: 720px; margin-bottom: 80px; }
      .servicios .eyebrow { color: rgba(245, 241, 232, 0.65); }
      .servicios .eyebrow::before { background: rgba(245, 241, 232, 0.4); }
      .servicios .section-title { color: var(--cream); }
      .servicios .section-title em { color: rgba(245, 241, 232, 0.78); }
      .servicios .section-lead { color: rgba(245, 241, 232, 0.7); }

      .acc-list {
        list-style: none; padding: 0; margin: 0;
        border-top: 1px solid rgba(245, 241, 232, 0.15);
      }
      .acc-item {
        border-bottom: 1px solid rgba(245, 241, 232, 0.15);
      }
      .acc-trigger {
        width: 100%; padding: 28px 0;
        display: grid; grid-template-columns: 60px 1fr auto;
        gap: 24px; align-items: center;
        background: transparent; border: none; cursor: pointer;
        text-align: left; color: var(--cream);
        transition: padding .3s;
        font-family: inherit;
      }
      .acc-trigger:hover { padding-left: 16px; }
      .acc-num {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 13px;
        color: rgba(245, 241, 232, 0.5);
        letter-spacing: 0.16em;
      }
      .acc-name {
        font-size: 28px; font-weight: 600;
        letter-spacing: -0.01em; line-height: 1.15;
        color: var(--cream);
      }
      .acc-toggle {
        width: 36px; height: 36px;
        border-radius: 50%;
        border: 1px solid rgba(245, 241, 232, 0.3);
        display: grid; place-items: center;
        transition: all .3s;
        color: var(--cream);
        font-size: 20px; font-weight: 300;
        line-height: 1;
      }
      .acc-item.open .acc-toggle {
        background: var(--cream); color: var(--green-deep);
        transform: rotate(45deg); border-color: var(--cream);
      }
      .acc-content {
        grid-column: 2 / 4;
        overflow: hidden; max-height: 0;
        transition: max-height .5s cubic-bezier(.2, .7, .2, 1);
        padding: 0 0 0 84px;
      }
      .acc-item.open .acc-content { max-height: 280px; }
      .acc-body {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 17px; line-height: 1.6;
        color: rgba(245, 241, 232, 0.78);
        padding-bottom: 28px;
        max-width: 640px;
      }
      .acc-panel {
        display: flex; flex-wrap: wrap; gap: 8px 16px;
        margin-top: 14px; padding: 0; list-style: none;
      }
      .acc-panel li {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px;
        color: rgba(245, 241, 232, 0.6);
        letter-spacing: 0.06em;
        display: inline-flex; align-items: center; gap: 6px;
      }
      .acc-panel li::before {
        content: ''; width: 4px; height: 4px; border-radius: 50%;
        background: rgba(245, 241, 232, 0.6);
      }

      /* CTA */
      .cta {
        background: var(--cream);
        padding: 140px 40px;
        text-align: center;
      }
      .cta-inner { max-width: 720px; margin: 0 auto; }
      .cta .eyebrow { justify-content: center; }
      .cta-title {
        font-size: clamp(48px, 6vw, 80px);
        font-weight: 600; letter-spacing: -0.025em; line-height: 1.0;
        margin-bottom: 24px;
      }
      .cta-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 400;
        color: var(--green-mid);
      }
      .cta-lead {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 19px; line-height: 1.6;
        color: var(--ink-soft); margin-bottom: 40px;
      }
      .cta-actions {
        display: inline-flex; gap: 14px; flex-wrap: wrap;
        justify-content: center;
      }
      .cta-actions .btn-primary {
        background: var(--green-deep); color: var(--cream);
        padding: 18px 32px; font-size: 15px;
      }
      .cta-actions .btn-primary:hover {
        background: var(--green-mid); transform: translateY(-2px);
      }
      .cta-actions .btn-ghost {
        color: var(--green-deep); border-color: var(--rule);
        padding: 18px 32px; font-size: 15px;
      }
      .cta-actions .btn-ghost:hover { background: rgba(13, 40, 24, 0.06); }

      /* FOOTER */
      .land-foot {
        background: var(--green-deep); color: var(--cream);
        padding: 100px 40px 0;
        position: relative; overflow: hidden;
      }
      .land-foot::before {
        content: '';
        position: absolute; top: 0; left: 0; right: 0;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(245, 241, 232, 0.25) 30%,
          rgba(245, 241, 232, 0.25) 70%,
          transparent 100%
        );
      }

      /* Hojas decorativas del footer */
      .foot-leaves {
        position: absolute; inset: 0;
        pointer-events: none; overflow: hidden;
      }
      .foot-leaves svg {
        position: absolute;
        color: var(--cream);
      }
      .foot-leaves .fl1 {
        top: -120px; right: -80px;
        width: 380px;
        opacity: 0.04;
        transform: rotate(20deg);
      }
      .foot-leaves .fl2 {
        bottom: -150px; left: -100px;
        width: 420px;
        opacity: 0.03;
        transform: rotate(-30deg);
      }

      /* Sello editorial gigante */
      .foot-mast {
        max-width: 1320px; margin: 0 auto;
        padding: 0 0 72px;
        position: relative; z-index: 1;
        text-align: center;
      }
      .foot-mast-mark {
        display: flex; align-items: center; justify-content: center;
        margin-bottom: 28px;
        opacity: 0.95;
      }
      .foot-mast-author {
        display: flex; flex-direction: column; align-items: center;
        gap: 6px;
        margin: 0 auto 28px;
        max-width: max-content;
      }
      .foot-mast-author-label {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10px;
        letter-spacing: 0.32em;
        color: rgba(245, 241, 232, 0.5);
        text-transform: uppercase;
      }
      .foot-mast-author-name {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 400;
        font-size: 18px;
        color: rgba(245, 241, 232, 0.92);
        letter-spacing: -0.005em;
      }
      .foot-mast-word em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 300;
        color: rgba(245, 241, 232, 0.55);
        margin-left: 0.05em;
      }
      .foot-mast-line {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: clamp(18px, 1.6vw, 22px);
        line-height: 1.5;
        color: rgba(245, 241, 232, 0.7);
        max-width: 540px; margin: 0 auto;
      }
      .foot-mast-line em {
        font-style: italic;
        color: rgba(245, 241, 232, 0.95);
      }

      .foot-divider {
        max-width: 1320px;
        height: 1px;
        margin: 0 auto;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(245, 241, 232, 0.18) 50%,
          transparent 100%
        );
        position: relative; z-index: 1;
      }

      /* Grid principal */
      .foot-grid {
        max-width: 1320px; margin: 0 auto;
        padding: 80px 0;
        display: grid;
        grid-template-columns: 1.1fr 2fr;
        gap: 80px;
        position: relative; z-index: 1;
      }
      @media (max-width: 960px) {
        .foot-grid { grid-template-columns: 1fr; gap: 56px; }
      }

      .foot-brand-col {
        display: flex; flex-direction: column; gap: 24px;
      }
      .foot-brand-mark {
        display: inline-flex;
        padding: 16px 18px;
        border: 1px solid rgba(245, 241, 232, 0.15);
        border-radius: 14px;
        background: rgba(245, 241, 232, 0.03);
        align-self: flex-start;
      }
      .foot-blurb {
        font-family: var(--font-newsreader), Georgia, serif;
        font-size: 17px; max-width: 360px; line-height: 1.55;
        color: rgba(245, 241, 232, 0.72);
        margin: 0;
      }
      .foot-cta {
        display: flex; flex-direction: column; gap: 10px;
        margin-top: 8px;
      }
      .foot-cta-btn {
        display: inline-flex; align-items: center; gap: 10px;
        align-self: flex-start;
        background: var(--cream);
        color: var(--green-deep);
        padding: 14px 24px;
        border-radius: 999px;
        font-size: 14px; font-weight: 600;
        text-decoration: none;
        transition: all .25s;
      }
      .foot-cta-btn:hover {
        transform: translateY(-2px);
        background: #fff;
        box-shadow: 0 12px 24px -8px rgba(245, 241, 232, 0.25);
      }
      .foot-cta-btn svg { transition: transform .25s; }
      .foot-cta-btn:hover svg { transform: translateX(4px); }
      .foot-cta-meta {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px; letter-spacing: 0.18em;
        color: rgba(245, 241, 232, 0.4);
        text-transform: uppercase;
      }

      /* Columnas de links */
      .foot-cols {
        display: grid; grid-template-columns: 1fr 1.1fr 1.2fr;
        gap: 48px;
      }
      @media (max-width: 720px) {
        .foot-cols { grid-template-columns: 1fr 1fr; gap: 40px 32px; }
      }
      .foot-col {
        display: flex; flex-direction: column;
      }
      .foot-tag {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10.5px; letter-spacing: 0.28em;
        color: rgba(245, 241, 232, 0.55);
        margin-bottom: 24px; text-transform: uppercase;
        display: inline-flex; align-items: center; gap: 10px;
      }
      .foot-tag .dot {
        width: 5px; height: 5px; border-radius: 50%;
        background: var(--cream);
      }
      .foot-link {
        display: flex; align-items: center; justify-content: space-between;
        padding: 11px 0;
        color: rgba(245, 241, 232, 0.78);
        font-size: 15px; text-decoration: none;
        border-bottom: 1px solid rgba(245, 241, 232, 0.08);
        transition: all .25s;
        font-family: var(--font-manrope), system-ui, sans-serif;
      }
      .foot-link:hover {
        color: var(--cream);
        padding-left: 6px;
        border-bottom-color: rgba(245, 241, 232, 0.25);
      }
      .foot-link .arrow {
        opacity: 0;
        transform: translateX(-6px);
        transition: all .25s;
        color: rgba(245, 241, 232, 0.5);
        font-size: 14px;
      }
      .foot-link:hover .arrow {
        opacity: 1;
        transform: translateX(0);
      }
      .foot-link.contact-link {
        flex-direction: column; align-items: flex-start; gap: 4px;
        padding: 14px 0;
      }
      .foot-link.contact-link.static {
        cursor: default;
      }
      .foot-link.contact-link.static:hover {
        color: rgba(245, 241, 232, 0.78);
        padding-left: 0;
      }
      .foot-link .contact-label {
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 10px; letter-spacing: 0.2em;
        color: rgba(245, 241, 232, 0.45);
        text-transform: uppercase;
      }
      .foot-link .contact-value {
        font-size: 16px;
        color: rgba(245, 241, 232, 0.95);
        font-weight: 500;
        letter-spacing: -0.005em;
      }

      /* Footer bar */
      .foot-bar {
        position: relative; z-index: 1;
        background: rgba(0, 0, 0, 0.18);
        border-top: 1px solid rgba(245, 241, 232, 0.1);
        margin: 0 -40px;
        padding: 24px 40px;
      }
      .foot-bar-inner {
        max-width: 1320px; margin: 0 auto;
        display: flex; justify-content: space-between;
        align-items: center; gap: 24px; flex-wrap: wrap;
        font-family: var(--font-dm-mono), 'JetBrains Mono', monospace;
        font-size: 11px;
        color: rgba(245, 241, 232, 0.5);
        letter-spacing: 0.18em; text-transform: uppercase;
      }
      .foot-bar-meta, .foot-bar-place {
        display: inline-flex; align-items: center; gap: 12px;
        flex-wrap: wrap;
      }
      .foot-bar-place svg {
        color: rgba(245, 241, 232, 0.6);
      }
      .foot-bar-sep {
        color: rgba(245, 241, 232, 0.25);
      }
      .foot-bar-italic {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        text-transform: none;
        letter-spacing: 0;
        font-size: 13px;
        color: rgba(245, 241, 232, 0.55);
      }

      /* Anim hero */
      @keyframes heroIn {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .hero-anim { animation: heroIn 1.2s cubic-bezier(.2, .7, .2, 1) both; }
      .ha1 { animation-delay: 100ms; }
      .ha2 { animation-delay: 350ms; }
      .ha3 { animation-delay: 700ms; }
      .ha4 { animation-delay: 1000ms; }

      /* ─────────────  RESPONSIVE  ───────────── */
      @media (max-width: 1024px) {
        .land-nav { padding: 16px 24px; }
        .land-nav.opaque { padding: 12px 24px; }
        .hero { padding: 64px 24px; }
        .social { padding: 64px 24px; }
        .beneficios { padding: 96px 24px; }
        .servicios { padding: 96px 24px; }
        .cta { padding: 96px 24px; }
        .land-foot { padding: 80px 24px 0; }
        .foot-bar { margin: 0 -24px; padding: 24px; }
        .ben-card { padding: 44px 32px; min-height: 300px; }
      }

      @media (max-width: 768px) {
        .land-nav .brand small { display: none; }
        .hero { min-height: 0; height: auto; padding: 120px 20px 64px; align-items: flex-start; }
        .hero-scroll { display: none; }
        .hero-bottom { gap: 28px; }
        .hero-lead { font-size: 18px; }
        .social { padding: 48px 20px; }
        .beneficios { padding: 64px 20px; }
        .ben-head { margin-bottom: 48px; }
        .ben-card { padding: 36px 24px; min-height: auto; }
        .ben-num { font-size: 120px; top: 12px; right: 16px; }
        .ben-title { font-size: 26px; max-width: none; }
        .ben-text { max-width: none; }
        .servicios { padding: 64px 20px; }
        .serv-head { margin-bottom: 48px; }
        .acc-trigger { grid-template-columns: 1fr auto; gap: 16px; padding: 22px 0; }
        .acc-trigger:hover { padding-left: 0; }
        .acc-num { display: none; }
        .acc-name { font-size: 21px; }
        .acc-content { grid-column: 1 / 3; padding-left: 0; }
        .acc-item.open .acc-content { max-height: 360px; }
        .acc-body { font-size: 15.5px; padding-bottom: 22px; }
        .cta { padding: 64px 20px; }
        .land-foot { padding: 64px 20px 0; }
        .foot-bar { margin: 0 -20px; padding: 20px; }
        .foot-mast { padding-bottom: 48px; }
        .foot-grid { padding: 48px 0; gap: 40px; }
      }

      @media (max-width: 480px) {
        .nav-actions { gap: 6px; }
        .nav-actions .btn { padding: 8px 14px; font-size: 12.5px; }
        .nav-actions .btn-ghost svg, .nav-actions .btn-primary svg { display: none; }
        .hero { padding-top: 104px; }
        .hero-eyebrow { font-size: 10px; letter-spacing: 0.2em; margin-bottom: 20px; }
        .hero-actions { gap: 10px; width: 100%; }
        .hero-actions .btn { flex: 1; justify-content: center; padding: 14px 18px; }
        .social-grid { grid-template-columns: 1fr; gap: 24px; }
        .social-stat .num { font-size: 40px; }
        .foot-bar-inner { font-size: 10px; }
        .foot-bar-italic { font-size: 12px; }
      }
    `}</style>
  );
}
