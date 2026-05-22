import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const isDev = process.env.NODE_ENV === 'development';

// 'unsafe-eval' SOLO se incluye en desarrollo: React lo usa ahí para reconstruir
// stacks de error en el navegador. En producción ni React ni Next lo necesitan,
// así que se omite — endurece la CSP contra XSS sin romper nada.
// 'unsafe-inline' se mantiene a propósito: quitarlo exigiría nonces de Next, que
// fuerzan rendering dinámico en todas las páginas (más lentas, sin CDN cache).
// Para el tamaño de AMAVET ese costo no compensa.
const scriptSrc = [
  "script-src 'self' 'unsafe-inline'",
  isDev ? "'unsafe-eval'" : '',
  'https://challenges.cloudflare.com',
]
  .filter(Boolean)
  .join(' ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // challenges.cloudflare.com en connect-src: el widget Turnstile hace
      // llamadas XHR a Cloudflare para resolver el challenge.
      `connect-src 'self' ${API_URL} https://*.supabase.co https://challenges.cloudflare.com`,
      // challenges.cloudflare.com: script e iframe del captcha Turnstile.
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
