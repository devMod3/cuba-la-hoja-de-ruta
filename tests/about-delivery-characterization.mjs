import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, resolve, sep, join } from 'node:path';
import { tmpdir } from 'node:os';

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

function waitForChildExit(child, timeoutMs = 5000) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return Promise.race([
    new Promise((done) => child.once('exit', done)),
    new Promise((done) => setTimeout(done, timeoutMs))
  ]);
}

class CdpClient {
  constructor(url) {
    assert.equal(typeof WebSocket, 'function', 'Node WebSocket API unavailable; run with --experimental-websocket on Node 20');
    this.ws = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.waiters = new Map();
    this.ready = new Promise((resolveReady, rejectReady) => {
      this.ws.addEventListener('open', resolveReady, { once: true });
      this.ws.addEventListener('error', rejectReady, { once: true });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        else pending.resolve(message.result);
        return;
      }
      const listeners = this.waiters.get(message.method);
      if (!listeners?.length) return;
      this.waiters.delete(message.method);
      for (const listener of listeners) listener.resolve(message.params);
    });
  }

  async send(method, params = {}) {
    await this.ready;
    const id = ++this.nextId;
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { resolve: resolveSend, reject: rejectSend, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  waitFor(method, timeoutMs = 15000) {
    return new Promise((resolveWait, rejectWait) => {
      const timer = setTimeout(() => rejectWait(new Error(`timeout waiting for ${method}`)), timeoutMs);
      const entry = {
        resolve: (value) => {
          clearTimeout(timer);
          resolveWait(value);
        }
      };
      const list = this.waiters.get(method) ?? [];
      list.push(entry);
      this.waiters.set(method, list);
    });
  }

  close() {
    this.ws.close();
  }
}

async function launchBrowser(browser) {
  const profileDir = await mkdtemp(join(tmpdir(), 'zenblog-about-delivery-'));
  let stderr = '';
  const child = spawn(browser, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--remote-debugging-port=0',
    '--remote-allow-origins=*',
    `--user-data-dir=${profileDir}`,
    'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const port = await new Promise((resolvePort, rejectPort) => {
    const timer = setTimeout(() => rejectPort(new Error(`Chrome DevTools endpoint timeout: ${stderr.slice(-1200)}`)), 10000);
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
      if (!match) return;
      clearTimeout(timer);
      resolvePort(Number(match[1]));
    });
    child.on('error', rejectPort);
    child.on('exit', (code) => {
      if (code && !/DevTools listening/.test(stderr)) {
        clearTimeout(timer);
        rejectPort(new Error(`Chrome exited ${code}: ${stderr.slice(-1200)}`));
      }
    });
  });

  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = targets.find((target) => target.type === 'page');
  assert.ok(page?.webSocketDebuggerUrl, 'Chrome page target missing');
  const cdp = new CdpClient(page.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  return {
    cdp,
    child,
    profileDir,
    async close() {
      cdp.close();
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
      await waitForChildExit(child);
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL');
        await waitForChildExit(child, 2000);
      }
      await rm(profileDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    }
  };
}

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || '/', 'http://localhost');

    if (requestUrl.pathname === '/tests/fixtures/about-delivery.html') {
      const mode = requestUrl.searchParams.get('mode') || 'lazy';
      let html = await readFile(FIXTURE, 'utf8');
      const globalCss = mode === 'global'
        ? `<link id="zen-about-css" rel="stylesheet" href="${ABOUT_CSS_PATH}?ownership=global&t=${Date.now()}" onload="window.__markAboutCssLoaded()">`
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
const browserSession = await launchBrowser(browser);
const { cdp } = browserSession;

async function evaluateValue(expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
  return result.result.value;
}

async function waitUntil(expression, timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluateValue(expression)) return;
    await new Promise((done) => setTimeout(done, 25));
  }
  throw new Error(`timeout waiting for browser condition: ${expression}`);
}

async function characterize({ mode, view, delay }) {
  activeCssDelay = delay;
  const loaded = cdp.waitFor('Page.loadEventFired', 15000);
  const url = `http://127.0.0.1:${port}/tests/fixtures/about-delivery.html?mode=${mode}&view=${view}&delay=${delay}&t=${Date.now()}`;
  const wallStart = Date.now();
  await cdp.send('Page.navigate', { url });
  await loaded;
  const wallLoadMs = Date.now() - wallStart;
  await waitUntil(`document.body?.dataset.deliveryReady === 'true'`, Math.max(10000, delay * 3 + 4000));

  const metrics = await evaluateValue(`(() => ({
    cssRequests: Number(document.body.dataset.cssRequests),
    domContentLoadedAt: Number(document.body.dataset.domContentLoadedAt),
    cssLoadAt: Number(document.body.dataset.cssLoadAt),
    shellRenderedAt: Number(document.body.dataset.shellRenderedAt),
    aboutReadyAt: Number(document.body.dataset.aboutReadyAt),
    styledAtRender: document.body.dataset.styledAtRender === 'true',
    foucMs: Number(document.body.dataset.foucMs)
  }))()`);
  activeCssDelay = 0;
  return { mode, view, delay, wallLoadMs, ...metrics };
}

const scenarios = [];
for (const delay of [0, 1200]) {
  for (const view of ['reader', 'about']) {
    for (const mode of ['lazy', 'global']) scenarios.push({ mode, view, delay });
  }
}

const results = [];
try {
  for (const scenario of scenarios) results.push(await characterize(scenario));

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
    slowGlobalReader.wallLoadMs - slowLazyReader.wallLoadMs >= 800,
    `global slow About CSS should materially delay reader load; lazy=${slowLazyReader.wallLoadMs}ms, global=${slowGlobalReader.wallLoadMs}ms`
  );

  console.log(JSON.stringify({ browser, protocol: 'CDP real-time delivery characterization', delayMs: 1200, results }, null, 2));
  console.log('M-003 delivery characterization: PASS');
} finally {
  activeCssDelay = 0;
  await browserSession.close();
  await new Promise((done) => server.close(done));
}
