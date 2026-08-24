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
  ['.txt', 'text/plain; charset=utf-8'],
  ['.svg', 'image/svg+xml']
]);

const probeHtml = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body>
  <main id="probe">Blogger-like route probe</main>
  <script>
    const captureAdmin = () => {
      if (document.documentElement.dataset.zenAdmin !== 'true') return;
      document.body.dataset.adminBoot = 'true';
      document.body.dataset.adminLocation = location.pathname + location.search + location.hash;
    };
    new MutationObserver(captureAdmin).observe(document.documentElement, { attributes: true, attributeFilter: ['data-zen-admin'] });
    setInterval(captureAdmin, 25);
  </script>
  <script type="module" src="/dist/zenblog.js"></script>
  <script type="module" src="/tools/runtime/bootstrap.js"></script>
</body>
</html>`;

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
  throw new Error('Chromium/Chrome no está disponible para Admin route browser test.');
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');
    if (requestUrl.pathname === '/probe' || requestUrl.pathname.endsWith('/admin')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(probeHtml);
      return;
    }

    let path = safePath(req.url || '/');
    if (!path) return void res.writeHead(403).end('Forbidden');
    const info = await stat(path);
    if (info.isDirectory()) path = resolve(path, 'index.html');
    const data = await readFile(path);
    res.writeHead(200, {
      'content-type': MIME.get(extname(path)) || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

await new Promise((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const browser = await findBrowser();

async function dump(path) {
  const url = `http://127.0.0.1:${port}${path}`;
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(browser, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      '--virtual-time-budget=2500', '--dump-dom', url
    ]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', rejectRun);
    child.on('exit', (code) => {
      if (code === 0) resolveRun(stdout);
      else rejectRun(new Error(`Chrome salió con ${code}: ${stderr.slice(-1400)}`));
    });
  });
}

try {
  const deepPath = await dump('/2026/08/articulo.html/admin?from=deep');
  assert.match(deepPath, /data-zen-admin="true"/);
  assert.match(deepPath, /data-admin-boot="true"/);
  assert.match(deepPath, /data-admin-location="\/admin\?from=deep"/);
  assert.doesNotMatch(deepPath, /data-zen-booted="true"/);

  const hashSuffix = await dump('/probe#zen-about/admin');
  assert.match(hashSuffix, /data-zen-admin="true"/);
  assert.match(hashSuffix, /data-admin-boot="true"/);
  assert.match(hashSuffix, /data-admin-location="\/admin"/);
  assert.doesNotMatch(hashSuffix, /data-zen-booted="true"/);

  const publicHash = await dump('/probe#zen-explore');
  assert.match(publicHash, /data-zen-booted="true"/);
  assert.doesNotMatch(publicHash, /data-zen-admin="true"/);

  console.log('Blogger Admin/public bootstrap ownership browser contract: PASS');
} finally {
  await new Promise((done) => server.close(done));
}
