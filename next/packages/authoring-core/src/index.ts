export const AUTHORING_CAPABILITIES = ['shared:read', 'shared:write'] as const;

export type AuthoringCapability = (typeof AUTHORING_CAPABILITIES)[number];

export const SHARED_DOCUMENT_KEYS = ['metadata-registry', 'site-profile'] as const;

export type SharedDocumentKey = (typeof SHARED_DOCUMENT_KEYS)[number];

export const AUTHORING_FAILURE_CODES = [
  'unauthorized',
  'forbidden',
  'not-found',
  'conflict',
  'validation',
  'transport'
] as const;

export type AuthoringFailureCode = (typeof AUTHORING_FAILURE_CODES)[number];

export interface AuthoringIdentity {
  readonly id: string;
  readonly login: string;
  readonly displayName: string | null;
}

export interface AuthorizedAuthoringSession {
  readonly status: 'authorized';
  readonly identity: AuthoringIdentity;
  readonly capabilities: ReadonlySet<AuthoringCapability>;
}

export interface DisconnectedAuthoringSession {
  readonly status: 'disconnected';
}

export type AuthoringSession = AuthorizedAuthoringSession | DisconnectedAuthoringSession;

export interface VersionedJsonDocument<T> {
  readonly key: SharedDocumentKey;
  readonly value: T;
  readonly version: string;
}

export interface WriteVersionedJsonInput<T> {
  readonly key: SharedDocumentKey;
  readonly value: T;
  readonly expectedVersion: string | null;
  readonly message: string;
}

export type JsonValidator<T> = (value: unknown) => T;

export interface VersionedJsonRepository {
  read<T>(key: SharedDocumentKey, validate: JsonValidator<T>): Promise<VersionedJsonDocument<T>>;
  write<T>(
    input: WriteVersionedJsonInput<T>,
    validate: JsonValidator<T>
  ): Promise<VersionedJsonDocument<T>>;
}

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export class AuthoringError extends Error {
  override readonly name = 'AuthoringError';

  constructor(
    readonly code: AuthoringFailureCode,
    message: string,
    readonly status: number | null = null
  ) {
    super(message);
  }
}

export function createAuthorizedSession(
  identity: AuthoringIdentity,
  capabilities: Iterable<AuthoringCapability>
): AuthorizedAuthoringSession {
  return Object.freeze({
    status: 'authorized' as const,
    identity: Object.freeze({ ...identity }),
    capabilities: new Set(capabilities)
  });
}

export function disconnectedSession(): DisconnectedAuthoringSession {
  return Object.freeze({ status: 'disconnected' as const });
}

export function hasAuthoringCapability(
  session: AuthoringSession,
  capability: AuthoringCapability
): session is AuthorizedAuthoringSession {
  return session.status === 'authorized' && session.capabilities.has(capability);
}

function validationError(message: string): never {
  throw new AuthoringError('validation', message);
}

function normalizeJson(value: unknown, seen: WeakSet<object>): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return validationError('Shared documents require finite numbers');
    return value;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return validationError('Shared documents cannot contain cycles');
    seen.add(value);
    const output: JsonValue[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!(index in value)) return validationError('Shared documents cannot contain sparse arrays');
      output.push(normalizeJson(value[index], seen));
    }
    seen.delete(value);
    return output;
  }

  if (typeof value === 'object') {
    if (Object.prototype.toString.call(value) !== '[object Object]') {
      return validationError('Shared documents require plain JSON objects');
    }
    if (seen.has(value)) return validationError('Shared documents cannot contain cycles');
    seen.add(value);
    const source = value as Record<string, unknown>;
    const output: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      output[key] = normalizeJson(source[key], seen);
    }
    seen.delete(value);
    return output;
  }

  return validationError(`Unsupported shared-document value type: ${typeof value}`);
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(normalizeJson(value, new WeakSet()), null, 2)}\n`;
}

interface StoredDocument {
  readonly value: unknown;
  readonly version: string;
}

export class InMemoryVersionedJsonRepository implements VersionedJsonRepository {
  readonly #documents = new Map<SharedDocumentKey, StoredDocument>();
  #revision = 0;

  async read<T>(
    key: SharedDocumentKey,
    validate: JsonValidator<T>
  ): Promise<VersionedJsonDocument<T>> {
    const stored = this.#documents.get(key);
    if (!stored) throw new AuthoringError('not-found', `Shared document not found: ${key}`);
    const value = validate(structuredClone(stored.value));
    return Object.freeze({ key, value, version: stored.version });
  }

  async write<T>(
    input: WriteVersionedJsonInput<T>,
    validate: JsonValidator<T>
  ): Promise<VersionedJsonDocument<T>> {
    if (!input.message.trim()) {
      throw new AuthoringError('validation', 'Shared-document commit message is required');
    }

    const value = validate(structuredClone(input.value));
    canonicalJson(value);
    const current = this.#documents.get(input.key);

    if (current && input.expectedVersion !== current.version) {
      throw new AuthoringError('conflict', `Shared document changed remotely: ${input.key}`);
    }
    if (!current && input.expectedVersion !== null) {
      throw new AuthoringError('conflict', `Shared document no longer exists: ${input.key}`);
    }

    this.#revision += 1;
    const version = `memory:${String(this.#revision)}`;
    this.#documents.set(input.key, { value: structuredClone(value), version });
    return Object.freeze({ key: input.key, value, version });
  }
}
