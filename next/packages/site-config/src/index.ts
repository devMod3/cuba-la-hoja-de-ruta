import { MetadataRegistrySchema, type MetadataRegistry } from '@zenblog/domain';
import metadataRegistryData from '../data/metadata-registry.json';
import siteProfileData from '../data/site-profile.json';
import vocabularyData from '../data/vocabulary.json';

export type SocialPlatform = string;
export type ResourceType = string;

export const KNOWN_SOCIAL_PLATFORMS = Object.freeze([
  'x',
  'youtube',
  'github',
  'facebook',
  'instagram',
  'linkedin',
  'telegram',
  'bluesky',
  'mastodon',
  'other'
] as const);

export const KNOWN_RESOURCE_TYPES = Object.freeze([
  'project',
  'institution',
  'archive',
  'source',
  'publication',
  'other'
] as const);

export interface PublishedSiteProfile {
  readonly schemaVersion: '1.0.0';
  readonly updatedAt: string | null;
  readonly profile: {
    readonly displayName: string;
    readonly photoUrl: string;
    readonly email: string;
    readonly website: string;
    readonly audioClipUrl: string;
    readonly wishlistUrl: string;
    readonly randomQuestion: string;
    readonly randomAnswer: string;
    readonly gender: string;
    readonly industry: string;
    readonly occupation: string;
    readonly location: {
      readonly city: string;
      readonly region: string;
      readonly country: string;
    };
    readonly introduction: string;
    readonly interests: readonly string[];
    readonly favoriteMovies: readonly string[];
    readonly favoriteMusic: readonly string[];
    readonly favoriteBooks: readonly string[];
  };
  readonly social: readonly {
    readonly id: string;
    readonly platform: SocialPlatform;
    readonly label: string;
    readonly username: string;
    readonly url: string;
    readonly visible: boolean;
    readonly order: number;
  }[];
  readonly relatedResources: readonly {
    readonly id: string;
    readonly title: string;
    readonly url: string;
    readonly description: string;
    readonly type: ResourceType;
    readonly visible: boolean;
    readonly order: number;
  }[];
}

export interface VocabularyEntry {
  readonly id: string;
  readonly label: string;
  readonly aliases: readonly string[];
}

export interface SiteVocabulary {
  readonly version: '1.0.0';
  readonly pillars: readonly VocabularyEntry[];
  readonly types: readonly VocabularyEntry[];
  readonly statuses: readonly VocabularyEntry[];
  readonly norms: readonly VocabularyEntry[];
  readonly concepts: readonly VocabularyEntry[];
}

export interface SharedMetadataRegistry extends MetadataRegistry {
  readonly schemaVersion: '1.0.0';
  readonly vocabularyVersion: '1.0.0';
  readonly updatedAt: string | null;
}

const SOCIAL_LABELS: Readonly<Record<string, string>> = {
  x: 'X / Twitter',
  youtube: 'YouTube',
  github: 'GitHub',
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  bluesky: 'Bluesky',
  mastodon: 'Mastodon',
  other: 'Red social'
};

const RESOURCE_LABELS: Readonly<Record<string, string>> = {
  project: 'Proyecto',
  institution: 'Institución',
  archive: 'Archivo',
  source: 'Fuente',
  publication: 'Publicación',
  other: 'Recurso'
};

const SAFE_IMAGE_DATA = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/iu;
const MAX_INLINE_IMAGE_LENGTH = 900_000;

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(text).filter(Boolean))];
}

function order(value: unknown, fallback: number): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function socialPlatform(value: unknown): SocialPlatform {
  return text(value) || 'other';
}

function resourceType(value: unknown): ResourceType {
  return text(value) || 'other';
}

export function isSafeExternalUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value, 'https://example.invalid/');
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeImageSource(value: string): boolean {
  if (!value) return true;
  if (isSafeExternalUrl(value)) return true;
  return value.length <= MAX_INLINE_IMAGE_LENGTH && SAFE_IMAGE_DATA.test(value);
}

function vocabularyEntries(value: unknown, field: string): readonly VocabularyEntry[] {
  if (!Array.isArray(value)) throw new Error(`Vocabulary ${field} must be an array`);
  const seen = new Set<string>();
  return Object.freeze(
    value.map((item, index) => {
      const record = asRecord(item);
      const id = text(record['id']);
      const label = text(record['label']);
      if (!id || !label)
        throw new Error(`Vocabulary ${field}[${String(index)}] requires id and label`);
      if (seen.has(id)) throw new Error(`Vocabulary ${field} contains duplicate id ${id}`);
      seen.add(id);
      return Object.freeze({ id, label, aliases: Object.freeze(textList(record['aliases'])) });
    })
  );
}

export function parseSiteVocabulary(value: unknown): SiteVocabulary {
  const root = asRecord(value);
  if (text(root['version']) !== '1.0.0') throw new Error('Vocabulary version must be 1.0.0');
  return Object.freeze({
    version: '1.0.0' as const,
    pillars: vocabularyEntries(root['pillars'], 'pillars'),
    types: vocabularyEntries(root['types'], 'types'),
    statuses: vocabularyEntries(root['statuses'], 'statuses'),
    norms: vocabularyEntries(root['norms'], 'norms'),
    concepts: vocabularyEntries(root['concepts'], 'concepts')
  });
}

export function vocabularyIdForLabel(
  entries: readonly VocabularyEntry[],
  value: string
): string | null {
  const normalized = value.trim().toLocaleLowerCase('es');
  const match = entries.find((entry) =>
    [entry.label, ...entry.aliases].some(
      (candidate) => candidate.trim().toLocaleLowerCase('es') === normalized
    )
  );
  return match?.id ?? null;
}

export function vocabularyLabel(
  entries: readonly VocabularyEntry[],
  id: string | null | undefined,
  fallback = 'Sin clasificar'
): string {
  return entries.find((entry) => entry.id === id)?.label ?? fallback;
}

export function parsePublishedSiteProfile(value: unknown): PublishedSiteProfile {
  const root = asRecord(value);
  const profile = asRecord(root['profile']);
  const location = asRecord(profile['location']);
  const socialInput = Array.isArray(root['social']) ? root['social'] : [];
  const resourcesInput = Array.isArray(root['relatedResources']) ? root['relatedResources'] : [];

  const data: PublishedSiteProfile = {
    schemaVersion: '1.0.0',
    updatedAt: text(root['updatedAt']) || null,
    profile: {
      displayName: text(profile['displayName']),
      photoUrl: text(profile['photoUrl']),
      email: text(profile['email']),
      website: text(profile['website']),
      audioClipUrl: text(profile['audioClipUrl']),
      wishlistUrl: text(profile['wishlistUrl']),
      randomQuestion: text(profile['randomQuestion']),
      randomAnswer: text(profile['randomAnswer']),
      gender: text(profile['gender']),
      industry: text(profile['industry']),
      occupation: text(profile['occupation']),
      location: {
        city: text(location['city']),
        region: text(location['region']),
        country: text(location['country'])
      },
      introduction: text(profile['introduction']),
      interests: textList(profile['interests']),
      favoriteMovies: textList(profile['favoriteMovies']),
      favoriteMusic: textList(profile['favoriteMusic']),
      favoriteBooks: textList(profile['favoriteBooks'])
    },
    social: socialInput
      .map((item, index) => {
        const record = asRecord(item);
        return {
          id: text(record['id']) || `social-${String(index + 1)}`,
          platform: socialPlatform(record['platform']),
          label: text(record['label']),
          username: text(record['username']),
          url: text(record['url']),
          visible: record['visible'] !== false,
          order: order(record['order'], index)
        };
      })
      .sort((left, right) => left.order - right.order),
    relatedResources: resourcesInput
      .map((item, index) => {
        const record = asRecord(item);
        return {
          id: text(record['id']) || `resource-${String(index + 1)}`,
          title: text(record['title']),
          url: text(record['url']),
          description: text(record['description']),
          type: resourceType(record['type']),
          visible: record['visible'] !== false,
          order: order(record['order'], index)
        };
      })
      .sort((left, right) => left.order - right.order)
  };

  const errors: string[] = [];
  if (text(root['schemaVersion']) !== '1.0.0') errors.push('schemaVersion must be 1.0.0');
  if (data.profile.photoUrl && !isSafeImageSource(data.profile.photoUrl)) {
    errors.push('profile.photoUrl has an unsafe image source');
  }
  if (data.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(data.profile.email)) {
    errors.push('profile.email is invalid');
  }

  for (const [name, url] of [
    ['profile.website', data.profile.website],
    ['profile.audioClipUrl', data.profile.audioClipUrl],
    ['profile.wishlistUrl', data.profile.wishlistUrl]
  ] as const) {
    if (url && !isSafeExternalUrl(url)) errors.push(`${name} is unsafe`);
  }

  data.social.forEach((item, index) => {
    const path = `social[${String(index)}].url`;
    if (!item.url) errors.push(`${path} is required`);
    else if (!isSafeExternalUrl(item.url)) errors.push(`${path} is unsafe`);
  });

  data.relatedResources.forEach((item, index) => {
    const path = `relatedResources[${String(index)}]`;
    if (!item.title) errors.push(`${path}.title is required`);
    if (!item.url) errors.push(`${path}.url is required`);
    else if (!isSafeExternalUrl(item.url)) errors.push(`${path}.url is unsafe`);
  });

  if (errors.length > 0) {
    throw new Error(`Published site profile is invalid: ${errors.join(' · ')}`);
  }

  return Object.freeze(data);
}

export function parseSharedMetadataRegistry(value: unknown): SharedMetadataRegistry {
  const root = asRecord(value);
  if (text(root['schemaVersion']) !== '1.0.0') {
    throw new Error('Metadata registry schemaVersion must be 1.0.0');
  }
  if (text(root['vocabularyVersion']) !== '1.0.0') {
    throw new Error('Metadata registry vocabularyVersion must be 1.0.0');
  }

  const parsed = MetadataRegistrySchema.parse({ records: root['records'] });
  const updatedAt = text(root['updatedAt']) || null;
  return Object.freeze({
    schemaVersion: '1.0.0' as const,
    vocabularyVersion: '1.0.0' as const,
    updatedAt,
    records: parsed.records
  });
}

export const siteProfile = parsePublishedSiteProfile(siteProfileData);
export const sharedMetadataRegistry = parseSharedMetadataRegistry(metadataRegistryData);
export const searchMetadataRegistry: MetadataRegistry = Object.freeze({
  records: sharedMetadataRegistry.records
});
export const vocabulary = parseSiteVocabulary(vocabularyData);

export function socialPlatformLabel(platform: SocialPlatform): string {
  return SOCIAL_LABELS[platform] ?? (platform || 'Red social');
}

export function resourceTypeLabel(type: ResourceType): string {
  return RESOURCE_LABELS[type] ?? (type || 'Recurso');
}
