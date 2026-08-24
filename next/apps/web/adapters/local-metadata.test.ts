import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_METADATA_STORAGE_KEY,
  EMPTY_METADATA_REGISTRY,
  LocalMetadataSource,
  type MetadataStorage
} from './local-metadata';

class MemoryStorage implements MetadataStorage {
  #value: string | null;

  constructor(value: string | null = null) {
    this.#value = value;
  }

  getItem(): string | null {
    return this.#value;
  }

  set(value: string | null) {
    this.#value = value;
  }
}

class KeyedEvent extends Event {
  readonly key: string | null;

  constructor(type: string, key: string | null) {
    super(type);
    this.key = key;
  }
}

describe('LocalMetadataSource', () => {
  it('preserves the zenMetadataRegistry.v2 storage contract', () => {
    expect(DEFAULT_METADATA_STORAGE_KEY).toBe('zenMetadataRegistry.v2');
  });

  it('reads and validates the current metadata registry', () => {
    const storage = new MemoryStorage(
      JSON.stringify({
        schemaVersion: '1.0.0',
        vocabularyVersion: '1.0.0',
        records: {
          '42': {
            classification: { primaryPillar: 'Constitución', relatedPillars: [], type: 'Ley' },
            temporal: { documentYear: 1940 }
          }
        },
        migrationIssues: {}
      })
    );
    const source = new LocalMetadataSource({ storage });
    expect(source.getRegistry().records['42']?.classification.primaryPillar).toBe('Constitución');
  });

  it('falls back safely when local storage contains invalid JSON', () => {
    const warn = vi.fn();
    const source = new LocalMetadataSource({ storage: new MemoryStorage('{broken'), warn });
    expect(source.getRegistry()).toEqual(EMPTY_METADATA_REGISTRY);
    expect(warn).toHaveBeenCalledOnce();
  });

  it('publishes updates for zenmetadata:changed and only the matching storage key', () => {
    const storage = new MemoryStorage(JSON.stringify({ records: {} }));
    const documentTarget = new EventTarget();
    const windowTarget = new EventTarget();
    const source = new LocalMetadataSource({ storage, documentTarget, windowTarget });
    const listener = vi.fn();
    const unsubscribe = source.subscribe(listener);

    documentTarget.dispatchEvent(new Event('zenmetadata:changed'));
    windowTarget.dispatchEvent(new KeyedEvent('storage', 'other.key'));
    windowTarget.dispatchEvent(new KeyedEvent('storage', DEFAULT_METADATA_STORAGE_KEY));

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    documentTarget.dispatchEvent(new Event('zenmetadata:changed'));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
