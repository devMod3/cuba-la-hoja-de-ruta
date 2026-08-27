import { describe, expect, it } from 'vitest';
import {
  buildArticleReference,
  createArticleDeck,
  estimateReadingMinutes,
  formatEditorialDate
} from './article-presentation';

describe('article presentation helpers', () => {
  it('estimates reading time with a one-minute floor', () => {
    expect(estimateReadingMinutes('')).toBe(1);
    expect(estimateReadingMinutes('uno dos tres')).toBe(1);
    expect(estimateReadingMinutes(Array.from({ length: 221 }, () => 'palabra').join(' '))).toBe(2);
  });

  it('prefers a supplied summary and truncates long source text on a word boundary', () => {
    expect(createArticleDeck('Resumen editorial.', 'Texto largo del artículo.')).toBe(
      'Resumen editorial.'
    );

    const deck = createArticleDeck('', 'uno dos tres cuatro cinco seis siete ocho nueve diez', 24);
    expect(deck).toBe('uno dos tres cuatro…');
  });

  it('formats valid editorial dates and rejects absent or invalid values', () => {
    expect(formatEditorialDate(null)).toBeNull();
    expect(formatEditorialDate('no-es-fecha')).toBeNull();
    expect(formatEditorialDate('2026-08-12T16:34:16.832-07:00')).toContain('2026');
  });

  it('builds a source-backed citation with or without publication metadata', () => {
    expect(
      buildArticleReference({
        title: 'Que es Pueblo?',
        publishedLabel: '12 de agosto de 2026',
        url: 'https://example.com/pueblo'
      })
    ).toBe(
      'La hoja de ruta. “Que es Pueblo?”. Publicado el 12 de agosto de 2026. https://example.com/pueblo'
    );

    expect(
      buildArticleReference({
        title: 'Sin fecha',
        publishedLabel: null,
        url: 'https://example.com/sin-fecha'
      })
    ).toBe('La hoja de ruta. “Sin fecha”. https://example.com/sin-fecha');
  });
});
