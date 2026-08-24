import { describe, expect, it } from 'vitest';
import { sanitizeBloggerArticleHtml } from './src/index';

describe('sanitizeBloggerArticleHtml', () => {
  it('preserves editorial structure while removing Blogger presentation attributes', () => {
    const output = sanitizeBloggerArticleHtml(
      '<h1 style="font-family: serif">Título interior</h1><p onclick="alert(1)"><span style="color:red">Texto <b>fuerte</b> y <i>énfasis</i>.</span></p>'
    );

    expect(output).toContain('<h2>Título interior</h2>');
    expect(output).toContain('<p>Texto <b>fuerte</b> y <i>énfasis</i>.</p>');
    expect(output).not.toMatch(/style=|onclick=/i);
  });

  it('removes executable markup and unsafe URL schemes', () => {
    const payloads = [
      '<script>alert(1)</script><p>Seguro</p>',
      '<img src=x onerror=alert(1)><p>Seguro</p>',
      '<a href="javascript:alert(1)" onclick="alert(2)">enlace</a>',
      '<iframe src="https://evil.example"></iframe><form action="javascript:alert(1)">form</form>',
      '<p style="background:url(javascript:alert(1))" onmouseover="alert(2)">Seguro</p>'
    ];

    for (const payload of payloads) {
      const output = sanitizeBloggerArticleHtml(payload);
      expect(output).not.toMatch(/<script|<iframe|<form|<img|javascript:|onerror=|onclick=|onmouseover=|style=/i);
    }
  });

  it('blocks recent foreign-content and raw-text XSS payload families', () => {
    const payloads = [
      '<svg><textarea><img src=x onerror=alert(1)></textarea></svg><p>Seguro</p>',
      '<math><xmp><img src=x onerror=alert(1)></xmp></math><p>Seguro</p>',
      '<svg><style><img src=x onerror=alert(1)></style></svg><p>Seguro</p>'
    ];

    for (const payload of payloads) {
      const output = sanitizeBloggerArticleHtml(payload);
      expect(output).toContain('<p>Seguro</p>');
      expect(output).not.toMatch(/<svg|<math|<textarea|<xmp|<img|onerror=/i);
    }
  });

  it('keeps only explicitly allowed link schemes and attributes', () => {
    const output = sanitizeBloggerArticleHtml(
      '<p><a href="https://example.com" title="Referencia" target="_blank" rel="opener">https</a> <a href="mailto:test@example.com">correo</a> <a href="//evil.example">relativo</a></p>'
    );

    expect(output).toContain('<a href="https://example.com" title="Referencia">https</a>');
    expect(output).toContain('<a href="mailto:test@example.com">correo</a>');
    expect(output).not.toContain('target=');
    expect(output).not.toContain('rel=');
    expect(output).not.toContain('href="//evil.example"');
  });
});
