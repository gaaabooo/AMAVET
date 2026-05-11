'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

const CATEGORIAS = [
  {
    id: 'cuenta',
    numero: 'I',
    titulo: 'Cuenta y acceso',
    descripcion: 'Cómo gestionar tu perfil, contraseña y acceso a Silvestra.',
    faqs: [
      {
        q: '¿Cómo cambio mi contraseña?',
        a: 'Ve a Configuración → Cambiar contraseña, ingresa la actual y define la nueva (mínimo 6 caracteres). Por seguridad, te pediremos confirmar la actual antes de actualizarla.',
      },
      {
        q: '¿Puedo cambiar mi correo electrónico?',
        a: 'Tu correo es el identificador único de la cuenta y no se modifica desde el perfil. Si necesitas cambiarlo escríbenos a soporte@silvestra.vet y te ayudamos a migrar tu cuenta.',
      },
      {
        q: 'Olvidé mi contraseña, ¿cómo la recupero?',
        a: 'En la pantalla de inicio de sesión usa la opción "¿Olvidaste tu contraseña?" para recibir un enlace de recuperación. Si no recibes el correo en 5 minutos, revisa tu carpeta de spam.',
      },
    ],
  },
  {
    id: 'mascotas',
    numero: 'II',
    titulo: 'Mis mascotas',
    descripcion: 'Registro y gestión de las mascotas vinculadas a tu cuenta.',
    faqs: [
      {
        q: '¿Cuántas mascotas puedo registrar?',
        a: 'Puedes registrar todas las mascotas que necesites. Cada una recibe un número de expediente único y permanente dentro de Silvestra.',
      },
      {
        q: '¿Puedo editar los datos de una mascota?',
        a: 'Por ahora los datos de la mascota se registran al momento de crearla. Si necesitas corregir algún dato (raza, edad, nombre), contáctanos por el formulario inferior.',
      },
      {
        q: '¿Puedo eliminar una mascota de mi perfil?',
        a: 'Si una mascota dejó de estar bajo tu cuidado, escríbenos para procesar la baja respetando el historial clínico que pueda existir.',
      },
    ],
  },
  {
    id: 'visitas',
    numero: 'III',
    titulo: 'Visitas a domicilio',
    descripcion: 'Cómo agendar, modificar o cancelar una visita veterinaria.',
    faqs: [
      {
        q: '¿Cómo agendo una visita?',
        a: 'Desde el dashboard pulsa "Agendar visita". Elige la mascota, los servicios que necesite, indica la dirección y selecciona fecha y hora disponible. No hay pago previo: confirmamos por correo.',
      },
      {
        q: '¿En qué zonas hacen visitas?',
        a: 'Actualmente cubrimos la Región de Valparaíso. Cobertura habitual en Valparaíso, Viña del Mar y Quilpué; cobertura extendida en Villa Alemana, Limache, Quillota, La Cruz, La Calera, Nogales y El Melón. Si vives fuera de la zona, contáctanos para evaluar la visita caso a caso.',
      },
      {
        q: '¿Puedo cancelar o modificar una visita agendada?',
        a: 'Sí. Puedes hacerlo escribiéndonos al correo de soporte hasta 4 horas antes de la cita sin costo. Estamos trabajando en la cancelación directa desde el dashboard.',
      },
      {
        q: '¿Cuánto dura una visita típica?',
        a: 'Entre 45 y 60 minutos según los servicios contratados. Exámenes y tests rápidos pueden agregar tiempo adicional.',
      },
    ],
  },
  {
    id: 'examenes',
    numero: 'IV',
    titulo: 'Exámenes y resultados',
    descripcion: 'Cómo acceder y descargar los resultados de tus mascotas.',
    faqs: [
      {
        q: '¿Dónde veo los exámenes de mi mascota?',
        a: 'En el perfil de la mascota encontrarás el historial agrupado por mes. Cada examen tiene su estado: pendiente, en proceso o disponible. Cuando esté disponible, podrás descargar el PDF directamente.',
      },
      {
        q: '¿Cuánto tarda un resultado?',
        a: 'Los tests rápidos se entregan en la misma visita. Los exámenes de laboratorio entre 24 y 72 horas hábiles según el tipo.',
      },
      {
        q: '¿Recibo aviso cuando llega un resultado nuevo?',
        a: 'Sí. Te enviamos un correo y verás el indicador "resultados nuevos" en el dashboard hasta que abras el archivo.',
      },
    ],
  },
];

export default function CentroAyuda() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');
    if (!u || !token) {
      router.push('/login');
      return;
    }
    setUsuario(JSON.parse(u));
    setCargando(false);
  }, [router]);

  const toggle = (key: string) => setAbierto(prev => (prev === key ? null : key));

  const filtrarFaqs = (q: string, a: string) => {
    if (!busqueda.trim()) return true;
    const term = busqueda.trim().toLowerCase();
    return q.toLowerCase().includes(term) || a.toLowerCase().includes(term);
  };

  const categoriasFiltradas = CATEGORIAS.map(cat => ({
    ...cat,
    faqs: cat.faqs.filter(f => filtrarFaqs(f.q, f.a)),
  })).filter(cat => cat.faqs.length > 0);

  const totalFaqs = CATEGORIAS.reduce((acc, c) => acc + c.faqs.length, 0);
  const totalFiltradas = categoriasFiltradas.reduce((acc, c) => acc + c.faqs.length, 0);

  if (cargando) {
    return (
      <main className="dash-bg min-h-screen relative">
        <HelpStyles />
        <DashboardNav active="ayuda" />
      </main>
    );
  }

  return (
    <main className="dash-bg min-h-screen relative overflow-hidden">
      <HelpStyles />

      {/* Hojas */}
      <div className="leaf-bg" aria-hidden="true">
        <svg className="l1" viewBox="0 0 200 200" fill="currentColor">
          <path d="M100 10 C 60 50, 40 110, 70 180 C 110 150, 160 100, 100 10 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.5" />
          <path d="M100 30 C 70 60, 60 110, 80 170" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <svg className="l2" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M30 100 C 80 40, 140 30, 180 60 C 150 130, 90 170, 30 100 Z" />
          <path d="M50 100 L 160 70" />
        </svg>
      </div>

      <DashboardNav active="ayuda" usuarioNombre={usuario?.nombre} />

      <div className="relative z-10 max-w-[1080px] mx-auto px-6 sm:px-10 py-12">
        {/* Hero */}
        <div className="help-hero" style={{ opacity: 0, animation: 'rise 700ms 60ms cubic-bezier(.2,.7,.2,1) forwards' }}>
          <div className="help-eyebrow">
            <span className="line" /> CENTRO DE AYUDA
          </div>
          <h1 className="help-title">
            ¿Cómo podemos <em>acompañarte</em>?
          </h1>
          <p className="help-lead">
            Encuentra respuestas rápidas o escríbenos. Estamos pendientes de tus mascotas como si fueran nuestras.
          </p>

          <div className="help-search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar entre las preguntas frecuentes…"
              className="help-search-input"
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} className="help-search-clear" aria-label="Limpiar búsqueda">
                Limpiar
              </button>
            )}
          </div>

          <div className="help-meta">
            <span>
              <b>{busqueda ? totalFiltradas : totalFaqs}</b> {busqueda ? 'resultado' : 'pregunta'}{(busqueda ? totalFiltradas : totalFaqs) === 1 ? '' : 's'}
              {busqueda && ` · "${busqueda}"`}
            </span>
            <span className="dot">·</span>
            <span>{CATEGORIAS.length} categorías</span>
          </div>
        </div>

        <div className="help-grid">

          {/* Categorías + FAQs */}
          <div className="help-main">

            {categoriasFiltradas.length === 0 ? (
              <div className="help-empty">
                <div className="help-empty-ill">🔍</div>
                <p className="help-empty-title">No encontramos resultados</p>
                <p className="help-empty-lead">
                  Intenta con otras palabras, o contáctanos directamente — abajo está el formulario.
                </p>
                <button onClick={() => setBusqueda('')} className="btn-ghost">
                  Mostrar todas las preguntas
                </button>
              </div>
            ) : categoriasFiltradas.map(cat => (
              <section key={cat.id} className="help-cat">
                <div className="help-cat-head">
                  <span className="help-cat-num">{cat.numero}.</span>
                  <h2 className="help-cat-title">{cat.titulo}</h2>
                  <span className="help-cat-line" />
                </div>
                <p className="help-cat-desc">{cat.descripcion}</p>

                <div className="faq-list">
                  {cat.faqs.map((f, idx) => {
                    const key = `${cat.id}-${idx}`;
                    const open = abierto === key;
                    return (
                      <article key={key} className={`faq ${open ? 'open' : ''}`}>
                        <button onClick={() => toggle(key)} className="faq-q">
                          <span className="faq-num">{String(idx + 1).padStart(2, '0')}</span>
                          <span className="faq-text">{f.q}</span>
                          <span className="faq-toggle" aria-hidden="true">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </button>
                        {open && (
                          <div className="faq-a">
                            {f.a}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Sidebar contacto */}
          <aside className="help-side">
            <div className="contact-card">
              <svg className="contact-leaf" viewBox="0 0 100 100" fill="currentColor" aria-hidden="true">
                <path d="M50 10 C 70 30, 80 50, 50 90 C 20 50, 30 30, 50 10 Z" />
              </svg>

              <div className="contact-eyebrow">CONTACTO DIRECTO</div>
              <h3 className="contact-title">
                ¿No encontraste tu <em>respuesta</em>?
              </h3>
              <p className="contact-lead">
                Escríbenos. Respondemos dentro de las próximas 24 horas hábiles.
              </p>

              <div className="contact-channels">
                <a
                  href="mailto:soporte@silvestra.vet?subject=Consulta%20desde%20Centro%20de%20ayuda"
                  className="contact-channel"
                >
                  <div className="cc-icon">@</div>
                  <div className="cc-info">
                    <div className="cc-label">CORREO</div>
                    <div className="cc-value">soporte@silvestra.vet</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="cc-arrow">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>

                <a
                  href="https://wa.me/56912345678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-channel"
                >
                  <div className="cc-icon">✉</div>
                  <div className="cc-info">
                    <div className="cc-label">WHATSAPP</div>
                    <div className="cc-value">+56 9 1234 5678</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="cc-arrow">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              <div className="contact-hours">
                <div className="ch-label">HORARIO DE ATENCIÓN</div>
                <div className="ch-row"><span>Lun · Vie</span><span className="mono">09:00 — 19:00</span></div>
                <div className="ch-row"><span>Sábado</span><span className="mono">10:00 — 14:00</span></div>
                <div className="ch-row"><span>Domingo</span><span className="mono muted">Cerrado</span></div>
              </div>

              <div className="contact-emergency">
                <div className="em-icon">!</div>
                <div className="em-info">
                  <div className="em-title">Emergencias 24/7</div>
                  <div className="em-text">Si tu mascota necesita atención inmediata, contáctanos al WhatsApp en cualquier momento.</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function HelpStyles() {
  return (
    <style jsx global>{`
      .dash-bg {
        --d-bg: #f4f0e6;
        --d-bg-card: #ffffff;
        --d-bg-soft: #ebe7da;
        --d-ink: #14241a;
        --d-ink-soft: #3d4d40;
        --d-ink-mute: #6b7a6e;
        --d-rule: #d8d2bf;
        --d-rule-soft: #ece7d3;
        --d-green-deep: #0d2818;
        --d-green-mid: #1f4d33;
        --d-green-leaf: #4a7a5a;
        --d-green-mist: #c8dcc7;
        --d-green-glow: #d8e9c8;
        --d-amber: #c9930b;
        --d-amber-soft: #fcebbf;
        --d-rose: #b15f4a;
        --d-rose-soft: #fadcd2;
        background: var(--d-bg);
        color: var(--d-ink);
        font-family: var(--font-manrope), system-ui, sans-serif;
      }
      .dash-bg .leaf-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
      .dash-bg .leaf-bg svg { position: absolute; color: var(--d-green-leaf); }
      .dash-bg .leaf-bg svg.l1 { top: -40px; right: -60px; width: 320px; opacity: 0.10; transform: rotate(20deg); }
      .dash-bg .leaf-bg svg.l2 { bottom: -80px; left: -100px; width: 380px; opacity: 0.08; transform: rotate(-30deg); }
      @keyframes rise {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .dash-bg .help-hero {
        margin-bottom: 48px;
        max-width: 740px;
      }
      .dash-bg .help-eyebrow {
        display: inline-flex; align-items: center; gap: 12px;
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--d-green-mid);
        margin-bottom: 14px;
      }
      .dash-bg .help-eyebrow .line { width: 28px; height: 1px; background: var(--d-green-mid); }
      .dash-bg .help-title {
        font-size: clamp(2.2rem, 5vw, 3.4rem);
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.05;
        color: var(--d-green-deep);
        margin-bottom: 14px;
      }
      .dash-bg .help-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 300;
        color: var(--d-green-mid);
      }
      .dash-bg .help-lead {
        font-size: 16px;
        color: var(--d-ink-soft);
        line-height: 1.6;
        margin-bottom: 28px;
        max-width: 580px;
      }

      .dash-bg .help-search {
        position: relative;
        display: flex; align-items: center;
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 16px;
        padding: 0 16px;
        max-width: 520px;
        transition: border-color .2s, box-shadow .2s;
      }
      .dash-bg .help-search:focus-within {
        border-color: var(--d-green-mid);
        box-shadow: 0 0 0 4px rgba(31, 77, 51, 0.08);
      }
      .dash-bg .help-search > svg { color: var(--d-ink-mute); flex-shrink: 0; }
      .dash-bg .help-search-input {
        flex: 1;
        border: none; outline: none;
        background: transparent;
        padding: 16px 12px;
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-size: 14px;
        color: var(--d-ink);
      }
      .dash-bg .help-search-input::placeholder { color: var(--d-ink-mute); }
      .dash-bg .help-search-clear {
        background: transparent;
        border: none;
        color: var(--d-ink-mute);
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px; font-weight: 500;
        cursor: pointer;
        letter-spacing: 0.05em;
        padding: 4px 8px;
        border-radius: 6px;
      }
      .dash-bg .help-search-clear:hover {
        color: var(--d-green-mid);
        background: var(--d-bg-soft);
      }

      .dash-bg .help-meta {
        display: flex; align-items: center; gap: 8px;
        margin-top: 16px;
        font-size: 12px;
        color: var(--d-ink-mute);
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        letter-spacing: 0.05em;
      }
      .dash-bg .help-meta b { color: var(--d-green-mid); font-weight: 600; }
      .dash-bg .help-meta .dot { color: var(--d-rule); }

      /* Grid */
      .dash-bg .help-grid {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 48px;
        position: relative;
        z-index: 1;
      }
      @media (max-width: 900px) {
        .dash-bg .help-grid { grid-template-columns: 1fr; gap: 28px; }
      }
      .dash-bg .help-main { min-width: 0; }

      /* Categorías */
      .dash-bg .help-cat { margin-bottom: 48px; }
      .dash-bg .help-cat-head {
        display: flex; align-items: baseline; gap: 14px;
        margin-bottom: 6px;
        padding-bottom: 14px;
        border-bottom: 2px solid var(--d-ink);
      }
      .dash-bg .help-cat-num {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 400;
        font-size: 22px;
        color: var(--d-green-mid);
      }
      .dash-bg .help-cat-title {
        font-size: 22px;
        font-weight: 700;
        color: var(--d-green-deep);
        letter-spacing: -0.01em;
      }
      .dash-bg .help-cat-line {
        flex: 1;
        margin-bottom: 4px;
      }
      .dash-bg .help-cat-desc {
        font-size: 13px;
        color: var(--d-ink-mute);
        margin-bottom: 18px;
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-weight: 400;
      }

      /* FAQ */
      .dash-bg .faq-list {
        display: flex;
        flex-direction: column;
      }
      .dash-bg .faq {
        border-bottom: 1px solid var(--d-rule-soft);
      }
      .dash-bg .faq:last-child { border-bottom: none; }
      .dash-bg .faq-q {
        width: 100%;
        display: grid;
        grid-template-columns: 32px 1fr 24px;
        gap: 14px;
        align-items: center;
        background: transparent;
        border: none;
        padding: 18px 4px;
        text-align: left;
        cursor: pointer;
        font-family: var(--font-manrope), system-ui, sans-serif;
        transition: padding .2s, background .2s;
      }
      .dash-bg .faq-q:hover {
        padding-left: 12px;
        padding-right: 12px;
        background: var(--d-bg-soft);
        border-radius: 10px;
      }
      .dash-bg .faq-num {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 11px;
        color: var(--d-ink-mute);
        letter-spacing: 0.05em;
      }
      .dash-bg .faq-text {
        font-size: 15px;
        font-weight: 500;
        color: var(--d-ink);
      }
      .dash-bg .faq.open .faq-text { font-weight: 700; color: var(--d-green-deep); }
      .dash-bg .faq-toggle {
        width: 24px; height: 24px;
        border-radius: 50%;
        background: var(--d-bg-soft);
        display: flex; align-items: center; justify-content: center;
        color: var(--d-ink-mute);
        transition: all .2s;
      }
      .dash-bg .faq.open .faq-toggle {
        background: var(--d-green-mid);
        color: white;
        transform: rotate(180deg);
      }
      .dash-bg .faq-a {
        padding: 4px 4px 22px 50px;
        font-size: 14px;
        color: var(--d-ink-soft);
        line-height: 1.65;
      }

      /* Empty */
      .dash-bg .help-empty {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 24px;
        padding: 52px 32px;
        text-align: center;
      }
      .dash-bg .help-empty-ill {
        width: 56px; height: 56px;
        border-radius: 18px;
        background: var(--d-bg-soft);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 18px;
        font-size: 28px;
      }
      .dash-bg .help-empty-title {
        font-size: 17px; font-weight: 700;
        color: var(--d-green-deep);
        margin-bottom: 6px;
      }
      .dash-bg .help-empty-lead {
        font-size: 13px;
        color: var(--d-ink-mute);
        margin-bottom: 18px;
        max-width: 360px;
        margin-left: auto; margin-right: auto;
      }

      /* Sidebar contacto */
      .dash-bg .help-side {
        position: sticky; top: 32px; align-self: start;
      }
      .dash-bg .contact-card {
        background: var(--d-bg-card);
        border: 1px solid var(--d-rule);
        border-radius: 24px;
        padding: 28px;
        position: relative;
        overflow: hidden;
      }
      .dash-bg .contact-leaf {
        position: absolute;
        top: -25px; right: -25px;
        width: 110px;
        opacity: 0.08;
        color: var(--d-green-mid);
        pointer-events: none;
      }
      .dash-bg .contact-eyebrow {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.2em;
        color: var(--d-green-mid);
        margin-bottom: 10px;
      }
      .dash-bg .contact-title {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.015em;
        color: var(--d-green-deep);
        margin-bottom: 8px;
        line-height: 1.15;
      }
      .dash-bg .contact-title em {
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic; font-weight: 300;
        color: var(--d-green-mid);
      }
      .dash-bg .contact-lead {
        font-size: 13px;
        color: var(--d-ink-mute);
        margin-bottom: 20px;
        line-height: 1.55;
      }

      .dash-bg .contact-channels {
        display: flex; flex-direction: column;
        gap: 8px;
        margin-bottom: 22px;
      }
      .dash-bg .contact-channel {
        display: flex; align-items: center; gap: 14px;
        padding: 14px;
        background: var(--d-bg-soft);
        border: 1px solid var(--d-rule-soft);
        border-radius: 14px;
        text-decoration: none;
        transition: all .15s;
      }
      .dash-bg .contact-channel:hover {
        border-color: var(--d-green-mid);
        background: var(--d-bg-card);
      }
      .dash-bg .cc-icon {
        width: 36px; height: 36px;
        border-radius: 50%;
        background: var(--d-green-mid);
        color: var(--d-green-glow);
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-newsreader), Georgia, serif;
        font-style: italic;
        font-size: 18px;
        font-weight: 400;
        flex-shrink: 0;
      }
      .dash-bg .cc-info { flex: 1; min-width: 0; }
      .dash-bg .cc-label {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.18em;
        color: var(--d-ink-mute);
      }
      .dash-bg .cc-value {
        font-size: 13px;
        font-weight: 600;
        color: var(--d-ink);
        margin-top: 2px;
      }
      .dash-bg .cc-arrow {
        color: var(--d-ink-mute);
        flex-shrink: 0;
      }

      .dash-bg .contact-hours {
        padding: 16px 0;
        border-top: 1px solid var(--d-rule-soft);
        border-bottom: 1px solid var(--d-rule-soft);
        margin-bottom: 18px;
      }
      .dash-bg .ch-label {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.2em;
        color: var(--d-ink-mute);
        margin-bottom: 10px;
      }
      .dash-bg .ch-row {
        display: flex; justify-content: space-between;
        padding: 4px 0;
        font-size: 13px;
        color: var(--d-ink);
      }
      .dash-bg .ch-row .mono {
        font-family: var(--font-dm-mono), ui-monospace, monospace;
        font-weight: 500;
        color: var(--d-ink-soft);
      }
      .dash-bg .ch-row .mono.muted { color: var(--d-ink-mute); }

      .dash-bg .contact-emergency {
        display: flex; gap: 12px;
        padding: 14px;
        background: var(--d-amber-soft);
        border-radius: 12px;
      }
      .dash-bg .em-icon {
        width: 28px; height: 28px;
        border-radius: 50%;
        background: var(--d-amber);
        color: white;
        display: flex; align-items: center; justify-content: center;
        font-weight: 700;
        font-size: 14px;
        flex-shrink: 0;
      }
      .dash-bg .em-info { flex: 1; }
      .dash-bg .em-title {
        font-size: 12px; font-weight: 700;
        color: var(--d-ink);
        margin-bottom: 3px;
      }
      .dash-bg .em-text {
        font-size: 11px;
        color: var(--d-ink-soft);
        line-height: 1.5;
      }

      .dash-bg .btn-ghost {
        font-family: var(--font-manrope), system-ui, sans-serif;
        font-weight: 600;
        font-size: 0.84rem;
        padding: 0.65rem 1.1rem;
        border-radius: 12px;
        border: 1px solid var(--d-rule);
        background: transparent;
        color: var(--d-green-deep);
        cursor: pointer;
        transition: all .15s ease;
      }
      .dash-bg .btn-ghost:hover { border-color: var(--d-green-mid); background: var(--d-bg-soft); }
    `}</style>
  );
}
