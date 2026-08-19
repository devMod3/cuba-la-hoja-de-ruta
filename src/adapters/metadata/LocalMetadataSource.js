import { MetadataSource } from '../../contracts/MetadataSource.js';

export class LocalMetadataSource extends MetadataSource {
  constructor({ storageKey = 'zenMetadataRegistry.v2', storage = window.localStorage } = {}) {
    super();
    this.storageKey = storageKey;
    this.storage = storage;
  }

  getRegistry() {
    try {
      const raw = this.storage.getItem(this.storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed?.records && typeof parsed.records === 'object') return parsed;
    } catch (error) {
      console.warn('[ZenBlog] Metadata registry unavailable', error);
    }

    return {
      schemaVersion: '1.0.0',
      vocabularyVersion: '1.0.0',
      records: {},
      migrationIssues: {}
    };
  }

  subscribe(listener) {
    const onMetadataChanged = () => listener(this.getRegistry());
    const onStorage = (event) => {
      if (event.key === this.storageKey) listener(this.getRegistry());
    };

    document.addEventListener('zenmetadata:changed', onMetadataChanged);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener('zenmetadata:changed', onMetadataChanged);
      window.removeEventListener('storage', onStorage);
    };
  }
}
