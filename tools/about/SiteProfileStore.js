export const SITE_PROFILE_STORAGE_KEY = 'zenSiteProfile.v1';
export const SITE_PROFILE_SCHEMA_VERSION = '1.0.0';

export const SOCIAL_PLATFORMS = Object.freeze([
  { id: 'x', label: 'X / Twitter' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'github', label: 'GitHub' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'bluesky', label: 'Bluesky' },
  { id: 'mastodon', label: 'Mastodon' },
  { id: 'other', label: 'Otra' }
]);

export const RESOURCE_TYPES = Object.freeze([
  { id: 'project', label: 'Proyecto' },
  { id: 'institution', label: 'Institución' },
  { id: 'archive', label: 'Archivo' },
  { id: 'source', label: 'Fuente' },
  { id: 'publication', label: 'Publicación' },
  { id: 'other', label: 'Otro' }
]);

const SOCIAL_IDS = new Set(SOCIAL_PLATFORMS.map((x) => x.id));
const RESOURCE_TYPE_IDS = new Set(RESOURCE_TYPES.map((x) => x.id));

function text(value) { return String(value ?? '').trim(); }
function textList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(text).filter(Boolean))];
}

export function isSafeExternalUrl(value) {
  const raw = text(value);
  if (!raw) return true;
  try {
    const url = new URL(raw, 'https://example.invalid/');
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function canonicalSocial(item, index) {
  const platform = SOCIAL_IDS.has(item?.platform) ? item.platform : 'other';
  return {
    id: text(item?.id) || `social-${index + 1}`,
    platform,
    label: text(item?.label),
    username: text(item?.username),
    url: text(item?.url),
    visible: item?.visible !== false,
    order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index
  };
}

function canonicalResource(item, index) {
  const type = RESOURCE_TYPE_IDS.has(item?.type) ? item.type : 'other';
  return {
    id: text(item?.id) || `resource-${index + 1}`,
    title: text(item?.title),
    url: text(item?.url),
    description: text(item?.description),
    type,
    visible: item?.visible !== false,
    order: Number.isFinite(Number(item?.order)) ? Number(item.order) : index
  };
}

export function emptySiteProfile() {
  return {
    schemaVersion: SITE_PROFILE_SCHEMA_VERSION,
    updatedAt: null,
    profile: {
      displayName: '',
      photoUrl: '',
      bloggerProfileUrl: '',
      email: '',
      website: '',
      audioClipUrl: '',
      wishlistUrl: '',
      randomQuestion: '',
      randomAnswer: '',
      gender: '',
      industry: '',
      occupation: '',
      location: { city: '', region: '', country: '' },
      introduction: '',
      interests: [],
      favoriteMovies: [],
      favoriteMusic: [],
      favoriteBooks: []
    },
    social: [],
    relatedResources: []
  };
}

export function canonicalizeSiteProfile(value = {}) {
  const profile = value?.profile ?? {};
  const location = profile?.location ?? {};
  return {
    schemaVersion: SITE_PROFILE_SCHEMA_VERSION,
    updatedAt: text(value?.updatedAt) || null,
    profile: {
      displayName: text(profile.displayName),
      photoUrl: text(profile.photoUrl),
      bloggerProfileUrl: text(profile.bloggerProfileUrl),
      email: text(profile.email),
      website: text(profile.website),
      audioClipUrl: text(profile.audioClipUrl),
      wishlistUrl: text(profile.wishlistUrl),
      randomQuestion: text(profile.randomQuestion),
      randomAnswer: text(profile.randomAnswer),
      gender: text(profile.gender),
      industry: text(profile.industry),
      occupation: text(profile.occupation),
      location: { city: text(location.city), region: text(location.region), country: text(location.country) },
      introduction: text(profile.introduction),
      interests: textList(profile.interests),
      favoriteMovies: textList(profile.favoriteMovies),
      favoriteMusic: textList(profile.favoriteMusic),
      favoriteBooks: textList(profile.favoriteBooks)
    },
    social: (Array.isArray(value?.social) ? value.social : []).map(canonicalSocial).sort((a, b) => a.order - b.order),
    relatedResources: (Array.isArray(value?.relatedResources) ? value.relatedResources : []).map(canonicalResource).sort((a, b) => a.order - b.order)
  };
}

export function validateSiteProfile(value) {
  const data = canonicalizeSiteProfile(value);
  const errors = [];
  for (const [label, url] of [
    ['Foto', data.profile.photoUrl],
    ['Perfil Blogger', data.profile.bloggerProfileUrl],
    ['Sitio web', data.profile.website],
    ['Audio Clip', data.profile.audioClipUrl],
    ['Wishlist', data.profile.wishlistUrl]
  ]) {
    if (url && !isSafeExternalUrl(url)) errors.push(`${label}: URL inválida`);
  }
  if (data.profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.profile.email)) errors.push('Correo electrónico inválido');
  data.social.forEach((item, index) => {
    if (!item.url) errors.push(`Red social ${index + 1}: falta URL`);
    else if (!isSafeExternalUrl(item.url)) errors.push(`Red social ${index + 1}: URL inválida`);
  });
  data.relatedResources.forEach((item, index) => {
    if (!item.title) errors.push(`Recurso ${index + 1}: falta título`);
    if (!item.url) errors.push(`Recurso ${index + 1}: falta URL`);
    else if (!isSafeExternalUrl(item.url)) errors.push(`Recurso ${index + 1}: URL inválida`);
  });
  return { ok: errors.length === 0, errors, value: data };
}

function defaultStorage() {
  if (globalThis.ZenSiteProfileStorage && typeof globalThis.ZenSiteProfileStorage.getItem === 'function' && typeof globalThis.ZenSiteProfileStorage.setItem === 'function') return globalThis.ZenSiteProfileStorage;
  return globalThis.localStorage;
}

export class SiteProfileStore {
  constructor({ storage = null, storageKey = SITE_PROFILE_STORAGE_KEY } = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
  }
  getStorage() { return this.storage ?? defaultStorage(); }
  load() {
    try {
      const raw = this.getStorage()?.getItem(this.storageKey);
      if (!raw) return emptySiteProfile();
      return canonicalizeSiteProfile(JSON.parse(raw));
    } catch (error) {
      console.warn('[ZenBlog/About] No se pudo leer el perfil del sitio', error);
      return emptySiteProfile();
    }
  }
  save(value) {
    const validation = validateSiteProfile(value);
    if (!validation.ok) {
      const error = new Error(validation.errors.join(' · '));
      error.validationErrors = validation.errors;
      throw error;
    }
    const data = { ...validation.value, updatedAt: new Date().toISOString() };
    this.getStorage()?.setItem(this.storageKey, JSON.stringify(data));
    globalThis.ZenSiteProfile = data;
    if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('zensiteprofile:changed', { detail: { profile: data } }));
    return data;
  }
  subscribe(listener) {
    const onCustom = (event) => listener(event.detail?.profile ?? this.load());
    const onStorage = (event) => { if (event.key === this.storageKey) listener(this.load()); };
    if (typeof document !== 'undefined') document.addEventListener('zensiteprofile:changed', onCustom);
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
    return () => {
      if (typeof document !== 'undefined') document.removeEventListener('zensiteprofile:changed', onCustom);
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
    };
  }
}
