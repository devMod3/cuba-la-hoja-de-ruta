import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { extname, resolve, sep, join } from 'node:path';
import { tmpdir } from 'node:os';

const ROOT = resolve(process.cwd());
const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8']
]);

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
  throw new Error('Chromium/Chrome no está disponible para characterization.');
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
  const profileDir = await mkdtemp(join(tmpdir(), 'zenblog-cdp-'));
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
      await rm(profileDir, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100
      });
    }
  };
}

const server = createServer(async (req, res) => {
  try {
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

const cases = [
  { id: 'narrow-phone', width: 320, height: 568 },
  { id: 'normal-phone', width: 390, height: 700 },
  { id: 'short-phone', width: 390, height: 560 },
  { id: 'phone-landscape', width: 667, height: 375, landscape: true }
];

const browserSession = await launchBrowser(browser);
const { cdp } = browserSession;
const results = [];

async function characterize(source, testCase) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: testCase.width,
    height: testCase.height,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: testCase.width,
    screenHeight: testCase.height,
    screenOrientation: testCase.landscape
      ? { type: 'landscapePrimary', angle: 90 }
      : { type: 'portraitPrimary', angle: 0 }
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  const loaded = cdp.waitFor('Page.loadEventFired');
  const url = `http://127.0.0.1:${port}/tests/fixtures/home-viewport.html?source=${source}&case=${testCase.id}&t=${Date.now()}`;
  await cdp.send('Page.navigate', { url });
  await loaded;
  await cdp.send('Runtime.evaluate', {
    expression: 'new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
    awaitPromise: true
  });

  const evaluation = await cdp.send('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const home = document.getElementById('zen-home');
      const style = getComputedStyle(home);
      const rootStyle = getComputedStyle(document.documentElement);
      const homeRect = home.getBoundingClientRect();
      const important = [...document.querySelectorAll('.zen-home-question,.zen-home-statement h1,.zen-home-quick-actions,.zen-feature-title,.zen-feature-actions')];
      const rects = important.map((node) => node.getBoundingClientRect());
      const minTop = Math.min(...rects.map((rect) => rect.top));
      const maxBottom = Math.max(...rects.map((rect) => rect.bottom));
      const scrollable = home.scrollHeight > home.clientHeight + 1 && /auto|scroll/.test(style.overflowY);
      const outside = minTop < homeRect.top - 1 || maxBottom > homeRect.bottom + 1;
      return {
        innerWidth,
        innerHeight,
        devicePixelRatio,
        headerH: rootStyle.getPropertyValue('--zen-header-h').trim(),
        playerSafe: rootStyle.getPropertyValue('--zen-player-safe').trim(),
        homeHeight: Number(homeRect.height.toFixed(2)),
        homeClientHeight: home.clientHeight,
        homeScrollHeight: home.scrollHeight,
        overflowY: style.overflowY,
        contentTop: Number(minTop.toFixed(2)),
        contentBottom: Number(maxBottom.toFixed(2)),
        homeTop: Number(homeRect.top.toFixed(2)),
        homeBottom: Number(homeRect.bottom.toFixed(2)),
        scrollable,
        essentialOutside: outside,
        essentialInaccessible: outside && !scrollable,
        horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
      };
    })()`
  });
  const value = evaluation.result.value;
  assert.equal(value.innerWidth, testCase.width, `${source}/${testCase.id}: exact CSS width not established`);
  assert.equal(value.innerHeight, testCase.height, `${source}/${testCase.id}: exact CSS height not established`);
  return value;
}

try {
  for (const source of ['main', 'production']) {
    for (const testCase of cases) {
      results.push({ source, case: testCase.id, ...await characterize(source, testCase) });
    }
  }
  console.log(JSON.stringify({ browser, protocol: 'CDP exact device metrics', results }, null, 2));
} finally {
  await browserSession.close();
  await new Promise((done) => server.close(done));
}
