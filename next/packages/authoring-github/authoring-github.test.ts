import { AuthoringError, type SharedDocumentKey } from '@zenblog/authoring-core';
import { describe, expect, it } from 'vitest';
import { connectGitHubAuthoring, type GitHubAuthoringConfig } from './src/index';

const TOKEN = 'ghp_SENTINEL_NEVER_LEAK_123456789';

const config: GitHubAuthoringConfig = {
  owner: 'devMod3',
  repository: 'cuba-la-hoja-de-ruta',
  documents: {
    'metadata-registry': 'authoring/metadata-registry.json',
    'site-profile': 'authoring/site-profile.json'
  },
  apiBaseUrl: 'https://api.github.test'
};

interface RecordedRequest {
  readonly url: string;
  readonly init: RequestInit | undefined;
}

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

function queuedFetch(...queued: Array<Response | Error>): {
  readonly fetchImpl: typeof fetch;
  readonly requests: RecordedRequest[];
} {
  const requests: RecordedRequest[] = [];
  const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({ url: String(input), init });
    const next = queued.shift();
    if (!next) return Promise.reject(new Error('Unexpected fetch'));
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  }) as typeof fetch;
  return { fetchImpl, requests };
}

function authResponses(push = true): [Response, Response] {
  return [
    jsonResponse({ id: 42, login: 'maintainer', name: 'Maintainer' }),
    jsonResponse({ permissions: { push } })
  ];
}

function validateRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('record required');
  }
  return value as Record<string, unknown>;
}

function encodedJson(value: unknown): string {
  return btoa(JSON.stringify(value));
}

function requestHeaders(request: RecordedRequest): Headers {
  return new Headers(request.init?.headers);
}

describe('connectGitHubAuthoring', () => {
  it('authenticates identity, checks write capability and keeps credentials non-serializable', async () => {
    const mock = queuedFetch(...authResponses());
    const connection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: mock.fetchImpl
    });

    expect(connection.session).toMatchObject({
      status: 'authorized',
      identity: { id: '42', login: 'maintainer', displayName: 'Maintainer' }
    });
    expect(connection.session.capabilities.has('shared:read')).toBe(true);
    expect(connection.session.capabilities.has('shared:write')).toBe(true);
    expect(JSON.stringify(connection)).not.toContain(TOKEN);
    expect(mock.requests.map((request) => request.url)).toEqual([
      'https://api.github.test/user',
      'https://api.github.test/repos/devMod3/cuba-la-hoja-de-ruta'
    ]);
    expect(requestHeaders(mock.requests[0]!).get('Authorization')).toBe(`Bearer ${TOKEN}`);
    expect(requestHeaders(mock.requests[0]!).get('X-GitHub-Api-Version')).toBe('2022-11-28');
  });

  it('fails before network access for missing credentials or unsafe allowlist configuration', async () => {
    const missingToken = queuedFetch();
    await expect(
      connectGitHubAuthoring({ token: '   ', config, fetchImpl: missingToken.fetchImpl })
    ).rejects.toMatchObject({ code: 'unauthorized' });
    expect(missingToken.requests).toHaveLength(0);

    for (const unsafePath of ['../workflow.yml', '/root.json', 'authoring\\profile.json', 'a//b']) {
      const invalidPath = queuedFetch();
      await expect(
        connectGitHubAuthoring({
          token: TOKEN,
          config: {
            ...config,
            documents: { ...config.documents, 'site-profile': unsafePath }
          },
          fetchImpl: invalidPath.fetchImpl
        })
      ).rejects.toMatchObject({ code: 'validation' });
      expect(invalidPath.requests).toHaveLength(0);
    }
  });

  it('separates authentication from repository write authorization', async () => {
    const mock = queuedFetch(...authResponses(false));
    await expect(
      connectGitHubAuthoring({ token: TOKEN, config, fetchImpl: mock.fetchImpl })
    ).rejects.toMatchObject({ code: 'forbidden' });
    expect(mock.requests).toHaveLength(2);
  });

  it('maps authentication and transport errors without credential leakage', async () => {
    const unauthorized = queuedFetch(jsonResponse({}, 401));
    const authError = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: unauthorized.fetchImpl
    }).catch((error: unknown) => error);
    expect(authError).toMatchObject({ code: 'unauthorized', status: 401 });
    expect(String(authError)).not.toContain(TOKEN);
    expect(JSON.stringify(authError)).not.toContain(TOKEN);

    const network = queuedFetch(new Error(`network ${TOKEN}`));
    const transportError = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: network.fetchImpl
    }).catch((error: unknown) => error);
    expect(transportError).toMatchObject({ code: 'transport' });
    expect(String(transportError)).not.toContain(TOKEN);
  });
});

describe('GitHub versioned JSON repository', () => {
  it('reads allowlisted base64 JSON and exposes the remote SHA as version', async () => {
    const mock = queuedFetch(
      ...authResponses(),
      jsonResponse({
        type: 'file',
        encoding: 'base64',
        sha: 'sha-read-1',
        content: encodedJson({ schemaVersion: '1.0.0', entries: [] })
      })
    );
    const connection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: mock.fetchImpl
    });
    const document = await connection.repository.read('metadata-registry', validateRecord);

    expect(document).toEqual({
      key: 'metadata-registry',
      value: { schemaVersion: '1.0.0', entries: [] },
      version: 'sha-read-1'
    });
    expect(mock.requests[2]?.url).toBe(
      'https://api.github.test/repos/devMod3/cuba-la-hoja-de-ruta/contents/authoring/metadata-registry.json'
    );
  });

  it('writes deterministic JSON with expected SHA and never retries a conflict', async () => {
    const mock = queuedFetch(...authResponses(), jsonResponse({ content: { sha: 'sha-write-2' } }));
    const connection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: mock.fetchImpl
    });
    const written = await connection.repository.write(
      {
        key: 'site-profile',
        value: { z: 1, a: 'profile' },
        expectedVersion: 'sha-write-1',
        message: 'Update site profile'
      },
      validateRecord
    );

    expect(written.version).toBe('sha-write-2');
    expect(mock.requests).toHaveLength(3);
    const request = mock.requests[2]!;
    expect(request.init?.method).toBe('PUT');
    const body = JSON.parse(String(request.init?.body)) as Record<string, string>;
    expect(body['message']).toBe('Update site profile');
    expect(body['sha']).toBe('sha-write-1');
    expect(atob(body['content'] ?? '')).toBe('{\n  "a": "profile",\n  "z": 1\n}\n');

    const conflict = queuedFetch(...authResponses(), jsonResponse({ message: 'stale' }, 409));
    const conflictedConnection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: conflict.fetchImpl
    });
    await expect(
      conflictedConnection.repository.write(
        {
          key: 'site-profile',
          value: { a: 'new' },
          expectedVersion: 'stale-sha',
          message: 'Stale update'
        },
        validateRecord
      )
    ).rejects.toMatchObject({ code: 'conflict', status: 409 });
    expect(conflict.requests).toHaveLength(3);
  });

  it('creates without a SHA and rejects unknown runtime keys before content fetch', async () => {
    const mock = queuedFetch(...authResponses(), jsonResponse({ content: { sha: 'sha-create' } }));
    const connection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: mock.fetchImpl
    });
    await connection.repository.write(
      {
        key: 'metadata-registry',
        value: { entries: [] },
        expectedVersion: null,
        message: 'Create metadata registry'
      },
      validateRecord
    );
    const body = JSON.parse(String(mock.requests[2]?.init?.body)) as Record<string, unknown>;
    expect(body).not.toHaveProperty('sha');

    await expect(
      connection.repository.read('../../workflows' as SharedDocumentKey, validateRecord)
    ).rejects.toMatchObject({ code: 'validation' });
    expect(mock.requests).toHaveLength(3);
  });

  it('maps missing, malformed and schema-invalid remote documents to safe failures', async () => {
    const missing = queuedFetch(...authResponses(), jsonResponse({}, 404));
    const missingConnection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: missing.fetchImpl
    });
    await expect(
      missingConnection.repository.read('site-profile', validateRecord)
    ).rejects.toMatchObject({ code: 'not-found', status: 404 });

    const malformed = queuedFetch(
      ...authResponses(),
      jsonResponse({ type: 'file', encoding: 'base64', sha: 'bad', content: btoa('{bad json') })
    );
    const malformedConnection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: malformed.fetchImpl
    });
    await expect(
      malformedConnection.repository.read('site-profile', validateRecord)
    ).rejects.toMatchObject({ code: 'validation' });

    const schemaInvalid = queuedFetch(
      ...authResponses(),
      jsonResponse({
        type: 'file',
        encoding: 'base64',
        sha: 'bad-schema',
        content: encodedJson([])
      })
    );
    const schemaConnection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: schemaInvalid.fetchImpl
    });
    await expect(
      schemaConnection.repository.read('site-profile', validateRecord)
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('enforces the document-size limit before write and invalidates the repository on disconnect', async () => {
    const sizeMock = queuedFetch(...authResponses());
    const sizeConnection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: sizeMock.fetchImpl
    });
    await expect(
      sizeConnection.repository.write(
        {
          key: 'site-profile',
          value: { photo: 'x'.repeat(2_000_001) },
          expectedVersion: null,
          message: 'Oversized profile'
        },
        validateRecord
      )
    ).rejects.toMatchObject({ code: 'validation' });
    expect(sizeMock.requests).toHaveLength(2);

    sizeConnection.disconnect();
    await expect(
      sizeConnection.repository.read('site-profile', validateRecord)
    ).rejects.toMatchObject({ code: 'unauthorized' });
    expect(sizeMock.requests).toHaveLength(2);
  });

  it('does not surface validator internals that could contain secret-bearing data', async () => {
    const mock = queuedFetch(
      ...authResponses(),
      jsonResponse({
        type: 'file',
        encoding: 'base64',
        sha: 'schema-secret',
        content: encodedJson({ value: 'remote' })
      })
    );
    const connection = await connectGitHubAuthoring({
      token: TOKEN,
      config,
      fetchImpl: mock.fetchImpl
    });
    const error = await connection.repository
      .read('site-profile', () => {
        throw new Error(`schema failed near ${TOKEN}`);
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AuthoringError);
    expect(error).toMatchObject({ code: 'validation' });
    expect(String(error)).not.toContain(TOKEN);
  });
});
