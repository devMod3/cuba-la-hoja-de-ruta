import type { MetadataRecord, MetadataRegistry } from '@zenblog/domain';

export const DEFAULT_METADATA_STORAGE_KEY = 'zenMetadataRegistry.v2';

export const EMPTY_METADATA_REGISTRY: MetadataRegistry = { records: {} };

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

type JsonObject = Record<string, unknown>;

const INVALID = Symbol('invalid-metadata');

type Parsed<T> = T | typeof INVALID;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): Parsed<string | null> {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : INVALID;
}

function stringArray(value: unknown): Parsed<string[]> {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return INVALID;
  return [...value];
}

function documentYear(value: unknown): Parsed<number | null> {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return Number.isInteger(numeric) ? numeric : INVALID;
}

function normArticles(value: unknown): Parsed<string[]> {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return INVALID;

  const articles: string[] = [];
  for (const article of value) {
    if (typeof article !== 'string' && typeof article !== 'number') return INVALID;
    articles.push(String(article));
  }
  return articles;
}

function parseRecord(value: unknown): Parsed<MetadataRecord> {
  if (!isObject(value)) return INVALID;

  const classificationValue = value['classification'];
  if (classificationValue !== undefined && !isObject(classificationValue)) return INVALID;
  const classification = isObject(classificationValue) ? classificationValue : {};
  const primaryPillar = nullableString(classification['primaryPillar']);
  const relatedPillars = stringArray(classification['relatedPillars']);
  const type = nullableString(classification['type']);
  if (primaryPillar === INVALID || relatedPillars === INVALID || type === INVALID) return INVALID;

  const temporalValue = value['temporal'];
  if (temporalValue !== undefined && !isObject(temporalValue)) return INVALID;
  const temporal = isObject(temporalValue) ? temporalValue : {};
  const year = documentYear(temporal['documentYear']);
  if (year === INVALID) return INVALID;

  const indexingValue = value['indexing'];
  if (indexingValue !== undefined && !isObject(indexingValue)) return INVALID;
  const indexing = isObject(indexingValue) ? indexingValue : {};
  const concepts = stringArray(indexing['concepts']);
  const aliases = stringArray(indexing['aliases']);
  const keywords = stringArray(indexing['keywords']);
  if (concepts === INVALID || aliases === INVALID || keywords === INVALID) return INVALID;

  const normsValue = indexing['norms'];
  if (normsValue !== undefined && !Array.isArray(normsValue)) return INVALID;
  const norms: MetadataRecord['indexing']['norms'] = [];
  for (const normValue of Array.isArray(normsValue) ? normsValue : []) {
    if (!isObject(normValue)) return INVALID;
    const normIdValue = normValue['normId'];
    if (normIdValue !== undefined && typeof normIdValue !== 'string') return INVALID;
    const articles = normArticles(normValue['articles']);
    if (articles === INVALID) return INVALID;
    norms.push({ normId: normIdValue ?? '', articles });
  }

  const editorialValue = value['editorial'];
  if (editorialValue !== undefined && !isObject(editorialValue)) return INVALID;
  const editorial = isObject(editorialValue) ? editorialValue : {};
  const status = nullableString(editorial['status']);
  if (status === INVALID) return INVALID;

  return {
    classification: { primaryPillar, relatedPillars, type },
    temporal: { documentYear: year },
    indexing: { concepts, aliases, keywords, norms },
    editorial: { status }
  };
}

function parseRegistry(value: unknown): MetadataRegistry | null {
  if (!isObject(value)) return null;
  const recordsValue = value['records'];
  if (recordsValue !== undefined && !isObject(recordsValue)) return null;

  const records: Record<string, MetadataRecord> = {};
  for (const [id, rawRecord] of Object.entries(isObject(recordsValue) ? recordsValue : {})) {
    const record = parseRecord(rawRecord);
    if (record === INVALID) return null;
    records[id] = record;
  }

  return { records };
}

export class LocalMetadataSource {
  readonly #storageKey: string;
  readonly #storage: MetadataStorage | undefined;
  readonly #documentTarget: MetadataEventTarget | undefined;
  readonly #windowTarget: MetadataEventTarget | undefined;
  readonly #warn: (message: string, error: unknown) => void;
  #cachedRaw: string | null | undefined;
  #cachedRegistry: MetadataRegistry = EMPTY_METADATA_REGISTRY;

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
    let raw: string | null;
    try {
      raw = this.#storage?.getItem(this.#storageKey) ?? null;
    } catch (error) {
      this.#warn('[ZenBlog] Metadata registry unavailable', error);
      return EMPTY_METADATA_REGISTRY;
    }

    if (raw === this.#cachedRaw) return this.#cachedRegistry;
    this.#cachedRaw = raw;

    if (!raw) {
      this.#cachedRegistry = EMPTY_METADATA_REGISTRY;
      return this.#cachedRegistry;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      this.#cachedRegistry = parseRegistry(parsed) ?? EMPTY_METADATA_REGISTRY;
    } catch (error) {
      this.#cachedRegistry = EMPTY_METADATA_REGISTRY;
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
