import { describe, expect, it } from 'vitest';
import { bloggerHtmlToPlainText } from './blogger-html-to-text';

describe('bloggerHtmlToPlainText', () => {
  it('preserves readable block boundaries and decodes common entities', () => {
    const html = '<h1>Pueblo &amp; Estado</h1><p>Uno&nbsp;dos.</p><p>Tres &#x2014; cuatro.</p>';
    expect(bloggerHtmlToPlainText(html)).toBe('Pueblo & Estado\n\nUno dos.\n\nTres — cuatro.');
  });

  it('returns potentially hostile markup only as inert text', () => {
    const html = '<p>Seguro</p><script>alert(1)</script><img src=x onerror=alert(2)>';
    expect(bloggerHtmlToPlainText(html)).toBe('Seguro\n\nalert(1)');
  });
});
