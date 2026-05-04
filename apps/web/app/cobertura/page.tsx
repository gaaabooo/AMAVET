import LegalLayout from '@/components/LegalLayout';

export const metadata = {
  title: 'Área de cobertura — Silvestra Vet',
  description:
    'Comunas de la Región Metropolitana donde Silvestra Vet presta atención veterinaria a domicilio.',
};

const COMUNAS_PRINCIPALES = [
  'Las Condes',
  'Vitacura',
  'Lo Barnechea',
  'Providencia',
  'Ñuñoa',
  'La Reina',
];

const COMUNAS_EXTENDIDA = [
  'Macul',
  'Peñalolén',
  'San Miguel',
  'La Florida',
  'Santiago Centro',
  'Huechuraba',
];

export default function CoberturaPage() {
  return (
    <LegalLayout
      eyebrow="Dónde llegamos"
      title="Área de"
      titleItalic="cobertura"
      intro="Atendemos en gran parte del sector oriente de Santiago. Si tu comuna no aparece en la lista, escríbenos por WhatsApp y revisamos disponibilidad para una visita programada."
    >
      <div className="flex flex-col gap-12 mt-4">
        <section>
          <h2
            className="text-2xl font-semibold mb-5"
            style={{
              color: '#191c1d',
              fontFamily: 'var(--font-manrope)',
              letterSpacing: '-0.01em',
            }}
          >
            Cobertura habitual
          </h2>
          <p className="mb-4">
            Visitas el mismo día o el siguiente, según disponibilidad.
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COMUNAS_PRINCIPALES.map((c) => (
              <li
                key={c}
                className="inline-flex items-center gap-3 py-2 px-4 rounded-full"
                style={{
                  background: '#ffffff',
                  border: '1px solid #c1c8c2',
                  fontFamily: 'var(--font-manrope)',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  color: '#191c1d',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#012d1d' }}
                  aria-hidden
                />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2
            className="text-2xl font-semibold mb-5"
            style={{
              color: '#191c1d',
              fontFamily: 'var(--font-manrope)',
              letterSpacing: '-0.01em',
            }}
          >
            Cobertura extendida
          </h2>
          <p className="mb-4">
            Visitas programadas con al menos 24 horas de anticipación. Puede
            aplicar un cargo adicional por traslado.
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {COMUNAS_EXTENDIDA.map((c) => (
              <li
                key={c}
                className="inline-flex items-center gap-3 py-2 px-4 rounded-full"
                style={{
                  background: '#f8f9fa',
                  border: '1px solid #e1e3e4',
                  fontFamily: 'var(--font-manrope)',
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  color: '#414844',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#735c00' }}
                  aria-hidden
                />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="p-8 rounded-xl"
          style={{ background: '#012d1d', color: '#ffffff' }}
        >
          <h3
            className="text-xl font-semibold mb-3"
            style={{
              fontFamily: 'var(--font-manrope)',
              letterSpacing: '-0.01em',
            }}
          >
            ¿No ves tu comuna?
          </h3>
          <p
            className="mb-5"
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'var(--font-newsreader)',
              fontSize: '1.0625rem',
              lineHeight: 1.6,
            }}
          >
            Escríbenos por WhatsApp con tu dirección. Si está dentro del
            sector oriente, casi siempre podemos coordinar la visita.
          </p>
          <a
            href="https://wa.me/56912345678?text=Hola,%20quiero%20saber%20si%20llegan%20a%20mi%20comuna"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-transform hover:scale-105"
            style={{
              background: '#fed65b',
              color: '#191c1d',
              fontFamily: 'var(--font-manrope)',
            }}
          >
            Consultar por WhatsApp
          </a>
        </section>
      </div>
    </LegalLayout>
  );
}
