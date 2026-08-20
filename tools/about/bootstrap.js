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

function reportFailure(root, error) {
  console.error('[ZenBlog/About] No se pudo montar Acerca de', error);
  if (root) root.dataset.zenAboutState = 'fallback';
  document.dispatchEvent(new CustomEvent('zenabout:error', {
    detail: { message: error instanceof Error ? error.message : String(error) }
  }));
}

async function bootAbout() {
  if (isAdminPath()) return;

  const root = document.getElementById('zen-about');
  if (root) {
    loadStylesheet();
    root.dataset.zenAboutState = 'loading';
  }

  try {
    const [{ AboutFeature, syncProfileFavicon }, { SiteProfileStore }] = await Promise.all([
      import(new URL('./AboutFeature.js', import.meta.url).href),
      import(new URL('./SiteProfileStore.js', import.meta.url).href)
    ]);

    const store = new SiteProfileStore();
    const syncFavicon = (data) => syncProfileFavicon(data?.profile?.photoUrl || '');
    syncFavicon(store.load());
    const unsubscribeFavicon = store.subscribe(syncFavicon);
    window.addEventListener('pagehide', () => unsubscribeFavicon(), { once: true });

    if (!root) return;

    const feature = new AboutFeature({ store, root }).mount();
    if (!feature) return;

    window.ZenAboutFeature = feature;
    root.dataset.zenAboutState = 'ready';
    document.dispatchEvent(new CustomEvent('zenabout:ready', { detail: { version: '0.1.5' } }));
  } catch (error) {
    reportFailure(root, error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void bootAbout(), { once: true });
} else {
  void bootAbout();
}
