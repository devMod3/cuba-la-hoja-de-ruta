export class ExploreFeature {
  constructor({ contentSource, metadataSource, searchService, root = document } = {}) {
    this.contentSource = contentSource;
    this.metadataSource = metadataSource;
    this.searchService = searchService;
    this.root = root;
    this.posts = [];
    this.registry = metadataSource.getRegistry();
    this.unsubscribe = null;
    this.bound = false;
  }

  get mount() {
    return this.root.querySelector('#zen-explore');
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
          <strong id="zen-explore-count" aria-live="polite">Cargando…</strong>
        </header>

        <form id="zen-explore-form" class="zen-explore-search" role="search">
          <label for="zen-explore-query">Buscar en La hoja de ruta</label>
          <div class="zen-search-line">
            <input id="zen-explore-query" type="search" autocomplete="off" placeholder="Pueblo, C40 art 40, soberanía popular…">
            <button id="zen-explore-clear" type="button" hidden aria-label="Limpiar búsqueda">×</button>
          </div>
        </form>

        <details class="zen-explore-advanced">
          <summary>Búsqueda avanzada</summary>
          <div class="zen-filter-grid">
            <label>Pilar
              <select id="zen-filter-pillar">
                <option value="all">Todos</option>
                <option value="soberania">Soberanía</option>
                <option value="constitucion">Constitución</option>
                <option value="estado">Estado</option>
              </select>
            </label>
            <label>Tipo
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
            <label>Desde
              <input id="zen-filter-year-from" type="number" min="1500" max="2200" inputmode="numeric" placeholder="1940">
            </label>
            <label>Hasta
              <input id="zen-filter-year-to" type="number" min="1500" max="2200" inputmode="numeric" placeholder="2026">
            </label>
            <label>Orden
              <select id="zen-filter-sort">
                <option value="recent">Más recientes</option>
                <option value="old">Más antiguos</option>
                <option value="az">A–Z</option>
                <option value="relevance">Relevancia</option>
              </select>
            </label>
          </div>
        </details>

        <div id="zen-explore-status" class="zen-explore-status" role="status"></div>
        <div class="zen-explore-results" id="zen-explore-results"></div>
      </div>`;

    this.bind();
    this.bound = true;
  }

  bind() {
    const query = this.mount.querySelector('#zen-explore-query');
    const form = this.mount.querySelector('#zen-explore-form');
    const clear = this.mount.querySelector('#zen-explore-clear');

    form.addEventListener('submit', (event) => event.preventDefault());
    query.addEventListener('input', () => this.renderResults());
    clear.addEventListener('click', () => {
      query.value = '';
      query.focus();
      this.renderResults();
    });

    this.mount.querySelectorAll('select, input[type="number"]').forEach((control) => {
      control.addEventListener('input', () => this.renderResults());
      control.addEventListener('change', () => this.renderResults());
    });
  }

  filters() {
    return {
      pillar: this.mount.querySelector('#zen-filter-pillar').value,
      type: this.mount.querySelector('#zen-filter-type').value,
      yearFrom: this.mount.querySelector('#zen-filter-year-from').value,
      yearTo: this.mount.querySelector('#zen-filter-year-to').value
    };
  }

  renderResults() {
    if (!this.mount) return;

    const query = this.mount.querySelector('#zen-explore-query').value;
    const sort = this.mount.querySelector('#zen-filter-sort').value;
    const results = this.searchService.search({
      posts: this.posts,
      registry: this.registry,
      query,
      filters: this.filters(),
      sort
    });

    const list = this.mount.querySelector('#zen-explore-results');
    const count = this.mount.querySelector('#zen-explore-count');
    const clear = this.mount.querySelector('#zen-explore-clear');

    count.textContent = `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`;
    clear.hidden = !query;

    if (!results.length) {
      list.innerHTML = '<p class="zen-empty">No se ha encontrado ningún resultado.</p>';
      return;
    }

    list.innerHTML = results.map(({ post, record }) => {
      const type = this.typeLabel(record?.classification?.type);
      return `
        <article class="zen-result-row">
          <a href="${post.url}">
            <span class="zen-row-type">${type}</span>
            <time datetime="${post.publishedAt ?? ''}">${this.formatDate(post.publishedAt)}</time>
            <h2>${post.title}</h2>
            <span aria-hidden="true" class="zen-row-arrow">›</span>
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
