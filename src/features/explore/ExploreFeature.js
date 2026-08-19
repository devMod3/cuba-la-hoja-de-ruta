export class ExploreFeature {
  constructor({ contentSource, metadataSource, exploreQueryService, root = document } = {}) {
    this.contentSource = contentSource;
    this.metadataSource = metadataSource;
    this.exploreQueryService = exploreQueryService;
    this.root = root;
    this.posts = [];
    this.registry = metadataSource.getRegistry();
    this.unsubscribe = null;
    this.bound = false;
    this.mode = 'search';
  }

  get mount() {
    return this.root.querySelector('#zen-explore');
  }

  escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  safeUrl(value) {
    try {
      const url = new URL(value, location.href);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
    } catch {
      return '#';
    }
  }

  formatDate(value) {
    if (!value) return '—';
    try {
      return new Intl.DateTimeFormat('es', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      }).format(new Date(value));
    } catch {
      return String(value).slice(0, 10);
    }
  }

  typeLabel(type) {
    const labels = {
      concepto: 'Concepto',
      analisis: 'Análisis',
      norma: 'Norma',
      documento: 'Documento',
      cronologia: 'Cronología',
      historia: 'Historia',
      dossier: 'Dossier'
    };
    return labels[type] ?? '—';
  }

  renderShell() {
    if (!this.mount || this.bound) return;

    this.mount.innerHTML = `
      <div class="zen-explore-shell">
        <header class="zen-explore-head">
          <div>
            <span class="zen-kicker">Archivo documental</span>
            <h1>Explorar</h1>
          </div>
          <strong id="archive-count" aria-live="polite">LAB · CARGANDO</strong>
        </header>

        <section id="zen-explore-search-mode" class="zen-explore-mode" aria-label="Búsqueda simple">
          <form id="zen-explore-search" class="zen-explore-search" role="search">
            <label for="zen-explore-search-input">Buscar en La hoja de ruta</label>
            <div class="zen-search-line">
              <input id="zen-explore-search-input" type="search" autocomplete="off" placeholder="Buscar por título…">
              <button id="zen-explore-search-clear" type="button" hidden aria-label="Limpiar búsqueda">×</button>
            </div>
            <div class="zen-search-actions">
              <span id="zen-search-inline-status" role="status" aria-live="polite"></span>
              <button id="zen-advanced-open" class="zen-text-action" type="button">Búsqueda avanzada</button>
            </div>
          </form>
        </section>

        <section id="zen-explore-advanced-mode" class="zen-explore-mode" hidden aria-label="Búsqueda avanzada">
          <div class="zen-advanced-toolbar">
            <button id="zen-advanced-back" class="zen-text-action zen-back-action" type="button">Buscar</button>
            <button id="zen-reset-filters" class="zen-text-action" type="button">Restablecer criterios</button>
          </div>

          <div class="zen-explore-controls">
            <label id="zen-filter-pillar-field">Pilar
              <select id="zen-filter-pillar">
                <option value="all">Todos</option>
                <option value="soberania">Soberanía</option>
                <option value="constitucion">Constitución</option>
                <option value="estado">Estado</option>
              </select>
            </label>

            <label id="zen-filter-type-field">Tipo
              <select id="zen-filter-type">
                <option value="all">Todos</option>
                <option value="concepto">Concepto</option>
                <option value="analisis">Análisis</option>
                <option value="norma">Norma</option>
                <option value="documento">Documento</option>
                <option value="cronologia">Cronología</option>
                <option value="historia">Historia</option>
                <option value="dossier">Dossier</option>
              </select>
            </label>

            <label id="zen-filter-year-field">Año documental
              <select id="zen-filter-year-mode">
                <option value="all">Todos</option>
                <option value="range">Rango</option>
              </select>
            </label>

            <label id="zen-filter-sort-field">Orden
              <select id="zen-sort-order">
                <option value="recent">Más recientes</option>
                <option value="old">Más antiguos</option>
                <option value="az">A–Z</option>
              </select>
            </label>

            <div id="zen-year-range" class="zen-year-range" hidden>
              <label id="zen-filter-year-from-field">Desde
                <input id="zen-year-from" type="number" min="1500" max="2200" inputmode="numeric" placeholder="1940">
              </label>
              <label id="zen-filter-year-to-field">Hasta
                <input id="zen-year-to" type="number" min="1500" max="2200" inputmode="numeric" placeholder="2026">
              </label>
            </div>
          </div>
        </section>

        <div id="zen-explore-status" class="zen-explore-status" role="status"></div>

        <section class="zen-results-panel" aria-label="Resultados">
          <div id="zen-results-scroll" class="zen-results-scroll">
            <div id="zen-archive-list"></div>
          </div>
        </section>
      </div>`;

    this.bind();
    this.bound = true;
  }

  bind() {
    const input = this.mount.querySelector('#zen-explore-search-input');
    const form = this.mount.querySelector('#zen-explore-search');
    const clear = this.mount.querySelector('#zen-explore-search-clear');
    const advancedOpen = this.mount.querySelector('#zen-advanced-open');
    const advancedBack = this.mount.querySelector('#zen-advanced-back');
    const reset = this.mount.querySelector('#zen-reset-filters');
    const yearMode = this.mount.querySelector('#zen-filter-year-mode');

    form.addEventListener('submit', (event) => event.preventDefault());
    input.addEventListener('input', () => this.renderResults());

    clear.addEventListener('click', () => {
      input.value = '';
      input.focus();
      this.renderResults();
    });

    advancedOpen.addEventListener('click', () => this.setMode('advanced'));
    advancedBack.addEventListener('click', () => this.setMode('search'));
    reset.addEventListener('click', () => this.resetAdvanced());

    yearMode.addEventListener('change', () => {
      this.syncYearRange();
      this.renderResults();
    });

    this.mount.querySelectorAll('#zen-explore-advanced-mode select, #zen-explore-advanced-mode input').forEach((control) => {
      if (control === yearMode) return;
      control.addEventListener('input', () => this.renderResults());
      control.addEventListener('change', () => this.renderResults());
    });
  }

  setMode(mode) {
    this.mode = mode === 'advanced' ? 'advanced' : 'search';
    const searchMode = this.mount.querySelector('#zen-explore-search-mode');
    const advancedMode = this.mount.querySelector('#zen-explore-advanced-mode');

    searchMode.hidden = this.mode !== 'search';
    advancedMode.hidden = this.mode !== 'advanced';

    if (this.mode === 'search') {
      this.mount.querySelector('#zen-explore-search-input').focus();
    }

    this.renderResults();
  }

  syncYearRange() {
    const mode = this.mount.querySelector('#zen-filter-year-mode').value;
    this.mount.querySelector('#zen-year-range').hidden = mode !== 'range';
  }

  resetAdvanced() {
    this.mount.querySelector('#zen-filter-pillar').value = 'all';
    this.mount.querySelector('#zen-filter-type').value = 'all';
    this.mount.querySelector('#zen-filter-year-mode').value = 'all';
    this.mount.querySelector('#zen-sort-order').value = 'recent';
    this.mount.querySelector('#zen-year-from').value = '';
    this.mount.querySelector('#zen-year-to').value = '';
    this.syncYearRange();
    this.renderResults();
  }

  filters() {
    const yearMode = this.mount.querySelector('#zen-filter-year-mode').value;
    return {
      pillar: this.mount.querySelector('#zen-filter-pillar').value,
      type: this.mount.querySelector('#zen-filter-type').value,
      yearFrom: yearMode === 'range' ? this.mount.querySelector('#zen-year-from').value : '',
      yearTo: yearMode === 'range' ? this.mount.querySelector('#zen-year-to').value : ''
    };
  }

  currentResults() {
    if (this.mode === 'advanced') {
      return this.exploreQueryService.filterArchive({
        posts: this.posts,
        registry: this.registry,
        filters: this.filters(),
        sort: this.mount.querySelector('#zen-sort-order').value
      });
    }

    return this.exploreQueryService.searchByTitle({
      posts: this.posts,
      query: this.mount.querySelector('#zen-explore-search-input').value
    }).map((result) => ({
      ...result,
      record: this.registry?.records?.[String(result.post.id)] ?? null
    }));
  }

  renderResults() {
    if (!this.mount) return;

    const results = this.currentResults();
    const list = this.mount.querySelector('#zen-archive-list');
    const count = this.mount.querySelector('#archive-count');
    const clear = this.mount.querySelector('#zen-explore-search-clear');
    const inlineStatus = this.mount.querySelector('#zen-search-inline-status');
    const query = this.mount.querySelector('#zen-explore-search-input').value.trim();

    count.textContent = `LAB · ${results.length} ${results.length === 1 ? 'RESULTADO' : 'RESULTADOS'}`;
    clear.hidden = !query;

    if (this.mode === 'search') {
      inlineStatus.textContent = query
        ? (results.length ? `${results.length} coincidencia${results.length === 1 ? '' : 's'}` : 'Sin coincidencias')
        : '';
    }

    if (!results.length) {
      list.innerHTML = '<p class="zen-empty">No se ha encontrado ningún resultado.</p>';
      return;
    }

    list.innerHTML = results.map(({ post, record }) => {
      const type = this.escape(this.typeLabel(record?.classification?.type));
      const url = this.escape(this.safeUrl(post.url));
      const published = this.escape(post.publishedAt ?? '');
      const title = this.escape(post.title);
      const date = this.escape(this.formatDate(post.publishedAt));

      return `
        <article class="zen-archive-row">
          <a href="${url}">
            <span class="zen-row-type">${type}</span>
            <time class="zen-row-date" datetime="${published}">${date}</time>
            <h2>${title}</h2>
            <span aria-hidden="true" class="zen-archive-row-arrow">›</span>
          </a>
        </article>`;
    }).join('');
  }

  async load() {
    const status = this.mount?.querySelector('#zen-explore-status');
    if (status) status.textContent = 'Leyendo publicaciones…';

    try {
      this.posts = await this.contentSource.listPosts();
      this.registry = this.metadataSource.getRegistry();
      if (status) status.textContent = '';
      this.renderResults();
    } catch (error) {
      console.error('[ZenBlog Explore]', error);
      if (status) status.textContent = 'No se pudo cargar el archivo documental.';
    }
  }

  boot() {
    if (!this.mount) return;
    this.renderShell();
    this.syncYearRange();
    this.load();
    this.unsubscribe = this.metadataSource.subscribe((registry) => {
      this.registry = registry;
      this.renderResults();
    });
  }

  destroy() {
    this.unsubscribe?.();
  }
}
