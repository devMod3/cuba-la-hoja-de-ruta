import type { TextNormalizer } from './TextNormalizer.js';

export interface LegacySearchPost {
  readonly id: string | number;
  readonly title: string;
  readonly publishedAt?: string | null;
}

export interface LegacySearchFilters {
  readonly pillar?: string;
  readonly type?: string;
  readonly yearFrom?: number | string;
  readonly yearTo?: number | string;
}

export type LegacySearchSort = 'relevance' | 'recent' | 'old' | 'az';

export interface LegacySearchInput<TPost extends LegacySearchPost, TRegistry = unknown> {
  readonly posts?: readonly TPost[];
  readonly registry?: TRegistry;
  readonly query?: string;
  readonly filters?: LegacySearchFilters;
  readonly sort?: LegacySearchSort;
}

export interface LegacySearchResult<TPost extends LegacySearchPost, TRecord = unknown> {
  readonly post: TPost;
  readonly record: TRecord | null;
  readonly score: number;
  readonly year: number | null;
}

export interface SearchServiceOptions {
  readonly normalizer?: TextNormalizer;
}

export declare class SearchService {
  constructor(options?: SearchServiceOptions);

  search<TPost extends LegacySearchPost, TRegistry = unknown>(
    input?: LegacySearchInput<TPost, TRegistry>
  ): LegacySearchResult<TPost>[];
}
