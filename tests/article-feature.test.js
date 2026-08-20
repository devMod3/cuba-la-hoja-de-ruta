import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  estimateReadingMinutes,
  isBloggerPostPath,
  slugifyHeading
} from '../src/features/article/ArticleFeature.js';

const source = readFileSync(new URL('../src/features/article/ArticleFeature.js', import.meta.url), 'utf8');

test('recognizes Blogger post URLs without matching static pages', () => {
  assert.equal(isBloggerPostPath('/2026/08/que-es-pueblo.html'), true);
  assert.equal(isBloggerPostPath('/p/acerca-de.html'), false);
  assert.equal(isBloggerPostPath('/search'), false);
});

test('creates stable accent-insensitive TOC slugs', () => {
  assert.equal(slugifyHeading('Soberanía y Constitución'), 'soberania-y-constitucion');
  assert.equal(slugifyHeading('  Artículo 40  '), 'articulo-40');
});

test('reading time never collapses below one minute', () => {
  assert.equal(estimateReadingMinutes('texto breve'), 1);
  assert.equal(estimateReadingMinutes('palabra '.repeat(441)), 3);
});

test('reader keeps article navigation inside the current document', () => {
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /history\.pushState/);
  assert.match(source, /post\.content\s*\|\|\s*post\.summary/);
  assert.match(source, /zen-reading-progress/);
  assert.match(source, /zen-article-toc/);
});
