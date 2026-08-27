import { bloggerSnapshotArticles } from '@zenblog/content-snapshot';
import type { Metadata } from 'next';
import { ExploreClient } from '../../components/explore-client';

export const metadata: Metadata = {
  title: 'Explorar',
  description: 'Localizar artículos por título y criterios documentales en La hoja de ruta.'
};

export default function ExplorePage() {
  return (
    <main className="explore-page" data-component="Explore">
      <ExploreClient articles={bloggerSnapshotArticles} />
    </main>
  );
}
