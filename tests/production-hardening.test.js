import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const theme = readFileSync(new URL('../blogger/theme.xml', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../tools/runtime/bootstrap.js', import.meta.url), 'utf8');
const gestures = readFileSync(new URL('../src/features/navigation/MobileGestureNavigation.js', import.meta.url), 'utf8');
const responsive = readFileSync(new URL('../src/ui/styles/responsive.css', import.meta.url), 'utf8');
const photoUpload = readFileSync(new URL('../tools/admin/ProfilePhotoUpload.js', import.meta.url), 'utf8');
const socialPng = readFileSync(new URL('../assets/social/zenblog-social-card.png', import.meta.url));

test('production theme emits server-rendered SEO and X/Open Graph metadata', () => {
  assert.match(theme, /property='og:title'/);
  assert.match(theme, /property='og:url'/);
  assert.match(theme, /property='og:image'/);
  assert.match(theme, /name='twitter:card'/);
  assert.match(theme, /summary_large_image/);
  assert.match(theme, /application\/ld\+json/);
  assert.match(theme, /"@type":"WebSite"/);
  assert.match(theme, /max-image-preview:large/);
});

test('social preview is a real local PNG asset', () => {
  assert.deepEqual([...socialPng.subarray(0, 8)], [137,80,78,71,13,10,26,10]);
  assert.ok(socialPng.length < 150_000, `social card is unexpectedly heavy: ${socialPng.length} bytes`);
});

test('active Blogger theme eliminates the CSS import waterfall', () => {
  assert.doesNotMatch(theme, /dist\/zenblog\.css/);
  for (const path of [
    'src/ui/styles/tokens.css',
    'src/ui/styles/shell.css',
    'src/features/home/home.css',
    'src/features/explore/explore.css',
    'src/features/article/article.css',
    'src/ui/styles/responsive.css'
  ]) assert.match(theme, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('public critical path keeps auxiliary tools lazy', () => {
  const scriptSrcCount = [...theme.matchAll(/<script\s+src=/g)].length;
  assert.equal(scriptSrcCount, 3, 'public theme should load product entry, runtime loader and player only');
  assert.match(theme, /tools\/runtime\/bootstrap\.js/);
  assert.doesNotMatch(theme, /tools\/about\/bootstrap\.js/);
  assert.doesNotMatch(theme, /tools\/inspector\/bootstrap\.js/);
  assert.doesNotMatch(theme, /tools\/admin\/bootstrap\.js/);
  assert.match(runtime, /event\.detail\?\.route === 'zen-about'/);
  assert.match(runtime, /localStorage\.getItem\(INSPECTOR_KEY\)/);
});

test('mobile swipe navigation is guarded and never steals reading or controls', () => {
  assert.match(gestures, /pointer: coarse/);
  assert.match(gestures, /edgeGuard = 24/);
  assert.match(gestures, /#zen-radio-player/);
  assert.match(gestures, /#zen-article/);
  assert.match(gestures, /\.zen-results-scroll/);
  assert.match(gestures, /Math\.abs\(dx\) > Math\.abs\(dy\) \* 1\.35/);
});

test('responsive foundation includes safe areas, touch targets and overflow guards', () => {
  assert.match(responsive, /safe-area-inset-left/);
  assert.match(responsive, /pointer:coarse/);
  assert.match(responsive, /min-height:44px/);
  assert.match(responsive, /overflow-x:hidden/);
  assert.match(responsive, /post-body table/);
});

test('profile photo workflow exports a public Blogger favicon artifact', () => {
  assert.match(photoUpload, /Descargar favicon/);
  assert.match(photoUpload, /la-hoja-de-ruta-favicon\.png/);
  assert.match(photoUpload, /Blogger → Configuración → Favicon/);
});

test('protected Blogger and player invariants remain intact', () => {
  assert.equal((theme.match(/id='Blog1'/g) || []).length, 1);
  assert.equal((theme.match(/id='page_body'/g) || []).length, 1);
  assert.doesNotMatch(theme, /zen_main/);
  assert.match(theme, /zen-radio-player\.js\?v=1\.0\.4/);
});
