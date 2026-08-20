import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { supportedSocialIcons, socialIconUrl } from '../tools/about/SocialIconRegistry.js';

const EXPECTED = ['x','github','youtube','telegram','linkedin','instagram','facebook','bluesky','mastodon','other'];

test('About social icon registry covers every supported platform', () => {
  assert.deepEqual(supportedSocialIcons(), EXPECTED);
});

test('every registered social icon resolves to a local SVG asset', async () => {
  for (const platform of EXPECTED) {
    const url = socialIconUrl(platform);
    assert.equal(url.startsWith('file:'), true);
    const source = await readFile(new URL(url), 'utf8');
    assert.match(source, /<svg[\s>]/);
  }
});

test('unknown social platform falls back to local generic icon', () => {
  assert.equal(socialIconUrl('unknown').endsWith('/icons/other.svg'), true);
});
