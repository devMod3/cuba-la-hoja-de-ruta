const ADMIN_PATHS = new Set(['/admin', '/p/admin.html']);
const RELEASE = '0.9.2';

function isAdminPath(pathname = location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return ADMIN_PATHS.has(normalized);
}

function releaseUrl(path) {
  const url = new URL(path, import.meta.url);
  url.searchParams.set('v', RELEASE);
  return url.href;
}

function loadStylesheet() {
  if (document.getElementById('zen-about-css')) return;
  const link = document.createElement('link');
  link.id = 'zen-about-css';
  link.rel = 'stylesheet';
  link.href = releaseUrl('./about.css');
  document.head.appendChild(link);
}

async function bootAbout() {
  if (isAdminPath()) return;

  const [{ AboutFeature, syncProfileFavicon }, { SiteProfileStore }] = await Promise.all([
    import(releaseUrl('./AboutFeature.js')),
    import(releaseUrl('./SiteProfileStore.js'))
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
    document.dispatchEvent(new CustomEvent('zenabout:ready', { detail: { version: RELEASE } }));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void bootAbout(), { once: true });
} else {
  void bootAbout();
}
