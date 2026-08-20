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
  ['.svg', 'image/svg+xml'],
  ['.json', 'application/json; charset=utf-8']
]);

function browserCandidates() {
  return ['google-chrome', 'chromium', 'chromium-browser'];
}

async function executableExists(name) {
  return new Promise((resolveExists) => {
    const child = spawn('sh', ['-lc', `command -v ${name}`], { stdio: 'ignore' });
    child.on('exit', (code) => resolveExists(code === 0));
    child.on('error', () => resolveExists(false));
  });
}

async function findBrowser() {
  for (const name of browserCandidates()) {
    if (await executableExists(name)) return name;
  }
  throw new Error('Chromium/Chrome no está disponible: el smoke test no puede ejecutarse.');
}

function safePath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, 'http://localhost').pathname);
  const candidate = resolve(ROOT, `.${pathname}`);
  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${sep}`)) return null;
  return candidate;
}

const server = createServer(async (req, res) => {
  try {
    let path = safePath(req.url || '/');
    if (!path) {
      res.writeHead(403).end('Forbidden');
      return;
    }
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

await new Promise((resolveListen) => server.listen(0, '127.0.0.1', resolveListen));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const browser = await findBrowser();
const url = `http://127.0.0.1:${port}/tests/fixtures/about-smoke.html`;

try {
  const html = await new Promise((resolveRun, rejectRun) => {
    const child = spawn(browser, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--virtual-time-budget=2500',
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
      else rejectRun(new Error(`Chrome salió con ${code}: ${stderr.slice(-1200)}`));
    });
  });

  assert.match(html, /data-about-ready="true"/);
  assert.doesNotMatch(html, /data-about-error=/);
  assert.match(html, /class="zen-about-shell"/);
  assert.match(html, /class="zen-about-profile-top"/);
  assert.match(html, />Redes sociales</);
  assert.match(html, />Recursos relacionados</);
  assert.doesNotMatch(html, /data-about-fallback="true"/);
  console.log('About browser smoke: PASS');
} finally {
  await new Promise((resolveClose) => server.close(resolveClose));
}
