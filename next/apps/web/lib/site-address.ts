const DEFAULT_SITE_ORIGIN = 'https://devmod3.github.io';
const DEFAULT_SITE_BASE_PATH = '/cuba-la-hoja-de-ruta';

function cleanOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Site origin must use HTTP(S)');
  }
  return url.origin;
}

function cleanBasePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '';
  const normalized = `/${trimmed.replace(/^\/+|\/+$/gu, '')}`;
  if (normalized.includes('..')) throw new Error('Site base path may not contain parent traversal');
  return normalized;
}

export const siteOrigin = cleanOrigin(process.env['ZENBLOG_SITE_ORIGIN'] ?? DEFAULT_SITE_ORIGIN);
export const siteBasePath = cleanBasePath(
  process.env['ZENBLOG_CANONICAL_BASE_PATH'] ?? DEFAULT_SITE_BASE_PATH
);

export function articlePath(id: string): string {
  return `/articulo/${encodeURIComponent(id)}/`;
}

export function siteUrl(pathname = '/'): string {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${siteOrigin}${siteBasePath}${path}`;
}

export function articleUrl(id: string): string {
  return siteUrl(articlePath(id));
}
