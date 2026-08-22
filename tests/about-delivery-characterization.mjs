import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, resolve, sep } from 'node:path';

const ROOT = resolve(process.cwd());
const FIXTURE = resolve(ROOT, 'tests/fixtures/about-delivery.html');
const ABOUT_CSS_PATH = '/tools/about/about.css';
const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.json', 'application/json; charset=utf-8']
]);
let activeCssDelay = 0;

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
  throw new Error('Chromium/Chrome no está disponible para About delivery characterization.');
}

function safePath(urlPath) {
  const pathname = decodeURIComponent(new URL(urlPath, 'http://localhost').pathname);
  const candidate = resolve(ROOT, `.${pathname}`);
  if (candidate !== ROOT && !candidate.startsWith(`${ROOT}${sep}`)) return null;
  return candidate;
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');

    if (requestUrl.pathname === '/tests/fixtures/about-delivery.html') {
      const mode = requestUrl.searchParams.get('mode') || 'lazy';
      let html = await readFile(FIXTURE, 'utf8');
      const globalCss = mode === 'global'
        ? `<link id="zen-about-css" rel="stylesheet" href="${ABOUT_CSS_PATH}?ownership=global" onload="window.__markAboutCssLoaded()">`
        : '';
      html = html.replace('<!-- ABOUT_DELIVERY_GLOBAL_CSS -->', globalCss);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      res.end(html);
      return;
    }

    if (requestUrl.pathname === ABOUT_CSS_PATH && activeCssDelay > 0) {
      await new Promise((done) => setTimeout(done, activeCssDelay));
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

function attr(html, name) {
  const match = html.match(new RegExp(`data-${name}="([^"]*)"`));
  assert.ok(match, `missing data-${name}`);
  return match[1];
}

async function dumpDom({ mode, view, delay }) {
  activeCssDelay = delay;
  const url = `http://127.0.0.1:${port}/tests/fixtures/about-delivery.html?mode=${mode}&view=${view}&delay=${delay}&t=${Date.now()}`;
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(browser, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--virtual-time-budget=5000',
      '--dump-dom',
      url
    ]);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', rejectRun);
    child.on('exit', (code) => {
      activeCssDelay = 0;
      if (code === 0) resolveRun(stdout);
      else rejectRun(new Error(`${browser} exited ${code}: ${stderr.slice(-1600)}`));
    });
  });
}

const scenarios = [];
for (const delay of [0, 1200]) {
  for (const view of ['reader', 'about']) {
    for (const mode of ['lazy', 'global']) scenarios.push({ mode, view, delay });
  }
}

const results = [];
try {
  for (const scenario of scenarios) {
    const html = await dumpDom(scenario);
    assert.equal(attr(html, 'delivery-ready'), 'true', `metrics not ready: ${JSON.stringify(scenario)}`);
    results.push({
      ...scenario,
      cssRequests: Number(attr(html, 'css-requests')),
      domContentLoadedAt: Number(attr(html, 'dom-content-loaded-at')),
      cssLoadAt: Number(attr(html, 'css-load-at')),
      shellRenderedAt: Number(attr(html, 'shell-rendered-at')),
      aboutReadyAt: Number(attr(html, 'about-ready-at')),
      styledAtRender: attr(html, 'styled-at-render') === 'true',
      foucMs: Number(attr(html, 'fouc-ms'))
    });
  }

  const find = (mode, view, delay) => results.find((row) => row.mode === mode && row.view === view && row.delay === delay);
  for (const delay of [0, 1200]) {
    assert.equal(find('lazy', 'reader', delay).cssRequests, 0, `lazy reader should not request About CSS at delay=${delay}`);
    assert.equal(find('global', 'reader', delay).cssRequests, 1, `global reader should request About CSS at delay=${delay}`);
    assert.equal(find('lazy', 'about', delay).cssRequests, 1, `lazy About should request About CSS at delay=${delay}`);
    assert.equal(find('global', 'about', delay).cssRequests, 1, `global About should request About CSS once at delay=${delay}`);
  }

  const slowLazyAbout = find('lazy', 'about', 1200);
  const slowGlobalAbout = find('global', 'about', 1200);
  const slowLazyReader = find('lazy', 'reader', 1200);
  const slowGlobalReader = find('global', 'reader', 1200);

  assert.equal(slowLazyAbout.styledAtRender, false, 'slow lazy About should expose an unstyled first render');
  assert.ok(slowLazyAbout.foucMs >= 800, `expected measurable slow-load FOUC, got ${slowLazyAbout.foucMs}ms`);
  assert.equal(slowGlobalAbout.styledAtRender, true, 'global stylesheet ownership should style About before first render');
  assert.equal(slowGlobalAbout.foucMs, 0, 'global stylesheet ownership should avoid About FOUC');
  assert.ok(
    slowGlobalReader.domContentLoadedAt - slowLazyReader.domContentLoadedAt >= 800,
    `global slow About CSS should materially delay reader DOMContentLoaded; lazy=${slowLazyReader.domContentLoadedAt}, global=${slowGlobalReader.domContentLoadedAt}`
  );

  console.log(JSON.stringify({ browser, delayMs: 1200, results }, null, 2));
  console.log('M-003 delivery characterization: PASS');
} finally {
  activeCssDelay = 0;
  await new Promise((done) => server.close(done));
}
