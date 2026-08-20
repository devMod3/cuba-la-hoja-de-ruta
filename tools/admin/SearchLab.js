import { BloggerFeedSource } from '../../src/adapters/blogger/BloggerFeedSource.js';
import { loadZenSearchCore } from './search-core-loader.js';

const ROOT_ID = 'zen-search-lab-root';

function emptyMetadata(post) {
  return {
    contractVersion: '1.0.0',
    identity: { postId: String(post.id), canonicalUrl: String(post.url) },
    title: String(post.title || '(sin título)'),
    classification: { primaryPillar: null, relatedPillars: [], type: null },
    temporal: { publishedAt: post.publishedAt ?? null, updatedAt: post.updatedAt ?? null, documentYear: null, period: null },
    indexing: { concepts: [], norms: [], aliases: [], keywords: [] },
    editorial: { status: null, revision: null }
  };
}

export function canonicalMetadataFor(post, registry) {
  const base = emptyMetadata(post);
  const source = registry?.records?.[String(post.id)] ?? {};
  return {
    ...base,
    ...source,
    identity: { ...base.identity, ...(source.identity ?? {}) },
    classification: {
      ...base.classification,
      ...(source.classification ?? {}),
      relatedPillars: Array.isArray(source.classification?.relatedPillars) ? [...source.classification.relatedPillars] : []
    },
    temporal: { ...base.temporal, ...(source.temporal ?? {}) },
    indexing: {
      ...base.indexing,
      ...(source.indexing ?? {}),
      concepts: Array.isArray(source.indexing?.concepts) ? [...source.indexing.concepts] : [],
      norms: Array.isArray(source.indexing?.norms) ? [...source.indexing.norms] : [],
      aliases: Array.isArray(source.indexing?.aliases) ? [...source.indexing.aliases] : [],
      keywords: Array.isArray(source.indexing?.keywords) ? [...source.indexing.keywords] : []
    },
    editorial: { ...base.editorial, ...(source.editorial ?? {}) }
  };
}

function htmlToContent(html) {
  const doc = new DOMParser().parseFromString(String(html ?? ''), 'text/html');
  return {
    headings: [...doc.querySelectorAll('h2, h3')].map((h) => h.textContent?.trim()).filter(Boolean),
    bodyText: doc.body?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  };
}

function options(items, empty) {
  return `<option value="">${empty}</option>${items.map((x) => `<option value="${x.id}">${x.label}</option>`).join('')}`;
}

const REASON_LABELS = {
  titleExact: 'Título exacto', titlePrefix: 'Prefijo de título', titlePhrase: 'Frase en título', titleToken: 'Palabra en título',
  conceptExact: 'Concepto exacto', conceptAlias: 'Alias de concepto', normExact: 'Norma exacta', normAlias: 'Alias de norma',
  articleReference: 'Referencia de artículo', metadataLabel: 'Metadata controlada', aliasExact: 'Alias documental exacto',
  aliasToken: 'Alias documental', keywordExact: 'Keyword exacta', keywordToken: 'Keyword', bodyPhrase: 'Frase en cuerpo',
  bodyToken: 'Palabra en cuerpo', filterOnly: 'Filtro estructurado'
};

export class SearchLab {
  constructor({ metadataManager = window.ZenMetadataManager, contentSource = new BloggerFeedSource() } = {}) {
    this.metadataManager = metadataManager;
    this.contentSource = contentSource;
    this.mount = null;
    this.posts = [];
    this.core = null;
    this.coreModule = null;
    this.onMetadataChanged = this.onMetadataChanged.bind(this);
  }

  ensureMount() {
    this.mount = document.getElementById(ROOT_ID);
    if (this.mount) return;
    this.mount = document.createElement('section');
    this.mount.id = ROOT_ID;
    this.mount.hidden = true;
    this.mount.setAttribute('aria-label', 'Search Lab');
    document.body.appendChild(this.mount);
  }

  renderShell() {
    const v = this.coreModule.ZEN_VOCABULARY_V1;
    this.mount.innerHTML = `
      <div class="zsl-shell">
        <header class="zsl-header">
          <div><small>ZenBlog Admin · Search Core v1</small><strong>Search Lab</strong></div>
          <div class="zsl-header-actions">
            <button type="button" data-zsl-action="metadata">Metadata</button>
            <button type="button" data-zsl-action="refresh">Actualizar índice</button>
          </div>
        </header>
        <section class="zsl-controls">
          <label class="zsl-query"><span>Consulta</span><input id="zsl-query" type="search" autocomplete="off" placeholder='C40 art 40 · "continuidad juridica" · pueblo -legitimidad'/></label>
          <div class="zsl-filters">
            <label><span>Pilar</span><select id="zsl-pillar">${options(v.pillars, 'Todos')}</select></label>
            <label><span>Tipo</span><select id="zsl-type">${options(v.types, 'Todos')}</select></label>
            <label><span>Desde</span><input id="zsl-year-from" type="number" min="1500" max="2200" placeholder="1940"/></label>
            <label><span>Hasta</span><input id="zsl-year-to" type="number" min="1500" max="2200" placeholder="1959"/></label>
            <label><span>Estado</span><select id="zsl-status">${options(v.statuses, 'Todos')}</select></label>
          </div>
          <div class="zsl-runbar"><button class="primary" type="button" data-zsl-action="run">Ejecutar búsqueda</button><span id="zsl-index-status">Índice sin cargar.</span></div>
        </section>
        <main class="zsl-results" id="zsl-results" aria-live="polite"><div class="zsl-empty">Escribe una consulta o aplica filtros para inspeccionar el motor documental.</div></main>
      </div>`;

    this.mount.addEventListener('click', (event) => void this.onClick(event));
    this.mount.querySelector('#zsl-query')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); this.run(); }
    });
  }

  installMetadataEntryPoint() {
    const header = document.querySelector('#zen-metadata-manager-root .zmm-header');
    if (!header || header.querySelector('[data-open-search-lab]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'zmm-head-action';
    button.dataset.openSearchLab = 'true';
    button.textContent = 'Search Lab';
    button.addEventListener('click', () => void this.open());
    header.insertBefore(button, header.querySelector('.zmm-close'));
  }

  rebuildCore() {
    const registry = this.metadataManager?.getRegistry?.() ?? { records: {} };
    const { SearchDocument, createZenSearchCore, ZEN_VOCABULARY_V1, DOCUMENTARY_RANKING_V1 } = this.coreModule;
    const documents = this.posts.map((post) => new SearchDocument({
      id: post.id,
      url: post.url,
      title: post.title,
      metadata: canonicalMetadataFor(post, registry),
      content: htmlToContent(post.content || post.summary || '')
    }));
    this.core = createZenSearchCore({ documents, vocabulary: ZEN_VOCABULARY_V1, rankingConfig: DOCUMENTARY_RANKING_V1 });
  }

  async refresh() {
    const status = this.mount.querySelector('#zsl-index-status');
    status.textContent = 'Leyendo artículos y metadata…';
    this.posts = await this.contentSource.listPosts();
    this.rebuildCore();
    status.textContent = `${this.posts.length} artículos indexados.`;
  }

  parsedQuery() {
    const q = this.core.queryParser.parse(this.mount.querySelector('#zsl-query').value);
    q.filters.pillar = this.mount.querySelector('#zsl-pillar').value || null;
    q.filters.type = this.mount.querySelector('#zsl-type').value || null;
    q.filters.status = this.mount.querySelector('#zsl-status').value || null;
    q.filters.yearFrom = Number(this.mount.querySelector('#zsl-year-from').value) || null;
    q.filters.yearTo = Number(this.mount.querySelector('#zsl-year-to').value) || null;
    return q;
  }

  run() {
    if (!this.core) return;
    const q = this.parsedQuery();
    const hasText = Boolean(q.normalized || q.phrases.length || q.tokens.length || q.negatives.length);
    const hasFilters = Object.values(q.filters).some((x) => x !== null && x !== '');
    this.renderResults(hasText || hasFilters ? this.core.service.search(q) : []);
  }

  renderResults(results) {
    const target = this.mount.querySelector('#zsl-results');
    target.replaceChildren();
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'zsl-empty';
      empty.textContent = '0 resultados. Revisa la consulta, los filtros o la metadata del documento.';
      target.appendChild(empty);
      return;
    }
    const summary = document.createElement('div');
    summary.className = 'zsl-summary';
    summary.textContent = `${results.length} resultado${results.length === 1 ? '' : 's'} · relevancia documental`;
    target.appendChild(summary);

    for (const result of results) {
      const article = document.createElement('article');
      article.className = 'zsl-result';
      const top = document.createElement('div');
      top.className = 'zsl-result-top';
      const link = document.createElement('a');
      link.href = result.document.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = result.document.title;
      const score = document.createElement('strong');
      score.className = 'zsl-score';
      score.textContent = String(result.score);
      top.append(link, score);
      article.appendChild(top);

      const m = result.document.metadata;
      const meta = document.createElement('div');
      meta.className = 'zsl-result-meta';
      meta.textContent = [m.classification.primaryPillar || 'sin pilar', m.classification.type || 'sin tipo', m.temporal.documentYear || 'sin año documental'].join(' · ');
      article.appendChild(meta);

      const reasons = document.createElement('ul');
      reasons.className = 'zsl-reasons';
      result.reasons.forEach((reason) => {
        const li = document.createElement('li');
        li.textContent = `${REASON_LABELS[reason.kind] ?? reason.kind}${reason.value ? ` · ${reason.value}` : ''}`;
        reasons.appendChild(li);
      });
      article.appendChild(reasons);
      target.appendChild(article);
    }
  }

  async open() {
    this.metadataManager?.close?.();
    this.mount.hidden = false;
    if (!this.core) await this.refresh();
    this.mount.querySelector('#zsl-query')?.focus();
  }

  closeToMetadata() {
    this.mount.hidden = true;
    this.metadataManager?.open?.();
  }

  async onClick(event) {
    const action = event.target instanceof Element ? event.target.closest('[data-zsl-action]')?.dataset.zslAction : null;
    if (action === 'metadata') this.closeToMetadata();
    if (action === 'refresh') await this.refresh();
    if (action === 'run') this.run();
  }

  onMetadataChanged() {
    if (!this.posts.length) return;
    this.rebuildCore();
    if (!this.mount.hidden) this.run();
  }

  async mountFeature() {
    this.coreModule = await loadZenSearchCore();
    this.ensureMount();
    this.renderShell();
    this.installMetadataEntryPoint();
    document.addEventListener('zenmetadata:changed', this.onMetadataChanged);
  }
}
