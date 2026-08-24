'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Article } from '@zenblog/domain';
import { searchArticlesByTitle } from '@zenblog/search-core';

export function ExploreClient({ articles }: { readonly articles: readonly Article[] }) {
  const [query, setQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const results = useMemo(() => searchArticlesByTitle(articles, query), [articles, query]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <section
      aria-labelledby="explore-search-heading"
      data-component="Explore.PublicSearch"
      data-hydrated={hydrated ? 'true' : 'false'}
    >
      <h2 id="explore-search-heading" className="visually-hidden">
        Buscar artículos
      </h2>
      <label className="explore-search" htmlFor="explore-query">
        <span className="visually-hidden">Buscar por título</span>
        <input
          id="explore-query"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por título"
          autoComplete="off"
        />
      </label>

      <p className="explore-status" role="status" aria-live="polite">
        {`${results.length} artículo${results.length === 1 ? '' : 's'}`}
      </p>

      {results.length === 0 ? <p>No hay artículos que coincidan con la búsqueda.</p> : null}

      <ul className="explore-results" aria-label="Artículos">
        {results.map((article) => (
          <li key={article.id}>
            <a href={article.url}>{article.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
