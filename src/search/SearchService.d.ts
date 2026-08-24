import type { TextNormalizer } from './TextNormalizer.js';

export interface LegacySearchPost {
  readonly id: string | number;
  readonly title: string;
  readonly publishedAt?: string | null | undefined;
}

export interface LegacySearchFilters {
  readonly pillar?: string | undefined;
  readonly type?: string | undefined;
  readonly yearFrom?: number | string | undefined;
  readonly yearTo?: number | string | undefined;
}

export type LegacySearchSort = 'relevance' | 'recent' | 'old' | 'az';

export interface LegacySearchInput<TPost extends LegacySearchPost, TRegistry = unknown> {
  readonly posts?: readonly TPost[] | undefined;
  readonly registry?: TRegistry | undefined;
  readonly query?: string | undefined;
  readonly filters?: LegacySearchFilters | undefined;
  readonly sort?: LegacySearchSort | undefined;
}

export interface LegacySearchResult<TPost extends LegacySearchPost, TRecord = unknown> {
  readonly post: TPost;
  readonly record: TRecord | null;
  readonly score: number;
  readonly year: number | null;
}

export interface SearchServiceOptions {
  readonly normalizer?: TextNormalizer | undefined;
}

export declare class SearchService {
  constructor(options?: SearchServiceOptions);

  search<TPost extends LegacySearchPost, TRegistry = unknown>(
    input?: LegacySearchInput<TPost, TRegistry>
  ): LegacySearchResult<TPost>[];
}
