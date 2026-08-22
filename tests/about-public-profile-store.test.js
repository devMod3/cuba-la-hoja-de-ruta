import test from 'node:test';
import assert from 'node:assert/strict';

import { PublishedSiteProfileStore, usesPublishedProfile } from '../tools/about/PublishedSiteProfileStore.js';

const profile = {
  schemaVersion: '1.0.0',
  profile: {
    displayName: 'Perfil publicado',
    introduction: 'Contenido público',
    location: { city: '', region: '', country: '' }
  },
  social: [],
  relatedResources: []
};

test('published profile mode is selected only when page and module origins differ', () => {
  assert.equal(usesPublishedProfile({
    pageUrl: 'http://127.0.0.1:8000/#zen-about',
    moduleUrl: 'http://127.0.0.1:8000/tools/about/PublishedSiteProfileStore.js'
  }), false);
  assert.equal(usesPublishedProfile({
    pageUrl: 'https://cubalahojaderuta.blogspot.com/#zen-about',
    moduleUrl: 'https://devmod3.github.io/cuba-la-hoja-de-ruta/tools/about/PublishedSiteProfileStore.js'
  }), true);
});

test('published profile store fetches an immutable validated snapshot without credentials', async () => {
  const requests = [];
  const store = await PublishedSiteProfileStore.fromUrl('https://example.test/site-profile.public.json', {
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return { ok: true, status: 200, json: async () => profile };
    }
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.cache, 'no-store');
  assert.equal(requests[0].options.credentials, 'omit');
  assert.equal(store.load().profile.displayName, 'Perfil publicado');
  assert.equal(store.load().profile.introduction, 'Contenido público');
  assert.equal(typeof store.subscribe(() => {}), 'function');
});

test('published profile store rejects an invalid public snapshot', async () => {
  await assert.rejects(
    PublishedSiteProfileStore.fromUrl('https://example.test/site-profile.public.json', {
      fetchImpl: async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          ...profile,
          social: [{ id: 'x', platform: 'x', label: 'X', username: '@x', url: 'javascript:alert(1)', visible: true, order: 0 }]
        })
      })
    }),
    /URL inválida/
  );
});
