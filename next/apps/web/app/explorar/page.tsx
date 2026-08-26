import { bloggerSnapshotArticles } from '@zenblog/content-snapshot';
import type { Metadata } from 'next';
import { ExploreClient } from '../../components/explore-client';

export const metadata: Metadata = {
  title: 'Explorar',
  description: 'Explorar los artículos de La hoja de ruta por título.'
};

export default function ExplorePage() {
  return (
    <main data-component="Explore">
      <h1>Explorar</h1>
      <ExploreClient articles={bloggerSnapshotArticles} />
    </main>
  );
}
