'use client';

import { useMemo, useState } from 'react';
import type { Article } from '@zenblog/domain';
import { searchArticlesByTitle } from '@zenblog/search-core';

function articleCountLabel(count: number): string {
  return `${String(count)} artículo${count === 1 ? '' : 's'}`;
}

export function ExploreClient({ articles }: { readonly articles: readonly Article[] }) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchArticlesByTitle(articles, query), [articles, query]);

  return (
    <section
      ref={(node) => {
        if (node) node.dataset['hydrated'] = 'true';
      }}
      aria-labelledby="explore-search-heading"
      data-component="Explore.PublicSearch"
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
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder="Buscar por título"
          autoComplete="off"
        />
      </label>

      <p className="explore-status" role="status" aria-live="polite">
        {articleCountLabel(results.length)}
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
