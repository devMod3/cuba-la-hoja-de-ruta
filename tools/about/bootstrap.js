const ADMIN_PATHS = new Set(['/admin', '/p/admin.html']);
const RELEASE = '0.9.1';
const ABOUT_STYLESHEET_ID = 'zen-about-css';
const stylesheetReadiness = new WeakMap();

function isAdminPath(pathname = location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return ADMIN_PATHS.has(normalized);
}

function releaseUrl(path) {
  const url = new URL(path, import.meta.url);
  url.searchParams.set('v', RELEASE);
  return url.href;
}

function waitForStylesheet(link, { allowExistingSheet = false } = {}) {
  if (link.dataset.zenAboutStylesheet === 'ready') return Promise.resolve(true);
  if (link.dataset.zenAboutStylesheet === 'failed') return Promise.resolve(false);

  // A stylesheet that predates this bootstrap may already have completed
  // before we can subscribe to its load event. This shortcut is intentionally
  // forbidden for links we create ourselves because `link.sheet` may become
  // non-null before the external resource has finished loading.
  if (allowExistingSheet && link.sheet) {
    link.dataset.zenAboutStylesheet = 'ready';
    return Promise.resolve(true);
  }

  if (stylesheetReadiness.has(link)) return stylesheetReadiness.get(link);

  const readiness = new Promise((resolve) => {
    const finish = (ready) => {
      link.dataset.zenAboutStylesheet = ready ? 'ready' : 'failed';
      link.removeEventListener('load', onLoad);
      link.removeEventListener('error', onError);
      resolve(ready);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);

    link.addEventListener('load', onLoad, { once: true });
    link.addEventListener('error', onError, { once: true });
  });

  stylesheetReadiness.set(link, readiness);
  return readiness;
}

function loadStylesheet() {
  const existing = document.getElementById(ABOUT_STYLESHEET_ID);
  if (existing) return waitForStylesheet(existing, { allowExistingSheet: true });

  const link = document.createElement('link');
  link.id = ABOUT_STYLESHEET_ID;
  link.rel = 'stylesheet';
  link.href = releaseUrl('./about.css');

  // Subscribe before insertion so a fast cache/local response cannot outrun
  // the readiness listener.
  const readiness = waitForStylesheet(link);
  document.head.appendChild(link);
  return readiness;
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

  // About is auxiliary: keep its CSS off the reader critical path, but do not
  // replace the server-visible fallback until the on-demand stylesheet is
  // ready. If CSS fails, the fallback remains intact instead of exposing an
  // unstyled custom shell.
  const stylesheetReady = await loadStylesheet();
  if (!stylesheetReady) {
    console.warn('[ZenBlog/About] No se pudo cargar la hoja de estilos; se conserva el fallback.');
    document.dispatchEvent(new CustomEvent('zenabout:error', {
      detail: { version: RELEASE, message: 'About stylesheet failed to load' }
    }));
    return;
  }

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
