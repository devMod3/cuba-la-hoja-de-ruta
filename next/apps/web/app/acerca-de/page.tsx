import { siteProfile } from '@zenblog/site-config';
import type { Metadata } from 'next';
import { AboutProfileView } from './about-profile-view';

export const metadata: Metadata = {
  title: 'Acerca de',
  description: 'Perfil público de La hoja de ruta.'
};

export default function AboutPage() {
  return <AboutProfileView data={siteProfile} />;
}
