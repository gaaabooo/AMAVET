interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = {
  sm: { mark: 40, word: '1.0625rem', vetSize: '1.0625rem', gap: '0.625rem' },
  md: { mark: 54, word: '1.375rem', vetSize: '1.375rem', gap: '0.75rem' },
};

export default function Logo({
  variant = 'light',
  size = 'sm',
  className = '',
}: LogoProps) {
  const { mark, word, vetSize, gap } = SIZES[size];

  const symbolColor = variant === 'light' ? '#012d1d' : '#ffffff';
  const pawColor = variant === 'light' ? '#012d1d' : '#ffffff';
  const wordColor = variant === 'light' ? '#012d1d' : '#ffffff';
  const vetColor = variant === 'light' ? '#012d1d' : '#b1f0ce';

  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      style={{ gap }}
      aria-label="Silvestra Vet"
    >
      <span
        className="relative inline-block"
        style={{ width: mark, height: mark }}
      >
        {/* Capa de fondo: huella de perro difuminada */}
        <svg
          width={mark}
          height={mark}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0"
          aria-hidden
        >
          <g
            fill={pawColor}
            opacity="0.18"
            style={{ filter: 'blur(1.2px)' }}
          >
            <ellipse cx="24" cy="34" rx="10" ry="7.5" />
            <ellipse cx="11" cy="20" rx="3.4" ry="4.2" />
            <ellipse cx="18.5" cy="11" rx="3.2" ry="4.2" />
            <ellipse cx="29.5" cy="11" rx="3.2" ry="4.2" />
            <ellipse cx="37" cy="20" rx="3.4" ry="4.2" />
          </g>
        </svg>

        {/* Capa frontal: caduceo veterinario (SVG asset) */}
        <span
          className="absolute inset-0 flex items-center justify-center"
          style={{
            color: symbolColor,
            WebkitMaskImage: 'url(/logo/silvestra-mark.svg)',
            maskImage: 'url(/logo/silvestra-mark.svg)',
            WebkitMaskSize: 'contain',
            maskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            maskPosition: 'center',
            backgroundColor: symbolColor,
          }}
        />
      </span>

      <span
        className="inline-flex items-baseline gap-1.5 font-[family-name:var(--font-manrope)]"
        style={{ fontSize: word }}
      >
        <span
          style={{
            color: wordColor,
            fontWeight: 800,
            letterSpacing: '0.02em',
          }}
        >
          SILVESTRA
        </span>
        <span
          style={{
            color: vetColor,
            fontWeight: 300,
            fontStyle: 'italic',
            fontFamily: 'var(--font-newsreader)',
            fontSize: vetSize,
            opacity: variant === 'light' ? 0.85 : 1,
          }}
        >
          vet
        </span>
      </span>
    </span>
  );
}
