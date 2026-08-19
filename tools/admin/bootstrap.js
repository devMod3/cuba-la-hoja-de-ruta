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
  const responses = await Promise.all(METADATA_PARTS.map((part) => fetch(new URL(`./${part}`, import.meta.url))));
  for (const response of responses) if (!response.ok) throw new Error(`Metadata source HTTP ${response.status}`);
  const source = (await Promise.all(responses.map((response) => response.text()))).join('');
  const blobUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
  try { await import(blobUrl); }
  finally { URL.revokeObjectURL(blobUrl); }
}

async function bootAdmin() {
  if (!isAdminPath()) return;
  document.documentElement.dataset.zenAdmin = 'true';
  document.title = 'ZenBlog Admin · La hoja de ruta';
  if (location.pathname === '/p/admin.html') history.replaceState(history.state ?? {}, '', `/admin${location.search}${location.hash}`);

  ensureMetadataMount();
  loadStylesheet(new URL('./admin.css', import.meta.url).href, 'zen-admin-css');
  loadStylesheet(new URL('./metadata-manager-v0.5.css', import.meta.url).href, 'zen-metadata-manager-css');
  loadStylesheet(new URL('./metadata-adaptive-v0.6.css', import.meta.url).href, 'zen-metadata-adaptive-css');
  loadStylesheet(new URL('./search-lab.css', import.meta.url).href, 'zen-search-lab-css');
  loadStylesheet(new URL('./about-manager.css', import.meta.url).href, 'zen-about-manager-css');

  await loadMetadataManager();
  if (!window.ZenMetadataManager?.open) throw new Error('ZenMetadataManager no se inicializó');

  const { AdaptiveMetadataUI } = await import(new URL('./AdaptiveMetadataUI.js', import.meta.url).href);
  const adaptiveUI = new AdaptiveMetadataUI({ metadataManager: window.ZenMetadataManager }).mount();

  const { SearchLab } = await import(new URL('./SearchLab.js', import.meta.url).href);
  const searchLab = new SearchLab({ metadataManager: window.ZenMetadataManager });
  await searchLab.mountFeature();

  const { AboutManager } = await import(new URL('./AboutManager.js', import.meta.url).href);
  const { installBloggerProfileFields } = await import(new URL('./BloggerProfileFields.js', import.meta.url).href);
  const aboutManager = installBloggerProfileFields(new AboutManager({ metadataManager: window.ZenMetadataManager, searchLab })).mount();

  window.ZenMetadataManager.open();

  window.ZenBlogAdmin = Object.freeze({
    version: '0.4.0',
    modules: Object.freeze(['metadata', 'search-lab', 'about']),
    metadataVersion: '0.6',
    metadataCoreVersion: '0.5',
    adaptiveUIVersion: '0.6.0',
    searchCoreVersion: '1.0.0-lab',
    aboutVersion: '0.1.0',
    openMetadata: () => { aboutManager.root.hidden = true; searchLab.closeToMetadata(); },
    openSearchLab: () => { aboutManager.root.hidden = true; return searchLab.open(); },
    openAbout: () => aboutManager.open(),
    adaptiveUI,
    searchLab,
    aboutManager
  });

  document.dispatchEvent(new CustomEvent('zenadmin:ready', {
    detail: { version: '0.4.0', modules: ['metadata', 'search-lab', 'about'], metadataVersion: '0.6', aboutVersion: '0.1.0' }
  }));
}

function reportBootError(error) {
  console.error('[ZenBlog/Admin] No se pudo iniciar el administrador', error);
  const root = document.getElementById('zen-metadata-manager-root');
  if (!root) return;
  root.hidden = false;
  root.innerHTML = `<div style="padding:24px;color:#F1F0EB;background:#121416;font:14px/1.5 system-ui,sans-serif">No se pudo iniciar ZenBlog Admin.<br><small>${String(error?.message || error)}</small></div>`;
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => void bootAdmin().catch(reportBootError), { once: true });
else void bootAdmin().catch(reportBootError);
