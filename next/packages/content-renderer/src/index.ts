import sanitizeHtml from 'sanitize-html';
import type { IOptions } from 'sanitize-html';

const ARTICLE_POLICY: IOptions = {
  allowedTags: [
    'p',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'strong',
    'b',
    'em',
    'i',
    'blockquote',
    'ul',
    'ol',
    'li',
    'a',
    'br',
    'hr',
    'code',
    'pre',
    'div'
  ],
  allowedAttributes: {
    a: ['href', 'title']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  transformTags: {
    h1: 'h2'
  }
};

const TEXT_EXTRACTION_POLICY: IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard'
};

const ARTICLE_HEADING_PATTERN = /<h([234])>([\s\S]*?)<\/h\1>/gu;

export type ArticleHeading = Readonly<{
  id: string;
  text: string;
  level: 2 | 3 | 4;
}>;

export type PreparedArticle = Readonly<{
  html: string;
  text: string;
  headings: readonly ArticleHeading[];
}>;

function decodeSanitizedText(value: string): string {
  return value.replaceAll('&amp;', '&').replaceAll('&gt;', '>').replaceAll('&lt;', '<');
}

function extractTextFromSanitizedHtml(sanitizedHtml: string): string {
  const textChunks: string[] = [];

  sanitizeHtml(sanitizedHtml, {
    ...TEXT_EXTRACTION_POLICY,
    textFilter(text) {
      textChunks.push(text);
      return '';
    }
  });

  return decodeSanitizedText(textChunks.join(' ')).replace(/\s+/gu, ' ').trim();
}

function slugifyHeading(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
}

export function sanitizeArticleHtml(html: string): string {
  return sanitizeHtml(html, ARTICLE_POLICY);
}

export function extractArticleText(html: string): string {
  return extractTextFromSanitizedHtml(sanitizeArticleHtml(html));
}

export function prepareArticleHtml(html: string): PreparedArticle {
  const sanitizedHtml = sanitizeArticleHtml(html);
  const headings: ArticleHeading[] = [];
  const seenSlugs = new Map<string, number>();
  let anchoredHtml = sanitizedHtml;

  for (const match of sanitizedHtml.matchAll(ARTICLE_HEADING_PATTERN)) {
    const level = Number(match[1]) as 2 | 3 | 4;
    const innerHtml = match[2] as string;
    const text = extractTextFromSanitizedHtml(innerHtml);
    const baseSlug = slugifyHeading(text) || `section-${String(headings.length + 1)}`;
    const previousCount = seenSlugs.get(baseSlug) ?? 0;
    const nextCount = previousCount + 1;
    const id = previousCount === 0 ? baseSlug : `${baseSlug}-${String(nextCount)}`;
    const headingText = text || `Sección ${String(headings.length + 1)}`;

    seenSlugs.set(baseSlug, nextCount);
    headings.push({ id, text: headingText, level });
    anchoredHtml = anchoredHtml.replace(
      match[0],
      `<h${String(level)} id="${id}">${innerHtml}</h${String(level)}>`
    );
  }

  return {
    html: anchoredHtml,
    text: extractTextFromSanitizedHtml(sanitizedHtml),
    headings
  };
}
