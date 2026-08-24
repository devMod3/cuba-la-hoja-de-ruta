import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ZRP_SCRIPT_URL } from '@zenblog/zrp-adapter';
import { GlobalHeader } from '../components/global-header';
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
        <script type="module" src={ZRP_SCRIPT_URL} data-component="ZRP.Loader" />
      </body>
    </html>
  );
}
