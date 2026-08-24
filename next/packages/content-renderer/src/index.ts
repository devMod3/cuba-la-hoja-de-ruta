import sanitizeHtml from 'sanitize-html';
import type { IOptions } from 'sanitize-html';

const BLOGGER_ARTICLE_POLICY: IOptions = {
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

export function sanitizeBloggerArticleHtml(html: string): string {
  return sanitizeHtml(html, BLOGGER_ARTICLE_POLICY);
}
