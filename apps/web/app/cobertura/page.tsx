import LegalNav from '@/components/LegalNav';
import LegalFooter from '@/components/LegalFooter';

export const metadata = {
  title: 'Área de cobertura — Silvestra Vet',
  description:
    'Comunas de la Región de Valparaíso donde Silvestra Vet presta atención veterinaria a domicilio.',
};

const COBERTURA_HABITUAL = [
  { nombre: 'Valparaíso', detalle: 'Cerros y plan' },
  { nombre: 'Viña del Mar', detalle: 'Plan, cerros y reñaca' },
  { nombre: 'Quilpué', detalle: 'Belloto y centro' },
];

const COBERTURA_EXTENDIDA = [
  { nombre: 'Villa Alemana', zona: 'Marga Marga', tiempo: '24h' },
  { nombre: 'Limache', zona: 'Marga Marga', tiempo: '24h' },
  { nombre: 'Quillota', zona: 'Valle Aconcagua', tiempo: '24-48h' },
  { nombre: 'La Cruz', zona: 'Valle Aconcagua', tiempo: '24-48h' },
  { nombre: 'La Calera', zona: 'Valle Aconcagua', tiempo: '24-48h' },
  { nombre: 'Nogales', zona: 'Valle Aconcagua', tiempo: '48h' },
  { nombre: 'El Melón', zona: 'Valle Aconcagua', tiempo: '48h' },
];

export default function CoberturaPage() {
  return (
    <main className="cov-root">
      <LegalNav />

      <header className="cov-hero">
        <div className="cov-hero-leaves" aria-hidden>
          <div className="leaf leaf-1" />
          <div className="leaf leaf-2" />
          <div className="leaf leaf-3" />
        </div>

        <div className="cov-hero-inner">
          <span className="cov-eyebrow">
            <span className="cov-eyebrow-line" />
            Dónde llegamos
          </span>

          <h1 className="cov-title">
            Región de
            <br />
            <em>Valparaíso</em>
          </h1>

          <p className="cov-intro">
            Atención veterinaria a domicilio en la zona costera y el valle del
            Aconcagua. Si tu comuna no aparece en la lista, escríbenos por
            WhatsApp y revisamos disponibilidad para una visita programada.
          </p>

          <div className="cov-meta">
            <div className="cov-meta-item">
              <span className="cov-meta-num">10</span>
              <span className="cov-meta-label">Comunas atendidas</span>
            </div>
            <div className="cov-meta-divider" aria-hidden />
            <div className="cov-meta-item">
              <span className="cov-meta-num">V</span>
              <span className="cov-meta-label">Región de Chile</span>
            </div>
            <div className="cov-meta-divider" aria-hidden />
            <div className="cov-meta-item">
              <span className="cov-meta-num">~80km</span>
              <span className="cov-meta-label">De radio aproximado</span>
            </div>
          </div>
        </div>
      </header>

      <section className="cov-section cov-habitual">
        <div className="cov-section-inner">
          <div className="cov-section-head">
            <span className="cov-num">I</span>
            <div>
              <h2 className="cov-h2">
                Cobertura <em>habitual</em>
              </h2>
              <p className="cov-h2-sub">
                Visitas el mismo día o el siguiente, según disponibilidad de
                horarios.
              </p>
            </div>
          </div>

          <ul className="cov-grid cov-grid-habitual">
            {COBERTURA_HABITUAL.map((c, i) => (
              <li key={c.nombre} className="cov-card cov-card-habitual">
                <span className="cov-card-num">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="cov-card-name">{c.nombre}</h3>
                <p className="cov-card-detalle">{c.detalle}</p>
                <div className="cov-card-tag">
                  <span className="cov-card-dot" aria-hidden />
                  Disponibilidad inmediata
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="cov-section cov-extendida">
        <div className="cov-topo" aria-hidden>
          <svg viewBox="0 0 1200 600" preserveAspectRatio="none">
            <defs>
              <pattern id="topo" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 0 40 Q 20 20 40 40 T 80 40" fill="none" stroke="rgba(212, 196, 122, 0.4)" strokeWidth="0.6" />
                <path d="M 0 60 Q 20 40 40 60 T 80 60" fill="none" stroke="rgba(212, 196, 122, 0.3)" strokeWidth="0.6" />
                <path d="M 0 20 Q 20 0 40 20 T 80 20" fill="none" stroke="rgba(212, 196, 122, 0.3)" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="1200" height="600" fill="url(#topo)" />
          </svg>
        </div>

        <div className="cov-section-inner">
          <div className="cov-section-head">
            <span className="cov-num cov-num-light">II</span>
            <div>
              <h2 className="cov-h2 cov-h2-light">
                Cobertura <em>extendida</em>
              </h2>
              <p className="cov-h2-sub cov-h2-sub-light">
                Visitas programadas con al menos 24 horas de anticipación. Puede
                aplicar un cargo adicional por traslado según la distancia.
              </p>
            </div>
          </div>

          <div className="cov-zonas">
            {[
              {
                titulo: 'Marga Marga',
                descripcion: 'Comunas conectadas por la Troncal Sur',
                comunas: COBERTURA_EXTENDIDA.filter((c) => c.zona === 'Marga Marga'),
              },
              {
                titulo: 'Valle Aconcagua',
                descripcion: 'Acceso por Ruta 5 Norte y la 60-CH',
                comunas: COBERTURA_EXTENDIDA.filter((c) => c.zona === 'Valle Aconcagua'),
              },
            ].map((zona, zi) => (
              <div key={zona.titulo} className="cov-zona">
                <div className="cov-zona-head">
                  <span className="cov-zona-tag">
                    <span className="cov-zona-tag-num">{String(zi + 1).padStart(2, '0')}</span>
                    Zona
                  </span>
                  <h3 className="cov-zona-title">{zona.titulo}</h3>
                  <p className="cov-zona-desc">{zona.descripcion}</p>
                </div>

                <ul className="cov-ext-list">
                  {zona.comunas.map((c, i) => (
                    <li key={c.nombre} className="cov-ext-item">
                      <span className="cov-ext-index">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="cov-ext-body">
                        <span className="cov-ext-name">{c.nombre}</span>
                        <span className="cov-ext-meta">
                          <span className="cov-ext-clock" aria-hidden>◷</span>
                          Respuesta {c.tiempo}
                        </span>
                      </div>
                      <span className="cov-ext-arrow" aria-hidden>→</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="cov-extendida-foot">
            Tiempos de respuesta más amplios para resguardar el bienestar de la
            mascota durante el traslado del equipo.
          </p>
        </div>
      </section>

      <section className="cov-cta">
        <div className="cov-cta-inner">
          <span className="cov-cta-eyebrow">¿No ves tu comuna?</span>
          <h3 className="cov-cta-title">
            Conversemos antes de
            <br />
            <em>descartar la visita</em>
          </h3>
          <p className="cov-cta-text">
            Si vives cerca del valle o en una comuna intermedia, escríbenos con
            tu dirección. Casi siempre podemos coordinar una visita.
          </p>
          <a
            href="https://wa.me/56912345678?text=Hola,%20quiero%20saber%20si%20llegan%20a%20mi%20comuna"
            target="_blank"
            rel="noopener noreferrer"
            className="cov-cta-btn"
          >
            Consultar por WhatsApp
            <span className="cov-cta-arrow" aria-hidden>
              →
            </span>
          </a>
        </div>
      </section>

      <LegalFooter />

      <CoberturaStyles />
    </main>
  );
}

function CoberturaStyles() {
  return (
    <style>{`
      .cov-root {
        --cream: #f5f1e8;
        --cream-soft: #ede8da;
        --green-deep: #0d2818;
        --green: #012d1d;
        --green-soft: #1a3a26;
        --gold: #735c00;
        --ink: #191c1d;
        --muted: #6b7268;
        --line: #d8d2c2;
        background: var(--cream);
        min-height: 100vh;
        color: var(--ink);
        font-family: var(--font-manrope);
      }

      /* HERO */
      .cov-hero {
        position: relative;
        padding: 6rem 2rem 5rem;
        overflow: hidden;
      }
      .cov-hero-leaves {
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.08;
      }
      .leaf {
        position: absolute;
        background: var(--green-deep);
        border-radius: 50% 0 50% 0;
      }
      .leaf-1 {
        top: 10%;
        left: -3%;
        width: 220px;
        height: 220px;
        transform: rotate(-25deg);
      }
      .leaf-2 {
        top: 60%;
        right: -5%;
        width: 280px;
        height: 280px;
        transform: rotate(40deg);
      }
      .leaf-3 {
        bottom: -8%;
        left: 30%;
        width: 180px;
        height: 180px;
        transform: rotate(15deg);
      }
      .cov-hero-inner {
        position: relative;
        max-width: 980px;
        margin: 0 auto;
      }
      .cov-eyebrow {
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
      .cov-eyebrow-line {
        width: 36px;
        height: 1px;
        background: var(--green);
      }
      .cov-title {
        font-size: clamp(3rem, 8vw, 6.5rem);
        font-weight: 700;
        line-height: 0.95;
        letter-spacing: -0.03em;
        color: var(--ink);
        margin-bottom: 2rem;
      }
      .cov-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--green);
      }
      .cov-intro {
        max-width: 56ch;
        font-family: var(--font-newsreader);
        font-size: 1.25rem;
        line-height: 1.6;
        color: #414844;
        margin-bottom: 3.5rem;
      }
      .cov-meta {
        display: flex;
        align-items: stretch;
        gap: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--line);
        flex-wrap: wrap;
      }
      .cov-meta-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .cov-meta-num {
        font-size: 2.25rem;
        font-weight: 600;
        line-height: 1;
        color: var(--green);
        letter-spacing: -0.02em;
        font-family: var(--font-newsreader);
        font-style: italic;
      }
      .cov-meta-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--muted);
        font-family: var(--font-dm-mono), monospace;
      }
      .cov-meta-divider {
        width: 1px;
        background: var(--line);
        align-self: stretch;
      }

      /* SECTIONS */
      .cov-section {
        padding: 5rem 2rem;
      }
      .cov-section-inner {
        max-width: 980px;
        margin: 0 auto;
      }
      .cov-section-head {
        display: flex;
        align-items: flex-start;
        gap: 2rem;
        margin-bottom: 3.5rem;
      }
      .cov-num {
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
      .cov-num-light { color: #c8e0d0; }
      .cov-h2 {
        font-size: clamp(2rem, 4vw, 3rem);
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.02em;
        color: var(--ink);
        margin-bottom: 0.75rem;
      }
      .cov-h2-light { color: var(--cream); }
      .cov-h2 em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--green);
      }
      .cov-h2-light em { color: #d4c47a; }
      .cov-h2-sub {
        font-family: var(--font-newsreader);
        font-size: 1.0625rem;
        line-height: 1.6;
        color: #414844;
        max-width: 52ch;
      }
      .cov-h2-sub-light { color: rgba(245, 241, 232, 0.75); }

      /* HABITUAL */
      .cov-habitual {
        background: var(--cream);
        border-top: 1px solid var(--line);
      }
      .cov-grid-habitual {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 1px;
        background: var(--line);
        border: 1px solid var(--line);
      }
      .cov-card-habitual {
        position: relative;
        background: #fbf8f0;
        padding: 2.5rem 2rem;
        transition: background 0.3s;
      }
      .cov-card-habitual:hover {
        background: #ffffff;
      }
      .cov-card-num {
        position: absolute;
        top: 1.5rem;
        right: 1.75rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: var(--muted);
      }
      .cov-card-name {
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        color: var(--ink);
        margin-bottom: 0.5rem;
        line-height: 1.1;
      }
      .cov-card-detalle {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-size: 0.95rem;
        color: var(--muted);
        margin-bottom: 1.75rem;
      }
      .cov-card-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--green);
      }
      .cov-card-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--green);
        animation: covPulse 2s ease-in-out infinite;
      }
      @keyframes covPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(1.3); }
      }

      /* EXTENDIDA */
      .cov-extendida {
        background: var(--green-deep);
        color: var(--cream);
        position: relative;
        overflow: hidden;
      }
      .cov-extendida::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 420px;
        height: 420px;
        background: radial-gradient(circle, rgba(115, 92, 0, 0.18), transparent 70%);
        pointer-events: none;
      }
      .cov-topo {
        position: absolute;
        inset: 0;
        opacity: 0.35;
        pointer-events: none;
      }
      .cov-topo svg {
        width: 100%;
        height: 100%;
      }
      .cov-extendida .cov-section-inner {
        position: relative;
        z-index: 1;
      }

      .cov-zonas {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        margin-bottom: 3rem;
      }
      .cov-zona {
        position: relative;
      }
      .cov-zona + .cov-zona {
        padding-left: 3rem;
        border-left: 1px solid rgba(245, 241, 232, 0.12);
      }
      .cov-zona-head {
        margin-bottom: 1.75rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid rgba(245, 241, 232, 0.12);
      }
      .cov-zona-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.625rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: #d4c47a;
        margin-bottom: 0.875rem;
      }
      .cov-zona-tag-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border: 1px solid rgba(212, 196, 122, 0.5);
        border-radius: 50%;
        font-size: 0.6rem;
      }
      .cov-zona-title {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 2.25rem;
        line-height: 1;
        color: var(--cream);
        letter-spacing: -0.01em;
        margin-bottom: 0.5rem;
      }
      .cov-zona-desc {
        font-size: 0.9rem;
        color: rgba(245, 241, 232, 0.6);
        line-height: 1.5;
      }

      .cov-ext-list {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .cov-ext-item {
        display: grid;
        grid-template-columns: 44px 1fr auto;
        align-items: center;
        gap: 1.25rem;
        padding: 1.125rem 0;
        border-bottom: 1px solid rgba(245, 241, 232, 0.08);
        cursor: default;
        transition: padding 0.3s, border-color 0.3s;
      }
      .cov-ext-item:hover {
        padding-left: 0.75rem;
        border-bottom-color: rgba(212, 196, 122, 0.4);
      }
      .cov-ext-index {
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        color: rgba(212, 196, 122, 0.7);
      }
      .cov-ext-body {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .cov-ext-name {
        font-size: 1.125rem;
        font-weight: 500;
        color: var(--cream);
        letter-spacing: -0.01em;
      }
      .cov-ext-meta {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.7rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: rgba(245, 241, 232, 0.45);
      }
      .cov-ext-clock {
        font-size: 0.85rem;
        color: #d4c47a;
      }
      .cov-ext-arrow {
        font-size: 1.1rem;
        color: rgba(245, 241, 232, 0.25);
        transition: transform 0.3s, color 0.3s;
      }
      .cov-ext-item:hover .cov-ext-arrow {
        color: #d4c47a;
        transform: translateX(4px);
      }

      .cov-extendida-foot {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-size: 1rem;
        line-height: 1.6;
        color: rgba(245, 241, 232, 0.6);
        max-width: 56ch;
        padding-top: 2.5rem;
        border-top: 1px solid rgba(245, 241, 232, 0.12);
      }

      /* CTA */
      .cov-cta {
        padding: 6rem 2rem;
        background: var(--cream-soft);
      }
      .cov-cta-inner {
        max-width: 720px;
        margin: 0 auto;
        text-align: center;
      }
      .cov-cta-eyebrow {
        display: inline-block;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: var(--green);
        margin-bottom: 1.5rem;
      }
      .cov-cta-title {
        font-size: clamp(2.25rem, 5vw, 3.5rem);
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.02em;
        color: var(--ink);
        margin-bottom: 1.5rem;
      }
      .cov-cta-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--green);
      }
      .cov-cta-text {
        font-family: var(--font-newsreader);
        font-size: 1.125rem;
        line-height: 1.6;
        color: #414844;
        margin-bottom: 2.5rem;
        max-width: 52ch;
        margin-left: auto;
        margin-right: auto;
      }
      .cov-cta-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        background: var(--green);
        color: var(--cream);
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 0.01em;
        border-radius: 100px;
        text-decoration: none;
        transition: all 0.3s;
      }
      .cov-cta-btn:hover {
        background: var(--green-deep);
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(13, 40, 24, 0.25);
      }
      .cov-cta-arrow {
        transition: transform 0.3s;
      }
      .cov-cta-btn:hover .cov-cta-arrow {
        transform: translateX(4px);
      }

      @media (max-width: 900px) {
        .cov-zonas {
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }
        .cov-zona + .cov-zona {
          padding-left: 0;
          padding-top: 2.5rem;
          border-left: none;
          border-top: 1px solid rgba(245, 241, 232, 0.12);
        }
      }

      @media (max-width: 768px) {
        .cov-section-head {
          flex-direction: column;
          gap: 1rem;
        }
        .cov-num { font-size: 2.25rem; }
        .cov-meta { gap: 1.25rem; }
        .cov-meta-divider { display: none; }
        .cov-zona-title { font-size: 1.875rem; }
      }
    `}</style>
  );
}
