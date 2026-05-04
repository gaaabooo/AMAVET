import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Contacto — Silvestra Vet',
  description:
    'Canales de contacto con Silvestra Vet: WhatsApp, correo electrónico y horario de atención.',
};

const CANALES = [
  {
    label: 'WhatsApp',
    detalle: 'Respuesta en minutos durante horario de atención.',
    valor: '+56 9 1234 5678',
    href: 'https://wa.me/56912345678?text=Hola,%20quiero%20agendar%20una%20visita%20veterinaria',
    cta: 'Abrir WhatsApp',
    primario: true,
  },
  {
    label: 'Correo general',
    detalle: 'Para coordinaciones, presupuestos y consultas administrativas.',
    valor: 'hola@silvestravet.cl',
    href: 'mailto:hola@silvestravet.cl',
    cta: 'Escribir correo',
  },
  {
    label: 'Soporte clínico',
    detalle: 'Si tienes dudas sobre un resultado de examen o un tratamiento en curso.',
    valor: 'soporte@silvestravet.cl',
    href: 'mailto:soporte@silvestravet.cl',
    cta: 'Escribir a soporte',
  },
  {
    label: 'Privacidad y datos',
    detalle: 'Para ejercer derechos sobre tus datos personales conforme a la Ley 19.628.',
    valor: 'privacidad@silvestravet.cl',
    href: 'mailto:privacidad@silvestravet.cl',
    cta: 'Escribir a privacidad',
  },
];

export default function ContactoPage() {
  return (
    <LegalLayout
      eyebrow="Hablemos"
      title="Cómo"
      titleItalic="contactarnos"
      intro="Atendemos por WhatsApp y correo. Para urgencias clínicas fuera de horario, te derivamos a clínica veterinaria de turno."
    >
      <ul className="flex flex-col gap-0 mt-4">
        {CANALES.map((c, i) => (
          <li
            key={c.label}
            className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-8 items-start py-8"
            style={{
              borderTop: i === 0 ? '1px solid #012d1d' : 'none',
              borderBottom: '1px solid #c1c8c2',
            }}
          >
            <div className="flex flex-col gap-1.5">
              <span
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: '#012d1d', letterSpacing: '0.15em' }}
              >
                {c.label}
              </span>
              <p
                className="text-2xl font-semibold"
                style={{
                  color: '#191c1d',
                  fontFamily: 'var(--font-manrope)',
                  letterSpacing: '-0.01em',
                }}
              >
                {c.valor}
              </p>
              <p
                style={{
                  color: '#414844',
                  fontFamily: 'var(--font-newsreader)',
                  fontSize: '1rem',
                  lineHeight: 1.55,
                }}
              >
                {c.detalle}
              </p>
            </div>
            <a
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 self-start md:self-center"
              style={
                c.primario
                  ? {
                      background: '#012d1d',
                      color: '#ffffff',
                      fontFamily: 'var(--font-manrope)',
                    }
                  : {
                      background: 'transparent',
                      border: '1px solid #012d1d',
                      color: '#012d1d',
                      fontFamily: 'var(--font-manrope)',
                    }
              }
            >
              {c.cta}
            </a>
          </li>
        ))}
      </ul>

      <section
        className="grid sm:grid-cols-2 gap-6 mt-12 p-8 rounded-xl"
        style={{ background: '#ffffff', border: '1px solid #e1e3e4' }}
      >
        <div>
          <h3
            className="text-sm font-bold uppercase tracking-widest mb-2"
            style={{ color: '#012d1d', letterSpacing: '0.15em' }}
          >
            Horario de atención
          </h3>
          <p
            style={{
              color: '#191c1d',
              fontFamily: 'var(--font-newsreader)',
              fontSize: '1.0625rem',
              lineHeight: 1.6,
            }}
          >
            Lunes a viernes, 9:00 a 19:00.
            <br />
            Sábados, 10:00 a 14:00.
            <br />
            Domingos y festivos, solo urgencias.
          </p>
        </div>
        <div>
          <h3
            className="text-sm font-bold uppercase tracking-widest mb-2"
            style={{ color: '#012d1d', letterSpacing: '0.15em' }}
          >
            Urgencias fuera de horario
          </h3>
          <p
            style={{
              color: '#191c1d',
              fontFamily: 'var(--font-newsreader)',
              fontSize: '1.0625rem',
              lineHeight: 1.6,
            }}
          >
            Para emergencias clínicas fuera de horario, te derivamos a una
            clínica veterinaria de turno cercana a tu domicilio.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
