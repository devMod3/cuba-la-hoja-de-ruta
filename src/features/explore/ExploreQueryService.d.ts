import type {
  LegacySearchFilters,
  LegacySearchPost,
  LegacySearchResult,
  LegacySearchSort,
  SearchService
} from '../../search/SearchService.js';
import type { TextNormalizer } from '../../search/TextNormalizer.js';

export interface ExploreQueryServiceOptions {
  readonly searchService: SearchService;
  readonly normalizer?: TextNormalizer;
}

export interface ExploreTitleSearchInput<TPost extends LegacySearchPost> {
  readonly posts?: readonly TPost[];
  readonly query?: string;
}

export interface ExploreArchiveInput<TPost extends LegacySearchPost, TRegistry = unknown> {
  readonly posts?: readonly TPost[];
  readonly registry?: TRegistry;
  readonly filters?: LegacySearchFilters;
  readonly sort?: LegacySearchSort;
}

export declare class ExploreQueryService {
  constructor(options: ExploreQueryServiceOptions);

  searchByTitle<TPost extends LegacySearchPost>(
    input?: ExploreTitleSearchInput<TPost>
  ): Array<Pick<LegacySearchResult<TPost, null>, 'post' | 'record' | 'score'>>;

  filterArchive<TPost extends LegacySearchPost, TRegistry = unknown>(
    input?: ExploreArchiveInput<TPost, TRegistry>
  ): LegacySearchResult<TPost>[];
}
