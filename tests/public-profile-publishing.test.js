import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  GitHubPublicProfilePublisher,
  PUBLIC_PROFILE_URL,
  installPublicProfilePublishing,
  isProductionBloggerLocation
} from '../tools/admin/PublicProfilePublishing.js';

const savedProfile = {
  schemaVersion: '1.0.0',
  updatedAt: '2026-08-22T21:21:00.000Z',
  profile: {
    displayName: 'Perfil desde Admin',
    introduction: 'Publicado desde Blogger Real',
    location: { city: '', region: '', country: '' }
  },
  social: [],
  relatedResources: []
};

test('public publishing is production-host specific', () => {
  assert.equal(isProductionBloggerLocation({ hostname: 'cubalahojaderuta.blogspot.com' }), true);
  assert.equal(isProductionBloggerLocation({ hostname: 'localhost' }), false);
  assert.equal(isProductionBloggerLocation({ hostname: 'evil.example' }), false);
});

test('publisher authenticates owner, updates only public profile and verifies direct main propagation', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options });
    const index = requests.length;
    if (index === 1) return { ok: true, status: 200, json: async () => ({ login: 'devMod3' }) };
    if (index === 2) return { ok: true, status: 200, json: async () => ({ sha: 'old-profile-blob' }) };
    if (index === 3) return { ok: true, status: 200, json: async () => ({ commit: { sha: 'public-profile-commit' } }) };
    if (index === 4) return { ok: true, status: 200, json: async () => savedProfile };
    throw new Error(`unexpected request ${index}`);
  };

  const publisher = new GitHubPublicProfilePublisher({
    fetchImpl,
    tokenProvider: async () => 'ephemeral-secret',
    delay: async () => {},
    pollAttempts: 1
  });

  const result = await publisher.publish(savedProfile);
  assert.equal(result.commitSha, 'public-profile-commit');
  assert.equal(result.publicUrl, PUBLIC_PROFILE_URL);
  assert.match(requests[0].url, /api\.github\.com\/user$/);
  assert.match(requests[1].url, /config\/site-profile\.public\.json\?ref=main$/);
  assert.equal(requests[2].options.method, 'PUT');
  assert.match(requests[3].url, /^https:\/\/raw\.githubusercontent\.com\/devMod3\/cuba-la-hoja-de-ruta\/main\/config\/site-profile\.public\.json\?/);
  assert.equal(requests[3].options.credentials, 'omit');

  const putBody = JSON.parse(requests[2].options.body);
  const decoded = Buffer.from(putBody.content, 'base64').toString('utf8');
  const published = JSON.parse(decoded);
  assert.equal(published.profile.displayName, 'Perfil desde Admin');
  assert.equal(published.updatedAt, savedProfile.updatedAt);
  assert.equal(putBody.sha, 'old-profile-blob');
  assert.equal(putBody.branch, 'main');
  assert.equal(requests[2].options.headers.Authorization, 'Bearer ephemeral-secret');
  assert.doesNotMatch(requests[2].options.body, /ephemeral-secret/);
});

test('default publisher preserves the native global fetch receiver', async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async function receiverSensitiveFetch(url, options = {}) {
    assert.equal(this, globalThis, 'native fetch must be invoked through the global object');
    requests.push({ url: String(url), options });
    const index = requests.length;
    if (index === 1) return { ok: true, status: 200, json: async () => ({ login: 'devMod3' }) };
    if (index === 2) return { ok: true, status: 200, json: async () => ({ sha: 'old-profile-blob' }) };
    if (index === 3) return { ok: true, status: 200, json: async () => ({ commit: { sha: 'public-profile-commit' } }) };
    if (index === 4) return { ok: true, status: 200, json: async () => savedProfile };
    throw new Error(`unexpected request ${index}`);
  };

  try {
    const publisher = new GitHubPublicProfilePublisher({
      tokenProvider: async () => 'ephemeral-secret',
      delay: async () => {},
      pollAttempts: 1
    });
    const result = await publisher.publish(savedProfile);
    assert.equal(result.commitSha, 'public-profile-commit');
    assert.equal(requests.length, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('publisher rejects a GitHub identity that is not the repository owner', async () => {
  const publisher = new GitHubPublicProfilePublisher({
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ login: 'otra-cuenta' }) }),
    tokenProvider: async () => 'ephemeral-secret',
    pollAttempts: 1
  });
  await assert.rejects(() => publisher.publish(savedProfile), /Cuenta GitHub no autorizada/);
});

test('Admin save keeps local-only semantics outside Blogger Real', async () => {
  const statuses = [];
  let publisherCalls = 0;
  const saveButton = { disabled: false };
  const footer = { textContent: '' };
  const manager = {
    root: { querySelector: (selector) => selector.includes('save') ? saveButton : footer },
    data: null,
    buildShell() {},
    collect: () => savedProfile,
    store: { save: (value) => value },
    status: (message, kind) => statuses.push({ message, kind })
  };
  installPublicProfilePublishing(manager, {
    isProduction: () => false,
    publisher: { publish: async () => { publisherCalls += 1; } }
  });
  manager.buildShell();
  const result = await manager.save();
  assert.equal(result.profile.displayName, 'Perfil desde Admin');
  assert.equal(publisherCalls, 0);
  assert.match(statuses.at(-1).message, /LOCAL \/ PRUEBAS/);
});

test('production integration reads mutable profile directly from main without persisting credentials', async () => {
  const source = await readFile(new URL('../tools/admin/PublicProfilePublishing.js', import.meta.url), 'utf8');
  const adminBootstrap = await readFile(new URL('../tools/admin/bootstrap.js', import.meta.url), 'utf8');
  const aboutBootstrap = await readFile(new URL('../tools/about/bootstrap.js', import.meta.url), 'utf8');

  assert.match(adminBootstrap, /installPublicProfilePublishing/);
  assert.match(aboutBootstrap, /https:\/\/raw\.githubusercontent\.com\/devMod3\/cuba-la-hoja-de-ruta\/main\/config\/site-profile\.public\.json/);
  assert.doesNotMatch(aboutBootstrap, /devmod3\.github\.io\/cuba-la-hoja-de-ruta\/config\/site-profile\.public\.json/);
  assert.match(aboutBootstrap, /resolvePublicProfileUrl/);
  assert.doesNotMatch(source, /localStorage\.setItem\([^\n]*token|sessionStorage\.setItem\([^\n]*token/i);
  assert.match(source, /Contents: write/);
  assert.match(source, /Guardado localmente, pero NO publicado/);
});
