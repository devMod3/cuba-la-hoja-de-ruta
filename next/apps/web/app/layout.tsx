import type { Metadata } from 'next';
import { Source_Sans_3, Source_Serif_4 } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { GlobalHeader } from '../components/global-header';
import { MobileGestureNavigation } from '../components/mobile-gesture-navigation';
import { ZrpLoader } from '../components/zrp-loader';
import './globals.css';
import './reader.css';

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

const basePath = process.env['ZENBLOG_BASE_PATH'] ?? '';
const auxiliaryRuntimeSrc = `${basePath}/zen-admin/tools/runtime/bootstrap.js`;

export const metadata: Metadata = {
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
        <script type="module" src={auxiliaryRuntimeSrc} />
      </body>
    </html>
  );
}
