import { articles } from '@zenblog/content-catalog';
import type { MetadataRoute } from 'next';
import { articleUrl, siteUrl } from '../lib/site-address';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const fixedRoutes: MetadataRoute.Sitemap = ['/', '/explorar/', '/acerca-de/'].map((path) => ({
    url: siteUrl(path),
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.7
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: articleUrl(article.id),
    ...(article.updatedAt ? { lastModified: new Date(article.updatedAt) } : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.8
  }));

  return [...fixedRoutes, ...articleRoutes];
}
