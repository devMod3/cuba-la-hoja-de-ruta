const ADMIN_PATHS = new Set(['/admin', '/p/admin.html']);

function isAdminPath(pathname = location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return ADMIN_PATHS.has(normalized);
}

function loadStylesheet() {
  if (document.getElementById('zen-about-css')) return;
  const link = document.createElement('link');
  link.id = 'zen-about-css';
  link.rel = 'stylesheet';
  link.href = new URL('./about.css', import.meta.url).href;
  document.head.appendChild(link);
}

async function bootAbout() {
  if (isAdminPath()) return;
  if (!document.getElementById('zen-about')) return;
  loadStylesheet();
  const { AboutFeature } = await import(new URL('./AboutFeature.js', import.meta.url).href);
  const feature = new AboutFeature().mount();
  if (feature) {
    window.ZenAboutFeature = feature;
    document.dispatchEvent(new CustomEvent('zenabout:ready', { detail: { version: '0.1.0' } }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void bootAbout(), { once: true });
} else {
  void bootAbout();
}
