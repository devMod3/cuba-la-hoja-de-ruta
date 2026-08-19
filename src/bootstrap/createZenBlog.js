import { BloggerFeedSource } from '../adapters/blogger/BloggerFeedSource.js';
import { LocalMetadataSource } from '../adapters/metadata/LocalMetadataSource.js';
import { SearchService } from '../search/SearchService.js';
import { NavigationFeature } from '../features/navigation/NavigationFeature.js';
import { ExploreFeature } from '../features/explore/ExploreFeature.js';
import { ExploreQueryService } from '../features/explore/ExploreQueryService.js';

const VERSION = '0.2.0';

export function createZenBlog({ root = document } = {}) {
  const contentSource = new BloggerFeedSource();
  const metadataSource = new LocalMetadataSource();
  const searchService = new SearchService();
  const exploreQueryService = new ExploreQueryService({ searchService });

  const navigation = new NavigationFeature({ root });
  const explore = new ExploreFeature({
    root,
    contentSource,
    metadataSource,
    exploreQueryService
  });

  return {
    version: VERSION,
    boot() {
      if (document.documentElement.dataset.zenBooted === 'true') return;
      document.documentElement.dataset.zenBooted = 'true';

      navigation.boot();
      explore.boot();

      window.ZenBlog = {
        version: VERSION,
        navigation,
        explore,
        services: { searchService, exploreQueryService },
        sources: { contentSource, metadataSource }
      };

      document.dispatchEvent(new CustomEvent('zenblog:ready', {
        detail: { version: VERSION }
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
