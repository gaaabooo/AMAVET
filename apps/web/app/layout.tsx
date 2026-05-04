import type { Metadata } from 'next';
import { Manrope, Newsreader } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
});

export const metadata: Metadata = {
  title: 'Silvestra Vet — Veterinario a domicilio',
  description: 'Atención veterinaria profesional en tu hogar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} ${newsreader.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}