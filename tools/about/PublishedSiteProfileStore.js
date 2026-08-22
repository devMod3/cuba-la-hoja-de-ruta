import { emptySiteProfile, validateSiteProfile } from './SiteProfileStore.js';

export function usesPublishedProfile({ pageUrl = globalThis.location?.href, moduleUrl = import.meta.url } = {}) {
  try {
    return new URL(pageUrl).origin !== new URL(moduleUrl).origin;
  } catch {
    return false;
  }
}

function browserFetch(...args) {
  return globalThis.fetch(...args);
}

function cacheBustedUrl(url, stamp = Date.now()) {
  const requestUrl = new URL(url);
  requestUrl.searchParams.set('zenProfileRead', String(stamp));
  return requestUrl.href;
}

export class PublishedSiteProfileStore {
  constructor({ data = emptySiteProfile() } = {}) {
    const validation = validateSiteProfile(data);
    if (!validation.ok) {
      const error = new Error(validation.errors.join(' · '));
      error.validationErrors = validation.errors;
      throw error;
    }
    this.data = validation.value;
  }

  static async fromUrl(url, { fetchImpl = browserFetch, now = Date.now } = {}) {
    if (typeof fetchImpl !== 'function') throw new Error('Public profile fetch is unavailable');

    const response = await fetchImpl(cacheBustedUrl(url, now()), {
      cache: 'no-store',
      credentials: 'omit'
    });
    if (!response?.ok) throw new Error(`Public profile HTTP ${response?.status ?? 'unknown'}`);

    return new PublishedSiteProfileStore({ data: await response.json() });
  }

  load() {
    return this.data;
  }

  subscribe() {
    // Public content is read from the mutable main snapshot on each page load.
    // Browser-local mutation events never become a public source of truth.
    return () => {};
  }
}
