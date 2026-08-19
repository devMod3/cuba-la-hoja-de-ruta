const ARTICLE_ROUTE = 'zen-article';
const SHELL_ROUTES = new Set(['zen-home', 'zen-explore', 'zen-about']);

function isPlainPrimaryClick(event) {
  return event.button === 0
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function plainText(value) {
  if (!value) return '';
  const parsed = new DOMParser().parseFromString(String(value), 'text/html');
  return (parsed.body?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function canonicalPath(value, base = location.href) {
  const url = new URL(value, base);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  return pathname;
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('es', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(value));
  } catch {
    return String(value).slice(0, 10);
  }
}

function labelValue(labels, prefix) {
  const normalizedPrefix = `${prefix.toLocaleLowerCase('es')}/`;
  const match = (labels ?? []).find((label) =>
    String(label).toLocaleLowerCase('es').startsWith(normalizedPrefix)
  );
  return match ? String(match).slice(prefix.length + 1) : '';
}

function routeFromHash(hash = location.hash) {
  const route = String(hash).replace(/^#/, '');
  return SHELL_ROUTES.has(route) ? route : 'zen-home';
}

export function isBloggerPostPath(pathname) {
  return /^\/\d{4}\/\d{2}\/[^/]+\.html$/i.test(String(pathname ?? ''));
}

export function slugifyHeading(value) {
  const slug = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return slug || 'seccion';
}

export function estimateReadingMinutes(text, wordsPerMinute = 220) {
  const words = String(text ?? '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export class ArticleFeature {
  constructor({ root = document, contentSource, navigation } = {}) {
    this.root = root;
    this.contentSource = contentSource;
    this.navigation = navigation;
    this.mount = null;
    this.shell = null;
    this.postsPromise = null;
    this.postsByPath = new Map();
    this.currentPost = null;
    this.startedOnItemDocument = false;
    this.createdMount = false;

    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onMountClick = this.onMountClick.bind(this);
    this.onPopState = this.onPopState.bind(this);
    this.onRouteChanged = this.onRouteChanged.bind(this);
    this.updateReadingState = this.updateReadingState.bind(this);
  }

  ensureMount() {
    this.mount = this.root.querySelector('#zen-article');
    if (this.mount) return;

    const app = this.root.querySelector('#zen-app');
    if (!app) return;

    this.mount = document.createElement('section');
    this.mount.id = 'zen-article';
    this.mount.className = 'zen-view';
    this.mount.dataset.zenView = 'article';
    this.mount.setAttribute('aria-label', 'Artículo');
    this.mount.setAttribute('aria-hidden', 'true');
    this.mount.hidden = true;
    app.append(this.mount);
    this.createdMount = true;
  }

  loadPosts() {
    if (this.postsPromise) return this.postsPromise;

    this.postsPromise = this.contentSource.listPosts().then((posts) => {
      this.postsByPath.clear();
      for (const post of posts) {
        if (!post?.url) continue;
        this.postsByPath.set(canonicalPath(post.url), post);
      }
      return posts;
    });

    return this.postsPromise;
  }

  async findPost(url) {
    await this.loadPosts();
    return this.postsByPath.get(canonicalPath(url)) ?? null;
  }

  render(post) {
    if (!this.mount) return;

    const content = post.content || post.summary || '<p>Este documento no contiene cuerpo de lectura.</p>';
    const contentText = plainText(content);
    const summary = plainText(post.summary || '');
    const minutes = estimateReadingMinutes(contentText);
    const published = formatDate(post.publishedAt);
    const type = labelValue(post.labels, 'Tipo');
    const pillar = labelValue(post.labels, 'Pilar');
    const identity = [type, pillar].filter(Boolean);
    const labels = (post.labels ?? []).filter(Boolean);

    const identityMarkup = identity.length
      ? `<div class="zen-article-identity">${identity.map((item, index) => `${index ? '<span aria-hidden="true" class="zen-identity-divider">·</span>' : ''}<span class="${index === 0 ? 'zen-article-type' : 'zen-article-pillar'}">${escapeHtml(item)}</span>`).join('')}</div>`
      : '';

    const deckMarkup = summary
      ? `<p class="zen-deck">${escapeHtml(summary)}</p>`
      : '';

    const labelMarkup = labels.length
      ? `<div class="zen-article-matters"><p class="zen-rail-title">MATERIAS</p><p class="zen-labels">${labels.map((label) => `<span>${escapeHtml(label)}</span>`).join('')}</p></div>`
      : '';

    this.mount.innerHTML = `
      <progress aria-label="Progreso de lectura" class="zen-reading-progress" max="100" value="0">0%</progress>
      <div class="zen-article-layout">
        <article class="zen-article">
          <header class="zen-article-header">
            ${identityMarkup}
            <h1>${escapeHtml(post.title)}</h1>
            ${deckMarkup}
            <div class="zen-article-summary">
              ${published ? `<time datetime="${escapeHtml(post.publishedAt ?? '')}">${escapeHtml(published)}</time>` : ''}
              <span>${minutes} min de lectura</span>
            </div>
            <button class="zen-article-toc-toggle" data-action="toc-open" type="button" hidden>Índice</button>
          </header>

          <div class="zen-article-body" id="zen-article-body">
            <div class="post-body">${content}</div>
          </div>

          <footer class="zen-article-footer">
            <div class="zen-article-footer-main">
              ${labelMarkup}
              <div class="zen-article-actions">
                <button class="zen-text-button" data-action="copy-reference" type="button">Copiar referencia</button>
                <button class="zen-text-button" data-action="print" type="button">Imprimir</button>
              </div>
            </div>
          </footer>
        </article>

        <aside aria-label="Índice y contexto" class="zen-article-rail">
          <button aria-label="Cerrar índice" class="zen-rail-close" data-action="toc-close" type="button">Cerrar</button>
          <section class="zen-rail-section">
            <p class="zen-rail-title">EN ESTE DOCUMENTO</p>
            <nav class="zen-article-toc" aria-label="Índice del artículo"></nav>
          </section>
        </aside>
      </div>`;

    this.buildToc();
  }

  buildToc() {
    const body = this.mount?.querySelector('#zen-article-body');
    const toc = this.mount?.querySelector('.zen-article-toc');
    const rail = this.mount?.querySelector('.zen-article-rail');
    const toggle = this.mount?.querySelector('.zen-article-toc-toggle');
    const layout = this.mount?.querySelector('.zen-article-layout');
    if (!body || !toc || !rail || !toggle || !layout) return;

    const headings = [...body.querySelectorAll('h2, h3')]
      .filter((heading) => heading.textContent?.trim());

    const used = new Map();
    toc.replaceChildren();

    for (const heading of headings) {
      const base = slugifyHeading(heading.textContent);
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      if (!heading.id) heading.id = count ? `${base}-${count + 1}` : base;

      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.trim();
      link.dataset.level = heading.tagName.toLowerCase();
      toc.append(link);
    }

    const hasToc = headings.length > 0;
    rail.hidden = !hasToc;
    toggle.hidden = !hasToc;
    layout.classList.toggle('zen-article-layout-single', !hasToc);
    this.mount.dataset.hasToc = hasToc ? 'true' : 'false';
  }

  activate(post, { scrollTop = true } = {}) {
    if (!this.mount) return;

    this.root.querySelectorAll('[data-zen-view]').forEach((view) => {
      const active = view === this.mount;
      view.hidden = !active;
      view.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    this.root.querySelectorAll('[data-zen-route]').forEach((link) => {
      link.setAttribute('aria-current', 'false');
    });

    this.currentPost = post;
    this.shell?.removeAttribute('data-toc-open');
    document.documentElement.dataset.zenRoute = ARTICLE_ROUTE;
    document.dispatchEvent(new CustomEvent('zenroute:changed', {
      detail: { route: ARTICLE_ROUTE, postId: post.id }
    }));

    if (scrollTop) window.scrollTo({ top: 0, behavior: 'auto' });
    this.updateReadingState();
  }

  deactivate() {
    this.currentPost = null;
    this.shell?.removeAttribute('data-toc-open');
  }

  async open(url, { history = 'push', scrollTop = true } = {}) {
    const post = await this.findPost(url);
    if (!post) return false;

    if (history === 'push' && canonicalPath(location.href) !== canonicalPath(post.url)) {
      window.history.pushState({ zenArticleId: post.id }, '', post.url);
    } else if (history === 'replace') {
      window.history.replaceState({ zenArticleId: post.id }, '', post.url);
    }

    this.render(post);
    this.activate(post, { scrollTop });
    return true;
  }

  onDocumentClick(event) {
    if (event.defaultPrevented || !isPlainPrimaryClick(event)) return;

    const link = event.target instanceof Element
      ? event.target.closest('a[href]')
      : null;
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !isBloggerPostPath(url.pathname)) return;

    event.preventDefault();
    void this.open(url.href, { history: 'push' }).then((opened) => {
      if (!opened) location.assign(url.href);
    }).catch((error) => {
      console.error('[ZenBlog/Article] No se pudo abrir el artículo', error);
      location.assign(url.href);
    });
  }

  onMountClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const action = target.closest('[data-action]')?.getAttribute('data-action');
    if (action === 'toc-open') {
      this.shell?.setAttribute('data-toc-open', 'true');
      return;
    }
    if (action === 'toc-close') {
      this.shell?.removeAttribute('data-toc-open');
      return;
    }
    if (action === 'print') {
      window.print();
      return;
    }
    if (action === 'copy-reference' && this.currentPost) {
      const reference = `${this.currentPost.title} — ${this.currentPost.url}`;
      void navigator.clipboard?.writeText(reference);
      return;
    }

    const tocLink = target.closest('.zen-article-toc a[href^="#"]');
    if (!tocLink) return;
    event.preventDefault();
    const id = decodeURIComponent(tocLink.getAttribute('href').slice(1));
    const heading = this.mount?.querySelector(`#${CSS.escape(id)}`);
    if (!heading) return;
    heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.shell?.removeAttribute('data-toc-open');
  }

  onPopState() {
    if (isBloggerPostPath(location.pathname)) {
      void this.open(location.href, { history: 'none', scrollTop: false });
      return;
    }

    this.deactivate();
    this.navigation?.apply(routeFromHash());
  }

  onRouteChanged(event) {
    const route = event?.detail?.route;
    if (!SHELL_ROUTES.has(route) || !this.currentPost) return;

    this.deactivate();

    // If the article was opened inside the homepage shell, normalize the URL
    // back to the shell route without a document reload. Direct article loads
    // keep Blogger's native URL as the safe fallback.
    if (!this.startedOnItemDocument && isBloggerPostPath(location.pathname)) {
      window.history.replaceState({}, '', `/#${route}`);
    }
  }

  updateReadingState() {
    if (!this.currentPost || !this.mount || this.mount.hidden) return;

    const body = this.mount.querySelector('#zen-article-body');
    const progress = this.mount.querySelector('.zen-reading-progress');
    if (!body || !progress) return;

    const top = body.getBoundingClientRect().top + window.scrollY;
    const available = Math.max(1, body.offsetHeight - window.innerHeight * 0.72);
    const travelled = Math.max(0, window.scrollY - top + window.innerHeight * 0.18);
    progress.value = Math.min(100, (travelled / available) * 100);

    const headings = [...body.querySelectorAll('h2[id], h3[id]')];
    if (!headings.length) return;

    const threshold = Math.min(180, window.innerHeight * 0.22);
    let active = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= threshold) active = heading;
      else break;
    }

    this.mount.querySelectorAll('.zen-article-toc a').forEach((link) => {
      link.setAttribute('aria-current', link.getAttribute('href') === `#${active.id}` ? 'true' : 'false');
    });
  }

  boot() {
    this.ensureMount();
    if (!this.mount) return;

    this.shell = this.root.querySelector('#zen-blog-prototype');
    this.startedOnItemDocument = document.body.classList.contains('item-view');

    document.addEventListener('click', this.onDocumentClick);
    document.addEventListener('zenroute:changed', this.onRouteChanged);
    this.mount.addEventListener('click', this.onMountClick);
    window.addEventListener('popstate', this.onPopState);
    window.addEventListener('scroll', this.updateReadingState, { passive: true });
    window.addEventListener('resize', this.updateReadingState, { passive: true });

    void this.loadPosts();

    if (this.startedOnItemDocument && isBloggerPostPath(location.pathname)) {
      void this.open(location.href, { history: 'none' }).catch((error) => {
        console.error('[ZenBlog/Article] Se conserva el lector nativo de Blogger', error);
      });
    }
  }

  destroy() {
    document.removeEventListener('click', this.onDocumentClick);
    document.removeEventListener('zenroute:changed', this.onRouteChanged);
    this.mount?.removeEventListener('click', this.onMountClick);
    window.removeEventListener('popstate', this.onPopState);
    window.removeEventListener('scroll', this.updateReadingState);
    window.removeEventListener('resize', this.updateReadingState);
    this.shell?.removeAttribute('data-toc-open');
    if (this.createdMount) this.mount?.remove();
    this.currentPost = null;
    this.mount = null;
    this.shell = null;
  }
}
