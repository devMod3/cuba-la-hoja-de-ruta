import { MetadataRegistrySchema, type MetadataRegistry } from '@zenblog/domain';

export const DEFAULT_METADATA_STORAGE_KEY = 'zenMetadataRegistry.v2';

export const EMPTY_METADATA_REGISTRY = MetadataRegistrySchema.parse({
  schemaVersion: '1.0.0',
  vocabularyVersion: '1.0.0',
  records: {},
  migrationIssues: {}
});

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
  readonly warn?: (message: string, error: unknown) => void;
}

export class LocalMetadataSource {
  readonly #storageKey: string;
  readonly #storage: MetadataStorage | undefined;
  readonly #documentTarget: MetadataEventTarget | undefined;
  readonly #windowTarget: MetadataEventTarget | undefined;
  readonly #warn: (message: string, error: unknown) => void;

  constructor({
    storageKey = DEFAULT_METADATA_STORAGE_KEY,
    storage = globalThis.localStorage,
    documentTarget = globalThis.document,
    windowTarget = globalThis.window,
    warn = (message, error) => {
      globalThis.console.warn(message, error);
    }
  }: LocalMetadataSourceOptions = {}) {
    this.#storageKey = storageKey;
    this.#storage = storage;
    this.#documentTarget = documentTarget;
    this.#windowTarget = windowTarget;
    this.#warn = warn;
  }

  getRegistry(): MetadataRegistry {
    try {
      const raw = this.#storage?.getItem(this.#storageKey) ?? null;
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      const result = MetadataRegistrySchema.safeParse(parsed);
      if (result.success) return result.data;
    } catch (error) {
      this.#warn('[ZenBlog] Metadata registry unavailable', error);
    }

    return EMPTY_METADATA_REGISTRY;
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
