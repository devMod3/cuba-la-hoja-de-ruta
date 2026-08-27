const WORDS_PER_MINUTE = 220;
const DEFAULT_DECK_LENGTH = 260;

const editorialDate = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});

export function estimateReadingMinutes(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 1;

  return Math.max(1, Math.ceil(normalized.split(/\s+/u).length / WORDS_PER_MINUTE));
}

export function createArticleDeck(
  summary: string,
  articleText: string,
  maxLength = DEFAULT_DECK_LENGTH
): string {
  const source = (summary.trim() || articleText.trim()).replace(/\s+/gu, ' ');
  if (source.length <= maxLength) return source;

  const candidate = source.slice(0, maxLength + 1);
  const lastWordBoundary = candidate.lastIndexOf(' ');
  const cutAt = lastWordBoundary >= Math.floor(maxLength * 0.65) ? lastWordBoundary : maxLength;

  return `${source.slice(0, cutAt).trimEnd()}…`;
}

export function formatEditorialDate(value: string | null): string | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return editorialDate.format(parsed);
}

export function buildArticleReference(input: {
  readonly title: string;
  readonly publishedLabel: string | null;
  readonly url: string;
}): string {
  const publication = input.publishedLabel ? ` Publicado el ${input.publishedLabel}.` : '';
  return `La hoja de ruta. “${input.title}”.${publication} ${input.url}`;
}
