import { z } from 'zod';
import { ArticleSchema, type Article } from '@zenblog/domain';

const BloggerTextSchema = z.object({ $t: z.string() });
const BloggerEntrySchema = z.object({
  id: BloggerTextSchema.optional(),
  title: BloggerTextSchema.optional(),
  published: BloggerTextSchema.optional(),
  updated: BloggerTextSchema.optional(),
  summary: BloggerTextSchema.optional(),
  content: BloggerTextSchema.optional(),
  link: z.array(z.object({ rel: z.string().optional(), href: z.string().optional() })).default([]),
  category: z.array(z.object({ term: z.string().optional() })).default([])
}).passthrough();

export function mapBloggerEntry(input: unknown): Article {
  const entry = BloggerEntrySchema.parse(input);
  const atomId = entry.id?.$t ?? '';
  const id = atomId.match(/post-(\d+)/)?.[1] ?? atomId;
  const url = entry.link.find((item) => item.rel === 'alternate')?.href ?? '';

  return ArticleSchema.parse({
    id,
    url,
    title: entry.title?.$t || '(sin título)',
    publishedAt: entry.published?.$t ?? null,
    updatedAt: entry.updated?.$t ?? null,
    summary: entry.summary?.$t ?? '',
    content: entry.content?.$t ?? '',
    labels: entry.category.map((item) => item.term).filter((value): value is string => Boolean(value))
  });
}
