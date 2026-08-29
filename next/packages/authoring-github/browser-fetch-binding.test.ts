import { expect, it } from 'vitest';
import { connectGitHubAuthoring, type GitHubAuthoringConfig } from './src/index';

const config: GitHubAuthoringConfig = {
  owner: 'devMod3',
  repository: 'cuba-la-hoja-de-ruta',
  documents: {
    'metadata-registry': 'config/authoring/metadata-registry.json',
    'site-profile': 'config/authoring/site-profile.json'
  },
  apiBaseUrl: 'https://api.github.test'
};

it('invokes the injected fetch implementation without rebinding its receiver', async () => {
  let requestCount = 0;
  const fetchImpl = function (
    this: unknown,
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    void input;
    void init;
    if (this !== undefined) {
      return Promise.reject(new TypeError('Illegal invocation'));
    }
    requestCount += 1;
    if (requestCount === 1) {
      return Promise.resolve(
        new Response(JSON.stringify({ id: 42, login: 'maintainer', name: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify({ permissions: { push: true } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } as typeof fetch;

  const connection = await connectGitHubAuthoring({
    token: 'github_pat_binding_regression',
    config,
    fetchImpl
  });

  expect(connection.session.status).toBe('authorized');
  expect(requestCount).toBe(2);
});
