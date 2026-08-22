import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, resolve, sep } from 'node:path';

const ROOT = resolve(process.cwd());
const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml']
]);

function safePath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, 'http://localhost').pathname);
  const candidate = resolve(ROOT, `.${pathname}`);
  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${sep}`)) return null;
  return candidate;
}

async function executableExists(name) {
  return new Promise((done) => {
    const child = spawn('sh', ['-lc', `command -v ${name}`], { stdio: 'ignore' });
    child.on('exit', (code) => done(code === 0));
    child.on('error', () => done(false));
  });
}

async function findBrowser() {
  for (const name of ['google-chrome', 'chromium', 'chromium-browser']) {
    if (await executableExists(name)) return name;
  }
  throw new Error('Chromium/Chrome no está disponible para About public-profile browser test.');
}

const publishedProfile = {
  schemaVersion: '1.0.0',
  profile: {
    displayName: 'Perfil PUBLICADO',
    photoUrl: '',
    bloggerProfileUrl: 'https://www.blogger.com/profile/123',
    email: 'public@example.com',
    website: 'https://example.com',
    audioClipUrl: 'https://example.com/audio.mp3',
    wishlistUrl: 'https://example.com/wishlist',
    randomQuestion: '¿Pregunta pública?',
    randomAnswer: 'Respuesta pública',
    gender: 'Perfil de prueba',
    occupation: 'Publicación',
    industry: 'Editorial',
    location: { city: 'Ciudad', region: 'Región', country: 'País' },
    introduction: 'Este contenido procede del snapshot público.',
    interests: ['Constitucionalismo', 'Tecnologías'],
    favoriteMovies: ['Película pública'],
    favoriteMusic: ['Música pública'],
    favoriteBooks: ['Libro público']
  },
  social: [{ id: 'x', platform: 'x', label: 'X', username: '@publico', url: 'https://x.com/publico', visible: true, order: 0 }],
  relatedResources: [{ id: 'r1', title: 'Recurso público', url: 'https://example.com/recurso', description: 'Descripción pública', type: 'source', visible: true, order: 0 }]
};

const localProfile = {
  schemaVersion: '1.0.0',
  profile: {
    displayName: 'Perfil LOCAL NO DEBE APARECER',
    photoUrl: '',
    bloggerProfileUrl: '',
    email: '',
    website: '',
    occupation: 'Local',
    industry: '',
    location: { city: '', region: '', country: '' },
    introduction: 'Este contenido vive en localStorage del origen Blogger simulado.'
  },
  social: [],
  relatedResources: []
};

const assetServer = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    if (requestUrl.pathname === '/config/site-profile.public.json') {
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*'
      });
      res.end(JSON.stringify(publishedProfile));
      return;
    }

    let path = safePath(req.url || '/');
    if (!path) return void res.writeHead(403).end('Forbidden');
    const info = await stat(path);
    if (info.isDirectory()) path = resolve(path, 'index.html');
    const data = await readFile(path);
    res.writeHead(200, {
      'content-type': MIME.get(extname(path)) || 'application/octet-stream',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'access-control-allow-origin': '*' }).end('Not found');
  }
});

await new Promise((done) => assetServer.listen(0, '127.0.0.1', done));
const assetAddress = assetServer.address();
const assetPort = typeof assetAddress === 'object' && assetAddress ? assetAddress.port : 0;
const assetOrigin = `http://127.0.0.1:${assetPort}`;

const pageServer = createServer((req, res) => {
  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body>
  <section id="zen-about"><div class="zen-reading" data-about-fallback="true"><h1>Fallback</h1></div></section>
  <script>
    localStorage.setItem('zenSiteProfile.v1', ${JSON.stringify(JSON.stringify(localProfile))});
    document.addEventListener('zenabout:ready', (event) => {
      document.body.dataset.aboutReady = 'true';
      document.body.dataset.profileSource = event.detail?.profileSource || '';
    });
    document.addEventListener('zenabout:error', (event) => {
      document.body.dataset.aboutError = event.detail?.message || 'unknown';
    });
  </script>
  <script type="module" src="${assetOrigin}/tools/about/bootstrap.js"></script>
</body>
</html>`;
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(html);
});

await new Promise((done) => pageServer.listen(0, '127.0.0.1', done));
const pageAddress = pageServer.address();
const pagePort = typeof pageAddress === 'object' && pageAddress ? pageAddress.port : 0;
const browser = await findBrowser();
const url = `http://127.0.0.1:${pagePort}/#zen-about`;

try {
  const html = await new Promise((resolveRun, rejectRun) => {
    const child = spawn(browser, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--virtual-time-budget=4500',
      '--dump-dom',
      url
    ]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', rejectRun);
    child.on('exit', (code) => {
      if (code === 0) resolveRun(stdout);
      else rejectRun(new Error(`Chrome salió con ${code}: ${stderr.slice(-1600)}`));
    });
  });

  const aboutDom = html.match(/<section id="zen-about"[\s\S]*?<\/section>/)?.[0] || '';
  assert.ok(aboutDom, 'About DOM missing from browser dump');
  assert.match(html, /data-about-ready="true"/);
  assert.match(html, /data-profile-source="published-main"/);
  assert.match(html, /data-zen-about-profile-source="published-main"/);

  for (const expected of [
    'Perfil PUBLICADO',
    'Perfil de prueba',
    'Publicación',
    'Editorial',
    'Ciudad',
    'Región',
    'País',
    'Este contenido procede del snapshot público.',
    'public@example.com',
    'Audio Clip ↗',
    'Wishlist ↗',
    'Constitucionalismo',
    'Tecnologías',
    'Película pública',
    'Música pública',
    'Libro público',
    '¿Pregunta pública?',
    'Respuesta pública',
    '@publico',
    'Recurso público',
    'Descripción pública'
  ]) {
    assert.match(aboutDom, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `public About missing: ${expected}`);
  }

  assert.match(aboutDom, /href="https:\/\/www\.blogger\.com\/profile\/123"/);
  assert.match(aboutDom, /href="https:\/\/example\.com\/"/);
  assert.match(aboutDom, /href="https:\/\/example\.com\/audio\.mp3"/);
  assert.match(aboutDom, /href="https:\/\/example\.com\/wishlist"/);
  assert.doesNotMatch(aboutDom, /Perfil LOCAL NO DEBE APARECER/);
  assert.doesNotMatch(html, /data-about-error=/);
  console.log('About public-profile Admin-to-public field parity browser contract: PASS');
} finally {
  await Promise.all([
    new Promise((done) => pageServer.close(done)),
    new Promise((done) => assetServer.close(done))
  ]);
}