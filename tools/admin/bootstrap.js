const ADMIN_PATHS = new Set(['/admin', '/p/admin.html']);

function isAdminPath(pathname = location.pathname) {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  return ADMIN_PATHS.has(normalized);
}

function ensureMetadataMount() {
  if (!document.getElementById('zen-metadata-launcher')) {
    const launcher = document.createElement('button');
    launcher.id = 'zen-metadata-launcher';
    launcher.type = 'button';
    launcher.setAttribute('aria-controls', 'zen-metadata-manager-root');
    launcher.setAttribute('aria-expanded', 'false');
    launcher.innerHTML = '<span aria-hidden="true" class="zmm-launcher-mark">M</span><span>Metadata</span>';
    document.body.appendChild(launcher);
  }

  if (!document.getElementById('zen-metadata-manager-root')) {
    const root = document.createElement('div');
    root.id = 'zen-metadata-manager-root';
    root.hidden = true;
    document.body.appendChild(root);
  }
}

function loadStylesheet(href, id) {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

async function bootAdmin() {
  if (!isAdminPath()) return;

  document.documentElement.dataset.zenAdmin = 'true';
  document.title = 'ZenBlog Admin · La hoja de ruta';

  if (location.pathname === '/p/admin.html') {
    history.replaceState(history.state ?? {}, '', `/admin${location.search}${location.hash}`);
  }

  ensureMetadataMount();

  loadStylesheet(new URL('./admin.css', import.meta.url).href, 'zen-admin-css');
  loadStylesheet(new URL('./metadata-manager-v0.5.css', import.meta.url).href, 'zen-metadata-manager-css');

  await import(new URL('./metadata-manager-v0.5.js', import.meta.url).href);

  if (window.ZenMetadataManager?.open) {
    window.ZenMetadataManager.open();
  }

  window.ZenBlogAdmin = Object.freeze({
    version: '0.1.0',
    module: 'metadata',
    metadataVersion: '0.5',
    openMetadata: () => window.ZenMetadataManager?.open?.()
  });

  document.dispatchEvent(new CustomEvent('zenadmin:ready', {
    detail: { version: '0.1.0', module: 'metadata' }
  }));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void bootAdmin(), { once: true });
} else {
  void bootAdmin();
}
