import { bloggerSnapshotArticles } from '@zenblog/content-snapshot';
import Link from 'next/link';

function cleanSummary(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function excerpt(value: string, max = 260): string {
  const text = cleanSummary(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export default function HomePage() {
  const featured = bloggerSnapshotArticles[0] ?? null;
  const featuredSummary = featured ? excerpt(featured.summary || featured.content || '') : '';

  return (
    <main className="home-page" data-component="Home">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero-copy">
          <p className="kicker">SOBERANÍA · CONSTITUCIÓN · ESTADO</p>
          <h1 id="home-title">Seguir el origen, los límites y el ejercicio del poder.</h1>
          <p className="home-deck">
            Conceptos, normas, documentos y análisis organizados para situar, relacionar y
            verificar cada afirmación.
          </p>
          <Link className="text-action" href="/explorar/">
            Explorar el sistema <span aria-hidden="true">→</span>
          </Link>
        </div>

        <aside className="home-feature" aria-label="Lectura destacada">
          <p className="kicker">DESTACADO</p>
          {featured ? (
            <>
              <h2>{featured.title}</h2>
              {featuredSummary ? <p>{featuredSummary}</p> : null}
              <Link className="primary-action" href={`/articulo/${featured.id}/`}>
                Leer
              </Link>
            </>
          ) : (
            <p className="muted">Aún no hay una lectura disponible.</p>
          )}
        </aside>
      </section>
    </main>
  );
}
