import { SiteProfileStore, SOCIAL_PLATFORMS, RESOURCE_TYPES, emptySiteProfile, canonicalizeSiteProfile } from '../about/SiteProfileStore.js';

const ROOT_ID = 'zen-about-manager-root';

function uid(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function lines(value) { return String(value ?? '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean); }
function joinLines(value) { return Array.isArray(value) ? value.join('\n') : ''; }
function optionList(items, selected = '') {
  return items.map((item) => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.label;
    option.selected = item.id === selected;
    return option;
  });
}
function field(labelText, control) {
  const label = document.createElement('label');
  label.className = 'zam-field';
  const labelNode = document.createElement('span');
  labelNode.textContent = labelText;
  label.append(labelNode, control);
  return label;
}
function input(type = 'text', placeholder = '') { const c = document.createElement('input'); c.type = type; c.placeholder = placeholder; return c; }
function textarea(placeholder = '', rows = 4) { const c = document.createElement('textarea'); c.placeholder = placeholder; c.rows = rows; return c; }

export class AboutManager {
  constructor({ store = new SiteProfileStore(), metadataManager = window.ZenMetadataManager, searchLab = null } = {}) {
    this.store = store;
    this.metadataManager = metadataManager;
    this.searchLab = searchLab;
    this.root = null;
    this.data = emptySiteProfile();
    this.activeTab = 'profile';
    this.controls = new Map();
    this.fileInput = null;
    this.onRootClick = this.onRootClick.bind(this);
    this.onRootChange = this.onRootChange.bind(this);
  }

  ensureMount() {
    this.root = document.getElementById(ROOT_ID);
    if (this.root) return;
    this.root = document.createElement('section');
    this.root.id = ROOT_ID;
    this.root.hidden = true;
    this.root.setAttribute('aria-label', 'Administrar Acerca de');
    document.body.appendChild(this.root);
  }

  buildShell() {
    this.root.innerHTML = `
      <div class="zam-shell">
        <header class="zam-header">
          <div class="zam-brand"><small>ZenBlog Admin · About v0.1</small><strong>Acerca de</strong></div>
          <div class="zam-header-actions">
            <button type="button" data-zam-action="metadata">Metadata</button>
            <button type="button" data-zam-action="search">Search Lab</button>
            <button type="button" data-zam-action="preview">Vista pública ↗</button>
            <button type="button" data-zam-action="export">Exportar</button>
            <button type="button" data-zam-action="import">Importar</button>
          </div>
        </header>
        <div class="zam-status" id="zam-status" role="status" aria-live="polite">Perfil del sitio listo.</div>
        <div class="zam-workspace">
          <nav class="zam-tabs" aria-label="Secciones de Acerca de">
            <button type="button" data-zam-tab="profile">Perfil</button>
            <button type="button" data-zam-tab="social">Redes sociales</button>
            <button type="button" data-zam-tab="resources">Recursos relacionados</button>
          </nav>
          <main class="zam-main">
            <section class="zam-panel" data-zam-panel="profile"></section>
            <section class="zam-panel" data-zam-panel="social" hidden></section>
            <section class="zam-panel" data-zam-panel="resources" hidden></section>
          </main>
        </div>
        <footer class="zam-footer"><span>zenSiteProfile.v1 · almacenamiento local</span><button class="primary" type="button" data-zam-action="save">Guardar Acerca de</button></footer>
      </div>`;

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json,application/json';
    this.fileInput.hidden = true;
    this.root.appendChild(this.fileInput);
    this.renderProfilePanel();
    this.renderSocialPanel();
    this.renderResourcesPanel();
    this.switchTab('profile');
    this.root.addEventListener('click', this.onRootClick);
    this.root.addEventListener('change', this.onRootChange);
    this.fileInput.addEventListener('change', () => {
      const file = this.fileInput.files?.[0];
      if (file) this.importFile(file);
      this.fileInput.value = '';
    });
  }

  profilePanel() { return this.root.querySelector('[data-zam-panel="profile"]'); }
  registerControl(id, control) { control.id = `zam-${id}`; this.controls.set(id, control); return control; }

  renderProfilePanel() {
    const panel = this.profilePanel();
    panel.replaceChildren();
    const intro = document.createElement('div');
    intro.className = 'zam-panel-intro';
    intro.innerHTML = '<div><small>Perfil público</small><h2>Perfil de Blogger</h2></div><p>Replica los campos del perfil público de Blogger y sólo publica los que tengan contenido.</p>';
    panel.appendChild(intro);

    const identity = document.createElement('section');
    identity.className = 'zam-group';
    identity.innerHTML = '<div class="zam-group-title"><span>Identidad y contacto</span><span>Principal</span></div>';
    const displayName = this.registerControl('displayName', input('text', 'Nombre visible'));
    const photoUrl = this.registerControl('photoUrl', input('url', 'https://…'));
    const bloggerProfileUrl = this.registerControl('bloggerProfileUrl', input('url', 'https://www.blogger.com/profile/…'));
    const email = this.registerControl('email', input('email', 'correo@ejemplo.com'));
    const website = this.registerControl('website', input('url', 'https://…'));
    identity.append(field('Nombre visible', displayName), field('URL de foto', photoUrl), field('Perfil de Blogger', bloggerProfileUrl), field('Correo electrónico', email), field('Sitio web', website));

    const about = document.createElement('section');
    about.className = 'zam-group';
    about.innerHTML = '<div class="zam-group-title"><span>Acerca de</span><span>Blogger</span></div>';
    const gender = this.registerControl('gender', input('text', 'Opcional'));
    const industry = this.registerControl('industry', input('text', 'Sector / Industria'));
    const occupation = this.registerControl('occupation', input('text', 'Ocupación'));
    const introduction = this.registerControl('introduction', textarea('Introducción / About me', 5));
    about.append(field('Género', gender), field('Sector / Industria', industry), field('Ocupación', occupation), field('Introducción', introduction));

    const location = document.createElement('section');
    location.className = 'zam-group';
    location.innerHTML = '<div class="zam-group-title"><span>Ubicación</span><span>Opcional</span></div>';
    const city = this.registerControl('city', input('text', 'Ciudad'));
    const region = this.registerControl('region', input('text', 'Estado / Región'));
    const country = this.registerControl('country', input('text', 'País'));
    const locationGrid = document.createElement('div');
    locationGrid.className = 'zam-grid-3';
    locationGrid.append(field('Ciudad', city), field('Estado / Región', region), field('País', country));
    location.appendChild(locationGrid);

    const favorites = document.createElement('details');
    favorites.className = 'zam-details';
    favorites.innerHTML = '<summary><span>Intereses y favoritos</span><small>Un elemento por línea</small></summary>';
    const favoritesBody = document.createElement('div');
    favoritesBody.className = 'zam-details-body';
    const interests = this.registerControl('interests', textarea('Constitucionalismo\nHistoria\nDerecho', 4));
    const movies = this.registerControl('favoriteMovies', textarea('Una película por línea', 4));
    const music = this.registerControl('favoriteMusic', textarea('Un artista, obra o género por línea', 4));
    const books = this.registerControl('favoriteBooks', textarea('Un libro por línea', 4));
    favoritesBody.append(field('Intereses', interests), field('Películas favoritas', movies), field('Música favorita', music), field('Libros favoritos', books));
    favorites.appendChild(favoritesBody);
    panel.append(identity, about, location, favorites);
  }

  renderSocialPanel() {
    const panel = this.root.querySelector('[data-zam-panel="social"]');
    panel.replaceChildren();
    const intro = document.createElement('div');
    intro.className = 'zam-panel-intro';
    intro.innerHTML = '<div><small>Enlaces públicos</small><h2>Redes sociales</h2></div><button type="button" data-zam-action="add-social">+ Añadir red</button>';
    panel.appendChild(intro);
    const list = document.createElement('div');
    list.className = 'zam-repeater';
    list.dataset.zamList = 'social';
    if (!this.data.social.length) { const empty = document.createElement('div'); empty.className = 'zam-empty'; empty.textContent = 'No hay redes sociales configuradas.'; list.appendChild(empty); }
    this.data.social.forEach((item, index) => {
      const row = document.createElement('article');
      row.className = 'zam-card';
      row.dataset.socialId = item.id;
      const head = document.createElement('div');
      head.className = 'zam-card-head';
      const number = document.createElement('strong'); number.textContent = `Red ${index + 1}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.zamAction = 'remove-social'; remove.dataset.id = item.id; remove.textContent = 'Eliminar';
      head.append(number, remove);
      const platform = document.createElement('select'); platform.dataset.field = 'platform'; optionList(SOCIAL_PLATFORMS, item.platform).forEach((option) => platform.appendChild(option));
      const label = input('text', 'Etiqueta personalizada'); label.dataset.field = 'label'; label.value = item.label || '';
      const username = input('text', '@usuario'); username.dataset.field = 'username'; username.value = item.username || '';
      const url = input('url', 'https://…'); url.dataset.field = 'url'; url.value = item.url || '';
      const visibleWrap = document.createElement('label'); visibleWrap.className = 'zam-check';
      const visible = document.createElement('input'); visible.type = 'checkbox'; visible.dataset.field = 'visible'; visible.checked = item.visible !== false;
      visibleWrap.append(visible, document.createTextNode(' Visible'));
      row.append(head, field('Plataforma', platform), field('Etiqueta', label), field('Usuario', username), field('URL', url), visibleWrap);
      list.appendChild(row);
    });
    panel.appendChild(list);
  }

  renderResourcesPanel() {
    const panel = this.root.querySelector('[data-zam-panel="resources"]');
    panel.replaceChildren();
    const intro = document.createElement('div');
    intro.className = 'zam-panel-intro';
    intro.innerHTML = '<div><small>Directorio editorial</small><h2>Recursos relacionados</h2></div><button type="button" data-zam-action="add-resource">+ Añadir recurso</button>';
    panel.appendChild(intro);
    const list = document.createElement('div'); list.className = 'zam-repeater'; list.dataset.zamList = 'resources';
    if (!this.data.relatedResources.length) { const empty = document.createElement('div'); empty.className = 'zam-empty'; empty.textContent = 'No hay recursos relacionados configurados.'; list.appendChild(empty); }
    this.data.relatedResources.forEach((item, index) => {
      const row = document.createElement('article'); row.className = 'zam-card'; row.dataset.resourceId = item.id;
      const head = document.createElement('div'); head.className = 'zam-card-head';
      const number = document.createElement('strong'); number.textContent = `Recurso ${index + 1}`;
      const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.zamAction = 'remove-resource'; remove.dataset.id = item.id; remove.textContent = 'Eliminar'; head.append(number, remove);
      const title = input('text', 'Nombre del recurso'); title.dataset.field = 'title'; title.value = item.title || '';
      const url = input('url', 'https://…'); url.dataset.field = 'url'; url.value = item.url || '';
      const description = textarea('Descripción breve y objetiva', 3); description.dataset.field = 'description'; description.value = item.description || '';
      const type = document.createElement('select'); type.dataset.field = 'type'; optionList(RESOURCE_TYPES, item.type).forEach((option) => type.appendChild(option));
      const visibleWrap = document.createElement('label'); visibleWrap.className = 'zam-check';
      const visible = document.createElement('input'); visible.type = 'checkbox'; visible.dataset.field = 'visible'; visible.checked = item.visible !== false; visibleWrap.append(visible, document.createTextNode(' Visible'));
      row.append(head, field('Título', title), field('URL', url), field('Descripción', description), field('Tipo', type), visibleWrap);
      list.appendChild(row);
    });
    panel.appendChild(list);
  }

  fillProfileControls() {
    const p = this.data.profile;
    const values = { displayName:p.displayName, photoUrl:p.photoUrl, bloggerProfileUrl:p.bloggerProfileUrl, email:p.email, website:p.website, gender:p.gender, industry:p.industry, occupation:p.occupation, introduction:p.introduction, city:p.location.city, region:p.location.region, country:p.location.country, interests:joinLines(p.interests), favoriteMovies:joinLines(p.favoriteMovies), favoriteMusic:joinLines(p.favoriteMusic), favoriteBooks:joinLines(p.favoriteBooks) };
    Object.entries(values).forEach(([id, value]) => { const control = this.controls.get(id); if (control) control.value = value ?? ''; });
  }

  readProfileControls() {
    const get = (id) => this.controls.get(id)?.value?.trim() ?? '';
    return { displayName:get('displayName'), photoUrl:get('photoUrl'), bloggerProfileUrl:get('bloggerProfileUrl'), email:get('email'), website:get('website'), gender:get('gender'), industry:get('industry'), occupation:get('occupation'), location:{ city:get('city'), region:get('region'), country:get('country') }, introduction:get('introduction'), interests:lines(get('interests')), favoriteMovies:lines(get('favoriteMovies')), favoriteMusic:lines(get('favoriteMusic')), favoriteBooks:lines(get('favoriteBooks')) };
  }

  syncRepeatersFromDom() {
    this.data.social = [...this.root.querySelectorAll('[data-social-id]')].map((row, index) => ({ id:row.dataset.socialId, platform:row.querySelector('[data-field="platform"]')?.value || 'other', label:row.querySelector('[data-field="label"]')?.value?.trim() || '', username:row.querySelector('[data-field="username"]')?.value?.trim() || '', url:row.querySelector('[data-field="url"]')?.value?.trim() || '', visible:Boolean(row.querySelector('[data-field="visible"]')?.checked), order:index }));
    this.data.relatedResources = [...this.root.querySelectorAll('[data-resource-id]')].map((row, index) => ({ id:row.dataset.resourceId, title:row.querySelector('[data-field="title"]')?.value?.trim() || '', url:row.querySelector('[data-field="url"]')?.value?.trim() || '', description:row.querySelector('[data-field="description"]')?.value?.trim() || '', type:row.querySelector('[data-field="type"]')?.value || 'other', visible:Boolean(row.querySelector('[data-field="visible"]')?.checked), order:index }));
  }

  collect() { this.syncRepeatersFromDom(); return canonicalizeSiteProfile({ ...this.data, profile:this.readProfileControls() }); }
  status(message, kind = 'info') { const target = this.root.querySelector('#zam-status'); if (target) { target.textContent = message; target.dataset.kind = kind; } }
  switchTab(tab) { this.activeTab = tab; this.root.querySelectorAll('[data-zam-tab]').forEach((button) => button.setAttribute('aria-current', button.dataset.zamTab === tab ? 'true' : 'false')); this.root.querySelectorAll('[data-zam-panel]').forEach((panel) => { panel.hidden = panel.dataset.zamPanel !== tab; }); }

  addSocial() { this.syncRepeatersFromDom(); this.data.social.push({ id:uid('social'), platform:'x', label:'', username:'', url:'', visible:true, order:this.data.social.length }); this.renderSocialPanel(); }
  addResource() { this.syncRepeatersFromDom(); this.data.relatedResources.push({ id:uid('resource'), title:'', url:'', description:'', type:'project', visible:true, order:this.data.relatedResources.length }); this.renderResourcesPanel(); }
  removeSocial(id) { this.syncRepeatersFromDom(); this.data.social = this.data.social.filter((item) => item.id !== id); this.renderSocialPanel(); }
  removeResource(id) { this.syncRepeatersFromDom(); this.data.relatedResources = this.data.relatedResources.filter((item) => item.id !== id); this.renderResourcesPanel(); }

  save() {
    try { const saved = this.store.save(this.collect()); this.data = saved; this.status('Acerca de guardado. La vista pública se actualiza en este navegador.', 'ok'); }
    catch (error) { this.status(`No se guardó: ${error.message}`, 'error'); }
  }

  exportData() {
    const payload = { ...this.collect(), exportedAt:new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'zen-site-profile-v1.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 500);
    this.status('Perfil del sitio exportado.', 'ok');
  }

  importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try { const saved = this.store.save(JSON.parse(String(reader.result ?? ''))); this.data = saved; this.fillProfileControls(); this.renderSocialPanel(); this.renderResourcesPanel(); this.status('Perfil del sitio importado correctamente.', 'ok'); }
      catch (error) { this.status(`No se pudo importar: ${error.message}`, 'error'); }
    };
    reader.readAsText(file);
  }

  async open() { this.metadataManager?.close?.(); if (this.searchLab?.mount) this.searchLab.mount.hidden = true; this.data = this.store.load(); this.fillProfileControls(); this.renderSocialPanel(); this.renderResourcesPanel(); this.root.hidden = false; this.switchTab(this.activeTab || 'profile'); }
  closeToMetadata() { this.root.hidden = true; this.metadataManager?.open?.(); }
  async openSearchLab() { this.root.hidden = true; await this.searchLab?.open?.(); }
  preview() { window.open('/#zen-about', '_blank', 'noopener'); }

  installEntryPoints() {
    const metadataHeader = document.querySelector('#zen-metadata-manager-root .zmm-header');
    if (metadataHeader && !metadataHeader.querySelector('[data-open-about-manager]')) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'zmm-head-action'; button.dataset.openAboutManager = 'true'; button.textContent = 'Acerca de'; button.addEventListener('click', () => void this.open()); metadataHeader.insertBefore(button, metadataHeader.querySelector('.zmm-close'));
    }
    const searchActions = document.querySelector('#zen-search-lab-root .zsl-header-actions');
    if (searchActions && !searchActions.querySelector('[data-open-about-manager]')) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.openAboutManager = 'true'; button.textContent = 'Acerca de'; button.addEventListener('click', () => void this.open()); searchActions.insertBefore(button, searchActions.lastElementChild);
    }
  }

  onRootChange(event) { if (event.target.closest('[data-social-id], [data-resource-id]')) this.syncRepeatersFromDom(); }
  onRootClick(event) {
    const tab = event.target.closest('[data-zam-tab]')?.dataset.zamTab;
    if (tab) { this.switchTab(tab); return; }
    const button = event.target.closest('[data-zam-action]'); if (!button) return;
    const action = button.dataset.zamAction;
    if (action === 'metadata') this.closeToMetadata();
    if (action === 'search') void this.openSearchLab();
    if (action === 'preview') this.preview();
    if (action === 'save') this.save();
    if (action === 'export') this.exportData();
    if (action === 'import') this.fileInput.click();
    if (action === 'add-social') this.addSocial();
    if (action === 'add-resource') this.addResource();
    if (action === 'remove-social') this.removeSocial(button.dataset.id);
    if (action === 'remove-resource') this.removeResource(button.dataset.id);
  }

  mount() {
    this.ensureMount(); this.buildShell(); this.data = this.store.load(); this.fillProfileControls(); this.renderSocialPanel(); this.renderResourcesPanel(); this.installEntryPoints(); window.ZenAboutManager = this; return this;
  }
}
