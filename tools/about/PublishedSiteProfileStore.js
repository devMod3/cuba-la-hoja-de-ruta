import { emptySiteProfile, validateSiteProfile } from './SiteProfileStore.js';

export function usesPublishedProfile({ pageUrl = globalThis.location?.href, moduleUrl = import.meta.url } = {}) {
  try {
    return new URL(pageUrl).origin !== new URL(moduleUrl).origin;
  } catch {
    return false;
  }
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

  static async fromUrl(url, { fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== 'function') throw new Error('Public profile fetch is unavailable');

    const response = await fetchImpl(url, {
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
    // Published profile is an immutable deployment snapshot. A newer snapshot
    // becomes visible on the next page load/release identity, not through
    // browser-local mutation events.
    return () => {};
  }
}
