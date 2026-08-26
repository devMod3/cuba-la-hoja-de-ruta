import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { GlobalHeader } from '../components/global-header';
import { ZrpLoader } from '../components/zrp-loader';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'La hoja de ruta', template: '%s · La hoja de ruta' },
  description: 'Soberanía · Constitución · Estado'
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <GlobalHeader />
        {children}
        <ZrpLoader />
      </body>
    </html>
  );
}
