import { BloggerFeedSource } from '../adapters/blogger/BloggerFeedSource.js';
import { LocalMetadataSource } from '../adapters/metadata/LocalMetadataSource.js';
import { SearchService } from '../search/SearchService.js';
import { NavigationFeature } from '../features/navigation/NavigationFeature.js';
import { ExploreFeature } from '../features/explore/ExploreFeature.js';

export function createZenBlog({ root = document } = {}) {
  const contentSource = new BloggerFeedSource();
  const metadataSource = new LocalMetadataSource();
  const searchService = new SearchService();

  const navigation = new NavigationFeature({ root });
  const explore = new ExploreFeature({
    root,
    contentSource,
    metadataSource,
    searchService
  });

  return {
    version: '0.1.0',
    boot() {
      if (document.documentElement.dataset.zenBooted === 'true') return;
      document.documentElement.dataset.zenBooted = 'true';

      navigation.boot();
      explore.boot();

      window.ZenBlog = {
        version: '0.1.0',
        navigation,
        explore,
        services: { searchService },
        sources: { contentSource, metadataSource }
      };

      document.dispatchEvent(new CustomEvent('zenblog:ready', {
        detail: { version: '0.1.0' }
      }));
    },
    destroy() {
      navigation.destroy();
      explore.destroy();
      delete document.documentElement.dataset.zenBooted;
      delete window.ZenBlog;
    }
  };
}
