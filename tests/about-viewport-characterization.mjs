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
  ['.css', 'text/css; charset=utf-8'],
  ['.svg', 'image/svg+xml']
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
  throw new Error('Chromium/Chrome no está disponible para About viewport characterization.');
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
      const list = this.waiters.get(method) ?? [];
      list.push({ resolve: (value) => { clearTimeout(timer); resolveWait(value); } });
      this.waiters.set(method, list);
    });
  }

  close() { this.ws.close(); }
}

async function launchBrowser(browser) {
  const profileDir = await mkdtemp(join(tmpdir(), 'zenblog-about-viewport-'));
  let stderr = '';
  const child = spawn(browser, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${profileDir}`, 'about:blank'
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
    let path = safePath(req.url || '/');
    if (!path) return void res.writeHead(403).end('Forbidden');
    const info = await stat(path);
    if (info.isDirectory()) path = resolve(path, 'index.html');
    const data = await readFile(path);
    res.writeHead(200, { 'content-type': MIME.get(extname(path)) || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
});

await new Promise((done) => server.listen(0, '127.0.0.1', done));
const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
const browser = await findBrowser();
const session = await launchBrowser(browser);
const { cdp } = session;

const cases = [
  { id: '320', width: 320, height: 568 },
  { id: '390', width: 390, height: 700 },
  { id: '768', width: 768, height: 1024 }
];

async function evaluateValue(expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
  return result.result.value;
}

async function characterize(source, state, testCase) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: testCase.width,
    height: testCase.height,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: testCase.width,
    screenHeight: testCase.height,
    screenOrientation: { type: 'portraitPrimary', angle: 0 }
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

  const loaded = cdp.waitFor('Page.loadEventFired');
  const url = `http://127.0.0.1:${port}/tests/fixtures/about-viewport.html?source=${source}&state=${state}&t=${Date.now()}`;
  await cdp.send('Page.navigate', { url });
  await loaded;
  await evaluateValue(`new Promise((resolve) => {
    const started = performance.now();
    const tick = () => document.body?.dataset.aboutReady === 'true' || performance.now() - started > 5000 ? resolve(true) : setTimeout(tick, 20);
    tick();
  })`);
  await evaluateValue('new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))');

  const value = await evaluateValue(`(() => {
    const root = document.getElementById('zen-about');
    const shell = root.querySelector('.zen-about-shell');
    const profileTop = root.querySelector('.zen-about-profile-top');
    const title = root.querySelector('h1');
    const lead = root.querySelector('.zen-about-lead');
    const rootStyle = getComputedStyle(root);
    const shellRect = shell?.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const profileStyle = profileTop ? getComputedStyle(profileTop) : null;
    return {
      innerWidth,
      innerHeight,
      ready: document.body.dataset.aboutReady === 'true',
      title: title?.textContent?.trim() || '',
      lead: lead?.textContent?.trim() || '',
      fallback: Boolean(root.querySelector('.zen-about-intro--fallback')),
      hasProfileTop: Boolean(profileTop),
      hasPhoto: Boolean(root.querySelector('.zen-about-photo')),
      socialCount: root.querySelectorAll('.zen-about-social').length,
      resourceCount: root.querySelectorAll('.zen-about-resource').length,
      gridColumns: profileStyle?.gridTemplateColumns || '',
      rootPaddingBottom: rootStyle.paddingBottom,
      rootOverflowY: rootStyle.overflowY,
      rootClientHeight: root.clientHeight,
      rootScrollHeight: root.scrollHeight,
      shellBottom: shellRect ? Number(shellRect.bottom.toFixed(2)) : -1,
      rootBottom: Number(rootRect.bottom.toFixed(2)),
      scrollable: root.scrollHeight > root.clientHeight + 1 && /auto|scroll/.test(rootStyle.overflowY),
      contentInaccessible: Boolean(shellRect && shellRect.bottom > rootRect.bottom + 1 && !(root.scrollHeight > root.clientHeight + 1 && /auto|scroll/.test(rootStyle.overflowY))),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1
    };
  })()`);

  assert.equal(value.innerWidth, testCase.width, `${source}/${state}/${testCase.id}: exact width not established`);
  assert.equal(value.innerHeight, testCase.height, `${source}/${state}/${testCase.id}: exact height not established`);
  return { source, state, case: testCase.id, width: testCase.width, height: testCase.height, ...value };
}

const results = [];
try {
  for (const source of ['canonical', 'production']) {
    for (const state of ['empty', 'populated']) {
      for (const testCase of cases) results.push(await characterize(source, state, testCase));
    }
  }

  for (const row of results) {
    assert.equal(row.ready, true, `${row.source}/${row.state}/${row.case}: About did not mount`);
    assert.equal(row.title, 'La hoja de ruta', `${row.source}/${row.state}/${row.case}: title missing`);
    assert.equal(row.horizontalOverflow, false, `${row.source}/${row.state}/${row.case}: horizontal overflow`);
    assert.equal(row.contentInaccessible, false, `${row.source}/${row.state}/${row.case}: content inaccessible`);
    if (row.state === 'empty') {
      assert.equal(row.fallback, true, `${row.source}/${row.case}: empty state must preserve fallback`);
    } else {
      assert.equal(row.fallback, false, `${row.source}/${row.case}: populated state must replace fallback`);
      assert.equal(row.hasProfileTop, true, `${row.source}/${row.case}: populated profile missing`);
      assert.equal(row.hasPhoto, true, `${row.source}/${row.case}: profile photo missing`);
      assert.equal(row.socialCount, 2, `${row.source}/${row.case}: social links missing`);
      assert.equal(row.resourceCount, 1, `${row.source}/${row.case}: resource missing`);
      assert.match(row.lead, /Plataforma editorial y documental/, `${row.source}/${row.case}: introduction missing`);
    }
  }

  console.log(JSON.stringify({ browser, protocol: 'CDP exact About viewport characterization', results }, null, 2));
  console.log('M-004 baseline characterization: PASS');
} finally {
  await session.close();
  await new Promise((done) => server.close(done));
}
