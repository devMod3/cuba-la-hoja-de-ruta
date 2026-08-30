import type { Metadata } from 'next';
import { AboutDraftPreview } from '../../../components/admin/about-draft-preview';

export const metadata: Metadata = {
  title: 'Vista previa — Acerca de',
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function AboutDraftPreviewPage() {
  return <AboutDraftPreview />;
}
