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
  { id: 'phone-landscape', width: 667, height: 375 }
];

function attr(html, name) {
  const match = html.match(new RegExp(`data-${name}="([^"]*)"`));
  assert.ok(match, `missing data-${name}`);
  return match[1];
}

async function dumpDom(source, testCase) {
  const url = `http://127.0.0.1:${port}/tests/fixtures/home-viewport.html?source=${source}`;
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(browser, [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--window-size=${testCase.width},${testCase.height}`,
      '--virtual-time-budget=3500',
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
      else rejectRun(new Error(`${browser} exited ${code}: ${stderr.slice(-1600)}`));
    });
  });
}

const results = [];
try {
  for (const source of ['main', 'production']) {
    for (const testCase of cases) {
      const html = await dumpDom(source, testCase);
      assert.equal(attr(html, 'characterization-ready'), 'true');
      results.push({
        source,
        case: testCase.id,
        requestedViewport: `${testCase.width}x${testCase.height}`,
        actualViewport: attr(html, 'viewport'),
        headerH: attr(html, 'header-h'),
        playerSafe: attr(html, 'player-safe'),
        homeHeight: Number(attr(html, 'home-height')),
        homeClientHeight: Number(attr(html, 'home-client-height')),
        homeScrollHeight: Number(attr(html, 'home-scroll-height')),
        overflowY: attr(html, 'overflow-y'),
        contentTop: Number(attr(html, 'content-top')),
        contentBottom: Number(attr(html, 'content-bottom')),
        homeTop: Number(attr(html, 'home-top')),
        homeBottom: Number(attr(html, 'home-bottom')),
        scrollable: attr(html, 'scrollable') === 'true',
        essentialOutside: attr(html, 'essential-outside') === 'true',
        essentialInaccessible: attr(html, 'essential-inaccessible') === 'true'
      });
    }
  }

  console.log(JSON.stringify({ browser, results }, null, 2));
} finally {
  await new Promise((done) => server.close(done));
}
