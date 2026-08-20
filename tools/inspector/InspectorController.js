import {
  DEFAULT_COMPONENT_REGISTRY,
  buildInspectorLog,
  describeElement,
  resolveInspectorTarget
} from './InspectorDiagnostics.js';

export const INSPECTOR_STORAGE_KEY = 'zenInspector.enabled';
const UI_ATTR = 'data-zen-inspector-ui';
const SAVED_HREF_ATTR = 'data-zen-inspector-href';

function readBoolean(storage, key) {
  try { return storage?.getItem(key) === 'true'; }
  catch { return false; }
}

function writeBoolean(storage, key, value) {
  try { storage?.setItem(key, value ? 'true' : 'false'); }
  catch {}
}

function isInspectorUI(target) {
  return Boolean(target?.closest?.(`[${UI_ATTR}="true"]`));
}

function fallbackCopy(value) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  textarea.setAttribute(UI_ATTR, 'true');
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try { ok = document.execCommand('copy'); }
  catch {}
  textarea.remove();
  return ok;
}

export class InspectorController {
  constructor({ storage = globalThis.localStorage, interactive = true, registry = DEFAULT_COMPONENT_REGISTRY } = {}) {
    this.storage = storage;
    this.interactive = interactive;
    this.registry = [...registry];
    this.enabled = readBoolean(storage, INSPECTOR_STORAGE_KEY);
    this.overlay = null;
    this.hud = null;
    this.modal = null;
    this.componentName = null;
    this.log = null;
    this.selected = null;
    this.hovered = null;
    this.currentName = '';
    this.currentLog = '';
    this.linkObserver = null;
    this.onClick = this.onClick.bind(this);
    this.onPointerOver = this.onPointerOver.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onStorage = this.onStorage.bind(this);
  }

  register(entries) {
    if (!Array.isArray(entries)) return this;
    entries.slice().reverse().forEach((entry) => {
      if (!entry?.selector || !entry?.name) return;
      this.registry.unshift({
        selector: entry.selector,
        name: entry.name,
        description: entry.description || '',
        protected: Boolean(entry.protected)
      });
    });
    return this;
  }

  neutralizeLink(anchor) {
    if (!this.interactive || !(anchor instanceof Element) || anchor.tagName !== 'A') return;
    if (!anchor.hasAttribute('href') || anchor.hasAttribute(SAVED_HREF_ATTR)) return;
    anchor.setAttribute(SAVED_HREF_ATTR, anchor.getAttribute('href') ?? '');
    anchor.removeAttribute('href');
  }

  neutralizeLinks(root = document) {
    if (!this.interactive || !this.enabled) return;
    if (root instanceof Element && root.matches('a[href]')) this.neutralizeLink(root);
    root.querySelectorAll?.('a[href]').forEach((anchor) => this.neutralizeLink(anchor));
  }

  startLinkObserver() {
    if (!this.interactive || this.linkObserver || typeof MutationObserver === 'undefined') return;
    this.linkObserver = new MutationObserver((mutations) => {
      if (!this.enabled) return;
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.target instanceof Element) {
          this.neutralizeLink(mutation.target);
        }
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) this.neutralizeLinks(node);
        });
      }
    });
    this.linkObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['href']
    });
  }

  stopLinkObserver() {
    this.linkObserver?.disconnect();
    this.linkObserver = null;
  }

  restoreLinks() {
    if (!this.interactive) return;
    document.querySelectorAll(`[${SAVED_HREF_ATTR}]`).forEach((anchor) => {
      const href = anchor.getAttribute(SAVED_HREF_ATTR) ?? '';
      anchor.setAttribute('href', href);
      anchor.removeAttribute(SAVED_HREF_ATTR);
    });
  }

  applyState(value, { persist = false } = {}) {
    this.enabled = Boolean(value);
    if (persist) writeBoolean(this.storage, INSPECTOR_STORAGE_KEY, this.enabled);
    document.documentElement.dataset.zenInspector = this.enabled ? 'on' : 'off';

    if (this.interactive) {
      if (this.enabled) {
        this.neutralizeLinks();
        this.startLinkObserver();
      } else {
        this.stopLinkObserver();
        this.restoreLinks();
      }
    }

    if (!this.enabled) {
      this.closeModal();
      this.clearSelection();
      this.hovered = null;
    }
    document.dispatchEvent(new CustomEvent('zeninspector:changed', { detail: { enabled: this.enabled } }));
    return this.enabled;
  }

  setEnabled(value) { return this.applyState(value, { persist: true }); }
  toggle() { return this.setEnabled(!this.enabled); }

  ensureUI() {
    if (!this.interactive || this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'zen-inspector-outline';
    this.overlay.hidden = true;
    this.overlay.setAttribute('aria-hidden', 'true');
    this.overlay.setAttribute(UI_ATTR, 'true');

    this.hud = document.createElement('div');
    this.hud.id = 'zen-inspector-hud';
    this.hud.hidden = true;
    this.hud.setAttribute('role', 'status');
    this.hud.setAttribute(UI_ATTR, 'true');

    this.modal = document.createElement('dialog');
    this.modal.id = 'zen-inspector-modal';
    this.modal.setAttribute('aria-labelledby', 'zen-inspector-modal-title');
    this.modal.setAttribute(UI_ATTR, 'true');
    this.modal.innerHTML = `
      <header class="zi-modal-head" ${UI_ATTR}="true">
        <div class="zi-modal-brand" ${UI_ATTR}="true">
          <small ${UI_ATTR}="true">Zen Inspector</small>
          <strong id="zen-inspector-modal-title" ${UI_ATTR}="true">Componente seleccionado</strong>
        </div>
        <button class="zi-modal-close" type="button" aria-label="Cerrar inspector" data-zi-action="close" ${UI_ATTR}="true">×</button>
      </header>
      <div class="zi-component-field" ${UI_ATTR}="true">
        <label for="zen-inspector-component-name" ${UI_ATTR}="true">Componente</label>
        <input id="zen-inspector-component-name" type="text" readonly spellcheck="false" autocomplete="off" ${UI_ATTR}="true">
      </div>
      <div class="zi-log-wrap" ${UI_ATTR}="true">
        <div class="zi-log-label" ${UI_ATTR}="true"><span ${UI_ATTR}="true">Log técnico</span><small ${UI_ATTR}="true">lectura</small></div>
        <textarea id="zen-inspector-log" readonly spellcheck="false" ${UI_ATTR}="true"></textarea>
      </div>
      <footer class="zi-modal-actions" ${UI_ATTR}="true">
        <span class="zi-modal-hint" ${UI_ATTR}="true">Esc para cerrar · Alt+I para desactivar</span>
        <div class="zi-modal-buttons" ${UI_ATTR}="true">
          <button type="button" data-zi-action="copy-name" ${UI_ATTR}="true">Copiar componente</button>
          <button class="zi-primary" type="button" data-zi-action="copy-log" ${UI_ATTR}="true">Copiar log</button>
        </div>
      </footer>`;

    this.componentName = this.modal.querySelector('#zen-inspector-component-name');
    this.log = this.modal.querySelector('#zen-inspector-log');

    this.modal.addEventListener('click', (event) => {
      if (event.target === this.modal) this.closeModal();
      const action = event.target instanceof Element ? event.target.closest('[data-zi-action]')?.dataset.ziAction : null;
      if (action === 'close') this.closeModal();
      if (action === 'copy-name') void this.copy(this.currentName, event.target.closest('button'), 'Copiado');
      if (action === 'copy-log') void this.copy(this.currentLog, event.target.closest('button'), 'Log copiado');
    });

    document.body.append(this.overlay, this.hud, this.modal);
  }

  resolve(target) {
    return resolveInspectorTarget(target, this.registry);
  }

  select(target, { openModal = false } = {}) {
    if (!(target instanceof Element)) return;
    this.ensureUI();
    const info = this.resolve(target);
    const element = info.element;
    const data = describeElement(element);
    if (!data) return;

    this.selected = element;
    const rect = element.getBoundingClientRect();
    Object.assign(this.overlay.style, {
      left: `${Math.max(0, rect.left)}px`,
      top: `${Math.max(0, rect.top)}px`,
      width: `${Math.max(0, rect.width)}px`,
      height: `${Math.max(0, rect.height)}px`
    });
    this.overlay.hidden = false;
    this.hud.textContent = `${info.name} · ${data.width}×${data.height}`;
    this.hud.hidden = false;

    if (openModal) this.showModal(info);
  }

  showModal(info) {
    if (!this.interactive) return;
    this.ensureUI();
    this.currentName = info.name;
    this.currentLog = buildInspectorLog(info, this.registry);
    this.componentName.value = this.currentName;
    this.log.value = this.currentLog;

    if (typeof this.modal.showModal === 'function') {
      if (!this.modal.open) this.modal.showModal();
    } else {
      this.modal.setAttribute('open', '');
    }

    requestAnimationFrame(() => {
      this.componentName.focus({ preventScroll: true });
      this.componentName.select();
    });
  }

  closeModal() {
    if (!this.modal) return;
    if (typeof this.modal.close === 'function' && this.modal.open) this.modal.close();
    else this.modal.removeAttribute('open');
  }

  async copy(value, button, successText) {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        ok = true;
      } else {
        ok = fallbackCopy(value);
      }
    } catch {
      ok = fallbackCopy(value);
    }
    if (!button) return;
    const previous = button.textContent;
    button.textContent = ok ? successText : 'Error';
    setTimeout(() => { button.textContent = previous; }, 1000);
  }

  clearSelection() {
    this.selected = null;
    if (this.overlay) this.overlay.hidden = true;
    if (this.hud) this.hud.hidden = true;
  }

  onPointerOver(event) {
    if (!this.enabled || !this.interactive || isInspectorUI(event.target)) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    this.hovered = target;
    this.select(target);
  }

  onClick(event) {
    if (!this.enabled || !this.interactive) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || isInspectorUI(target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.select(target, { openModal: true });
  }

  onKeyDown(event) {
    if (event.altKey && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      this.toggle();
      return;
    }
    if (event.key === 'Escape' && this.enabled && !this.modal?.open && this.selected) {
      event.preventDefault();
      this.clearSelection();
    }
  }

  onResize() {
    const target = this.selected || this.hovered;
    if (this.enabled && target && document.documentElement.contains(target)) this.select(target);
  }

  onStorage(event) {
    if (event.key === INSPECTOR_STORAGE_KEY) this.applyState(event.newValue === 'true');
  }

  mount() {
    document.documentElement.dataset.zenInspector = this.enabled ? 'on' : 'off';
    if (this.interactive) {
      this.ensureUI();
      document.addEventListener('pointerover', this.onPointerOver, true);
      document.addEventListener('click', this.onClick, true);
      document.addEventListener('keydown', this.onKeyDown, true);
      window.addEventListener('resize', this.onResize, { passive: true });
      window.addEventListener('scroll', this.onResize, { passive: true, capture: true });
      if (this.enabled) {
        this.neutralizeLinks();
        this.startLinkObserver();
      }
    }
    window.addEventListener('storage', this.onStorage);
    return this;
  }

  destroy() {
    this.stopLinkObserver();
    this.restoreLinks();
    document.removeEventListener('pointerover', this.onPointerOver, true);
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onResize, true);
    window.removeEventListener('storage', this.onStorage);
    this.overlay?.remove();
    this.hud?.remove();
    this.modal?.remove();
  }
}
