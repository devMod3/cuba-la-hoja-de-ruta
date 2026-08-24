import { z } from 'zod';

export const ArticleSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  publishedAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  summary: z.string(),
  content: z.string(),
  labels: z.array(z.string())
}).readonly();

export type Article = z.infer<typeof ArticleSchema>;
