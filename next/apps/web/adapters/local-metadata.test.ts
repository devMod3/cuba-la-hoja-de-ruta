import { afterEach, describe, expect, it, vi } from 'vitest';
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

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it('returns a stable external-store snapshot until raw storage changes', () => {
    const storage = new MemoryStorage(JSON.stringify({ records: {} }));
    const source = new LocalMetadataSource({ storage });

    const first = source.getRegistry();
    expect(source.getRegistry()).toBe(first);

    storage.set(
      JSON.stringify({
        records: {
          '42': {
            classification: {
              primaryPillar: 'Constitución',
              relatedPillars: [],
              type: 'Análisis'
            },
            temporal: { documentYear: 1940 }
          }
        }
      })
    );

    const second = source.getRegistry();
    expect(second).not.toBe(first);
    expect(second.records['42']?.classification.type).toBe('Análisis');
    expect(source.getRegistry()).toBe(second);
  });

  it('falls back safely and caches invalid JSON until the raw value changes', () => {
    const warn = vi.fn();
    const storage = new MemoryStorage('{broken');
    const source = new LocalMetadataSource({ storage, warn });

    expect(source.getRegistry()).toEqual(EMPTY_METADATA_REGISTRY);
    expect(source.getRegistry()).toBe(EMPTY_METADATA_REGISTRY);
    expect(warn).toHaveBeenCalledOnce();

    storage.set('{still-broken');
    expect(source.getRegistry()).toBe(EMPTY_METADATA_REGISTRY);
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('uses the default console warning for storage parse failures', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const source = new LocalMetadataSource({ storage: new MemoryStorage('{broken') });

    expect(source.getRegistry()).toEqual(EMPTY_METADATA_REGISTRY);
    expect(consoleWarn).toHaveBeenCalledOnce();
    expect(consoleWarn).toHaveBeenCalledWith(
      '[ZenBlog] Metadata registry unavailable',
      expect.any(SyntaxError)
    );
  });

  it('falls back silently for missing or schema-invalid metadata', () => {
    const warn = vi.fn();

    expect(
      new LocalMetadataSource({ storage: new MemoryStorage(null), warn }).getRegistry()
    ).toEqual(EMPTY_METADATA_REGISTRY);
    expect(
      new LocalMetadataSource({
        storage: new MemoryStorage('{"records":null}'),
        warn
      }).getRegistry()
    ).toEqual(EMPTY_METADATA_REGISTRY);
    expect(warn).not.toHaveBeenCalled();
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

  it('honors a custom storage key and tolerates an omitted event target', () => {
    const storage = new MemoryStorage(JSON.stringify({ records: {} }));
    const windowTarget = new EventTarget();
    const listener = vi.fn();
    const source = new LocalMetadataSource({
      storage,
      storageKey: 'custom.metadata',
      windowTarget
    });
    const unsubscribe = source.subscribe(listener);

    windowTarget.dispatchEvent(new KeyedEvent('storage', DEFAULT_METADATA_STORAGE_KEY));
    windowTarget.dispatchEvent(new KeyedEvent('storage', null));
    windowTarget.dispatchEvent(new KeyedEvent('storage', 'custom.metadata'));

    expect(listener).toHaveBeenCalledOnce();
    expect(() => {
      unsubscribe();
    }).not.toThrow();
  });
});
