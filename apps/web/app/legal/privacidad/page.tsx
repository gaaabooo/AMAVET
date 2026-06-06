import LegalNav from '@/components/LegalNav';
import LegalFooter from '@/components/LegalFooter';

export const metadata = {
  title: 'Política de Privacidad — Silvestra Vet',
  description:
    'Cómo recopilamos, tratamos, almacenamos y protegemos los datos personales de los tutores y la información clínica de sus mascotas en Silvestra Vet.',
};

const SECCIONES = [
  {
    num: 'I',
    titulo: 'Datos que recopilamos',
    parrafos: [
      'Para prestar atención veterinaria a domicilio, podemos solicitar datos del tutor, como nombre completo, RUT, correo electrónico, teléfono y dirección de visita.',
      'También recopilamos información necesaria sobre la mascota, como nombre, especie, raza, edad, antecedentes médicos, medicamentos, alergias, vacunas, exámenes y observaciones clínicas relevantes.',
      'La información se obtiene principalmente a través del registro de usuario, la solicitud de atención, la consulta veterinaria y la gestión de exámenes. No recopilamos datos desde fuentes externas sin una justificación válida o sin autorización cuando corresponda.',
    ],
  },
  {
    num: 'II',
    titulo: 'Finalidad del uso de datos',
    parrafos: [
      'Utilizamos la información únicamente para prestar y gestionar el servicio veterinario.',
      'Esto incluye coordinar visitas, registrar antecedentes clínicos, contactar al tutor, entregar resultados de exámenes, emitir indicaciones veterinarias, generar certificados o recetas cuando corresponda y mantener un historial básico de atención.',
      'No vendemos datos personales ni los usamos para publicidad de terceros.',
    ],
  },
  {
    num: 'III',
    titulo: 'Almacenamiento y seguridad',
    parrafos: [
      'La información se almacena en sistemas digitales con acceso restringido. Solo pueden acceder quienes necesiten esos datos para prestar, administrar o mantener el servicio.',
      'Aplicamos medidas razonables de seguridad, como control de acceso por usuario, autenticación, restricciones por rol y protección de resultados clínicos. Los resultados de exámenes no deben publicarse de forma abierta ni quedar disponibles en enlaces públicos sin control.',
      'Aunque ningún sistema es completamente inmune a incidentes, Silvestra Vet procura resguardar la información con medidas técnicas y administrativas proporcionales al tipo de datos tratados.',
    ],
  },
  {
    num: 'IV',
    titulo: 'Laboratorios y proveedores externos',
    parrafos: [
      'Cuando un examen requiere procesamiento externo, podemos compartir con el laboratorio la información mínima necesaria para identificar la muestra y realizar el análisis solicitado.',
      'También podemos utilizar proveedores tecnológicos para operar la plataforma, correo, almacenamiento, autenticación o mensajería. Estos proveedores actúan como apoyo operativo y no están autorizados para usar la información con fines propios.',
    ],
  },
  {
    num: 'V',
    titulo: 'Conservación de la información',
    parrafos: [
      'Los datos se conservarán mientras exista una relación activa entre el tutor y Silvestra Vet, y por el tiempo necesario para cumplir fines clínicos, administrativos, legales o tributarios.',
      'Cuando la información deje de ser necesaria, podrá ser eliminada, bloqueada o anonimizada, según corresponda.',
    ],
  },
  {
    num: 'VI',
    titulo: 'Cookies y tecnologías similares',
    parrafos: [
      'El sitio puede utilizar cookies necesarias para el funcionamiento de la plataforma, como inicio de sesión, seguridad y preferencias básicas.',
      'No utilizamos cookies publicitarias ni herramientas de seguimiento comercial sin informar previamente al usuario. Si en el futuro se incorporan herramientas de analítica o publicidad, esta política será actualizada y se solicitará el consentimiento cuando corresponda.',
    ],
  },
  {
    num: 'VII',
    titulo: 'Derechos del titular',
    parrafos: [
      'El tutor puede solicitar el acceso, rectificación, actualización o eliminación de sus datos personales, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada y sus modificaciones vigentes.',
      'Para ejercer estos derechos, deberá escribir al correo de contacto informado por Silvestra Vet. Antes de responder, podremos solicitar antecedentes mínimos para verificar la identidad del solicitante y resguardar la confidencialidad de la información.',
      'También consideraremos los cambios introducidos por la Ley N° 21.719 sobre protección y tratamiento de datos personales, en la medida en que sus disposiciones resulten aplicables.',
    ],
  },
  {
    num: 'VIII',
    titulo: 'Confidencialidad clínica',
    parrafos: [
      'La información clínica de la mascota será tratada con reserva. Los antecedentes médicos, resultados de exámenes, indicaciones y observaciones de la atención no serán compartidos con terceros ajenos al servicio, salvo autorización del tutor, requerimiento legal o necesidad clínica justificada.',
    ],
  },
  {
    num: 'IX',
    titulo: 'Modificaciones',
    parrafos: [
      'Silvestra Vet podrá actualizar esta política cuando existan cambios legales, técnicos u operativos.',
      'La versión vigente estará disponible en esta página. Si los cambios afectan de forma relevante el tratamiento de datos personales, se informará por los canales de contacto registrados.',
    ],
  },
];

export default function PrivacidadPage() {
  return (
    <main className="priv-root">
      <LegalNav />

      <header className="priv-hero">
        <div className="priv-hero-leaves" aria-hidden>
          <div className="leaf leaf-1" />
          <div className="leaf leaf-2" />
        </div>

        <div className="priv-hero-inner">
          <span className="priv-eyebrow">
            <span className="priv-eyebrow-line" />
            Documento legal
          </span>

          <h1 className="priv-title">
            Política de
            <br />
            <em>privacidad</em>
          </h1>

          <p className="priv-intro">
            En Silvestra Vet cuidamos la información de tutores y mascotas
            con la misma seriedad con que abordamos la atención clínica.
            Esta política explica qué datos recopilamos, para qué los
            usamos, cómo los protegemos y qué derechos puedes ejercer sobre
            ellos.
          </p>

          <div className="priv-meta">
            <div className="priv-meta-item">
              <span className="priv-meta-label">Vigente desde</span>
              <span className="priv-meta-val">Enero 2026</span>
            </div>
            <div className="priv-meta-divider" aria-hidden />
            <div className="priv-meta-item">
              <span className="priv-meta-label">Marco legal</span>
              <span className="priv-meta-val">Ley N° 19.628</span>
            </div>
            <div className="priv-meta-divider" aria-hidden />
            <div className="priv-meta-item">
              <span className="priv-meta-label">Jurisdicción</span>
              <span className="priv-meta-val">Chile</span>
            </div>
          </div>
        </div>
      </header>

      <section className="priv-body">
        <div className="priv-body-inner">
          <aside className="priv-toc" aria-label="Índice del documento">
            <span className="priv-toc-label">En este documento</span>
            <ol className="priv-toc-list">
              {SECCIONES.map((s) => (
                <li key={s.num}>
                  <a href={`#sec-${s.num}`}>
                    <span className="priv-toc-num">{s.num}</span>
                    <span className="priv-toc-title">{s.titulo}</span>
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <div className="priv-content">
            {SECCIONES.map((s) => (
              <article
                key={s.num}
                id={`sec-${s.num}`}
                className="priv-sec"
              >
                <header className="priv-sec-head">
                  <span className="priv-sec-num">{s.num}</span>
                  <h2 className="priv-sec-title">{s.titulo}</h2>
                </header>
                <div className="priv-sec-body">
                  {s.parrafos.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </article>
            ))}

            <div className="priv-contact">
              <span className="priv-contact-eyebrow">Canal de contacto</span>
              <h3 className="priv-contact-title">
                Para ejercer tus derechos
                <br />
                <em>escríbenos directamente</em>
              </h3>
              <p className="priv-contact-text">
                Las solicitudes relacionadas con esta política, incluido el
                ejercicio de los derechos ARCO, deben dirigirse al siguiente
                correo. Recibirás acuse de recibo dentro de las 48 horas hábiles
                siguientes.
              </p>
              <a
                href="mailto:privacidad@silvestravet.cl"
                className="priv-contact-mail"
              >
                privacidad@silvestravet.cl
                <span className="priv-contact-arrow" aria-hidden>→</span>
              </a>
            </div>

            <p className="priv-updated">
              Última actualización: enero de 2026
            </p>
          </div>
        </div>
      </section>

      <LegalFooter />

      <PrivacidadStyles />
    </main>
  );
}

function PrivacidadStyles() {
  return (
    <style>{`
      .priv-root {
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
        scroll-behavior: smooth;
      }

      /* HERO */
      .priv-hero {
        position: relative;
        padding: 6rem 2rem 5rem;
        overflow: hidden;
      }
      .priv-hero-leaves {
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
        left: -3%;
        width: 240px;
        height: 240px;
        transform: rotate(-25deg);
      }
      .leaf-2 {
        top: 50%;
        right: -4%;
        width: 280px;
        height: 280px;
        transform: rotate(40deg);
      }
      .priv-hero-inner {
        position: relative;
        max-width: 980px;
        margin: 0 auto;
      }
      .priv-eyebrow {
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
      .priv-eyebrow-line {
        width: 36px;
        height: 1px;
        background: var(--green);
      }
      .priv-title {
        font-size: clamp(3rem, 8vw, 6.5rem);
        font-weight: 700;
        line-height: 0.95;
        letter-spacing: -0.03em;
        color: var(--ink);
        margin-bottom: 2rem;
      }
      .priv-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: var(--green);
      }
      .priv-intro {
        max-width: 60ch;
        font-family: var(--font-newsreader);
        font-size: 1.25rem;
        line-height: 1.6;
        color: #414844;
        margin-bottom: 3.5rem;
      }
      .priv-meta {
        display: flex;
        align-items: stretch;
        gap: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--line);
        flex-wrap: wrap;
      }
      .priv-meta-item {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .priv-meta-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--muted);
        font-family: var(--font-dm-mono), monospace;
      }
      .priv-meta-val {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 1.5rem;
        color: var(--green);
        letter-spacing: -0.01em;
      }
      .priv-meta-divider {
        width: 1px;
        background: var(--line);
        align-self: stretch;
      }

      /* BODY */
      .priv-body {
        background: var(--cream);
        padding: 5rem 2rem 6rem;
        border-top: 1px solid var(--line);
      }
      .priv-body-inner {
        max-width: 1100px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 5rem;
        align-items: start;
      }

      /* TOC */
      .priv-toc {
        position: sticky;
        top: 6rem;
      }
      .priv-toc-label {
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
      .priv-toc-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .priv-toc-list a {
        display: flex;
        align-items: baseline;
        gap: 0.875rem;
        padding: 0.4rem 0;
        text-decoration: none;
        transition: color 0.2s, transform 0.25s;
      }
      .priv-toc-list a:hover {
        transform: translateX(4px);
      }
      .priv-toc-num {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 0.95rem;
        color: var(--green);
        opacity: 0.5;
        min-width: 1.5rem;
      }
      .priv-toc-title {
        font-size: 0.85rem;
        font-weight: 500;
        color: #414844;
        line-height: 1.4;
        transition: color 0.2s;
      }
      .priv-toc-list a:hover .priv-toc-title {
        color: var(--green);
      }
      .priv-toc-list a:hover .priv-toc-num {
        opacity: 1;
      }

      /* CONTENT */
      .priv-content {
        max-width: 64ch;
      }
      .priv-sec {
        margin-bottom: 4rem;
        scroll-margin-top: 6rem;
      }
      .priv-sec-head {
        display: flex;
        align-items: baseline;
        gap: 1.5rem;
        margin-bottom: 1.75rem;
        padding-bottom: 1.25rem;
        border-bottom: 1px solid var(--line);
      }
      .priv-sec-num {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        font-size: 2.25rem;
        line-height: 1;
        color: var(--green);
        opacity: 0.5;
        letter-spacing: -0.02em;
        min-width: 2.5rem;
      }
      .priv-sec-title {
        font-size: 1.625rem;
        font-weight: 600;
        color: var(--ink);
        letter-spacing: -0.01em;
        line-height: 1.2;
      }
      .priv-sec-body {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }
      .priv-sec-body p {
        font-family: var(--font-newsreader);
        font-size: 1.0625rem;
        line-height: 1.75;
        color: #2f3530;
      }

      /* CONTACT BLOCK */
      .priv-contact {
        margin-top: 5rem;
        padding: 3rem;
        background: var(--green-deep);
        color: var(--cream);
        position: relative;
        overflow: hidden;
        border-radius: 4px;
      }
      .priv-contact::before {
        content: '';
        position: absolute;
        top: -40%;
        right: -10%;
        width: 320px;
        height: 320px;
        background: radial-gradient(circle, rgba(212, 196, 122, 0.18), transparent 70%);
        pointer-events: none;
      }
      .priv-contact-eyebrow {
        position: relative;
        display: inline-block;
        font-family: var(--font-dm-mono), monospace;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: #d4c47a;
        margin-bottom: 1rem;
      }
      .priv-contact-title {
        position: relative;
        font-size: 1.875rem;
        font-weight: 600;
        line-height: 1.15;
        letter-spacing: -0.02em;
        color: var(--cream);
        margin-bottom: 1.25rem;
      }
      .priv-contact-title em {
        font-family: var(--font-newsreader);
        font-style: italic;
        font-weight: 300;
        color: #d4c47a;
      }
      .priv-contact-text {
        position: relative;
        font-family: var(--font-newsreader);
        font-size: 1rem;
        line-height: 1.65;
        color: rgba(245, 241, 232, 0.75);
        max-width: 52ch;
        margin-bottom: 2rem;
      }
      .priv-contact-mail {
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
      .priv-contact-mail:hover {
        color: #d4c47a;
        border-bottom-color: #d4c47a;
      }
      .priv-contact-arrow {
        transition: transform 0.3s;
      }
      .priv-contact-mail:hover .priv-contact-arrow {
        transform: translateX(4px);
      }

      .priv-updated {
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
        .priv-body-inner {
          grid-template-columns: 1fr;
          gap: 3rem;
        }
        .priv-toc {
          position: static;
        }
      }
      @media (max-width: 768px) {
        .priv-meta { gap: 1.25rem; }
        .priv-meta-divider { display: none; }
        .priv-sec-head {
          flex-direction: column;
          gap: 0.75rem;
        }
        .priv-contact { padding: 2rem; }
        .priv-contact-title { font-size: 1.5rem; }
      }
      @media (max-width: 640px) {
        .priv-hero { padding: 4.5rem 1.25rem 3rem; }
        .priv-body { padding: 3.5rem 1.25rem 4rem; }
        .priv-contact { padding: 1.5rem; }
      }
    `}</style>
  );
}
