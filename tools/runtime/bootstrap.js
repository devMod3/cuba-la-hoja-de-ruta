const ADMIN_PATHS = new Set(['/admin', '/p/admin.html']);
const INSPECTOR_KEY = 'zenInspector.enabled';

function isAdminPath(pathname = location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return ADMIN_PATHS.has(normalized);
}

function readInspectorState() {
  try { return localStorage.getItem(INSPECTOR_KEY) === 'true'; }
  catch { return false; }
}

let aboutPromise = null;
let inspectorPromise = null;

function loadAbout() {
  aboutPromise ??= import(new URL('../about/bootstrap.js', import.meta.url).href);
  return aboutPromise;
}

function loadInspector() {
  inspectorPromise ??= import(new URL('../inspector/bootstrap.js', import.meta.url).href)
    .finally(() => document.removeEventListener('keydown', onInspectorShortcut, true));
  return inspectorPromise;
}

function onRouteChanged(event) {
  if (event.detail?.route === 'zen-about') void loadAbout();
}

function onInspectorShortcut(event) {
  if (!(event.altKey && event.code === 'KeyI')) return;
  if (window.ZenInspector) return;
  event.preventDefault();
  try { localStorage.setItem(INSPECTOR_KEY, 'true'); } catch {}
  void loadInspector();
}

async function boot() {
  if (isAdminPath()) {
    await import(new URL('../admin/bootstrap.js', import.meta.url).href);
    return;
  }

  document.addEventListener('zenroute:changed', onRouteChanged);
  document.addEventListener('keydown', onInspectorShortcut, true);

  if (location.hash === '#zen-about') void loadAbout();
  if (readInspectorState()) void loadInspector();

  window.addEventListener('storage', (event) => {
    if (event.key === INSPECTOR_KEY && event.newValue === 'true') void loadInspector();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void boot(), { once: true });
} else {
  void boot();
}
