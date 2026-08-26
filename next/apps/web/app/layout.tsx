import type { Metadata } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import type { ReactNode } from 'react';
import { GlobalHeader } from '../components/global-header';
import { ZrpLoader } from '../components/zrp-loader';
import './globals.css';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-sans'
});

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-serif'
});

export const metadata: Metadata = {
  title: { default: 'La hoja de ruta', template: '%s · La hoja de ruta' },
  description: 'Soberanía · Constitución · Estado'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${sourceSans.variable} ${sourceSerif.variable}`}>
      <body>
        <GlobalHeader />
        {children}
        <ZrpLoader />
      </body>
    </html>
  );
}
