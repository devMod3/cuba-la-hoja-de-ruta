import {
  bloggerSnapshotArticles,
  getBloggerSnapshotArticleById
} from '@zenblog/content-snapshot';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { bloggerHtmlToPlainText } from '../../../adapters/blogger-html-to-text';

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

  return {
    title: article.title,
    alternates: { canonical: article.url },
    robots: { index: false, follow: true },
    openGraph: {
      type: 'article',
      title: article.title,
      url: article.url,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt ?? undefined
    }
  };
}

export default async function ArticlePreviewPage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = getBloggerSnapshotArticleById(id);
  if (!article) notFound();

  const paragraphs = bloggerHtmlToPlainText(article.content).split(/\n{2,}/).filter(Boolean);

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

        <div className="article-preview-copy">
          {paragraphs.map((paragraph, index) => (
            <p key={`${article.id}-${index}`}>{paragraph}</p>
          ))}
        </div>

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
