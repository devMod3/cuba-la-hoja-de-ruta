'use client';

import { articles } from '@zenblog/content-catalog';
import type { MetadataRecord } from '@zenblog/domain';
import {
  vocabulary,
  vocabularyLabel,
  type SharedMetadataRegistry,
  type VocabularyEntry
} from '@zenblog/site-config';
import { useMemo, useState } from 'react';
import { metadataRecordFor } from './admin-model';

interface MetadataManagerProps {
  readonly registry: SharedMetadataRegistry;
  readonly onChange: (registry: SharedMetadataRegistry) => void;
}

interface EditorDraft {
  readonly primaryPillar: string;
  readonly relatedPillars: readonly string[];
  readonly type: string;
  readonly documentYear: string;
  readonly status: string;
  readonly concepts: readonly string[];
  readonly aliases: string;
  readonly keywords: string;
  readonly norms: string;
}

function recordState(record: MetadataRecord): 'complete' | 'incomplete' {
  return record.classification.primaryPillar && record.classification.type
    ? 'complete'
    : 'incomplete';
}

function lines(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/\r?\n/u)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ];
}

function normLines(record: MetadataRecord): string {
  return record.indexing.norms
    .map(
      (reference) =>
        `${reference.normId}${reference.articles.length ? `:${reference.articles.join(',')}` : ''}`
    )
    .join('\n');
}

function parseNormLines(value: string): MetadataRecord['indexing']['norms'] {
  return lines(value)
    .map((line) => {
      const [normId = '', articles = ''] = line.split(':', 2);
      return {
        normId: normId.trim(),
        articles: articles
          .split(',')
          .map((article) => article.trim())
          .filter(Boolean)
      };
    })
    .filter((reference) => reference.normId.length > 0);
}

function draftFromRecord(record: MetadataRecord): EditorDraft {
  return {
    primaryPillar: record.classification.primaryPillar ?? '',
    relatedPillars: record.classification.relatedPillars,
    type: record.classification.type ?? '',
    documentYear: record.temporal.documentYear ? String(record.temporal.documentYear) : '',
    status: record.editorial.status ?? '',
    concepts: record.indexing.concepts,
    aliases: record.indexing.aliases.join('\n'),
    keywords: record.indexing.keywords.join('\n'),
    norms: normLines(record)
  };
}

function displayValue(entries: readonly VocabularyEntry[], id: string | null | undefined): string {
  return id ? vocabularyLabel(entries, id, id) : '—';
}

export function MetadataManager({ registry, onChange }: MetadataManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditorDraft | null>(null);
  const [status, setStatus] = useState(`${String(articles.length)} artículos`);
  const article = articles.find((item) => item.id === editingId) ?? null;

  const health = useMemo(() => {
    let complete = 0;
    for (const item of articles) {
      if (recordState(metadataRecordFor(item, registry)) === 'complete') complete += 1;
    }
    return { complete, incomplete: articles.length - complete };
  }, [registry]);

  function openEditor(id: string): void {
    const selectedArticle = articles.find((item) => item.id === id);
    if (!selectedArticle) return;
    setEditingId(id);
    setDraft(draftFromRecord(metadataRecordFor(selectedArticle, registry)));
  }

  function updateDraft(update: Partial<EditorDraft>): void {
    setDraft((current) => (current ? { ...current, ...update } : current));
  }

  function toggleRelatedPillar(id: string, checked: boolean): void {
    if (!draft) return;
    const next = checked
      ? [...new Set([...draft.relatedPillars, id])]
      : draft.relatedPillars.filter((pillar) => pillar !== id);
    updateDraft({ relatedPillars: next.filter((pillar) => pillar !== draft.primaryPillar) });
  }

  function toggleConcept(id: string, checked: boolean): void {
    if (!draft) return;
    const next = checked
      ? [...new Set([...draft.concepts, id])]
      : draft.concepts.filter((concept) => concept !== id);
    updateDraft({ concepts: next });
  }

  function save(): void {
    if (!article || !draft) return;
    const base = metadataRecordFor(article, registry);
    const numericYear = Number(draft.documentYear);
    const nextRecord: MetadataRecord = {
      ...base,
      classification: {
        primaryPillar: draft.primaryPillar || null,
        relatedPillars: draft.relatedPillars.filter((pillar) => pillar !== draft.primaryPillar),
        type: draft.type || null
      },
      temporal: {
        documentYear: Number.isInteger(numericYear) && numericYear > 0 ? numericYear : null
      },
      indexing: {
        concepts: [...draft.concepts],
        aliases: lines(draft.aliases),
        keywords: lines(draft.keywords),
        norms: parseNormLines(draft.norms)
      },
      editorial: { status: draft.status || null }
    };
    const nextRegistry: SharedMetadataRegistry = {
      ...registry,
      updatedAt: new Date().toISOString(),
      records: { ...registry.records, [article.id]: nextRecord }
    };
    onChange(nextRegistry);
    setStatus('Metadata guardada');
  }

  return (
    <div id="zen-metadata-manager-root">
      <div className="zmm-shell">
        <header className="zmm-header">
          <div>
            <small>Herramienta de autoría</small>
            <strong>Metadata</strong>
          </div>
          <div id="zmm-status" role="status" aria-live="polite" data-kind="ok">
            {status} · {String(health.complete)} completos · {String(health.incomplete)} incompletos
          </div>
        </header>
        <div className="zmm-main">
          <section className="zmm-browser" aria-label="Artículos">
            <div className="zmm-list-head" aria-hidden="true">
              <span />
              <span>Artículo</span>
              <span>Estado</span>
              <span>Tipo</span>
              <span>Fecha</span>
            </div>
            <div className="zmm-scroll">
              <ul className="zmm-list">
                {articles.map((item) => {
                  const itemRecord = metadataRecordFor(item, registry);
                  const state = recordState(itemRecord);
                  return (
                    <li className="zmm-row" key={item.id} data-id={item.id}>
                      <span aria-hidden="true" />
                      <button
                        className="zmm-title-btn"
                        type="button"
                        onClick={() => {
                          openEditor(item.id);
                        }}
                      >
                        <strong>{item.title}</strong>
                        <small>
                          {displayValue(
                            vocabulary.pillars,
                            itemRecord.classification.primaryPillar
                          )}
                        </small>
                      </button>
                      <span className="zmm-health" data-state={state}>
                        {state === 'complete' ? 'Completa' : 'Incompleta'}
                      </span>
                      <span className="zmm-type">
                        {displayValue(vocabulary.types, itemRecord.classification.type)}
                      </span>
                      <span className="zmm-date">{item.publishedAt?.slice(0, 10) ?? '—'}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <aside className="zmm-editor" aria-label="Editor de metadata" hidden={!article || !draft}>
            {article && draft ? (
              <div className="zmm-editor-body">
                <header className="zmm-editor-title">
                  <small>Editar artículo</small>
                  <h2>{article.title}</h2>
                </header>

                <section className="zmm-section">
                  <div className="zmm-section-title">
                    <span>Clasificación</span>
                    <span>Contrato 1.0</span>
                  </div>
                  <label className="zmm-field" htmlFor="zmm-primary-pillar">
                    <span>Pilar principal</span>
                    <select
                      id="zmm-primary-pillar"
                      value={draft.primaryPillar}
                      onChange={(event) => {
                        updateDraft({
                          primaryPillar: event.target.value,
                          relatedPillars: draft.relatedPillars.filter(
                            (pillar) => pillar !== event.target.value
                          )
                        });
                      }}
                    >
                      <option value="">Sin clasificar</option>
                      {vocabulary.pillars.map((pillar) => (
                        <option key={pillar.id} value={pillar.id}>
                          {pillar.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="zmm-field">
                    <span>Pilares relacionados</span>
                    <div id="zmm-related-pillars" className="zmm-related">
                      {vocabulary.pillars
                        .filter((pillar) => pillar.id !== draft.primaryPillar)
                        .map((pillar) => (
                          <label className="zmm-check" key={pillar.id}>
                            <input
                              type="checkbox"
                              checked={draft.relatedPillars.includes(pillar.id)}
                              onChange={(event) => {
                                toggleRelatedPillar(pillar.id, event.target.checked);
                              }}
                            />{' '}
                            {pillar.label}
                          </label>
                        ))}
                    </div>
                  </div>
                  <label className="zmm-field" htmlFor="zmm-type">
                    <span>Tipo</span>
                    <select
                      id="zmm-type"
                      value={draft.type}
                      onChange={(event) => {
                        updateDraft({ type: event.target.value });
                      }}
                    >
                      <option value="">Sin clasificar</option>
                      {vocabulary.types.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="zmm-field" htmlFor="zmm-year">
                    <span>Año documental</span>
                    <input
                      id="zmm-year"
                      type="number"
                      min="1500"
                      max="2200"
                      value={draft.documentYear}
                      onChange={(event) => {
                        updateDraft({ documentYear: event.target.value });
                      }}
                    />
                  </label>
                  <label className="zmm-field" htmlFor="zmm-status-field">
                    <span>Estado</span>
                    <select
                      id="zmm-status-field"
                      value={draft.status}
                      onChange={(event) => {
                        updateDraft({ status: event.target.value });
                      }}
                    >
                      <option value="">Sin estado</option>
                      {vocabulary.statuses.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </section>

                <section className="zmm-section">
                  <div className="zmm-section-title">
                    <span>Conceptos</span>
                    <span>Vocabulario controlado</span>
                  </div>
                  <div id="zmm-concept-picker" className="zmm-related">
                    {vocabulary.concepts.map((concept) => (
                      <label className="zmm-check" key={concept.id}>
                        <input
                          type="checkbox"
                          checked={draft.concepts.includes(concept.id)}
                          onChange={(event) => {
                            toggleConcept(concept.id, event.target.checked);
                          }}
                        />{' '}
                        {concept.label}
                      </label>
                    ))}
                  </div>
                  <label className="zmm-field">
                    <span>Aliases (uno por línea)</span>
                    <textarea
                      value={draft.aliases}
                      onChange={(event) => {
                        updateDraft({ aliases: event.target.value });
                      }}
                    />
                  </label>
                  <label className="zmm-field">
                    <span>Palabras clave (una por línea)</span>
                    <textarea
                      value={draft.keywords}
                      onChange={(event) => {
                        updateDraft({ keywords: event.target.value });
                      }}
                    />
                  </label>
                </section>

                <section className="zmm-section">
                  <div className="zmm-section-title">
                    <span>Referencias normativas</span>
                    <span>norma:artículo,artículo</span>
                  </div>
                  <label className="zmm-field" htmlFor="zmm-norm-list">
                    <span>Normas</span>
                    <textarea
                      id="zmm-norm-list"
                      value={draft.norms}
                      onChange={(event) => {
                        updateDraft({ norms: event.target.value });
                      }}
                      placeholder="c40:40,97"
                    />
                  </label>
                </section>

                <div className="zmm-editor-actions">
                  <button id="zmm-save" type="button" className="primary" onClick={save}>
                    Guardar metadata
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setDraft(null);
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
