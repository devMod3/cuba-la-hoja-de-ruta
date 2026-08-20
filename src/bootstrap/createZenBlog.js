import { BloggerFeedSource } from '../adapters/blogger/BloggerFeedSource.js?v=0.4.0';
import { LocalMetadataSource } from '../adapters/metadata/LocalMetadataSource.js?v=0.4.0';
import { SearchService } from '../search/SearchService.js?v=0.4.0';
import { NavigationFeature } from '../features/navigation/NavigationFeature.js?v=0.4.0';
import { HomeFeature } from '../features/home/HomeFeature.js?v=0.4.0';
import { ExploreFeature } from '../features/explore/ExploreFeature.js?v=0.4.0';
import { ExploreQueryService } from '../features/explore/ExploreQueryService.js?v=0.4.0';
import { ArticleFeature } from '../features/article/ArticleFeature.js?v=0.4.0';

const VERSION = '0.4.0';
const MOBILE_GESTURE_QUERY = '(max-width: 900px) and (pointer: coarse)';

export function createZenBlog({ root = document } = {}) {
  const contentSource = new BloggerFeedSource();
  const metadataSource = new LocalMetadataSource();
  const searchService = new SearchService();
  const exploreQueryService = new ExploreQueryService({ searchService });

  const navigation = new NavigationFeature({ root });
  const home = new HomeFeature({ root, contentSource });
  const explore = new ExploreFeature({ root, contentSource, metadataSource, exploreQueryService });
  const article = new ArticleFeature({ root, contentSource, navigation });
  let gestures = null;
  let destroyed = false;

  async function bootOptionalGestures() {
    if (destroyed || !globalThis.matchMedia?.(MOBILE_GESTURE_QUERY).matches) return null;
    const { MobileGestureNavigation } = await import('../features/navigation/MobileGestureNavigation.js?v=0.4.0');
    if (destroyed) return null;
    gestures = new MobileGestureNavigation({ root, navigation }).boot();
    if (window.ZenBlog) window.ZenBlog.gestures = gestures;
    return gestures;
  }

  return {
    version: VERSION,
    boot() {
      if (document.documentElement.dataset.zenBooted === 'true') return;
      destroyed = false;
      document.documentElement.dataset.zenBooted = 'true';

      navigation.boot();
      void home.boot();
      explore.boot();
      article.boot();

      window.ZenBlog = {
        version: VERSION,
        navigation,
        home,
        explore,
        article,
        gestures,
        services: { searchService, exploreQueryService },
        sources: { contentSource, metadataSource }
      };

      void bootOptionalGestures();

      document.dispatchEvent(new CustomEvent('zenblog:ready', { detail: { version: VERSION } }));
    },
    destroy() {
      destroyed = true;
      gestures?.destroy();
      article.destroy();
      navigation.destroy();
      home.destroy();
      explore.destroy();
      delete document.documentElement.dataset.zenBooted;
      delete window.ZenBlog;
    }
  };
}
