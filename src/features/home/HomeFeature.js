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

function excerpt(value, max = 320) {
  const text = plainText(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

function isHomepageDocument() {
  return document.body.classList.contains('homepage-view')
    || location.pathname === '/'
    || location.pathname === '/index.html';
}

function fallbackMarkup() {
  return `
    <div class="zen-home-workspace zen-home-workspace-single">
      <div class="zen-home-panel-overview">
        <section class="zen-home-statement" aria-labelledby="zen-home-intro-title">
          <p class="zen-kicker">SOBERANÍA · CONSTITUCIÓN · ESTADO</p>
          <h1 id="zen-home-intro-title">Seguir el origen, los límites y el ejercicio del poder.</h1>
          <p>Conceptos, normas, documentos y análisis organizados para situar, relacionar y verificar cada afirmación.</p>
          <div class="zen-home-quick-actions">
            <a class="zen-text-button" data-zen-route="zen-explore" href="#zen-explore">Explorar el sistema →</a>
          </div>
        </section>
        <section aria-label="Lectura destacada" class="zen-home-feature-slot">
          <article class="zen-feature" data-zen-home-feature>
            <div class="zen-feature-eyebrow"><span class="zen-kicker">DESTACADO</span></div>
            <p class="zen-feature-loading">Cargando lectura destacada…</p>
          </article>
        </section>
      </div>
    </div>`;
}

export class HomeFeature {
  constructor({ root = document, contentSource } = {}) {
    this.root = root;
    this.contentSource = contentSource;
    this.target = null;
    this.surface = null;
    this.createdSurface = false;
  }

  ensureSurface() {
    this.surface = this.target.querySelector('[data-zen-home-surface]');
    if (this.surface) return;

    this.surface = document.createElement('div');
    this.surface.className = 'zen-home-surface';
    this.surface.setAttribute('data-zen-home-surface', 'true');
    this.surface.innerHTML = fallbackMarkup();
    this.target.prepend(this.surface);
    this.createdSurface = true;
  }

  renderFeatured(post) {
    const feature = this.surface?.querySelector('[data-zen-home-feature]');
    if (!feature) return;

    if (!post) {
      feature.innerHTML = `
        <div class="zen-feature-eyebrow"><span class="zen-kicker">DESTACADO</span></div>
        <p class="zen-feature-loading">Aún no hay una lectura disponible.</p>`;
      return;
    }

    const summary = excerpt(post.summary || post.content || '');
    const summaryMarkup = summary
      ? `<p class="zen-feature-snippet">${escapeHtml(summary)}</p>`
      : '';

    feature.innerHTML = `
      <div class="zen-feature-eyebrow"><span class="zen-kicker">DESTACADO</span></div>
      <h2 class="zen-feature-title"><a href="${escapeHtml(post.url)}">${escapeHtml(post.title)}</a></h2>
      ${summaryMarkup}
      <div class="zen-feature-actions">
        <a class="zen-primary-action" href="${escapeHtml(post.url)}">Leer</a>
      </div>`;
  }

  async boot() {
    if (!isHomepageDocument()) return;

    this.target = this.root.querySelector('#zen-home');
    if (!this.target) return;

    this.ensureSurface();
    this.target.dataset.homeEnhanced = 'true';

    try {
      const posts = await this.contentSource.listPosts();
      this.renderFeatured(posts[0] ?? null);
    } catch {
      this.renderFeatured(null);
    }
  }

  destroy() {
    if (this.createdSurface) this.surface?.remove();
    if (this.target) delete this.target.dataset.homeEnhanced;
    this.surface = null;
    this.target = null;
    this.createdSurface = false;
  }
}
