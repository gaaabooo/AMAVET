import Link from 'next/link';
import LegalNav from '@/components/LegalNav';
import LegalFooter from '@/components/LegalFooter';

export const metadata = {
  title: 'Términos de Servicio — Silvestra Vet',
  description:
    'Acuerdo de servicio que regula las visitas veterinarias a domicilio en la Región de Valparaíso prestadas por Silvestra Vet.',
};

const SECCIONES = [
  {
    num: 'I',
    titulo: 'Qué es Silvestra Vet',
    resumen: 'Quién presta el servicio y bajo qué criterios clínicos.',
    parrafos: [
      'Silvestra Vet es un servicio de medicina veterinaria a domicilio realizado por la médica veterinaria Amanda Castañeda Urbina, orientado a la atención de mascotas en su propio entorno y bajo condiciones compatibles con una visita domiciliaria. Cada atención se desarrolla conforme a criterios clínicos reconocidos por la medicina veterinaria, considerando el estado del paciente, los antecedentes entregados por el tutor y las condiciones reales disponibles al momento de la visita.',
      'La atención a domicilio no reemplaza una clínica veterinaria, hospitalización, urgencia o servicio de especialidad cuando estos sean necesarios. En esos casos, la profesional podrá recomendar la derivación a un centro veterinario que cuente con el equipamiento o el nivel de atención requerido.',
      'Silvestra Vet no garantiza resultados determinados. Su compromiso es prestar una atención diligente, explicar de forma clara los procedimientos realizados y entregar al tutor un registro comprensible de cada visita.',
    ],
  },
  {
    num: 'II',
    titulo: 'Cobertura y agendamiento',
    resumen: 'Dónde llegamos y cómo se confirma una visita.',
    parrafos: [
      'Atendemos en cobertura habitual en Valparaíso, Viña del Mar y Quilpué. También podemos coordinar visitas en cobertura extendida en Villa Alemana, Limache, Quillota, La Cruz, La Calera, Nogales y El Melón, según disponibilidad, distancia y horario.',
      'Si vives en una comuna que no aparece en este listado, puedes consultarnos antes de descartar la visita. En algunos casos es posible coordinar una atención especial. Las visitas se pueden agendar desde la cuenta del usuario, por WhatsApp u otros canales oficiales. La hora queda confirmada cuando se informa el día, horario, domicilio y servicio solicitado.',
      'En periodos de alta demanda, se informará la próxima fecha disponible.',
    ],
  },
  {
    num: 'III',
    titulo: 'Cancelación y reagendamiento',
    resumen: 'Plazos y condiciones para mover o cancelar una hora.',
    parrafos: [
      'Si necesitas cancelar o cambiar una visita, pedimos avisar con al menos 4 horas de anticipación. Las cancelaciones con menor aviso pueden estar sujetas a un cargo administrativo, especialmente si el traslado ya fue iniciado.',
      'Si Silvestra Vet debe reagendar por emergencia, traslado o fuerza mayor, se informará lo antes posible y se ofrecerá una nueva hora disponible.',
    ],
  },
  {
    num: 'IV',
    titulo: 'Alcance del servicio',
    resumen: 'Qué procedimientos se realizan en domicilio y cuáles no.',
    parrafos: [
      'En domicilio se pueden realizar atenciones compatibles con este tipo de servicio, como vacunación, desparasitación interna, control médico, curación de heridas simples, administración de microchip y toma de muestras para exámenes.',
      'Procedimientos como cirugías mayores, hospitalización, imagenología avanzada o urgencias complejas requieren atención en clínica o centro especializado.',
    ],
  },
  {
    num: 'V',
    titulo: 'Resultados de exámenes',
    resumen: 'Cómo y cuándo se entregan los resultados de laboratorio.',
    parrafos: [
      'Las muestras pueden ser procesadas por laboratorios veterinarios externos. El plazo habitual de entrega puede variar según el tipo de examen.',
      'Como referencia, algunos resultados pueden estar disponibles entre 24 y 72 horas hábiles. Los resultados se entregarán en formato PDF dentro de la cuenta del tutor o mediante un canal seguro definido por Silvestra Vet.',
    ],
  },
  {
    num: 'VI',
    titulo: 'Pagos y tarifas',
    resumen: 'Cuándo se paga y qué medios se aceptan.',
    parrafos: [
      'El pago se realiza al finalizar la visita, salvo que se indique otra modalidad al momento de agendar. Las tarifas se informan antes de confirmar la atención.',
      'Si durante la visita se requiere un procedimiento adicional, se explicará previamente al tutor junto con su costo aproximado. Se podrán aceptar transferencia bancaria, tarjetas u otros medios de pago disponibles.',
    ],
  },
  {
    num: 'VII',
    titulo: 'Información que debe entregar el tutor',
    resumen: 'Antecedentes médicos que el tutor debe aportar.',
    parrafos: [
      'Para una atención segura, el tutor debe entregar información clara y completa sobre la mascota. Esto incluye enfermedades previas, medicamentos en uso, alergias, vacunas, exámenes anteriores y cambios recientes de conducta o salud.',
      'Las indicaciones entregadas al finalizar la visita forman parte del tratamiento y deben ser seguidas por el tutor.',
    ],
  },
  {
    num: 'VIII',
    titulo: 'Responsabilidad',
    resumen: 'Hasta dónde responde Silvestra Vet por la atención prestada.',
    parrafos: [
      'Silvestra Vet responde por los actos clínicos realizados directamente durante la visita, conforme a la información disponible y a los estándares razonables de la medicina veterinaria. La evolución de una mascota puede depender de factores que no siempre son detectables en una primera atención.',
      'Silvestra Vet no será responsable por consecuencias derivadas de información incompleta entregada por el tutor, incumplimiento de indicaciones o servicios prestados por terceros externos.',
    ],
  },
  {
    num: 'IX',
    titulo: 'Modificaciones',
    resumen: 'Cómo se publican y entran en vigencia los cambios.',
    parrafos: [
      'Silvestra Vet podrá actualizar estos términos cuando sea necesario por cambios operativos, técnicos o legales. La versión vigente estará disponible en esta página.',
      'El uso del servicio después de una actualización implica la aceptación de los términos vigentes.',
    ],
  },
];

export default function TerminosPage() {
  return (
    <main className="terms-root">
      <LegalNav />

      <header className="terms-hero">
        <div className="terms-hero-leaves" aria-hidden>
          <div className="leaf leaf-1" />
          <div className="leaf leaf-2" />
          <div className="leaf leaf-3" />
        </div>

        <div className="terms-hero-inner">
          <span className="terms-eyebrow">
            <span className="terms-eyebrow-line" />
            Acuerdo de servicio
          </span>

          <h1 className="terms-title">
            Términos de
            <br />
            <em>servicio</em>
          </h1>

          <p className="terms-intro">
            Estos términos regulan la prestación de servicios veterinarios a
            domicilio realizados por Amanda Castañeda Urbina, médica
            veterinaria responsable de Silvestra Vet. El documento explica qué
            comprende la atención, cómo se agenda, cuáles son los límites del
            servicio en domicilio, cómo se gestionan los resultados de
            exámenes y qué responsabilidades asume cada parte.
          </p>

          <div className="terms-meta">
            <div className="terms-meta-item">
              <span className="terms-meta-label">Vigente desde</span>
              <span className="terms-meta-val">Enero 2026</span>
            </div>
            <div className="terms-meta-divider" aria-hidden />
            <div className="terms-meta-item">
              <span className="terms-meta-label">Cobertura</span>
              <span className="terms-meta-val">Región V</span>
            </div>
            <div className="terms-meta-divider" aria-hidden />
            <div className="terms-meta-item">
              <span className="terms-meta-label">Secciones</span>
              <span className="terms-meta-val">IX</span>
            </div>
          </div>
        </div>
      </header>

      <section className="terms-pact">
        <div className="terms-pact-inner">
          <span className="terms-pact-mark" aria-hidden>§</span>
          <p className="terms-pact-text">
            Al agendar una visita o crear una cuenta en Silvestra Vet,
            entendemos que has leído y aceptas el siguiente acuerdo.
          </p>
        </div>
      </section>

      <section className="terms-body">
        <div className="terms-body-inner">
          <aside className="terms-toc" aria-label="Índice del documento">
            <span className="terms-toc-label">Índice</span>
            <ol className="terms-toc-list">
              {SECCIONES.map((s) => (
                <li key={s.num}>
                  <a href={`#sec-${s.num}`}>
                    <span className="terms-toc-num">{s.num}</span>
                    <span className="terms-toc-title">{s.titulo}</span>
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div className="terms-content">
            {SECCIONES.map((s) => (
              <article
                key={s.num}
                id={`sec-${s.num}`}
                className="terms-sec"
              >
                <header className="terms-sec-head">
                  <div className="terms-sec-num-wrap">
                    <span className="terms-sec-num">{s.num}</span>
                  </div>
                  <div className="terms-sec-titles">
                    <h2 className="terms-sec-title">{s.titulo}</h2>
                    <p className="terms-sec-resumen">{s.resumen}</p>
                  </div>
                </header>
                <div className="terms-sec-body">
                  {s.parrafos.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </article>
            ))}

            <div className="terms-contact">
              <span className="terms-contact-eyebrow">Dudas o disputas</span>
              <h3 className="terms-contact-title">
                Antes de cualquier reclamo formal,
                <br />
                <em>conversemos</em>
              </h3>
              <p className="terms-contact-text">
                Si algo no se entiende o no estás conforme con cómo se prestó
                un servicio, escríbenos. Resolvemos directamente, sin
                intermediarios. Para temas de tratamiento de datos personales,
                revisa también nuestra{' '}
                <Link href="/legal/privacidad" className="terms-contact-link">
                  Política de Privacidad
                </Link>
                .
              </p>
              <a
                href="mailto:contacto@silvestravet.cl"
                className="terms-contact-mail"
              >
                contacto@silvestravet.cl
                <span className="terms-contact-arrow" aria-hidden>→</span>
              </a>
            </div>

            <p className="terms-updated">
              Última actualización: enero de 2026
            </p>
          </div>
        </div>
      </section>

      <LegalFooter />

      <TerminosStyles />
    </main>
  );
}

function TerminosStyles() {
  return (
    <style>{`
      .terms-root {
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
        background: var(--cream);
        min-height: 100vh;
        color: var(--ink);
        font-family: var(--font-manrope);
        scroll-behavior: smooth;
      }

      /* HERO */
      .terms-hero {
        position: relative;
        padding: 6rem 2rem 5rem;
        overflow: hidden;
      }
      .terms-hero-leaves {
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
        top: 8%;
        right: -3%;
        width: 220px;
        height: 220px;
        transform: rotate(35deg);
      }
      .leaf-2 {
        top: 55%;
        left: -4%;
        width: 280px;
        height: 280px;
        transform: rotate(-30deg);
      }
      .leaf-3 {
        bottom: -10%;
        right: 25%;
        width: 180px;
        height: 180px;
        transform: rotate(20deg);
      }
      .terms-hero-inner {
        position: relative;
        max-width: 980px;
        margin: 0 auto;
      }
      .terms-eyebrow {
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
      .terms-eyebrow-line {
        width: 36px;
        height: 1px;
        background: var(--green);
      }
      .terms-title {
        font-size: clamp(3rem, 8vw, 6.5rem);
        font-weight: 700;
        line-height: 0.95;
        letter-spacing: -0.03em;
        color: var(--ink);
        margin-bottom: 2rem;
      }
      .terms-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--green);
      }
      .terms-intro {
        max-width: 60ch;
        font-family: var(--font-newsreader);
        font-size: 1.25rem;
        line-height: 1.6;
        color: #414844;
        margin-bottom: 3.5rem;
      }
      .terms-meta {
        display: flex;
        align-items: stretch;
        gap: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--line);
        flex-wrap: wrap;
      }
      .terms-meta-item {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .terms-meta-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--muted);
        font-family: var(--font-dm-mono), monospace;
      }
      .terms-meta-val {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 1.5rem;
        color: var(--green);
        letter-spacing: -0.01em;
      }
      .terms-meta-divider {
        width: 1px;
        background: var(--line);
        align-self: stretch;
      }

      /* PACT BANNER */
      .terms-pact {
        background: var(--green-deep);
        color: var(--cream);
        padding: 2.25rem 2rem;
        position: relative;
        overflow: hidden;
      }
      .terms-pact::before {
        content: '';
        position: absolute;
        top: -60%;
        right: -10%;
        width: 360px;
        height: 360px;
        background: radial-gradient(circle, rgba(212, 196, 122, 0.16), transparent 70%);
        pointer-events: none;
      }
      .terms-pact-inner {
        max-width: 980px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: 1.75rem;
        position: relative;
      }
      .terms-pact-mark {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 4rem;
        line-height: 1;
        color: var(--gold-soft);
        opacity: 0.7;
        flex-shrink: 0;
      }
      .terms-pact-text {
        font-family: var(--font-newsreader);
        font-size: 1.1rem;
        line-height: 1.55;
        color: rgba(245, 241, 232, 0.92);
        max-width: 60ch;
      }

      /* BODY */
      .terms-body {
        background: var(--cream);
        padding: 5rem 2rem 6rem;
      }
      .terms-body-inner {
        max-width: 1100px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 5rem;
        align-items: start;
      }

      /* TOC */
      .terms-toc {
        position: sticky;
        top: 6rem;
      }
      .terms-toc-label {
        display: block;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: var(--muted);
        margin-bottom: 1.25rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--line);
      }
      .terms-toc-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .terms-toc-list a {
        display: flex;
        align-items: baseline;
        gap: 0.875rem;
        padding: 0.4rem 0;
        text-decoration: none;
        transition: transform 0.25s;
      }
      .terms-toc-list a:hover {
        transform: translateX(4px);
      }
      .terms-toc-num {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 0.95rem;
        color: var(--green);
        opacity: 0.5;
        min-width: 1.5rem;
        transition: opacity 0.2s;
      }
      .terms-toc-title {
        font-size: 0.85rem;
        font-weight: 500;
        color: #414844;
        line-height: 1.4;
        transition: color 0.2s;
      }
      .terms-toc-list a:hover .terms-toc-title {
        color: var(--green);
      }
      .terms-toc-list a:hover .terms-toc-num {
        opacity: 1;
      }

      /* CONTENT */
      .terms-content {
        max-width: 64ch;
      }
      .terms-sec {
        margin-bottom: 4rem;
        scroll-margin-top: 6rem;
      }
      .terms-sec-head {
        display: grid;
        grid-template-columns: 64px 1fr;
        gap: 1.5rem;
        margin-bottom: 1.75rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--line);
      }
      .terms-sec-num-wrap {
        display: flex;
        justify-content: center;
        padding-top: 0.25rem;
      }
      .terms-sec-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border: 1px solid var(--green);
        border-radius: 50%;
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 1.25rem;
        color: var(--green);
        letter-spacing: -0.02em;
      }
      .terms-sec-titles {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .terms-sec-title {
        font-size: 1.625rem;
        font-weight: 600;
        color: var(--ink);
        letter-spacing: -0.01em;
        line-height: 1.2;
      }
      .terms-sec-resumen {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-size: 1rem;
        color: var(--muted);
        line-height: 1.4;
      }
      .terms-sec-body {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        padding-left: calc(64px + 1.5rem);
      }
      .terms-sec-body p {
        font-family: var(--font-newsreader);
        font-size: 1.0625rem;
        line-height: 1.75;
        color: #2f3530;
      }

      /* CONTACT BLOCK */
      .terms-contact {
        margin-top: 5rem;
        padding: 3rem;
        background: var(--green-deep);
        color: var(--cream);
        position: relative;
        overflow: hidden;
        border-radius: 4px;
      }
      .terms-contact::before {
        content: '';
        position: absolute;
        top: -40%;
        left: -10%;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, rgba(212, 196, 122, 0.18), transparent 70%);
        pointer-events: none;
      }
      .terms-contact-eyebrow {
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
      .terms-contact-title {
        position: relative;
        font-size: 1.875rem;
        font-weight: 600;
        line-height: 1.15;
        letter-spacing: -0.02em;
        color: var(--cream);
        margin-bottom: 1.25rem;
      }
      .terms-contact-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--gold-soft);
      }
      .terms-contact-text {
        position: relative;
        font-family: var(--font-newsreader);
        font-size: 1rem;
        line-height: 1.65;
        color: rgba(245, 241, 232, 0.78);
        max-width: 56ch;
        margin-bottom: 2rem;
      }
      .terms-contact-link {
        color: var(--gold-soft);
        text-decoration: underline;
        text-underline-offset: 3px;
        transition: opacity 0.2s;
      }
      .terms-contact-link:hover { opacity: 0.75; }
      .terms-contact-mail {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.95rem;
        font-weight: 500;
        color: var(--cream);
        text-decoration: none;
        padding: 0.875rem 0;
        border-bottom: 1px solid rgba(245, 241, 232, 0.3);
        transition: border-color 0.3s, color 0.3s;
      }
      .terms-contact-mail:hover {
        color: var(--gold-soft);
        border-bottom-color: var(--gold-soft);
      }
      .terms-contact-arrow {
        transition: transform 0.3s;
      }
      .terms-contact-mail:hover .terms-contact-arrow {
        transform: translateX(4px);
      }

      .terms-updated {
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--line);
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.75rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: var(--muted);
      }

      @media (max-width: 900px) {
        .terms-body-inner {
          grid-template-columns: 1fr;
          gap: 3rem;
        }
        .terms-toc {
          position: static;
        }
      }
      @media (max-width: 768px) {
        .terms-meta { gap: 1.25rem; }
        .terms-meta-divider { display: none; }
        .terms-pact-inner {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }
        .terms-pact-mark { font-size: 3rem; }
        .terms-sec-head {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .terms-sec-num-wrap { justify-content: flex-start; }
        .terms-sec-body { padding-left: 0; }
        .terms-contact { padding: 2rem; }
        .terms-contact-title { font-size: 1.5rem; }
      }
      @media (max-width: 640px) {
        .terms-hero { padding: 4.5rem 1.25rem 3rem; }
        .terms-body { padding: 3.5rem 1.25rem 4rem; }
        .terms-contact { padding: 1.5rem; }
      }
    `}</style>
  );
}
