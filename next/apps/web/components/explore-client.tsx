'use client';

import { useEffect, useMemo, useState } from 'react';
import { BloggerFeedSource } from '@zenblog/cms-blogger';
import type { Article } from '@zenblog/domain';
import { searchArticlesByTitle } from '@zenblog/search-core';

export const BLOGGER_SOURCE_URL = 'https://cubalahojaderuta.blogspot.com/';

export function ExploreClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    const fetcher: typeof fetch = (input, init) =>
      globalThis.fetch(input, { ...init, signal: controller.signal });
    const source = new BloggerFeedSource({ baseUrl: BLOGGER_SOURCE_URL, fetcher });

    source
      .listPosts()
      .then((posts) => {
        if (!controller.signal.aborted) {
          setArticles(posts);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error');
      });

    return () => controller.abort();
  }, []);

  const results = useMemo(() => searchArticlesByTitle(articles, query), [articles, query]);

  return (
    <section aria-labelledby="explore-search-heading" data-component="Explore.PublicSearch">
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
        {status === 'loading' && 'Cargando artículos…'}
        {status === 'error' && 'No se pudo cargar el índice público.'}
        {status === 'ready' && `${results.length} artículo${results.length === 1 ? '' : 's'}`}
      </p>

      {status === 'ready' && results.length === 0 ? (
        <p>No hay artículos que coincidan con la búsqueda.</p>
      ) : null}

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
