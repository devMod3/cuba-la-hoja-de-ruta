import { extractBloggerArticleText, prepareBloggerArticleHtml } from '@zenblog/content-renderer';
import { bloggerSnapshotArticles, getBloggerSnapshotArticleById } from '@zenblog/content-snapshot';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArticleReaderActions,
  ArticleReaderProgress
} from '../../../components/article-reader-tools';
import {
  buildArticleReference,
  createArticleDeck,
  estimateReadingMinutes,
  formatEditorialDate
} from '../../../lib/article-presentation';

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

function readingTimeLabel(minutes: number): string {
  return `${String(minutes)} min de lectura`;
}

function matterCountLabel(count: number): string {
  return `${String(count)} materia${count === 1 ? '' : 's'}`;
}

export default async function ArticlePreviewPage({ params }: ArticlePageProps) {
  const { id } = await params;
  const article = getBloggerSnapshotArticleById(id);
  if (!article) notFound();

  const preparedArticle = prepareBloggerArticleHtml(article.content);
  const summaryText = extractBloggerArticleText(article.summary);
  const deck = createArticleDeck(summaryText, preparedArticle.text);
  const readingMinutes = estimateReadingMinutes(preparedArticle.text);
  const publishedLabel = formatEditorialDate(article.publishedAt);
  const updatedLabel = formatEditorialDate(article.updatedAt);
  const referenceText = buildArticleReference({
    title: article.title,
    publishedLabel,
    url: article.url
  });

  return (
    <main
      className="article-reader-page"
      data-component="Article.Preview"
      data-reader-version="professional"
    >
      <ArticleReaderProgress />

      <article className="article-reader">
        <header className="article-reader-header">
          <p className="article-reader-breadcrumb">
            <Link href="/explorar/">Archivo</Link>
            <span aria-hidden="true">/</span>
            <span>Lectura</span>
          </p>

          <p className="kicker">Archivo documental</p>
          <h1>{article.title}</h1>
          {deck ? <p className="article-reader-deck">{deck}</p> : null}

          <ul className="article-reader-meta" aria-label="Datos de lectura">
            <li>
              <span>Publicado</span>
              {article.publishedAt && publishedLabel ? (
                <time dateTime={article.publishedAt}>{publishedLabel}</time>
              ) : (
                <strong>Sin fecha pública</strong>
              )}
            </li>
            <li>
              <span>Extensión</span>
              <strong>{readingTimeLabel(readingMinutes)}</strong>
            </li>
            <li>
              <span>Materias</span>
              <strong>{matterCountLabel(article.labels.length)}</strong>
            </li>
          </ul>
        </header>

        <div className="article-reader-layout">
          <nav className="reader-toc" aria-label="Índice del artículo">
            <div className="reader-sticky-panel">
              <p className="reader-rail-label">En este artículo</p>
              {preparedArticle.headings.length ? (
                <ol>
                  {preparedArticle.headings.map((heading) => (
                    <li key={heading.id} data-level={heading.level}>
                      <a href={`#${heading.id}`}>{heading.text}</a>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="reader-toc-empty">Lectura continua</p>
              )}
            </div>
          </nav>

          <div className="article-reader-body">
            <div
              id="article-reader-copy"
              className="article-reader-copy"
              data-sanitized-html="true"
              dangerouslySetInnerHTML={{ __html: preparedArticle.html }}
            />

            {article.labels.length ? (
              <section className="article-reader-matters" aria-labelledby="article-matters-heading">
                <p className="reader-rail-label" id="article-matters-heading">
                  Materias
                </p>
                <ul aria-label="Materias del artículo">
                  {article.labels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="article-reader-rail" aria-label="Ficha del artículo">
            <div className="reader-sticky-panel">
              <p className="reader-rail-label">Ficha</p>
              <dl className="reader-facts">
                <div>
                  <dt>Publicado</dt>
                  <dd>{publishedLabel ?? 'Sin fecha pública'}</dd>
                </div>
                <div>
                  <dt>Actualizado</dt>
                  <dd>{updatedLabel ?? 'Sin actualización pública'}</dd>
                </div>
                <div>
                  <dt>Lectura</dt>
                  <dd>{readingTimeLabel(readingMinutes)}</dd>
                </div>
              </dl>

              <ArticleReaderActions referenceText={referenceText} />

              <a className="reader-source-link" href={article.url} rel="noreferrer" target="_blank">
                Abrir fuente original ↗
              </a>
            </div>
          </aside>
        </div>
      </article>
    </main>
  );
}
