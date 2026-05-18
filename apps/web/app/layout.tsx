import type { Metadata } from 'next';
import { Manrope, Newsreader, DM_Mono } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
});

export const metadata: Metadata = {
  title: 'Silvestra Vet — Veterinario a domicilio',
  description: 'Atención veterinaria profesional en tu hogar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      {/* suppressHydrationWarning: extensiones del navegador (Grammarly,
          DarkReader, etc.) inyectan atributos en <body> antes de la hidratación
          y disparan un warning falso positivo. No afecta otros nodos. */}
      <body
        suppressHydrationWarning
        className={`${manrope.variable} ${newsreader.variable} ${dmMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}