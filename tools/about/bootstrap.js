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

  const [{ AboutFeature, syncProfileFavicon }, { SiteProfileStore }] = await Promise.all([
    import(new URL('./AboutFeature.js', import.meta.url).href),
    import(new URL('./SiteProfileStore.js', import.meta.url).href)
  ]);

  const store = new SiteProfileStore();
  const syncFavicon = (data) => syncProfileFavicon(data?.profile?.photoUrl || '');
  syncFavicon(store.load());
  const unsubscribeFavicon = store.subscribe(syncFavicon);
  window.addEventListener('pagehide', unsubscribeFavicon, { once: true });

  if (!document.getElementById('zen-about')) return;
  loadStylesheet();
  const feature = new AboutFeature({ store }).mount();
  if (feature) {
    window.ZenAboutFeature = feature;
    document.dispatchEvent(new CustomEvent('zenabout:ready', { detail: { version: '0.1.4' } }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void bootAbout(), { once: true });
} else {
  void bootAbout();
}
