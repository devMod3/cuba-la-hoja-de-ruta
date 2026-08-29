import { describe, expect, it } from 'vitest';
import {
  AuthoringError,
  InMemoryVersionedJsonRepository,
  canonicalJson,
  createAuthorizedSession,
  disconnectedSession,
  hasAuthoringCapability
} from './src/index';

function validateRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new AuthoringError('validation', 'Expected record');
  }
  return value as Record<string, unknown>;
}

describe('authoring session contracts', () => {
  it('separates disconnected and authorized capabilities without credential state', () => {
    const disconnected = disconnectedSession();
    const authorized = createAuthorizedSession(
      { id: '42', login: 'maintainer', displayName: 'Maintainer' },
      ['shared:read', 'shared:write']
    );

    expect(hasAuthoringCapability(disconnected, 'shared:write')).toBe(false);
    expect(hasAuthoringCapability(authorized, 'shared:write')).toBe(true);
    expect(JSON.stringify(authorized)).not.toContain('token');
    expect(JSON.stringify(authorized)).not.toContain('credential');
  });
});

describe('AuthoringError', () => {
  it('preserves typed failure metadata', () => {
    const error = new AuthoringError('transport', 'Transport failed', 503);

    expect(error).toMatchObject({
      name: 'AuthoringError',
      code: 'transport',
      message: 'Transport failed',
      status: 503
    });
  });
});

describe('canonicalJson', () => {
  it('orders object keys recursively and appends a terminal newline', () => {
    expect(canonicalJson({ z: 1, a: { y: true, b: ['x', null] } })).toBe(
      '{\n  "a": {\n    "b": [\n      "x",\n      null\n    ],\n    "y": true\n  },\n  "z": 1\n}\n'
    );
  });

  it('rejects non-JSON, sparse and cyclic values', () => {
    expect(() => canonicalJson({ value: Number.NaN })).toThrow(AuthoringError);
    expect(() => canonicalJson({ value: undefined })).toThrow(/Unsupported/);
    expect(() => canonicalJson(new Date('2026-01-01T00:00:00.000Z'))).toThrow(/plain JSON/);

    const sparse: unknown[] = [];
    sparse.length = 1;
    expect(() => canonicalJson(sparse)).toThrow(/sparse/);

    const cyclic: Record<string, unknown> = {};
    cyclic['self'] = cyclic;
    expect(() => canonicalJson(cyclic)).toThrow(/cycles/);
  });
});

describe('InMemoryVersionedJsonRepository', () => {
  it('creates, reads and updates a versioned shared document', async () => {
    const repository = new InMemoryVersionedJsonRepository();
    const created = await repository.write(
      {
        key: 'metadata-registry',
        value: { schemaVersion: '1.0.0', entries: [] },
        expectedVersion: null,
        message: 'Create shared metadata'
      },
      validateRecord
    );

    expect(created.version).toBe('memory:1');
    const read = await repository.read('metadata-registry', validateRecord);
    expect(read).toEqual(created);

    const updated = await repository.write(
      {
        key: 'metadata-registry',
        value: { schemaVersion: '1.0.0', entries: [{ id: 'a' }] },
        expectedVersion: read.version,
        message: 'Update shared metadata'
      },
      validateRecord
    );
    expect(updated.version).toBe('memory:2');
  });

  it('rejects stale, missing and invalid version transitions', async () => {
    const repository = new InMemoryVersionedJsonRepository();

    await expect(repository.read('site-profile', validateRecord)).rejects.toMatchObject({
      code: 'not-found'
    });

    await expect(
      repository.write(
        {
          key: 'site-profile',
          value: {},
          expectedVersion: 'memory:9',
          message: 'Invalid create'
        },
        validateRecord
      )
    ).rejects.toMatchObject({ code: 'conflict' });

    const created = await repository.write(
      { key: 'site-profile', value: {}, expectedVersion: null, message: 'Create profile' },
      validateRecord
    );

    await expect(
      repository.write(
        {
          key: 'site-profile',
          value: { changed: true },
          expectedVersion: 'memory:0',
          message: 'Stale update'
        },
        validateRecord
      )
    ).rejects.toMatchObject({ code: 'conflict' });

    await expect(
      repository.write(
        {
          key: 'site-profile',
          value: { changed: true },
          expectedVersion: created.version,
          message: '   '
        },
        validateRecord
      )
    ).rejects.toMatchObject({ code: 'validation' });
  });
});
