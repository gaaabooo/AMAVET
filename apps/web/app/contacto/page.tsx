import Link from 'next/link';
import LegalNav from '@/components/LegalNav';
import LegalFooter from '@/components/LegalFooter';

export const metadata = {
  title: 'Contacto — Silvestra Vet',
  description:
    'Habla con Silvestra Vet por WhatsApp o correo. Atención veterinaria a domicilio en la Región de Valparaíso.',
};

const CANALES = [
  {
    label: 'Correo general',
    descripcion:
      'Coordinaciones, presupuestos y consultas administrativas. Respondemos dentro de 24 horas hábiles.',
    valor: 'hola@silvestravet.cl',
    href: 'mailto:hola@silvestravet.cl',
    cta: 'Escribir',
    icon: '✉',
  },
  {
    label: 'Soporte clínico',
    descripcion:
      'Dudas sobre resultados de exámenes, indicaciones o tratamientos en curso.',
    valor: 'soporte@silvestravet.cl',
    href: 'mailto:soporte@silvestravet.cl',
    cta: 'Escribir a soporte',
    icon: '✦',
  },
  {
    label: 'Privacidad y datos',
    descripcion:
      'Solicitudes sobre tratamiento de datos personales conforme a la Ley N° 19.628.',
    valor: 'privacidad@silvestravet.cl',
    href: 'mailto:privacidad@silvestravet.cl',
    cta: 'Escribir',
    icon: '§',
  },
];

const HORARIO = [
  { dia: 'Lun — Vie', rango: '09:00 — 19:00', activo: true },
  { dia: 'Sábados', rango: '10:00 — 14:00', activo: true },
  { dia: 'Domingo', rango: 'Solo urgencias', activo: false },
  { dia: 'Festivos', rango: 'Solo urgencias', activo: false },
];

export default function ContactoPage() {
  return (
    <main className="ct-root">
      <LegalNav />

      <header className="ct-hero">
        <div className="ct-hero-leaves" aria-hidden>
          <div className="leaf leaf-1" />
          <div className="leaf leaf-2" />
          <div className="leaf leaf-3" />
        </div>

        <div className="ct-hero-grid">
          <div className="ct-hero-text">
            <span className="ct-eyebrow">
              <span className="ct-eyebrow-line" />
              Hablemos
            </span>

            <h1 className="ct-title">
              Una conversación
              <br />
              <em>antes que un trámite</em>
            </h1>

            <p className="ct-intro">
              Cuéntanos qué necesita tu mascota. Coordinamos por WhatsApp o
              correo según te acomode, y respondemos personalmente: detrás de
              cada mensaje hay un médico veterinario, no un bot.
            </p>

            <div className="ct-hero-actions">
              <a
                href="https://wa.me/56912345678?text=Hola,%20quiero%20agendar%20una%20visita%20veterinaria"
                target="_blank"
                rel="noopener noreferrer"
                className="ct-btn-primary"
              >
                <span className="ct-btn-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413"/>
                  </svg>
                </span>
                Abrir WhatsApp
                <span className="ct-btn-arrow" aria-hidden>→</span>
              </a>
              <div className="ct-status">
                <span className="ct-status-dot" aria-hidden />
                <span>
                  Atendiendo ahora ·{' '}
                  <span className="ct-status-mute">Lun a Vie 9:00–19:00</span>
                </span>
              </div>
            </div>
          </div>

          <aside className="ct-hero-card">
            <div className="ct-card-frame">
              <div className="ct-card-corner ct-corner-tl" aria-hidden />
              <div className="ct-card-corner ct-corner-tr" aria-hidden />
              <div className="ct-card-corner ct-corner-bl" aria-hidden />
              <div className="ct-card-corner ct-corner-br" aria-hidden />

              <span className="ct-card-eyebrow">Vía rápida</span>
              <p className="ct-card-num">+56 9 1234 5678</p>
              <p className="ct-card-detalle">
                Mensajes directos al equipo clínico. Respuesta en minutos
                dentro de horario.
              </p>
              <div className="ct-card-meta">
                <div>
                  <span className="ct-card-meta-l">Comunas</span>
                  <span className="ct-card-meta-v">10</span>
                </div>
                <div className="ct-card-divider" aria-hidden />
                <div>
                  <span className="ct-card-meta-l">Región</span>
                  <span className="ct-card-meta-v">V</span>
                </div>
                <div className="ct-card-divider" aria-hidden />
                <div>
                  <span className="ct-card-meta-l">Respuesta</span>
                  <span className="ct-card-meta-v">~5 min</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <section className="ct-canales">
        <div className="ct-section-inner">
          <div className="ct-section-head">
            <span className="ct-num">I</span>
            <div>
              <h2 className="ct-h2">
                Otros <em>canales</em>
              </h2>
              <p className="ct-h2-sub">
                Si lo tuyo no es WhatsApp, también puedes escribirnos por
                correo según el tipo de consulta.
              </p>
            </div>
          </div>

          <ul className="ct-canales-grid">
            {CANALES.map((c, i) => (
              <li key={c.label} className="ct-canal">
                <span className="ct-canal-num">
                  {String(i + 2).padStart(2, '0')}
                </span>
                <span className="ct-canal-icon" aria-hidden>
                  {c.icon}
                </span>
                <span className="ct-canal-label">{c.label}</span>
                <p className="ct-canal-desc">{c.descripcion}</p>
                <a
                  href={c.href}
                  className="ct-canal-mail"
                  aria-label={`${c.cta} a ${c.valor}`}
                >
                  {c.valor}
                  <span className="ct-canal-arrow" aria-hidden>→</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="ct-horario">
        <div className="ct-horario-decor" aria-hidden>
          <svg viewBox="0 0 1200 600" preserveAspectRatio="none">
            <defs>
              <pattern id="ct-topo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 0 40 Q 20 20 40 40 T 80 40" fill="none" stroke="rgba(212, 196, 122, 0.4)" strokeWidth="0.6" />
                <path d="M 0 60 Q 20 40 40 60 T 80 60" fill="none" stroke="rgba(212, 196, 122, 0.3)" strokeWidth="0.6" />
                <path d="M 0 20 Q 20 0 40 20 T 80 20" fill="none" stroke="rgba(212, 196, 122, 0.3)" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="1200" height="600" fill="url(#ct-topo)" />
          </svg>
        </div>

        <div className="ct-section-inner">
          <div className="ct-section-head">
            <span className="ct-num ct-num-light">II</span>
            <div>
              <h2 className="ct-h2 ct-h2-light">
                Horario de <em>atención</em>
              </h2>
              <p className="ct-h2-sub ct-h2-sub-light">
                Tiempos en los que el equipo está activo respondiendo y
                coordinando visitas.
              </p>
            </div>
          </div>

          <div className="ct-horario-grid">
            <ul className="ct-horario-list">
              {HORARIO.map((h, i) => (
                <li
                  key={h.dia}
                  className={`ct-horario-row ${h.activo ? 'is-active' : 'is-mute'}`}
                >
                  <span className="ct-horario-i">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="ct-horario-dia">{h.dia}</span>
                  <span className="ct-horario-rango">{h.rango}</span>
                  <span className="ct-horario-dot" aria-hidden />
                </li>
              ))}
            </ul>

            <aside className="ct-urgencia">
              <span className="ct-urg-eyebrow">Fuera de horario</span>
              <h3 className="ct-urg-title">
                Urgencias <em>clínicas</em>
              </h3>
              <p className="ct-urg-text">
                Para emergencias fuera de nuestro horario de atención, te
                derivamos a la clínica veterinaria de turno más cercana a tu
                domicilio. Si tu caso es urgente, llama directamente.
              </p>
              <a
                href="tel:+56912345678"
                className="ct-urg-mail"
              >
                Llamar ahora
                <span className="ct-urg-arrow" aria-hidden>→</span>
              </a>
            </aside>
          </div>
        </div>
      </section>

      <section className="ct-cobertura">
        <div className="ct-section-inner ct-cob-inner">
          <div>
            <span className="ct-eyebrow">
              <span className="ct-eyebrow-line" />
              Antes de escribir
            </span>
            <h3 className="ct-cob-title">
              ¿Tu comuna está en
              <br />
              <em>nuestra cobertura?</em>
            </h3>
            <p className="ct-cob-text">
              Operamos en la Región de Valparaíso con cobertura habitual y
              extendida. Revisa el detalle antes de coordinar la visita.
            </p>
          </div>
          <Link href="/cobertura" className="ct-cob-btn">
            Ver áreas de cobertura
            <span className="ct-cob-arrow" aria-hidden>→</span>
          </Link>
        </div>
      </section>

      <LegalFooter />

      <ContactoStyles />
    </main>
  );
}

function ContactoStyles() {
  return (
    <style>{`
      .ct-root {
        --cream: #f5f1e8;
        --cream-soft: #ede8da;
        --green-deep: #0d2818;
        --green: #012d1d;
        --green-soft: #1a3a26;
        --gold: #735c00;
        --gold-soft: #d4c47a;
        --ink: #191c1d;
        --muted: #6b7268;
        --line: #d8d2c2;
        --whatsapp: #25d366;
        background: var(--cream);
        min-height: 100vh;
        color: var(--ink);
        font-family: var(--font-manrope);
      }

      /* HERO */
      .ct-hero {
        position: relative;
        padding: 5rem 2rem 5rem;
        overflow: hidden;
      }
      .ct-hero-leaves {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.07;
      }
      .leaf {
        position: absolute;
        background: var(--green-deep);
        border-radius: 50% 0 50% 0;
      }
      .leaf-1 { top: 5%; left: -3%; width: 240px; height: 240px; transform: rotate(-25deg); }
      .leaf-2 { top: 60%; right: -4%; width: 280px; height: 280px; transform: rotate(40deg); }
      .leaf-3 { bottom: -8%; left: 35%; width: 180px; height: 180px; transform: rotate(15deg); }

      .ct-hero-grid {
        position: relative;
        max-width: 1200px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        gap: 4rem;
        align-items: center;
      }

      .ct-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: var(--green);
        margin-bottom: 1.5rem;
        font-family: var(--font-dm-mono), monospace;
      }
      .ct-eyebrow-line {
        width: 36px;
        height: 1px;
        background: var(--green);
      }
      .ct-title {
        font-size: clamp(2.75rem, 6.5vw, 5rem);
        font-weight: 700;
        line-height: 1;
        letter-spacing: -0.03em;
        color: var(--ink);
        margin-bottom: 1.75rem;
      }
      .ct-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--green);
      }
      .ct-intro {
        max-width: 50ch;
        font-family: var(--font-newsreader);
        font-size: 1.1875rem;
        line-height: 1.6;
        color: #414844;
        margin-bottom: 2.5rem;
      }

      .ct-hero-actions {
        display: flex;
        align-items: center;
        gap: 2rem;
        flex-wrap: wrap;
      }
      .ct-btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.875rem;
        padding: 1.125rem 2rem;
        background: var(--green);
        color: var(--cream);
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        border-radius: 100px;
        text-decoration: none;
        transition: all 0.3s;
      }
      .ct-btn-primary:hover {
        background: var(--green-deep);
        transform: translateY(-2px);
        box-shadow: 0 16px 36px rgba(13, 40, 24, 0.3);
      }
      .ct-btn-icon {
        display: inline-flex;
        align-items: center;
        color: var(--whatsapp);
      }
      .ct-btn-arrow {
        transition: transform 0.3s;
      }
      .ct-btn-primary:hover .ct-btn-arrow {
        transform: translateX(4px);
      }
      .ct-status {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.78rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--muted);
      }
      .ct-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--whatsapp);
        box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7);
        animation: ctPulse 2s ease-in-out infinite;
      }
      @keyframes ctPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.55); }
        50% { box-shadow: 0 0 0 8px rgba(37, 211, 102, 0); }
      }
      .ct-status-mute {
        color: rgba(107, 114, 104, 0.7);
      }

      /* HERO CARD */
      .ct-hero-card {
        position: relative;
      }
      .ct-card-frame {
        position: relative;
        padding: 2.5rem 2rem;
        background: var(--green-deep);
        color: var(--cream);
        border-radius: 4px;
        overflow: hidden;
      }
      .ct-card-frame::before {
        content: '';
        position: absolute;
        top: -30%;
        right: -30%;
        width: 240px;
        height: 240px;
        background: radial-gradient(circle, rgba(212, 196, 122, 0.18), transparent 70%);
        pointer-events: none;
      }
      .ct-card-corner {
        position: absolute;
        width: 14px;
        height: 14px;
        border: 1px solid var(--gold-soft);
        opacity: 0.6;
      }
      .ct-corner-tl { top: 10px; left: 10px; border-right: none; border-bottom: none; }
      .ct-corner-tr { top: 10px; right: 10px; border-left: none; border-bottom: none; }
      .ct-corner-bl { bottom: 10px; left: 10px; border-right: none; border-top: none; }
      .ct-corner-br { bottom: 10px; right: 10px; border-left: none; border-top: none; }

      .ct-card-eyebrow {
        position: relative;
        display: inline-block;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: var(--gold-soft);
        margin-bottom: 1rem;
      }
      .ct-card-num {
        position: relative;
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 2.25rem;
        line-height: 1;
        letter-spacing: -0.02em;
        color: var(--cream);
        margin-bottom: 1rem;
      }
      .ct-card-detalle {
        position: relative;
        font-family: var(--font-newsreader);
        font-size: 0.9375rem;
        line-height: 1.55;
        color: rgba(245, 241, 232, 0.72);
        margin-bottom: 1.75rem;
      }
      .ct-card-meta {
        position: relative;
        display: flex;
        align-items: stretch;
        gap: 1.25rem;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(245, 241, 232, 0.15);
      }
      .ct-card-meta > div {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .ct-card-meta-l {
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.62rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: rgba(245, 241, 232, 0.5);
      }
      .ct-card-meta-v {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-size: 1.125rem;
        color: var(--gold-soft);
      }
      .ct-card-divider {
        width: 1px;
        background: rgba(245, 241, 232, 0.15);
      }

      /* SECTIONS */
      .ct-section-inner {
        max-width: 1100px;
        margin: 0 auto;
      }
      .ct-section-head {
        display: flex;
        align-items: flex-start;
        gap: 2rem;
        margin-bottom: 3rem;
      }
      .ct-num {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-size: 3rem;
        font-weight: 300;
        line-height: 1;
        color: var(--green);
        opacity: 0.4;
        letter-spacing: -0.02em;
        flex-shrink: 0;
        min-width: 3.5rem;
      }
      .ct-num-light { color: #c8e0d0; }
      .ct-h2 {
        font-size: clamp(2rem, 4vw, 2.75rem);
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.02em;
        color: var(--ink);
        margin-bottom: 0.75rem;
      }
      .ct-h2-light { color: var(--cream); }
      .ct-h2 em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--green);
      }
      .ct-h2-light em { color: var(--gold-soft); }
      .ct-h2-sub {
        font-family: var(--font-newsreader);
        font-size: 1.0625rem;
        line-height: 1.6;
        color: #414844;
        max-width: 52ch;
      }
      .ct-h2-sub-light { color: rgba(245, 241, 232, 0.72); }

      /* CANALES */
      .ct-canales {
        padding: 5rem 2rem;
        background: var(--cream);
        border-top: 1px solid var(--line);
      }
      .ct-canales-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1px;
        background: var(--line);
        border: 1px solid var(--line);
      }
      .ct-canal {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 2.5rem 2rem;
        background: #fbf8f0;
        transition: background 0.3s;
      }
      .ct-canal:hover { background: #ffffff; }
      .ct-canal-num {
        position: absolute;
        top: 1.5rem;
        right: 1.75rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: var(--muted);
      }
      .ct-canal-icon {
        font-family: var(--font-newsreader);
        font-size: 2rem;
        line-height: 1;
        color: var(--green);
        opacity: 0.7;
        margin-bottom: 0.5rem;
      }
      .ct-canal-label {
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--green);
      }
      .ct-canal-desc {
        font-family: var(--font-newsreader);
        font-size: 0.9375rem;
        line-height: 1.55;
        color: #414844;
        margin-bottom: 0.5rem;
        flex: 1;
      }
      .ct-canal-mail {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--ink);
        text-decoration: none;
        padding-top: 0.875rem;
        border-top: 1px solid var(--line);
        transition: color 0.3s;
      }
      .ct-canal-mail:hover { color: var(--green); }
      .ct-canal-arrow { transition: transform 0.3s; }
      .ct-canal-mail:hover .ct-canal-arrow { transform: translateX(4px); }

      /* HORARIO */
      .ct-horario {
        position: relative;
        padding: 5rem 2rem;
        background: var(--green-deep);
        color: var(--cream);
        overflow: hidden;
      }
      .ct-horario-decor {
        position: absolute;
        inset: 0;
        opacity: 0.3;
        pointer-events: none;
      }
      .ct-horario-decor svg { width: 100%; height: 100%; }
      .ct-horario .ct-section-inner { position: relative; z-index: 1; }
      .ct-horario-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 4rem;
        align-items: start;
      }
      .ct-horario-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .ct-horario-row {
        display: grid;
        grid-template-columns: 44px 1fr auto 12px;
        align-items: center;
        gap: 1.5rem;
        padding: 1.25rem 0;
        border-bottom: 1px solid rgba(245, 241, 232, 0.1);
        transition: padding 0.3s;
      }
      .ct-horario-row:hover { padding-left: 0.75rem; }
      .ct-horario-i {
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        color: rgba(212, 196, 122, 0.7);
      }
      .ct-horario-dia {
        font-size: 1.125rem;
        font-weight: 500;
        color: var(--cream);
        letter-spacing: -0.01em;
      }
      .ct-horario-rango {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-size: 1rem;
        color: rgba(245, 241, 232, 0.7);
      }
      .ct-horario-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      .ct-horario-row.is-active .ct-horario-dot {
        background: var(--gold-soft);
      }
      .ct-horario-row.is-mute {
        opacity: 0.55;
      }
      .ct-horario-row.is-mute .ct-horario-dot {
        background: rgba(245, 241, 232, 0.25);
      }

      .ct-urgencia {
        padding: 2rem;
        border: 1px solid rgba(245, 241, 232, 0.18);
        border-radius: 4px;
        background: rgba(245, 241, 232, 0.04);
      }
      .ct-urg-eyebrow {
        display: inline-block;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: var(--gold-soft);
        margin-bottom: 0.875rem;
      }
      .ct-urg-title {
        font-size: 1.625rem;
        font-weight: 600;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: var(--cream);
        margin-bottom: 1rem;
      }
      .ct-urg-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--gold-soft);
      }
      .ct-urg-text {
        font-family: var(--font-newsreader);
        font-size: 0.95rem;
        line-height: 1.6;
        color: rgba(245, 241, 232, 0.72);
        margin-bottom: 1.5rem;
      }
      .ct-urg-mail {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--cream);
        text-decoration: none;
        padding: 0.75rem 0;
        border-bottom: 1px solid rgba(245, 241, 232, 0.3);
        transition: color 0.3s, border-color 0.3s;
      }
      .ct-urg-mail:hover {
        color: var(--gold-soft);
        border-bottom-color: var(--gold-soft);
      }
      .ct-urg-arrow { transition: transform 0.3s; }
      .ct-urg-mail:hover .ct-urg-arrow { transform: translateX(4px); }

      /* COBERTURA STRIP */
      .ct-cobertura {
        padding: 4.5rem 2rem;
        background: var(--cream-soft);
      }
      .ct-cob-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 3rem;
        flex-wrap: wrap;
      }
      .ct-cob-title {
        font-size: clamp(1.75rem, 3.5vw, 2.5rem);
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: -0.02em;
        color: var(--ink);
        margin-bottom: 0.875rem;
      }
      .ct-cob-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--green);
      }
      .ct-cob-text {
        font-family: var(--font-newsreader);
        font-size: 1.0625rem;
        line-height: 1.55;
        color: #414844;
        max-width: 50ch;
      }
      .ct-cob-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 1.75rem;
        background: transparent;
        border: 1px solid var(--green);
        color: var(--green);
        font-size: 0.9rem;
        font-weight: 600;
        border-radius: 100px;
        text-decoration: none;
        transition: all 0.3s;
        flex-shrink: 0;
      }
      .ct-cob-btn:hover {
        background: var(--green);
        color: var(--cream);
      }
      .ct-cob-arrow { transition: transform 0.3s; }
      .ct-cob-btn:hover .ct-cob-arrow { transform: translateX(4px); }

      @media (max-width: 980px) {
        .ct-hero-grid {
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        .ct-canales-grid {
          grid-template-columns: 1fr;
        }
        .ct-horario-grid {
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
      }
      @media (max-width: 768px) {
        .ct-section-head { flex-direction: column; gap: 1rem; }
        .ct-num { font-size: 2.25rem; }
        .ct-hero-actions { gap: 1.25rem; }
        .ct-cob-inner { flex-direction: column; align-items: flex-start; }
      }
      @media (max-width: 640px) {
        .ct-hero { padding: 4rem 1.25rem; }
        .ct-canales { padding: 3.5rem 1.25rem; }
        .ct-horario { padding: 3.5rem 1.25rem; }
        .ct-cobertura { padding: 3.5rem 1.25rem; }
        .ct-hero-actions { flex-direction: column; align-items: stretch; }
        .ct-hero-actions > * { justify-content: center; }
      }
    `}</style>
  );
}
