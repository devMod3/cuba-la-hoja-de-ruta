const TABS = Object.freeze([
  { id: 'metadata', label: 'Metadata' },
  { id: 'search', label: 'Search Lab' },
  { id: 'about', label: 'Acerca de' },
  { id: 'inspector', label: 'Inspector' }
]);

function button(tab) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'zas-tab';
  el.dataset.zasTab = tab.id;
  el.setAttribute('role', 'tab');
  el.setAttribute('aria-controls', `zas-pane-${tab.id}`);
  el.textContent = tab.label;
  return el;
}

export class AdminShell {
  constructor({ metadataManager, searchLab, aboutManager, inspectorController } = {}) {
    this.metadataManager = metadataManager;
    this.searchLab = searchLab;
    this.aboutManager = aboutManager;
    this.inspector = inspectorController;
    this.root = null;
    this.content = null;
    this.activeTab = 'metadata';
    this.panes = new Map();
    this.onClick = this.onClick.bind(this);
  }

  build() {
    const root = document.createElement('div');
    root.id = 'zen-admin-shell';
    root.innerHTML = `
      <header class="zas-header">
        <a class="zas-brand" href="/" target="_blank" rel="noopener" aria-label="Abrir La hoja de ruta">
          <span class="zas-mark" aria-hidden="true">HR</span>
          <span><strong>ZenBlog Admin</strong><small>La hoja de ruta</small></span>
        </a>
        <nav class="zas-tabs" role="tablist" aria-label="Herramientas de administración"></nav>
        <a class="zas-site-link" href="/" target="_blank" rel="noopener">Sitio ↗</a>
      </header>
      <main class="zas-content" id="zas-content"></main>`;

    const tabs = root.querySelector('.zas-tabs');
    const content = root.querySelector('#zas-content');
    TABS.forEach((tab) => {
      tabs.appendChild(button(tab));
      const pane = document.createElement('section');
      pane.id = `zas-pane-${tab.id}`;
      pane.className = 'zas-pane';
      pane.dataset.zasPane = tab.id;
      pane.setAttribute('role', 'tabpanel');
      pane.setAttribute('aria-label', tab.label);
      pane.hidden = tab.id !== this.activeTab;
      content.appendChild(pane);
      this.panes.set(tab.id, pane);
    });

    this.root = root;
    this.content = content;
    document.body.appendChild(root);
    root.addEventListener('click', this.onClick);
    return this;
  }

  adoptModules() {
    const metadataRoot = document.getElementById('zen-metadata-manager-root');
    const searchRoot = this.searchLab?.mount ?? document.getElementById('zen-search-lab-root');
    const aboutRoot = this.aboutManager?.root ?? document.getElementById('zen-about-manager-root');
    if (!metadataRoot || !searchRoot || !aboutRoot) throw new Error('AdminShell: faltan módulos para montar');

    this.panes.get('metadata').appendChild(metadataRoot);
    this.panes.get('search').appendChild(searchRoot);
    this.panes.get('about').appendChild(aboutRoot);
    this.renderInspectorPane();
    return this;
  }

  renderInspectorPane() {
    const pane = this.panes.get('inspector');
    pane.innerHTML = `
      <div class="zas-tool-page">
        <header class="zas-tool-head">
          <div><small>Herramienta de autoría</small><h1>Inspector</h1></div>
          <label class="zas-switch-row" for="zas-inspector-switch">
            <span><strong>Inspector</strong><small>Intercepta clics en el sitio para identificar elementos.</small></span>
            <span class="zas-switch"><input id="zas-inspector-switch" type="checkbox" role="switch"><i aria-hidden="true"></i></span>
          </label>
        </header>
        <section class="zas-inspector-info">
          <p>Actívalo aquí y abre el sitio. Con Inspector ON, un clic selecciona el elemento en vez de ejecutar su acción. Alt+I también alterna el estado.</p>
          <div class="zas-inspector-state"><span>Estado</span><strong id="zas-inspector-state">OFF</strong></div>
          <a class="zas-primary-link" href="/" target="_blank" rel="noopener">Abrir sitio para inspeccionar ↗</a>
        </section>
      </div>`;

    const toggle = pane.querySelector('#zas-inspector-switch');
    toggle.checked = Boolean(this.inspector?.enabled);
    toggle.addEventListener('change', () => this.setInspector(toggle.checked));
    this.syncInspectorState();
  }

  setInspector(enabled) {
    this.inspector?.setEnabled(Boolean(enabled));
    this.syncInspectorState();
  }

  syncInspectorState() {
    const toggle = this.root?.querySelector('#zas-inspector-switch');
    const state = this.root?.querySelector('#zas-inspector-state');
    const enabled = Boolean(this.inspector?.enabled);
    if (toggle) toggle.checked = enabled;
    if (state) state.textContent = enabled ? 'ON' : 'OFF';
  }

  async activate(tab) {
    if (!this.panes.has(tab)) return;
    this.activeTab = tab;
    this.root.querySelectorAll('[data-zas-tab]').forEach((el) => {
      const active = el.dataset.zasTab === tab;
      el.setAttribute('aria-selected', active ? 'true' : 'false');
      el.tabIndex = active ? 0 : -1;
    });
    this.panes.forEach((pane, id) => { pane.hidden = id !== tab; });

    if (tab === 'metadata') {
      if (this.searchLab?.mount) this.searchLab.mount.hidden = true;
      if (this.aboutManager?.root) this.aboutManager.root.hidden = true;
      this.metadataManager?.open?.();
    } else if (tab === 'search') {
      this.metadataManager?.close?.();
      if (this.aboutManager?.root) this.aboutManager.root.hidden = true;
      await this.searchLab?.open?.();
    } else if (tab === 'about') {
      this.metadataManager?.close?.();
      if (this.searchLab?.mount) this.searchLab.mount.hidden = true;
      await this.aboutManager?.open?.();
    } else {
      this.metadataManager?.close?.();
      if (this.searchLab?.mount) this.searchLab.mount.hidden = true;
      if (this.aboutManager?.root) this.aboutManager.root.hidden = true;
      this.syncInspectorState();
    }
  }

  onClick(event) {
    const tab = event.target instanceof Element ? event.target.closest('[data-zas-tab]')?.dataset.zasTab : null;
    if (tab) void this.activate(tab);
  }

  async mount() {
    this.build().adoptModules();
    await this.activate('metadata');
    window.addEventListener('storage', (event) => {
      if (event.key === 'zenInspector.enabled') this.syncInspectorState();
    });
    document.addEventListener('zeninspector:changed', () => this.syncInspectorState());
    return this;
  }
}
