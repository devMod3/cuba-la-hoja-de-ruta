interface ZenInspectorToggleMessage {
  readonly type: 'zen-inspector:toggle';
}

interface ZenInspectorToggleResponse {
  readonly active: boolean;
}

interface ZenInspectorRuntimeApi {
  readonly onMessage: {
    addListener(
      listener: (
        message: unknown,
        sender: unknown,
        sendResponse: (response: ZenInspectorToggleResponse) => void
      ) => boolean | void
    ): void;
  };
}

declare const chrome: Readonly<{ runtime: ZenInspectorRuntimeApi }>;

type ZenInspectorTag = keyof HTMLElementTagNameMap;

(() => {
  const HOST_TAG = 'zen-inspector-extension-root';
  const existing = document.querySelector(HOST_TAG);
  if (existing) existing.remove();

  const host = document.createElement(HOST_TAG);
  host.setAttribute('aria-hidden', 'true');
  for (const [property, value] of [
    ['all', 'initial'],
    ['position', 'fixed'],
    ['inset', '0'],
    ['display', 'block'],
    ['pointer-events', 'none'],
    ['z-index', '2147483647']
  ] as const) {
    host.style.setProperty(property, value, 'important');
  }
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .zi-outline {
      position: fixed;
      pointer-events: none;
      border: 2px solid #f6c344;
      background: color-mix(in srgb, #f6c344 10%, transparent);
      box-shadow: 0 0 0 1px rgba(0,0,0,.5);
      z-index: 2147483645;
    }
    .zi-hud {
      position: fixed;
      left: 12px;
      bottom: 12px;
      max-width: min(640px, calc(100vw - 24px));
      padding: 8px 10px;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 8px;
      background: rgba(17, 20, 23, .96);
      color: #f7f7f7;
      font: 600 12px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      box-shadow: 0 12px 34px rgba(0,0,0,.35);
      z-index: 2147483646;
      pointer-events: none;
    }
    .zi-panel {
      position: fixed;
      top: 12px;
      right: 12px;
      width: min(440px, calc(100vw - 24px));
      max-height: calc(100vh - 24px);
      display: none;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 12px;
      background: #111417;
      color: #f7f7f7;
      box-shadow: 0 20px 60px rgba(0,0,0,.48);
      font: 14px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      z-index: 2147483647;
      pointer-events: auto;
    }
    .zi-panel[data-open="true"] { display: flex; }
    .zi-head, .zi-actions { display: flex; align-items: center; gap: 8px; padding: 12px; }
    .zi-head { justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,.12); }
    .zi-brand { display: grid; gap: 2px; min-width: 0; }
    .zi-brand small { color: #b8c0c7; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
    .zi-brand strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zi-body { display: grid; gap: 10px; min-height: 0; padding: 12px; }
    .zi-log {
      width: 100%;
      min-height: 280px;
      max-height: 58vh;
      resize: vertical;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 8px;
      padding: 10px;
      background: #0a0c0e;
      color: #dfe5ea;
      font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      white-space: pre;
    }
    .zi-note { margin: 0; color: #aeb7bf; font-size: 12px; }
    .zi-actions { justify-content: flex-end; border-top: 1px solid rgba(255,255,255,.12); }
    button {
      appearance: none;
      border: 1px solid rgba(255,255,255,.2);
      border-radius: 8px;
      padding: 7px 10px;
      background: #1d2328;
      color: #f7f7f7;
      font: 600 12px/1 system-ui, sans-serif;
      cursor: pointer;
    }
    button:hover { background: #283139; }
    button.zi-primary { border-color: #f6c344; background: #f6c344; color: #17130a; }
    .zi-copy-status { margin-right: auto; color: #b8c0c7; font-size: 12px; }
  `;
  shadow.appendChild(style);

  function element<K extends ZenInspectorTag>(
    tag: K,
    className = '',
    text = ''
  ): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  const outline = element('div', 'zi-outline');
  outline.hidden = true;
  const hud = element('div', 'zi-hud');
  hud.hidden = true;
  const panel = element('section', 'zi-panel');
  panel.dataset['open'] = 'false';

  const head = element('header', 'zi-head');
  const brand = element('div', 'zi-brand');
  brand.append(
    element('small', '', 'Zen Inspector'),
    element('strong', '', 'Elemento seleccionado')
  );
  const closeButton = element('button', '', 'Cerrar');
  closeButton.type = 'button';
  head.append(brand, closeButton);

  const body = element('div', 'zi-body');
  const note = element(
    'p',
    'zi-note',
    'Lectura local. Formularios, secretos data-* y parámetros de URL se redactan por defecto.'
  );
  const logField = element('textarea', 'zi-log');
  logField.readOnly = true;
  logField.spellcheck = false;
  body.append(note, logField);

  const actions = element('footer', 'zi-actions');
  const copyStatus = element('span', 'zi-copy-status');
  const copyButton = element('button', 'zi-primary', 'Copiar log');
  copyButton.type = 'button';
  actions.append(copyStatus, copyButton);

  panel.append(head, body, actions);
  shadow.append(outline, hud, panel);

  let active = true;
  let locked = false;
  let currentTarget: Element | null = null;
  let frame = 0;

  function isInspectorUi(target: Element): boolean {
    return target === host;
  }

  function eventTarget(event: Event): Element | null {
    for (const candidate of event.composedPath()) {
      if (candidate instanceof Element) return candidate;
    }
    return event.target instanceof Element ? event.target : null;
  }

  function moveOutline(target: Element): void {
    const rect = target.getBoundingClientRect();
    outline.hidden = false;
    outline.style.left = `${String(Math.max(0, rect.left))}px`;
    outline.style.top = `${String(Math.max(0, rect.top))}px`;
    outline.style.width = `${String(Math.max(0, rect.width))}px`;
    outline.style.height = `${String(Math.max(0, rect.height))}px`;
    const info = zenInspectorResolveTarget(target);
    hud.hidden = false;
    hud.textContent = `${info.name} · ${String(Math.round(rect.width))}×${String(Math.round(rect.height))}`;
  }

  function select(target: Element): void {
    currentTarget = target;
    locked = true;
    moveOutline(target);
    const info = zenInspectorResolveTarget(target);
    const title = brand.querySelector('strong');
    if (title) title.textContent = info.name;
    logField.value = zenInspectorBuildLog(target);
    panel.dataset['open'] = 'true';
  }

  function clearSelection(): void {
    locked = false;
    currentTarget = null;
    panel.dataset['open'] = 'false';
    copyStatus.textContent = '';
  }

  function setActive(next: boolean): void {
    active = next;
    host.style.setProperty('display', next ? 'block' : 'none', 'important');
    if (!next) {
      clearSelection();
      outline.hidden = true;
      hud.hidden = true;
    }
  }

  function onPointerMove(event: PointerEvent): void {
    if (!active || locked) return;
    const target = eventTarget(event);
    if (!target || isInspectorUi(target)) return;
    currentTarget = target;
    if (frame !== 0) return;
    frame = globalThis.requestAnimationFrame(() => {
      frame = 0;
      if (currentTarget && document.documentElement.contains(currentTarget))
        moveOutline(currentTarget);
    });
  }

  function onClick(event: MouseEvent): void {
    if (!active) return;
    const target = eventTarget(event);
    if (!target || isInspectorUi(target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    select(target);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (!active || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (locked) {
      clearSelection();
      return;
    }
    outline.hidden = true;
    hud.hidden = true;
  }

  async function copyLog(): Promise<void> {
    const value = logField.value;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      copyStatus.textContent = 'Copiado';
      return;
    } catch {
      logField.focus();
      logField.select();
      const copied = document.execCommand('copy');
      copyStatus.textContent = copied ? 'Copiado' : 'Seleccionado para copiar';
    }
  }

  closeButton.addEventListener('click', () => {
    clearSelection();
  });
  copyButton.addEventListener('click', () => {
    void copyLog();
  });
  document.addEventListener('pointermove', onPointerMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKeyDown, true);
  window.addEventListener(
    'scroll',
    () => {
      if (active && currentTarget && document.documentElement.contains(currentTarget)) {
        moveOutline(currentTarget);
      }
    },
    { passive: true, capture: true }
  );
  window.addEventListener(
    'resize',
    () => {
      if (active && currentTarget && document.documentElement.contains(currentTarget)) {
        moveOutline(currentTarget);
      }
    },
    { passive: true }
  );

  if (typeof chrome !== 'undefined') {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (
        typeof message !== 'object' ||
        message === null ||
        !('type' in message) ||
        (message as ZenInspectorToggleMessage).type !== 'zen-inspector:toggle'
      ) {
        return false;
      }
      setActive(!active);
      sendResponse({ active });
      return false;
    });
  }

  setActive(true);
})();
