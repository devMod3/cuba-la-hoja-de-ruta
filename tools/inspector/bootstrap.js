const ADMIN_PATHS = new Set(['/admin', '/p/admin.html']);

function isAdminPath(pathname = location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return ADMIN_PATHS.has(normalized);
}

function loadStylesheet() {
  if (document.getElementById('zen-inspector-css')) return;
  const link = document.createElement('link');
  link.id = 'zen-inspector-css';
  link.rel = 'stylesheet';
  link.href = new URL('./inspector.css', import.meta.url).href;
  document.head.appendChild(link);
}

async function bootInspector() {
  if (isAdminPath()) return;
  loadStylesheet();
  const { InspectorController } = await import(new URL('./InspectorController.js', import.meta.url).href);
  const inspector = new InspectorController({ interactive: true }).mount();
  window.ZenInspector = inspector;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void bootInspector(), { once: true });
else void bootInspector();
