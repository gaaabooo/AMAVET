import Link from 'next/link';
import Logo from './Logo';

interface LegalLayoutProps {
  eyebrow: string;
  title: string;
  titleItalic?: string;
  intro?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export default function LegalLayout({
  eyebrow,
  title,
  titleItalic,
  intro,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  return (
    <main className="min-h-screen bg-(--surface)">
      <nav
        className="sticky top-0 z-50 px-6 py-4 flex justify-between items-center"
        style={{
          background: 'rgba(248,249,250,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #e1e3e4',
        }}
      >
        <Link href="/" aria-label="Volver al inicio">
          <Logo size="sm" variant="light" />
        </Link>
        <Link
          href="/"
          className="text-sm font-medium hover:underline underline-offset-4"
          style={{ color: '#012d1d' }}
        >
          ← Volver al inicio
        </Link>
      </nav>

      <article className="max-w-[68ch] mx-auto px-6 py-20">
        <span
          className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-5"
          style={{ color: '#012d1d' }}
        >
          <span
            className="w-8 h-px"
            style={{ background: '#012d1d', display: 'inline-block' }}
            aria-hidden
          />
          {eyebrow}
        </span>

        <h1
          className="text-5xl font-bold leading-[1.05] mb-5"
          style={{ color: '#191c1d', letterSpacing: '-0.02em' }}
        >
          {title}
          {titleItalic && (
            <>
              {' '}
              <span
                style={{
                  color: '#012d1d',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontFamily: 'var(--font-newsreader)',
                }}
              >
                {titleItalic}
              </span>
            </>
          )}
        </h1>

        {intro && (
          <p
            className="text-xl mb-12"
            style={{
              color: '#414844',
              fontFamily: 'var(--font-newsreader)',
              lineHeight: 1.6,
            }}
          >
            {intro}
          </p>
        )}

        <div
          className="prose-legal flex flex-col gap-6"
          style={{
            color: '#414844',
            fontFamily: 'var(--font-newsreader)',
            fontSize: '1.0625rem',
            lineHeight: 1.7,
          }}
        >
          {children}
        </div>

        {lastUpdated && (
          <p
            className="text-sm mt-16 pt-6"
            style={{
              color: '#717973',
              borderTop: '1px solid #e1e3e4',
              fontFamily: 'var(--font-manrope)',
            }}
          >
            Última actualización: {lastUpdated}
          </p>
        )}
      </article>

      <footer
        className="py-10 border-t mt-12"
        style={{ background: '#ffffff', borderColor: '#e1e3e4' }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <Logo size="sm" variant="light" />
          <div className="flex flex-wrap gap-6 text-sm" style={{ color: '#717973' }}>
            <Link href="/legal/privacidad" className="hover:underline underline-offset-4">
              Privacidad
            </Link>
            <Link href="/legal/terminos" className="hover:underline underline-offset-4">
              Términos
            </Link>
            <Link href="/cobertura" className="hover:underline underline-offset-4">
              Cobertura
            </Link>
            <Link href="/contacto" className="hover:underline underline-offset-4">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
