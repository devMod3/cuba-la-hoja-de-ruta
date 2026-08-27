import { readFile } from 'node:fs/promises';

export type SocialPlatform =
  | 'x'
  | 'youtube'
  | 'github'
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'telegram'
  | 'bluesky'
  | 'mastodon'
  | 'other';

export type ResourceType =
  'project' | 'institution' | 'archive' | 'source' | 'publication' | 'other';

export interface PublishedSiteProfile {
  readonly schemaVersion: '1.0.0';
  readonly updatedAt: string | null;
  readonly profile: {
    readonly displayName: string;
    readonly photoUrl: string;
    readonly bloggerProfileUrl: string;
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

const SOCIAL_LABELS: Readonly<Record<SocialPlatform, string>> = {
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

const RESOURCE_LABELS: Readonly<Record<ResourceType, string>> = {
  project: 'Proyecto',
  institution: 'Institución',
  archive: 'Archivo',
  source: 'Fuente',
  publication: 'Publicación',
  other: 'Recurso'
};

const SOCIAL_PLATFORMS = new Set<SocialPlatform>(Object.keys(SOCIAL_LABELS) as SocialPlatform[]);
const RESOURCE_TYPES = new Set<ResourceType>(Object.keys(RESOURCE_LABELS) as ResourceType[]);
const SAFE_IMAGE_DATA = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i;
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

function socialPlatform(value: unknown): SocialPlatform {
  const candidate = text(value) as SocialPlatform;
  return SOCIAL_PLATFORMS.has(candidate) ? candidate : 'other';
}

function resourceType(value: unknown): ResourceType {
  const candidate = text(value) as ResourceType;
  return RESOURCE_TYPES.has(candidate) ? candidate : 'other';
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
      bloggerProfileUrl: text(profile['bloggerProfileUrl']),
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
          id: text(record['id']) || `social-${index + 1}`,
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
          id: text(record['id']) || `resource-${index + 1}`,
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
  if (data.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)) {
    errors.push('profile.email is invalid');
  }

  for (const [name, url] of [
    ['profile.bloggerProfileUrl', data.profile.bloggerProfileUrl],
    ['profile.website', data.profile.website],
    ['profile.audioClipUrl', data.profile.audioClipUrl],
    ['profile.wishlistUrl', data.profile.wishlistUrl]
  ] as const) {
    if (url && !isSafeExternalUrl(url)) errors.push(`${name} is unsafe`);
  }

  data.social.forEach((item, index) => {
    if (!item.url) errors.push(`social[${index}].url is required`);
    else if (!isSafeExternalUrl(item.url)) errors.push(`social[${index}].url is unsafe`);
  });

  data.relatedResources.forEach((item, index) => {
    if (!item.title) errors.push(`relatedResources[${index}].title is required`);
    if (!item.url) errors.push(`relatedResources[${index}].url is required`);
    else if (!isSafeExternalUrl(item.url)) {
      errors.push(`relatedResources[${index}].url is unsafe`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`Published site profile is invalid: ${errors.join(' · ')}`);
  }

  return data;
}

export async function readPublishedSiteProfile(): Promise<PublishedSiteProfile> {
  const source = new URL('../../../../config/site-profile.public.json', import.meta.url);
  const raw = await readFile(source, 'utf8');
  return parsePublishedSiteProfile(JSON.parse(raw) as unknown);
}

export function socialPlatformLabel(platform: SocialPlatform): string {
  return SOCIAL_LABELS[platform];
}

export function resourceTypeLabel(type: ResourceType): string {
  return RESOURCE_LABELS[type];
}
