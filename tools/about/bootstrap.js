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

function waitForStylesheet(link) {
  if (link.sheet) return Promise.resolve(true);
  if (stylesheetReadiness.has(link)) return stylesheetReadiness.get(link);

  const readiness = new Promise((resolve) => {
    let settled = false;
    const finish = (ready) => {
      if (settled) return;
      settled = true;
      link.removeEventListener('load', onLoad);
      link.removeEventListener('error', onError);
      resolve(ready);
    };
    const onLoad = () => finish(true);
    const onError = () => finish(false);

    link.addEventListener('load', onLoad, { once: true });
    link.addEventListener('error', onError, { once: true });

    // Close the race where the stylesheet becomes available between the
    // initial `link.sheet` check and listener registration.
    queueMicrotask(() => {
      if (link.sheet) finish(true);
    });
  });

  stylesheetReadiness.set(link, readiness);
  return readiness;
}

function loadStylesheet() {
  let link = document.getElementById(ABOUT_STYLESHEET_ID);
  if (!link) {
    link = document.createElement('link');
    link.id = ABOUT_STYLESHEET_ID;
    link.rel = 'stylesheet';
    link.href = releaseUrl('./about.css');
    document.head.appendChild(link);
  }
  return waitForStylesheet(link);
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
