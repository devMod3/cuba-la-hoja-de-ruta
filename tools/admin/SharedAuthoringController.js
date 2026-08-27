import {
  SITE_PROFILE_STORAGE_KEY,
  emptySiteProfile,
  validateSiteProfile
} from '../about/SiteProfileStore.js';

const METADATA_STORAGE_KEY = 'zenMetadataRegistry.v2';
const METADATA_BACKUP_KEY = `${METADATA_STORAGE_KEY}.shared-backup`;
const SITE_PROFILE_BACKUP_KEY = `${SITE_PROFILE_STORAGE_KEY}.shared-backup`;

const DOCUMENTS = Object.freeze({
  'metadata-registry': Object.freeze({
    label: 'Metadata',
    path: 'config/authoring/metadata-registry.json',
    storageKey: METADATA_STORAGE_KEY,
    backupKey: METADATA_BACKUP_KEY
  }),
  'site-profile': Object.freeze({
    label: 'Acerca de',
    path: 'config/authoring/site-profile.json',
    storageKey: SITE_PROFILE_STORAGE_KEY,
    backupKey: SITE_PROFILE_BACKUP_KEY
  })
});

const SAFE_FAILURE_TEXT = Object.freeze({
  unauthorized: 'La credencial no fue aceptada por GitHub.',
  forbidden: 'La identidad autenticada no tiene permiso de escritura en este repositorio.',
  conflict: 'El documento cambió remotamente. Se bloqueó la escritura para evitar sobrescribir otro cambio.',
  validation: 'El documento compartido no cumple el contrato de ZenBlog.',
  transport: 'No se pudo completar la comunicación con GitHub.',
  'not-found': 'El documento compartido todavía no existe.'
});

function clone(value) {
  return structuredClone(value);
}

function objectRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function emptyMetadataRegistry() {
  return {
    schemaVersion: '1.0.0',
    vocabularyVersion: '1.0.0',
    updatedAt: null,
    records: {},
    migrationIssues: {}
  };
}

function meaningfulMetadata(registry) {
  return (
    Object.keys(registry?.records ?? {}).length > 0 ||
    Object.keys(registry?.migrationIssues ?? {}).length > 0
  );
}

function stripProfileTimestamp(profile) {
  return { ...profile, updatedAt: null };
}

function safeFailure(error) {
  const code = typeof error?.code === 'string' ? error.code : '';
  return SAFE_FAILURE_TEXT[code] ?? 'La operación de autoría compartida no pudo completarse.';
}

function triggerJsonDownload(value, filename) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export class SharedAuthoringController {
  constructor({
    metadataManager = globalThis.ZenMetadataManager,
    aboutManager = globalThis.ZenBlogAdmin?.aboutManager ?? null,
    owner = 'devMod3',
    repository = 'cuba-la-hoja-de-ruta',
    coreModuleUrl,
    githubModuleUrl,
    storage = globalThis.localStorage,
    reload = () => globalThis.location.reload()
  } = {}) {
    this.metadataManager = metadataManager;
    this.aboutManager = aboutManager;
    this.owner = owner;
    this.repositoryName = repository;
    this.coreModuleUrl = coreModuleUrl;
    this.githubModuleUrl = githubModuleUrl;
    this.storage = storage;
    this.reload = reload;
    this.connection = null;
    this.core = null;
    this.github = null;
    this.remote = new Map();
    this.conflicts = new Set();
    this.state = 'disconnected';
    this.root = null;
    this.launcher = null;
    this.statusNode = null;
    this.documentList = null;
    this.identityNode = null;
    this.tokenInput = null;
    this.connectButton = null;
    this.disconnectButton = null;
    this.refreshButton = null;
    this.onDialogClick = this.onDialogClick.bind(this);
    this.onConnect = this.onConnect.bind(this);
    this.onBeforeUnload = this.onBeforeUnload.bind(this);
  }

  async loadAuthoringModules() {
    if (this.core && this.github) return;
    if (!this.coreModuleUrl || !this.githubModuleUrl) {
      throw new Error('Shared authoring module URLs are unavailable');
    }
    const [core, github] = await Promise.all([
      import(this.coreModuleUrl),
      import(this.githubModuleUrl)
    ]);
    this.core = core;
    this.github = github;
  }

  mount() {
    const shellHeader = document.querySelector('#zen-admin-shell .zas-header');
    if (!shellHeader) throw new Error('SharedAuthoringController: AdminShell no está disponible');
    if (document.getElementById('zen-shared-authoring-dialog')) return this;

    this.launcher = document.createElement('button');
    this.launcher.type = 'button';
    this.launcher.className = 'zsa-launcher';
    this.launcher.dataset.state = this.state;
    this.launcher.setAttribute('aria-haspopup', 'dialog');
    this.launcher.setAttribute('aria-controls', 'zen-shared-authoring-dialog');
    this.launcher.textContent = 'Compartido · desconectado';
    this.launcher.addEventListener('click', () => this.root?.showModal());

    const siteLink = shellHeader.querySelector('.zas-site-link');
    shellHeader.insertBefore(this.launcher, siteLink);

    const dialog = document.createElement('dialog');
    dialog.id = 'zen-shared-authoring-dialog';
    dialog.className = 'zsa-dialog';
    dialog.setAttribute('aria-labelledby', 'zsa-title');
    dialog.innerHTML = `
      <form class="zsa-panel" method="dialog" data-zsa-connect-form>
        <header class="zsa-head">
          <div>
            <small>GitHub Pages · control de autoría</small>
            <h2 id="zsa-title">Estado compartido</h2>
          </div>
          <button class="zsa-close" type="button" data-zsa-action="close" aria-label="Cerrar">×</button>
        </header>
        <p class="zsa-intro">Conecta una credencial fine-grained limitada a este repositorio. La credencial existe sólo en memoria y se destruye al desconectar o recargar.</p>
        <div class="zsa-status" role="status" aria-live="polite" data-zsa-status>Desconectado. Los borradores locales siguen intactos.</div>
        <section class="zsa-connect" aria-label="Conexión GitHub">
          <label>
            <span>Credencial temporal</span>
            <input data-zsa-token type="password" autocomplete="off" spellcheck="false" inputmode="text" />
          </label>
          <div class="zsa-actions">
            <button type="submit" class="zsa-primary" data-zsa-connect>Conectar</button>
            <button type="button" data-zsa-action="disconnect" hidden>Desconectar</button>
          </div>
        </section>
        <div class="zsa-session" hidden data-zsa-session>
          <div><span>Sesión</span><strong data-zsa-identity>—</strong></div>
          <button type="button" data-zsa-action="refresh">Recargar estado remoto</button>
        </div>
        <section class="zsa-documents" hidden data-zsa-documents aria-label="Documentos compartidos"></section>
        <footer class="zsa-foot">R3B · optimistic concurrency · sin last-write-wins</footer>
      </form>`;

    document.body.appendChild(dialog);
    this.root = dialog;
    this.statusNode = dialog.querySelector('[data-zsa-status]');
    this.documentList = dialog.querySelector('[data-zsa-documents]');
    this.identityNode = dialog.querySelector('[data-zsa-identity]');
    this.tokenInput = dialog.querySelector('[data-zsa-token]');
    this.connectButton = dialog.querySelector('[data-zsa-connect]');
    this.disconnectButton = dialog.querySelector('[data-zsa-action="disconnect"]');
    this.refreshButton = dialog.querySelector('[data-zsa-action="refresh"]');
    dialog.querySelector('[data-zsa-connect-form]')?.addEventListener('submit', this.onConnect);
    dialog.addEventListener('click', this.onDialogClick);
    globalThis.addEventListener('beforeunload', this.onBeforeUnload);
    this.renderSession();
    return this;
  }

  onBeforeUnload() {
    this.connection?.disconnect();
    this.connection = null;
  }

  async onConnect(event) {
    event.preventDefault();
    if (this.state === 'authenticating') return;
    const token = String(this.tokenInput?.value ?? '').trim();
    if (this.tokenInput) this.tokenInput.value = '';
    if (!token) {
      this.setStatus('Introduce una credencial temporal para conectar.', 'error');
      this.tokenInput?.focus();
      return;
    }

    this.setState('authenticating');
    this.setStatus('Autenticando identidad y permiso de escritura…', 'info');
    try {
      await this.loadAuthoringModules();
      const connection = await this.github.connectGitHubAuthoring({
        token,
        config: {
          owner: this.owner,
          repository: this.repositoryName,
          documents: {
            'metadata-registry': DOCUMENTS['metadata-registry'].path,
            'site-profile': DOCUMENTS['site-profile'].path
          }
        }
      });
      this.connection?.disconnect();
      this.connection = connection;
      this.setState('authorized');
      this.identityNode.textContent = `@${connection.session.identity.login}`;
      this.setStatus('Conexión autorizada. Leyendo documentos compartidos…', 'ok');
      await this.refreshAll();
    } catch (error) {
      this.connection?.disconnect();
      this.connection = null;
      const code = typeof error?.code === 'string' ? error.code : 'error';
      this.setState(code === 'forbidden' ? 'forbidden' : 'error');
      this.setStatus(safeFailure(error), 'error');
    }
  }

  async onDialogClick(event) {
    const action = event.target instanceof Element ? event.target.closest('[data-zsa-action]')?.dataset.zsaAction : null;
    if (!action) return;
    if (action === 'close') {
      this.root?.close();
      return;
    }
    if (action === 'disconnect') {
      this.disconnect();
      return;
    }
    if (action === 'refresh') {
      await this.refreshAll();
      return;
    }

    const key = event.target.closest('[data-zsa-key]')?.dataset.zsaKey;
    if (!key || !DOCUMENTS[key]) return;
    if (action === 'export-local') {
      this.exportLocal(key);
      return;
    }
    if (action === 'upload-local') {
      await this.uploadLocal(key, false);
      return;
    }
    if (action === 'overwrite-remote') {
      if (!globalThis.confirm(`Sobrescribir ${DOCUMENTS[key].label} remoto con el borrador local revisado?`)) return;
      await this.uploadLocal(key, true);
      return;
    }
    if (action === 'adopt-remote') {
      if (!globalThis.confirm(`Adoptar ${DOCUMENTS[key].label} remoto? Se conservará una copia del estado local antes de recargar.`)) return;
      this.adoptRemote(key);
    }
  }

  disconnect() {
    this.connection?.disconnect();
    this.connection = null;
    this.remote.clear();
    this.conflicts.clear();
    if (this.identityNode) this.identityNode.textContent = '—';
    this.setState('disconnected');
    this.setStatus('Desconectado. Los borradores locales siguen intactos.', 'info');
    this.renderDocuments();
  }

  setState(state) {
    this.state = state;
    this.renderSession();
  }

  setStatus(message, kind = 'info') {
    if (!this.statusNode) return;
    this.statusNode.textContent = message;
    this.statusNode.dataset.kind = kind;
  }

  renderSession() {
    if (!this.root || !this.launcher) return;
    const connected = this.state === 'authorized';
    const authenticating = this.state === 'authenticating';
    const session = this.root.querySelector('[data-zsa-session]');
    const documents = this.root.querySelector('[data-zsa-documents]');
    if (this.tokenInput) this.tokenInput.disabled = connected || authenticating;
    if (this.connectButton) {
      this.connectButton.disabled = authenticating || connected;
      this.connectButton.textContent = authenticating ? 'Conectando…' : 'Conectar';
    }
    if (this.disconnectButton) this.disconnectButton.hidden = !connected;
    if (this.refreshButton) this.refreshButton.disabled = !connected;
    if (session) session.hidden = !connected;
    if (documents) documents.hidden = !connected;
    this.launcher.dataset.state = this.state;
    this.launcher.textContent = connected && this.connection
      ? `Compartido · @${this.connection.session.identity.login}`
      : authenticating
        ? 'Compartido · conectando…'
        : 'Compartido · desconectado';
  }

  validateMetadata(value) {
    const registry = objectRecord(value);
    if (!registry || registry.schemaVersion !== '1.0.0') {
      throw new Error('Metadata registry schemaVersion inválido');
    }
    if (registry.vocabularyVersion !== '1.0.0') {
      throw new Error('Metadata registry vocabularyVersion inválido');
    }
    const records = objectRecord(registry.records);
    const issues = objectRecord(registry.migrationIssues ?? {});
    if (!records || !issues) throw new Error('Metadata registry inválido');
    for (const record of Object.values(records)) {
      const validation = this.metadataManager?.validate?.(record);
      if (!validation || !Array.isArray(validation.errors) || validation.errors.length) {
        throw new Error('Metadata registry contiene registros inválidos');
      }
    }
    return clone(registry);
  }

  validateProfile(value) {
    const validation = validateSiteProfile(value);
    if (!validation.ok) throw new Error(validation.errors.join(' · '));
    return validation.value;
  }

  localValue(key) {
    if (key === 'metadata-registry') {
      return this.validateMetadata(this.metadataManager?.getRegistry?.() ?? emptyMetadataRegistry());
    }
    return this.validateProfile(this.aboutManager?.store?.load?.() ?? emptySiteProfile());
  }

  validator(key) {
    return key === 'metadata-registry'
      ? (value) => this.validateMetadata(value)
      : (value) => this.validateProfile(value);
  }

  isMeaningful(key, value) {
    if (key === 'metadata-registry') return meaningfulMetadata(value);
    return this.core.canonicalJson(stripProfileTimestamp(value)) !== this.core.canonicalJson(emptySiteProfile());
  }

  migrationState(key) {
    const local = this.localValue(key);
    const remote = this.remote.get(key) ?? null;
    const localMeaningful = this.isMeaningful(key, local);
    if (!remote) return localMeaningful ? 'local-only' : 'empty';
    if (!localMeaningful) return 'remote-only';
    return this.core.canonicalJson(local) === this.core.canonicalJson(remote.value)
      ? 'equal'
      : 'divergent';
  }

  async refreshAll() {
    if (!this.connection) return;
    this.setStatus('Leyendo versiones remotas…', 'info');
    try {
      for (const key of Object.keys(DOCUMENTS)) await this.refreshDocument(key);
      this.setStatus('Estado remoto actualizado. Ninguna escritura se realiza automáticamente.', 'ok');
      this.renderDocuments();
    } catch (error) {
      this.setStatus(safeFailure(error), 'error');
    }
  }

  async refreshDocument(key) {
    try {
      const documentValue = await this.connection.repository.read(key, this.validator(key));
      this.remote.set(key, documentValue);
    } catch (error) {
      if (error?.code === 'not-found') {
        this.remote.delete(key);
        return;
      }
      throw error;
    }
  }

  renderDocuments() {
    if (!this.documentList || !this.connection) {
      if (this.documentList) this.documentList.replaceChildren();
      return;
    }
    this.documentList.replaceChildren();
    for (const key of Object.keys(DOCUMENTS)) {
      const definition = DOCUMENTS[key];
      const state = this.migrationState(key);
      const conflict = this.conflicts.has(key);
      const card = document.createElement('article');
      card.className = 'zsa-document';
      card.dataset.zsaKey = key;

      const header = document.createElement('div');
      header.className = 'zsa-document-head';
      const title = document.createElement('strong');
      title.textContent = definition.label;
      const badge = document.createElement('span');
      badge.dataset.state = conflict ? 'conflict' : state;
      badge.textContent = conflict ? 'conflicto' : this.stateLabel(state);
      header.append(title, badge);

      const detail = document.createElement('p');
      detail.textContent = conflict
        ? 'GitHub rechazó una escritura stale. La versión remota actual se recargó; revisa antes de intentar otra acción.'
        : this.stateDetail(state);

      const actions = document.createElement('div');
      actions.className = 'zsa-document-actions';
      actions.appendChild(this.actionButton('export-local', 'Exportar local'));
      if (state === 'local-only') actions.appendChild(this.actionButton('upload-local', 'Subir local', true));
      if (state === 'remote-only') actions.appendChild(this.actionButton('adopt-remote', 'Adoptar remoto', true));
      if (state === 'divergent' || conflict) {
        actions.appendChild(this.actionButton('adopt-remote', 'Adoptar remoto'));
        actions.appendChild(this.actionButton('overwrite-remote', 'Sobrescribir remoto', true));
      }
      card.append(header, detail, actions);
      this.documentList.appendChild(card);
    }
  }

  actionButton(action, label, primary = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.zsaAction = action;
    button.textContent = label;
    if (primary) button.className = 'zsa-primary';
    return button;
  }

  stateLabel(state) {
    return {
      empty: 'sin datos',
      'local-only': 'sólo local',
      'remote-only': 'sólo remoto',
      equal: 'sincronizado',
      divergent: 'divergente'
    }[state] ?? state;
  }

  stateDetail(state) {
    return {
      empty: 'No hay datos locales con contenido ni documento remoto. No se requiere migración.',
      'local-only': 'Existe un borrador local y todavía no existe documento compartido. Puedes crearlo sin sobrescribir nada.',
      'remote-only': 'Existe una versión compartida y el estado local está vacío. Adoptarla requiere una acción explícita.',
      equal: 'La copia local coincide exactamente con la versión SHA leída desde GitHub.',
      divergent: 'Local y remoto contienen cambios distintos. No hay resolución automática ni last-write-wins.'
    }[state] ?? '';
  }

  async uploadLocal(key, overwrite) {
    if (!this.connection) return;
    const local = this.localValue(key);
    const current = this.remote.get(key) ?? null;
    const expectedVersion = overwrite ? current?.version ?? null : null;
    if (!overwrite && current) {
      this.setStatus('Se bloqueó la creación: ya existe una versión remota. Recarga y revisa el conflicto.', 'error');
      await this.refreshDocument(key);
      this.conflicts.add(key);
      this.renderDocuments();
      return;
    }

    this.setStatus(`Escribiendo ${DOCUMENTS[key].label} con control de versión…`, 'info');
    try {
      await this.connection.repository.write(
        {
          key,
          value: local,
          expectedVersion,
          message: `content(authoring): sync ${key}`
        },
        this.validator(key)
      );
      const readBack = await this.connection.repository.read(key, this.validator(key));
      if (this.core.canonicalJson(readBack.value) !== this.core.canonicalJson(local)) {
        throw new Error('Shared authoring read-back mismatch');
      }
      this.remote.set(key, readBack);
      this.conflicts.delete(key);
      this.setStatus(`${DOCUMENTS[key].label} escrito y verificado por read-back SHA.`, 'ok');
      this.renderDocuments();
    } catch (error) {
      if (error?.code === 'conflict') {
        this.conflicts.add(key);
        try {
          await this.refreshDocument(key);
        } catch {}
      }
      this.setStatus(safeFailure(error), 'error');
      this.renderDocuments();
    }
  }

  exportLocal(key) {
    const value = this.localValue(key);
    const filename = key === 'metadata-registry'
      ? 'zen-metadata-registry-local.json'
      : 'zen-site-profile-local.json';
    triggerJsonDownload(value, filename);
    this.setStatus(`${DOCUMENTS[key].label} local exportado sin modificar el estado compartido.`, 'ok');
  }

  adoptRemote(key) {
    const remote = this.remote.get(key);
    if (!remote) {
      this.setStatus('No existe una versión remota que adoptar.', 'error');
      return;
    }
    const definition = DOCUMENTS[key];
    const currentRaw = this.storage?.getItem(definition.storageKey);
    if (currentRaw) this.storage?.setItem(definition.backupKey, currentRaw);
    this.storage?.setItem(definition.storageKey, JSON.stringify(remote.value));
    this.setStatus(`${definition.label} remoto adoptado. Se conservó backup local; recargando Admin y destruyendo la credencial…`, 'ok');
    this.connection?.disconnect();
    this.connection = null;
    setTimeout(() => this.reload(), 250);
  }
}
