'use client';

import { articles } from '@zenblog/content-catalog';
import { searchArticles } from '@zenblog/search-core';
import type { SharedMetadataRegistry } from '@zenblog/site-config';
import { useState } from 'react';

export function SearchLab({ registry }: { readonly registry: SharedMetadataRegistry }) {
  const [query, setQuery] = useState('');
  const [executedQuery, setExecutedQuery] = useState('');
  const results = searchArticles({ articles, registry, query: executedQuery, sort: 'relevance' });

  return (
    <div id="zen-search-lab-root">
      <div className="zsl-shell">
        <header className="zsl-header">
          <div>
            <small>Herramienta de autoría</small>
            <strong>Search Lab</strong>
          </div>
          <span id="zsl-index-status" role="status">
            {String(articles.length)} artículos indexados
          </span>
        </header>
        <div className="zsl-controls">
          <label className="zsl-query" htmlFor="zsl-query">
            <span>Consulta</span>
            <input
              id="zsl-query"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              autoComplete="off"
            />
          </label>
          <div className="zsl-runbar">
            <button
              type="button"
              className="primary"
              onClick={() => {
                setExecutedQuery(query);
              }}
            >
              Ejecutar búsqueda
            </button>
            <span>{String(results.length)} resultados</span>
          </div>
        </div>
        <div id="zsl-results" className="zsl-results" aria-live="polite">
          {results.length ? (
            results.map(({ article, score }) => (
              <article className="zsl-result" key={article.id}>
                <div className="zsl-result-top">
                  <a href={`/articulo/${article.id}/`}>{article.title}</a>
                  <span className="zsl-score">{String(score)}</span>
                </div>
              </article>
            ))
          ) : (
            <p className="zsl-empty">Sin resultados para la consulta actual.</p>
          )}
        </div>
      </div>
    </div>
  );
}
