import type { Article, MetadataRecord } from '@zenblog/domain';
import {
  parsePublishedSiteProfile,
  parseSharedMetadataRegistry,
  sharedMetadataRegistry,
  siteProfile,
  type PublishedSiteProfile,
  type SharedMetadataRegistry
} from '@zenblog/site-config';

export const METADATA_STORAGE_KEY = 'zenMetadataRegistry.v2';
export const SITE_PROFILE_STORAGE_KEY = 'zenSiteProfile.v1';
const METADATA_EVENT = 'zenmetadata:changed';
const PROFILE_EVENT = 'zensiteprofile:changed';

export function cloneMetadataRegistry(value: SharedMetadataRegistry): SharedMetadataRegistry {
  return parseSharedMetadataRegistry(structuredClone(value));
}

export function cloneSiteProfile(value: PublishedSiteProfile): PublishedSiteProfile {
  return parsePublishedSiteProfile(structuredClone(value));
}

export function defaultMetadataRegistry(): SharedMetadataRegistry {
  return cloneMetadataRegistry(sharedMetadataRegistry);
}

export function defaultSiteProfile(): PublishedSiteProfile {
  return cloneSiteProfile(siteProfile);
}

function readStored<T>(
  storage: Storage,
  key: string,
  parse: (value: unknown) => T,
  fallback: () => T
): T {
  const raw = storage.getItem(key);
  if (!raw) return fallback();
  try {
    return parse(JSON.parse(raw) as unknown);
  } catch {
    return fallback();
  }
}

export function readMetadataDraft(storage: Storage): SharedMetadataRegistry {
  return readStored(
    storage,
    METADATA_STORAGE_KEY,
    parseSharedMetadataRegistry,
    defaultMetadataRegistry
  );
}

export function writeMetadataDraft(storage: Storage, value: SharedMetadataRegistry): void {
  storage.setItem(METADATA_STORAGE_KEY, JSON.stringify(value));
  document.dispatchEvent(new CustomEvent(METADATA_EVENT));
}

export function readSiteProfileDraft(storage: Storage): PublishedSiteProfile {
  return readStored(
    storage,
    SITE_PROFILE_STORAGE_KEY,
    parsePublishedSiteProfile,
    defaultSiteProfile
  );
}

export function writeSiteProfileDraft(storage: Storage, value: PublishedSiteProfile): void {
  storage.setItem(SITE_PROFILE_STORAGE_KEY, JSON.stringify(value));
  document.dispatchEvent(new CustomEvent(PROFILE_EVENT));
}

interface DraftStore<T> {
  readonly getSnapshot: () => T;
  readonly getServerSnapshot: () => T;
  readonly subscribe: (listener: () => void) => () => void;
}

function createDraftStore<T>({
  key,
  eventName,
  parse,
  fallback
}: Readonly<{
  key: string;
  eventName: string;
  parse: (value: unknown) => T;
  fallback: () => T;
}>): DraftStore<T> {
  const serverSnapshot = fallback();
  let cachedRaw: string | null | undefined;
  let cachedValue = serverSnapshot;

  const getSnapshot = (): T => {
    let raw: string | null;
    try {
      raw = globalThis.localStorage.getItem(key);
    } catch {
      return serverSnapshot;
    }
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    if (!raw) {
      cachedValue = serverSnapshot;
      return cachedValue;
    }
    try {
      cachedValue = parse(JSON.parse(raw) as unknown);
    } catch {
      cachedValue = serverSnapshot;
    }
    return cachedValue;
  };

  const subscribe = (listener: () => void): (() => void) => {
    const localListener: EventListener = () => {
      listener();
    };
    const storageListener = (event: StorageEvent) => {
      if (event.key === key) listener();
    };
    document.addEventListener(eventName, localListener);
    window.addEventListener('storage', storageListener);
    return () => {
      document.removeEventListener(eventName, localListener);
      window.removeEventListener('storage', storageListener);
    };
  };

  return Object.freeze({
    getSnapshot,
    getServerSnapshot: () => serverSnapshot,
    subscribe
  });
}

export function createMetadataDraftStore(): DraftStore<SharedMetadataRegistry> {
  return createDraftStore({
    key: METADATA_STORAGE_KEY,
    eventName: METADATA_EVENT,
    parse: parseSharedMetadataRegistry,
    fallback: defaultMetadataRegistry
  });
}

export function createSiteProfileDraftStore(): DraftStore<PublishedSiteProfile> {
  return createDraftStore({
    key: SITE_PROFILE_STORAGE_KEY,
    eventName: PROFILE_EVENT,
    parse: parsePublishedSiteProfile,
    fallback: defaultSiteProfile
  });
}

export function metadataRecordFor(
  article: Article,
  registry: SharedMetadataRegistry
): MetadataRecord {
  return (
    registry.records[article.id] ?? {
      classification: { primaryPillar: null, relatedPillars: [], type: null },
      temporal: { documentYear: null },
      indexing: { concepts: [], aliases: [], keywords: [], norms: [] },
      editorial: { status: null }
    }
  );
}

export function metadataIsMeaningful(value: SharedMetadataRegistry): boolean {
  return Object.keys(value.records).length > 0;
}

export function profileIsMeaningful(value: PublishedSiteProfile): boolean {
  const profile = value.profile;
  return Boolean(
    profile.displayName ||
    profile.photoUrl ||
    profile.email ||
    profile.website ||
    profile.audioClipUrl ||
    profile.wishlistUrl ||
    profile.randomQuestion ||
    profile.randomAnswer ||
    profile.gender ||
    profile.industry ||
    profile.occupation ||
    profile.location.city ||
    profile.location.region ||
    profile.location.country ||
    profile.introduction ||
    profile.interests.length ||
    profile.favoriteMovies.length ||
    profile.favoriteMusic.length ||
    profile.favoriteBooks.length ||
    value.social.length ||
    value.relatedResources.length
  );
}
