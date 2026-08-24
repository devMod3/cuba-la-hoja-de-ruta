const BLOCK_TAGS = /<\/?(?:p|div|h[1-6]|li|blockquote|pre|br|hr)\b[^>]*>/gi;
const ALL_TAGS = /<[^>]*>/g;
const ENTITY_PATTERN = /&(#x?[0-9a-f]+|nbsp|amp|lt|gt|quot|apos|#39);/gi;

function decodeEntity(entity: string): string {
  const normalized = entity.toLowerCase();
  if (normalized === 'nbsp') return ' ';
  if (normalized === 'amp') return '&';
  if (normalized === 'lt') return '<';
  if (normalized === 'gt') return '>';
  if (normalized === 'quot') return '"';
  if (normalized === 'apos' || normalized === '#39') return "'";

  if (normalized.startsWith('#x')) {
    const codePoint = Number.parseInt(normalized.slice(2), 16);
    return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : '�';
  }

  if (normalized.startsWith('#')) {
    const codePoint = Number.parseInt(normalized.slice(1), 10);
    return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : '�';
  }

  return `&${entity};`;
}

export function bloggerHtmlToPlainText(html: string): string {
  return html
    .replace(BLOCK_TAGS, '\n')
    .replace(ALL_TAGS, ' ')
    .replace(ENTITY_PATTERN, (_match, entity: string) => decodeEntity(entity))
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}
