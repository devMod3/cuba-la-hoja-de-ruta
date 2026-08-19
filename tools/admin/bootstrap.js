const ADMIN_PATHS = new Set(['/admin', '/p/admin.html']);
const METADATA_PARTS = [
  'metadata-manager-v0.5.part1.txt',
  'metadata-manager-v0.5.part2.txt',
  'metadata-manager-v0.5.part3.txt',
  'metadata-manager-v0.5.part4.txt'
];

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

async function loadMetadataManager() {
  const responses = await Promise.all(
    METADATA_PARTS.map((part) => fetch(new URL(`./${part}`, import.meta.url)))
  );

  for (const response of responses) {
    if (!response.ok) {
      throw new Error(`Metadata source HTTP ${response.status}`);
    }
  }

  const source = (await Promise.all(responses.map((response) => response.text()))).join('');
  const blobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));

  try {
    await import(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
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

  await loadMetadataManager();

  if (!window.ZenMetadataManager?.open) {
    throw new Error('ZenMetadataManager no se inicializó');
  }

  window.ZenMetadataManager.open();

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

function reportBootError(error) {
  console.error('[ZenBlog/Admin] No se pudo iniciar el administrador', error);
  const root = document.getElementById('zen-metadata-manager-root');
  if (!root) return;
  root.hidden = false;
  root.innerHTML = `<div style="padding:24px;color:#F1F0EB;background:#121416;font:14px/1.5 system-ui,sans-serif">No se pudo iniciar ZenBlog Admin.<br><small>${String(error?.message || error)}</small></div>`;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void bootAdmin().catch(reportBootError), { once: true });
} else {
  void bootAdmin().catch(reportBootError);
}
