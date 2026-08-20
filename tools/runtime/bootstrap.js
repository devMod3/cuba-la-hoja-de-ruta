const ADMIN_PATHS = new Set(['/admin', '/p/admin.html']);
const INSPECTOR_KEY = 'zenInspector.enabled';
const RELEASE = '0.9.1';

function isAdminPath(pathname = location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return ADMIN_PATHS.has(normalized);
}

function releaseUrl(path) {
  const url = new URL(path, import.meta.url);
  url.searchParams.set('v', RELEASE);
  return url.href;
}

function readInspectorState() {
  try { return localStorage.getItem(INSPECTOR_KEY) === 'true'; }
  catch { return false; }
}

let aboutPromise = null;
let inspectorPromise = null;

function loadAbout() {
  aboutPromise ??= import(releaseUrl('../about/bootstrap.js'));
  return aboutPromise;
}

function loadInspector() {
  inspectorPromise ??= import(releaseUrl('../inspector/bootstrap.js'))
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
    await import(releaseUrl('../admin/bootstrap.js'));
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
