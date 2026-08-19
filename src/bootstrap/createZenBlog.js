import { BloggerFeedSource } from '../adapters/blogger/BloggerFeedSource.js?v=0.3.0';
import { LocalMetadataSource } from '../adapters/metadata/LocalMetadataSource.js';
import { SearchService } from '../search/SearchService.js';
import { NavigationFeature } from '../features/navigation/NavigationFeature.js?v=0.3.0';
import { HomeFeature } from '../features/home/HomeFeature.js?v=0.3.0';
import { ExploreFeature } from '../features/explore/ExploreFeature.js';
import { ExploreQueryService } from '../features/explore/ExploreQueryService.js';

const VERSION = '0.3.0';

export function createZenBlog({ root = document } = {}) {
  const contentSource = new BloggerFeedSource();
  const metadataSource = new LocalMetadataSource();
  const searchService = new SearchService();
  const exploreQueryService = new ExploreQueryService({ searchService });

  const navigation = new NavigationFeature({ root });
  const home = new HomeFeature({ root, contentSource });
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
      void home.boot();
      explore.boot();

      window.ZenBlog = {
        version: VERSION,
        navigation,
        home,
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
      home.destroy();
      explore.destroy();
      delete document.documentElement.dataset.zenBooted;
      delete window.ZenBlog;
    }
  };
}
