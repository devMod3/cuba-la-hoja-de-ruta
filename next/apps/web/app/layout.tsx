import type { Metadata } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { GlobalHeader } from '../components/global-header';
import { MobileGestureNavigation } from '../components/mobile-gesture-navigation';
import { ZrpLoader } from '../components/zrp-loader';
import './globals.css';
import './reader.css';
import { siteUrl } from '../lib/site-address';

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

const fontFamilies = {
  '--sans': sourceSans.style.fontFamily,
  '--serif': sourceSerif.style.fontFamily
} as CSSProperties;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl('/')),
  title: { default: 'La hoja de ruta', template: '%s · La hoja de ruta' },
  description: 'Soberanía · Constitución · Estado'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${sourceSans.variable} ${sourceSerif.variable}`}>
      <body style={fontFamilies}>
        <GlobalHeader />
        {children}
        <MobileGestureNavigation />
        <ZrpLoader />
      </body>
    </html>
  );
}
