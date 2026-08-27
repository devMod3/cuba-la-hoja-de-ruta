'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import type { Article, MetadataRecord, MetadataRegistry } from '@zenblog/domain';
import { searchArticles, searchArticlesByTitle, type SearchSort } from '@zenblog/search-core';
import { EMPTY_METADATA_REGISTRY, LocalMetadataSource } from '../adapters/local-metadata';

const PILLARS = ['Soberanía', 'Constitución', 'Estado'] as const;
const TYPES = [
  'Concepto',
  'Análisis',
  'Norma',
  'Documento',
  'Cronología',
  'Historia',
  'Dossier'
] as const;

const publicationDate = new Intl.DateTimeFormat('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

type ExploreMode = 'simple' | 'advanced';
type YearMode = 'all' | 'range';

function articleCountLabel(count: number): string {
  return `${String(count)} artículo${count === 1 ? '' : 's'}`;
}

function knownPillar(article: Article): (typeof PILLARS)[number] | null {
  return PILLARS.find((pillar) => article.labels.includes(pillar)) ?? null;
}

function fallbackMetadataRecord(pillar: (typeof PILLARS)[number]): MetadataRecord {
  return {
    classification: {
      primaryPillar: pillar,
      relatedPillars: [],
      type: null
    },
    temporal: { documentYear: null },
    indexing: {
      concepts: [],
      aliases: [],
      keywords: [],
      norms: []
    },
    editorial: { status: null }
  };
}

function withPillarFallback(
  articles: readonly Article[],
  registry: MetadataRegistry
): MetadataRegistry {
  const records: Record<string, MetadataRecord> = { ...registry.records };

  for (const article of articles) {
    const record = records[article.id];
    if (record?.classification.primaryPillar) continue;

    const pillar = knownPillar(article);
    if (!pillar) continue;

    records[article.id] = record
      ? {
          ...record,
          classification: {
            ...record.classification,
            primaryPillar: pillar
          }
        }
      : fallbackMetadataRecord(pillar);
  }

  return { ...registry, records };
}

function metadataType(article: Article, registry: MetadataRegistry): string {
  return registry.records[article.id]?.classification.type ?? 'Sin clasificar';
}

function formattedPublicationDate(article: Article): string {
  if (!article.publishedAt) return 'Sin fecha';
  const date = new Date(article.publishedAt);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : publicationDate.format(date);
}

function emptyMetadataSnapshot(): MetadataRegistry {
  return EMPTY_METADATA_REGISTRY;
}

export function ExploreClient({ articles }: { readonly articles: readonly Article[] }) {
  const metadataSource = useMemo(() => new LocalMetadataSource(), []);
  const subscribeToMetadata = useCallback(
    (onStoreChange: () => void) =>
      metadataSource.subscribe(() => {
        onStoreChange();
      }),
    [metadataSource]
  );
  const getMetadataSnapshot = useCallback(() => metadataSource.getRegistry(), [metadataSource]);
  const registry = useSyncExternalStore(
    subscribeToMetadata,
    getMetadataSnapshot,
    emptyMetadataSnapshot
  );
  const [mode, setMode] = useState<ExploreMode>('simple');
  const [query, setQuery] = useState('');
  const [pillar, setPillar] = useState('all');
  const [type, setType] = useState('all');
  const [yearMode, setYearMode] = useState<YearMode>('all');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [sort, setSort] = useState<SearchSort>('recent');

  const effectiveRegistry = useMemo(
    () => withPillarFallback(articles, registry),
    [articles, registry]
  );

  const results = useMemo(() => {
    if (mode === 'simple') return searchArticlesByTitle(articles, query);

    return searchArticles({
      articles,
      registry: effectiveRegistry,
      filters: {
        pillar,
        type,
        yearFrom: yearMode === 'range' ? yearFrom : undefined,
        yearTo: yearMode === 'range' ? yearTo : undefined
      },
      sort
    }).map((result) => result.article);
  }, [articles, effectiveRegistry, mode, pillar, query, sort, type, yearFrom, yearMode, yearTo]);

  const resetAdvanced = () => {
    setPillar('all');
    setType('all');
    setYearMode('all');
    setYearFrom('');
    setYearTo('');
    setSort('recent');
  };

  return (
    <section
      ref={(node) => {
        if (node) node.dataset['hydrated'] = 'true';
      }}
      aria-labelledby="explore-search-heading"
      data-component="Explore.PublicSearch"
    >
      <header className="explore-heading">
        <div>
          <p className="kicker">Archivo documental</p>
          <h1 id="explore-search-heading">Explorar</h1>
        </div>
        <p className="explore-status" role="status" aria-live="polite">
          {articleCountLabel(results.length)}
        </p>
      </header>

      {mode === 'simple' ? (
        <div className="explore-simple" data-mode="simple">
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
          <div className="explore-actions">
            {query ? (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setQuery('');
                }}
              >
                Limpiar
              </button>
            ) : null}
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode('advanced');
              }}
            >
              Búsqueda avanzada
            </button>
          </div>
        </div>
      ) : (
        <div className="explore-advanced" data-mode="advanced">
          <div className="explore-actions explore-actions--between">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setMode('simple');
              }}
            >
              ← Buscar
            </button>
            <button type="button" className="text-button" onClick={resetAdvanced}>
              Restablecer criterios
            </button>
          </div>

          <div className="explore-filters" aria-label="Criterios de búsqueda avanzada">
            <label>
              <span>Pilar</span>
              <select
                value={pillar}
                onChange={(event) => {
                  setPillar(event.target.value);
                }}
              >
                <option value="all">Todos</option>
                {PILLARS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Tipo</span>
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                }}
              >
                <option value="all">Todos</option>
                {TYPES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Año documental</span>
              <select
                value={yearMode}
                onChange={(event) => {
                  setYearMode(event.target.value as YearMode);
                }}
              >
                <option value="all">Todos</option>
                <option value="range">Rango</option>
              </select>
            </label>

            <label>
              <span>Orden</span>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as SearchSort);
                }}
              >
                <option value="recent">Más recientes</option>
                <option value="old">Más antiguos</option>
                <option value="az">A–Z</option>
              </select>
            </label>
          </div>

          {yearMode === 'range' ? (
            <div className="explore-year-range" aria-label="Rango de año documental">
              <label>
                <span>Desde</span>
                <input
                  type="number"
                  min="1500"
                  max="2200"
                  inputMode="numeric"
                  value={yearFrom}
                  onChange={(event) => {
                    setYearFrom(event.target.value);
                  }}
                />
              </label>
              <label>
                <span>Hasta</span>
                <input
                  type="number"
                  min="1500"
                  max="2200"
                  inputMode="numeric"
                  value={yearTo}
                  onChange={(event) => {
                    setYearTo(event.target.value);
                  }}
                />
              </label>
            </div>
          ) : null}
        </div>
      )}

      {results.length === 0 ? (
        <p className="explore-empty">No hay artículos que coincidan con los criterios.</p>
      ) : null}

      <div className="explore-results-scroll" data-zen-results-scroll>
        <ul className="explore-results" aria-label="Artículos">
          {results.map((article) => (
            <li key={article.id}>
              <Link href={`/articulo/${encodeURIComponent(article.id)}/`}>
                <span className="explore-result-meta">
                  <span>{metadataType(article, effectiveRegistry)}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={article.publishedAt ?? undefined}>
                    {formattedPublicationDate(article)}
                  </time>
                </span>
                <strong>{article.title}</strong>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
