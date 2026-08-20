import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readFileSync } from 'node:fs';
import { supportedSocialIcons, socialIconUrl } from '../tools/about/SocialIconRegistry.js';

const EXPECTED = ['x','github','youtube','telegram','linkedin','instagram','facebook','bluesky','mastodon','other'];
const feature = readFileSync(new URL('../tools/about/AboutFeature.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../tools/about/about.css', import.meta.url), 'utf8');

test('About social icon registry covers every supported platform', () => {
  assert.deepEqual(supportedSocialIcons(), EXPECTED);
});

test('every registered social icon resolves to a local SVG asset', async () => {
  for (const platform of EXPECTED) {
    const url = socialIconUrl(platform);
    assert.equal(url.startsWith('file:'), true);
    const source = await new Promise((resolve, reject) => {
      readFile(new URL(url), 'utf8', (error, data) => error ? reject(error) : resolve(data));
    });
    assert.match(source, /<svg[\s>]/);
  }
});

test('unknown social platform falls back to local generic icon', () => {
  assert.equal(socialIconUrl('unknown').endsWith('/icons/other.svg'), true);
});

test('public About uses the profile image as a managed favicon', () => {
  assert.match(feature, /data-zen-about-favicon/);
  assert.match(feature, /favicon\.rel = 'icon'/);
  assert.match(feature, /syncProfileFavicon\(profile\.photoUrl\)/);
});

test('public About removes profile details and decorative arrows', () => {
  assert.doesNotMatch(feature, /zen-about-profile-details/);
  assert.doesNotMatch(feature, /zen-about-social-arrow/);
  assert.doesNotMatch(feature, /zen-about-resource-arrow/);
  assert.match(feature, /zen-about-divider/);
});

test('public About enlarges portrait while reducing the identity heading', () => {
  assert.match(css, /zen-about-photo-frame\{width:132px;height:132px/);
  assert.match(css, /clamp\(1\.75rem,3vw,2\.65rem\)/);
});
