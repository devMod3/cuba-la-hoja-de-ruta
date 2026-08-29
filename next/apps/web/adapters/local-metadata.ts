import type { MetadataRegistry } from '@zenblog/domain';
import { parseSharedMetadataRegistry, searchMetadataRegistry } from '@zenblog/site-config';

export const DEFAULT_METADATA_STORAGE_KEY = 'zenMetadataRegistry.v2';
export const EMPTY_METADATA_REGISTRY: MetadataRegistry = Object.freeze({ records: {} });

export interface MetadataStorage {
  getItem(key: string): string | null;
}

export interface MetadataEventTarget {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export interface LocalMetadataSourceOptions {
  readonly storageKey?: string;
  readonly storage?: MetadataStorage;
  readonly documentTarget?: MetadataEventTarget;
  readonly windowTarget?: MetadataEventTarget;
  readonly fallbackRegistry?: MetadataRegistry;
  readonly warn?: (message: string, error: unknown) => void;
}

export class LocalMetadataSource {
  readonly #storageKey: string;
  readonly #storage: MetadataStorage | undefined;
  readonly #documentTarget: MetadataEventTarget | undefined;
  readonly #windowTarget: MetadataEventTarget | undefined;
  readonly #fallbackRegistry: MetadataRegistry;
  readonly #warn: (message: string, error: unknown) => void;
  #cachedRaw: string | null | undefined;
  #cachedRegistry: MetadataRegistry;

  constructor({
    storageKey = DEFAULT_METADATA_STORAGE_KEY,
    storage = globalThis.localStorage,
    documentTarget = globalThis.document,
    windowTarget = globalThis.window,
    fallbackRegistry = searchMetadataRegistry,
    warn = (message, error) => {
      globalThis.console.warn(message, error);
    }
  }: LocalMetadataSourceOptions = {}) {
    this.#storageKey = storageKey;
    this.#storage = storage;
    this.#documentTarget = documentTarget;
    this.#windowTarget = windowTarget;
    this.#fallbackRegistry = fallbackRegistry;
    this.#cachedRegistry = fallbackRegistry;
    this.#warn = warn;
  }

  getRegistry(): MetadataRegistry {
    let raw: string | null;
    try {
      raw = this.#storage?.getItem(this.#storageKey) ?? null;
    } catch (error) {
      this.#warn('[ZenBlog] Metadata registry unavailable', error);
      return this.#fallbackRegistry;
    }

    if (raw === this.#cachedRaw) return this.#cachedRegistry;
    this.#cachedRaw = raw;

    if (!raw) {
      this.#cachedRegistry = this.#fallbackRegistry;
      return this.#cachedRegistry;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      const shared = parseSharedMetadataRegistry(parsed);
      this.#cachedRegistry = Object.freeze({ records: shared.records });
    } catch (error) {
      this.#cachedRegistry = this.#fallbackRegistry;
      this.#warn('[ZenBlog] Metadata registry unavailable', error);
    }

    return this.#cachedRegistry;
  }

  subscribe(listener: (registry: MetadataRegistry) => void): () => void {
    const onMetadataChanged: EventListener = () => {
      listener(this.getRegistry());
    };
    const onStorage: EventListener = (event) => {
      const key = (event as Event & { key?: string | null }).key;
      if (key === this.#storageKey) listener(this.getRegistry());
    };

    this.#documentTarget?.addEventListener('zenmetadata:changed', onMetadataChanged);
    this.#windowTarget?.addEventListener('storage', onStorage);

    return () => {
      this.#documentTarget?.removeEventListener('zenmetadata:changed', onMetadataChanged);
      this.#windowTarget?.removeEventListener('storage', onStorage);
    };
  }
}
