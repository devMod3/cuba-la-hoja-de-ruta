import {
  AuthoringError,
  SHARED_DOCUMENT_KEYS,
  canonicalJson,
  createAuthorizedSession,
  type AuthoringIdentity,
  type AuthorizedAuthoringSession,
  type JsonValidator,
  type SharedDocumentKey,
  type VersionedJsonDocument,
  type VersionedJsonRepository,
  type WriteVersionedJsonInput
} from '@zenblog/authoring-core';

const DEFAULT_API_BASE_URL = 'https://api.github.com';
const API_VERSION = '2022-11-28';
const SAFE_REPOSITORY_PART = /^[A-Za-z0-9_.-]+$/;

export interface GitHubAuthoringConfig {
  readonly owner: string;
  readonly repository: string;
  readonly documents: Readonly<Record<SharedDocumentKey, string>>;
  readonly apiBaseUrl?: string;
}

export interface ConnectGitHubAuthoringOptions {
  readonly token: string;
  readonly config: GitHubAuthoringConfig;
  readonly fetchImpl?: typeof fetch;
}

export interface GitHubAuthoringConnection {
  readonly session: AuthorizedAuthoringSession;
  readonly repository: VersionedJsonRepository;
  disconnect(): void;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function requiredRepositoryPart(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || !SAFE_REPOSITORY_PART.test(normalized)) {
    throw new AuthoringError('validation', `Invalid GitHub ${label}`);
  }
  return normalized;
}

function requiredDocumentPath(path: string): string {
  const normalized = path.trim();
  if (!normalized || normalized.startsWith('/') || normalized.includes('\\')) {
    throw new AuthoringError('validation', 'Invalid shared-document repository path');
  }
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new AuthoringError('validation', 'Invalid shared-document repository path');
  }
  return segments.join('/');
}

function safeApiBaseUrl(value: string | undefined): string {
  const parsed = new URL(value ?? DEFAULT_API_BASE_URL);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new AuthoringError('validation', 'GitHub API base URL must be a clean HTTPS origin/path');
  }
  return parsed.href.replace(/\/+$/, '');
}

function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function encodeBase64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64Utf8(value: string): string {
  try {
    const binary = atob(value.replace(/\s+/g, ''));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new AuthoringError('validation', 'Shared GitHub document has invalid base64/UTF-8 content');
  }
}

function validateRemoteValue<T>(value: unknown, validate: JsonValidator<T>): T {
  try {
    return validate(value);
  } catch (error) {
    if (error instanceof AuthoringError) throw error;
    throw new AuthoringError('validation', 'Shared GitHub document failed schema validation');
  }
}

function responseFailure(status: number, context: string): AuthoringError {
  if (status === 401) return new AuthoringError('unauthorized', `${context}: authentication failed`, status);
  if (status === 403) return new AuthoringError('forbidden', `${context}: repository access denied`, status);
  return new AuthoringError('transport', `${context}: GitHub HTTP ${String(status)}`, status);
}

class GitHubContentsRepository implements VersionedJsonRepository {
  readonly #owner: string;
  readonly #repository: string;
  readonly #paths: Readonly<Record<SharedDocumentKey, string>>;
  readonly #apiBaseUrl: string;
  readonly #fetch: typeof fetch;
  #token: string | null;
  #authorized = false;

  constructor(options: ConnectGitHubAuthoringOptions) {
    this.#owner = requiredRepositoryPart(options.config.owner, 'owner');
    this.#repository = requiredRepositoryPart(options.config.repository, 'repository');
    this.#apiBaseUrl = safeApiBaseUrl(options.config.apiBaseUrl);
    this.#fetch = options.fetchImpl ?? globalThis.fetch;
    this.#token = options.token.trim() || null;
    if (!this.#token) throw new AuthoringError('unauthorized', 'GitHub authoring credential is required');

    const paths = {} as Record<SharedDocumentKey, string>;
    for (const key of SHARED_DOCUMENT_KEYS) paths[key] = requiredDocumentPath(options.config.documents[key]);
    this.#paths = Object.freeze(paths);
  }

  disconnect(): void {
    this.#authorized = false;
    this.#token = null;
  }

  async authorize(): Promise<AuthoringIdentity> {
    const identityResponse = await this.#request(`${this.#apiBaseUrl}/user`);
    if (!identityResponse.ok) throw responseFailure(identityResponse.status, 'GitHub identity');
    const identityPayload: unknown = await identityResponse.json();
    const identityRecord = asRecord(identityPayload);
    const login = identityRecord?.['login'];
    const id = identityRecord?.['id'];
    const name = identityRecord?.['name'];
    if (typeof login !== 'string' || !login || (typeof id !== 'string' && typeof id !== 'number')) {
      throw new AuthoringError('unauthorized', 'GitHub identity response was invalid');
    }

    const repositoryResponse = await this.#request(this.#repositoryUrl());
    if (repositoryResponse.status === 404) {
      throw new AuthoringError('forbidden', 'GitHub repository is not available to this identity', 404);
    }
    if (!repositoryResponse.ok) throw responseFailure(repositoryResponse.status, 'GitHub repository');
    const repositoryPayload: unknown = await repositoryResponse.json();
    const repositoryRecord = asRecord(repositoryPayload);
    const permissions = asRecord(repositoryRecord?.['permissions']);
    if (permissions?.['push'] !== true) {
      throw new AuthoringError('forbidden', 'GitHub identity lacks shared-authoring write capability');
    }

    this.#authorized = true;
    return Object.freeze({
      id: String(id),
      login,
      displayName: typeof name === 'string' && name.trim() ? name.trim() : null
    });
  }

  async read<T>(
    key: SharedDocumentKey,
    validate: JsonValidator<T>
  ): Promise<VersionedJsonDocument<T>> {
    this.#assertAuthorized();
    const response = await this.#request(this.#documentUrl(key));
    if (response.status === 404) {
      throw new AuthoringError('not-found', `Shared document not found: ${key}`, 404);
    }
    if (!response.ok) throw responseFailure(response.status, 'Shared-document read');

    const payload: unknown = await response.json();
    const record = asRecord(payload);
    const sha = record?.['sha'];
    const content = record?.['content'];
    const encoding = record?.['encoding'];
    const type = record?.['type'];
    if (
      typeof sha !== 'string' ||
      !sha ||
      typeof content !== 'string' ||
      encoding !== 'base64' ||
      type !== 'file'
    ) {
      throw new AuthoringError('validation', 'Shared GitHub document response was invalid');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(decodeBase64Utf8(content)) as unknown;
    } catch (error) {
      if (error instanceof AuthoringError) throw error;
      throw new AuthoringError('validation', 'Shared GitHub document is not valid JSON');
    }
    const value = validateRemoteValue(parsed, validate);
    return Object.freeze({ key, value, version: sha });
  }

  async write<T>(
    input: WriteVersionedJsonInput<T>,
    validate: JsonValidator<T>
  ): Promise<VersionedJsonDocument<T>> {
    this.#assertAuthorized();
    const message = input.message.trim();
    if (!message || message.length > 200) {
      throw new AuthoringError('validation', 'Shared-document commit message must contain 1-200 characters');
    }
    const value = validateRemoteValue(structuredClone(input.value), validate);
    const body: Record<string, string> = {
      message,
      content: encodeBase64Utf8(canonicalJson(value))
    };
    if (input.expectedVersion !== null) body['sha'] = input.expectedVersion;

    const response = await this.#request(this.#documentUrl(input.key), {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    if (response.status === 409 || response.status === 422) {
      throw new AuthoringError('conflict', `Shared document changed remotely: ${input.key}`, response.status);
    }
    if (!response.ok) throw responseFailure(response.status, 'Shared-document write');

    const payload: unknown = await response.json();
    const record = asRecord(payload);
    const writtenContent = asRecord(record?.['content']);
    const sha = writtenContent?.['sha'];
    if (typeof sha !== 'string' || !sha) {
      throw new AuthoringError('validation', 'GitHub write response did not contain a document version');
    }
    return Object.freeze({ key: input.key, value, version: sha });
  }

  #assertAuthorized(): void {
    if (!this.#authorized || !this.#token) {
      throw new AuthoringError('unauthorized', 'Shared authoring session is not authorized');
    }
  }

  #repositoryUrl(): string {
    return `${this.#apiBaseUrl}/repos/${encodeURIComponent(this.#owner)}/${encodeURIComponent(this.#repository)}`;
  }

  #documentUrl(key: SharedDocumentKey): string {
    const path = this.#paths[key];
    if (!path) throw new AuthoringError('validation', 'Unknown shared-document key');
    return `${this.#repositoryUrl()}/contents/${encodePath(path)}`;
  }

  async #request(url: string, init: RequestInit = {}): Promise<Response> {
    const token = this.#token;
    if (!token) throw new AuthoringError('unauthorized', 'GitHub authoring credential is not available');
    try {
      return await this.#fetch(url, {
        ...init,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': API_VERSION,
          ...(init.headers ?? {})
        }
      });
    } catch {
      throw new AuthoringError('transport', 'GitHub authoring request failed');
    }
  }
}

export async function connectGitHubAuthoring(
  options: ConnectGitHubAuthoringOptions
): Promise<GitHubAuthoringConnection> {
  const repository = new GitHubContentsRepository(options);
  const identity = await repository.authorize();
  const session = createAuthorizedSession(identity, ['shared:read', 'shared:write']);
  return Object.freeze({
    session,
    repository,
    disconnect: () => repository.disconnect()
  });
}
