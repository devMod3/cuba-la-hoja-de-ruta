import { sanitizeBloggerArticleHtml } from '@zenblog/content-renderer';
import { bloggerSnapshotArticles, getBloggerSnapshotArticleById } from '@zenblog/content-snapshot';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type ArticlePageProps = Readonly<{ params: Promise<{ id: string }> }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return bloggerSnapshotArticles.map((article) => ({ id: article.id }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const article = getBloggerSnapshotArticleById(id);

  if (!article) {
    return {
      title: 'Artículo no encontrado',
      robots: { index: false, follow: false }
    };
  }

  const articleOpenGraph: NonNullable<Metadata['openGraph']> = {
    type: 'article',
    title: article.title,
    url: article.url,
    ...(article.publishedAt ? { publishedTime: article.publishedAt } : {}),
    ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {})
  };

  return {
    title: article.title,
    alternates: { canonical: article.url },
    robots: { index: false, follow: true },
    openGraph: articleOpenGraph
  };
}

export default async function ArticlePreviewPage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = getBloggerSnapshotArticleById(id);
  if (!article) notFound();

  const sanitizedContent = sanitizeBloggerArticleHtml(article.content);

  return (
    <main data-component="Article.Preview">
      <article className="article-preview">
        <header>
          <p className="article-preview-kicker">Vista previa de migración</p>
          <h1>{article.title}</h1>
          {article.publishedAt ? (
            <p>
              <time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time>
            </p>
          ) : null}
        </header>

        <div
          className="article-preview-copy"
          data-sanitized-html="true"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />

        {article.labels.length ? (
          <ul className="article-preview-labels" aria-label="Etiquetas">
            {article.labels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : null}

        <p>
          <a href={article.url}>Leer versión canónica en Blogger ↗</a>
        </p>
      </article>
    </main>
  );
}
