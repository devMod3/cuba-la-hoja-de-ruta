export const INSPECTOR_STORAGE_KEY = 'zenInspector.enabled';

function readBoolean(storage, key) {
  try { return storage?.getItem(key) === 'true'; }
  catch { return false; }
}

function writeBoolean(storage, key, value) {
  try { storage?.setItem(key, value ? 'true' : 'false'); }
  catch {}
}

function describeElement(el) {
  if (!(el instanceof Element)) return null;
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    classes: [...el.classList].slice(0, 6),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

export class InspectorController {
  constructor({ storage = globalThis.localStorage, interactive = true } = {}) {
    this.storage = storage;
    this.interactive = interactive;
    this.enabled = readBoolean(storage, INSPECTOR_STORAGE_KEY);
    this.overlay = null;
    this.hud = null;
    this.selected = null;
    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onStorage = this.onStorage.bind(this);
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    writeBoolean(this.storage, INSPECTOR_STORAGE_KEY, this.enabled);
    document.documentElement.dataset.zenInspector = this.enabled ? 'on' : 'off';
    if (!this.enabled) this.clearSelection();
    document.dispatchEvent(new CustomEvent('zeninspector:changed', { detail: { enabled: this.enabled } }));
    return this.enabled;
  }

  toggle() { return this.setEnabled(!this.enabled); }

  ensureUI() {
    if (!this.interactive || this.overlay) return;
    this.overlay = document.createElement('div');
    this.overlay.id = 'zen-inspector-outline';
    this.overlay.hidden = true;
    this.overlay.setAttribute('aria-hidden', 'true');
    this.hud = document.createElement('div');
    this.hud.id = 'zen-inspector-hud';
    this.hud.hidden = true;
    this.hud.setAttribute('role', 'status');
    document.body.append(this.overlay, this.hud);
  }

  select(el) {
    if (!(el instanceof Element)) return;
    this.ensureUI();
    this.selected = el;
    const data = describeElement(el);
    const rect = el.getBoundingClientRect();
    Object.assign(this.overlay.style, {
      left: `${Math.max(0, rect.left)}px`,
      top: `${Math.max(0, rect.top)}px`,
      width: `${Math.max(0, rect.width)}px`,
      height: `${Math.max(0, rect.height)}px`
    });
    this.overlay.hidden = false;
    const ident = `${data.tag}${data.id ? `#${data.id}` : ''}${data.classes.length ? `.${data.classes.join('.')}` : ''}`;
    this.hud.textContent = `${ident} · ${data.width}×${data.height}`;
    this.hud.hidden = false;
  }

  clearSelection() {
    this.selected = null;
    if (this.overlay) this.overlay.hidden = true;
    if (this.hud) this.hud.hidden = true;
  }

  onClick(event) {
    if (!this.enabled || !this.interactive) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest('#zen-inspector-hud,#zen-inspector-outline')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.select(target);
  }

  onKeyDown(event) {
    if (event.altKey && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      this.toggle();
      return;
    }
    if (event.key === 'Escape' && this.enabled && this.selected) {
      event.preventDefault();
      this.clearSelection();
    }
  }

  onResize() { if (this.enabled && this.selected) this.select(this.selected); }
  onStorage(event) { if (event.key === INSPECTOR_STORAGE_KEY) this.setEnabled(event.newValue === 'true'); }

  mount() {
    document.documentElement.dataset.zenInspector = this.enabled ? 'on' : 'off';
    if (this.interactive) {
      this.ensureUI();
      document.addEventListener('click', this.onClick, true);
      document.addEventListener('keydown', this.onKeyDown, true);
      window.addEventListener('resize', this.onResize, { passive: true });
      window.addEventListener('scroll', this.onResize, { passive: true, capture: true });
    }
    window.addEventListener('storage', this.onStorage);
    return this;
  }

  destroy() {
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onResize, true);
    window.removeEventListener('storage', this.onStorage);
    this.overlay?.remove();
    this.hud?.remove();
  }
}
