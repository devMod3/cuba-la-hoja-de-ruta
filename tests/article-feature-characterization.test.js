import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ArticleFeature,
  estimateReadingMinutes,
  isBloggerPostPath,
  slugifyHeading
} from '../src/features/article/ArticleFeature.js';

class Classes {
  constructor(...values) { this.values = new Set(values); }
  contains(value) { return this.values.has(value); }
  toggle(value, force) {
    const on = force ?? !this.values.has(value);
    if (on) this.values.add(value); else this.values.delete(value);
    return on;
  }
}

class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.dataset = {};
    this.attrs = new Map();
    this.classList = new Classes();
    this.children = [];
    this.q = new Map();
    this.qa = new Map();
    this.closestMap = new Map();
    this.hidden = false;
    this.id = '';
    this.textContent = '';
    this.innerHTML = '';
    this.offsetHeight = 0;
    this.listeners = [];
  }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  getAttribute(k) { return k === 'href' && this.href !== undefined ? this.href : (this.attrs.get(k) ?? null); }
  removeAttribute(k) { this.attrs.delete(k); }
  hasAttribute(k) { return this.attrs.has(k); }
  append(child) { this.children.push(child); }
  replaceChildren(...children) { this.children = children; }
  querySelector(s) { return this.q.get(s) ?? null; }
  querySelectorAll(s) { return this.qa.get(s) ?? []; }
  closest(s) { return this.closestMap.get(s) ?? null; }
  addEventListener(type, fn, options) { this.listeners.push(['add', type, fn, options]); }
  removeEventListener(type, fn, options) { this.listeners.push(['remove', type, fn, options]); }
  getBoundingClientRect() { return this.rect ?? { top: 0 }; }
  scrollIntoView(options) { this.scrolled = options; }
  remove() { this.removed = true; }
}

class Anchor extends El {
  constructor(href = '') { super('a'); this.href = href; this.target = ''; }
}

class Parser {
  parseFromString(value) {
    return { body: { textContent: String(value).replace(/<[^>]+>/g, ' ') } };
  }
}

class CE {
  constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
}

function browser(href = 'https://example.test/#zen-home') {
  const saved = new Map();
  const set = (name, value) => {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  };
  let url = new URL(href);
  const assigned = [], history = [], scrolls = [], prints = [], copies = [], documentEvents = [];
  const docListeners = [], winListeners = [];
  const location = { assign(value) { assigned.push(String(value)); url = new URL(value, url); } };
  Object.defineProperties(location, {
    href: { get: () => url.href }, origin: { get: () => url.origin },
    pathname: { get: () => url.pathname }, hash: { get: () => url.hash }
  });
  const document = {
    documentElement: new El('html'), body: new El('body'),
    createElement(tag) { return tag === 'a' ? new Anchor() : new El(tag); },
    dispatchEvent(event) { documentEvents.push(event); },
    addEventListener(...args) { docListeners.push(['add', ...args]); },
    removeEventListener(...args) { docListeners.push(['remove', ...args]); },
    querySelector() { return null; }, querySelectorAll() { return []; }
  };
  const window = {
    scrollY: 0, innerHeight: 1000,
    history: {
      pushState(state, title, value) { history.push(['push', state, value]); url = new URL(value, url); },
      replaceState(state, title, value) { history.push(['replace', state, value]); url = new URL(value, url); }
    },
    scrollTo(options) { scrolls.push(options); this.scrollY = options.top ?? this.scrollY; },
    print() { prints.push(true); },
    addEventListener(...args) { winListeners.push(['add', ...args]); },
    removeEventListener(...args) { winListeners.push(['remove', ...args]); }
  };
  set('Element', El); set('HTMLAnchorElement', Anchor); set('DOMParser', Parser); set('CustomEvent', CE);
  set('CSS', { escape: String }); set('document', document); set('window', window); set('location', location);
  set('navigator', { clipboard: { writeText(value) { copies.push(String(value)); return Promise.resolve(); } } });
  return {
    assigned, history, scrolls, prints, copies, documentEvents, docListeners, winListeners, document, window,
    go(value) { url = new URL(value, url); },
    restore() { for (const [name, d] of saved) d ? Object.defineProperty(globalThis, name, d) : delete globalThis[name]; }
  };
}

function click(target) {
  return {
    button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false,
    defaultPrevented: false, target,
    preventDefault() { this.prevented = true; }
  };
}

async function flush() { await Promise.resolve(); await new Promise((r) => setImmediate(r)); }

test('article helpers preserve routing, slugs and reading-time contracts', () => {
  assert.equal(isBloggerPostPath('/2026/08/doc.html'), true);
  assert.equal(isBloggerPostPath('/p/acerca-de.html'), false);
  assert.equal(slugifyHeading('Soberanía y Constitución'), 'soberania-y-constitucion');
  assert.equal(slugifyHeading('***'), 'seccion');
  assert.equal(estimateReadingMinutes('breve'), 1);
  assert.equal(estimateReadingMinutes('p '.repeat(441)), 3);
});

test('mount creation, post caching and path lookup are deterministic', async () => {
  const b = browser();
  try {
    const app = new El('main');
    const root = { querySelector: (s) => s === '#zen-app' ? app : null };
    let calls = 0;
    const posts = [{ id: '1', url: 'https://example.test/2026/08/a.html/' }, { id: 'x' }];
    const f = new ArticleFeature({ root, contentSource: { async listPosts() { calls++; return posts; } } });
    f.ensureMount();
    assert.equal(f.createdMount, true);
    assert.equal(f.mount.id, 'zen-article');
    assert.equal(f.mount.hidden, true);
    assert.equal(f.mount.getAttribute('aria-hidden'), 'true');
    assert.equal(app.children[0], f.mount);
    const p1 = f.loadPosts(), p2 = f.loadPosts();
    assert.equal(p1, p2); await p1;
    assert.equal(calls, 1);
    assert.equal((await f.findPost('/2026/08/a.html')).id, '1');
    assert.equal(await f.findPost('/2026/08/missing.html'), null);
    const existing = new El('section');
    const reused = new ArticleFeature({ root: { querySelector: () => existing } });
    reused.ensureMount(); assert.equal(reused.mount, existing); assert.equal(reused.createdMount, false);
  } finally { b.restore(); }
});

test('render emits escaped metadata, raw article body and safe fallback', () => {
  const b = browser();
  try {
    const f = new ArticleFeature(); f.mount = new El('section');
    let toc = 0; f.buildToc = () => toc++;
    f.render({
      id: '1', title: '<Título & control>', url: 'https://example.test/2026/08/a.html',
      content: '<h2>Parte</h2><p>texto</p>', summary: '<b>Resumen</b>',
      publishedAt: '2026-08-20T00:00:00Z', labels: ['Tipo/Norma', 'Pilar/Estado', 'Tema <x>']
    });
    assert.match(f.mount.innerHTML, /&lt;Título &amp; control&gt;/);
    assert.match(f.mount.innerHTML, /Resumen/);
    assert.match(f.mount.innerHTML, /zen-article-type">Norma/);
    assert.match(f.mount.innerHTML, /zen-article-pillar">Estado/);
    assert.match(f.mount.innerHTML, /Tema &lt;x&gt;/);
    assert.match(f.mount.innerHTML, /<h2>Parte<\/h2><p>texto<\/p>/);
    assert.equal(toc, 1);
    f.render({ id: '2', title: 'Vacío', url: '/2026/08/b.html', content: '', summary: '', publishedAt: 'bad', labels: [] });
    assert.match(f.mount.innerHTML, /Este documento no contiene cuerpo de lectura/);
    assert.match(f.mount.innerHTML, /bad/);
  } finally { b.restore(); }
});

test('TOC derives unique stable ids and collapses when no headings exist', () => {
  const b = browser();
  try {
    const body = new El(), toc = new El('nav'), rail = new El(), toggle = new El(), layout = new El();
    const a = new El('h2'); a.textContent = 'Ámbito';
    const c = new El('h3'); c.textContent = 'Ámbito';
    const keep = new El('h2'); keep.textContent = 'Original'; keep.id = 'editorial';
    body.qa.set('h2, h3', [a, c, keep]);
    const mount = new El();
    for (const [k, v] of [['#zen-article-body', body], ['.zen-article-toc', toc], ['.zen-article-rail', rail], ['.zen-article-toc-toggle', toggle], ['.zen-article-layout', layout]]) mount.q.set(k, v);
    const f = new ArticleFeature(); f.mount = mount; f.buildToc();
    assert.equal(a.id, 'ambito'); assert.equal(c.id, 'ambito-2'); assert.equal(keep.id, 'editorial');
    assert.equal(toc.children.length, 3); assert.equal(mount.dataset.hasToc, 'true');
    body.qa.set('h2, h3', []); f.buildToc();
    assert.equal(rail.hidden, true); assert.equal(toggle.hidden, true);
    assert.equal(layout.classList.contains('zen-article-layout-single'), true);
  } finally { b.restore(); }
});

test('open and activate own SPA history, view visibility and route events', async () => {
  const b = browser();
  try {
    const mount = new El('section'), home = new El('section'), link = new Anchor('#zen-home'), shell = new El();
    const root = { querySelectorAll: (s) => s === '[data-zen-view]' ? [home, mount] : s === '[data-zen-route]' ? [link] : [] };
    const f = new ArticleFeature({ root }); f.mount = mount; f.shell = shell;
    f.updateReadingState = () => { f.reads = (f.reads ?? 0) + 1; };
    const post = { id: '42', url: 'https://example.test/2026/08/doc.html' };
    f.findPost = async () => post; f.render = (p) => { f.rendered = p; };
    assert.equal(await f.open(post.url), true);
    assert.equal(b.history[0][0], 'push'); assert.equal(f.rendered, post); assert.equal(f.currentPost, post);
    assert.equal(home.hidden, true); assert.equal(mount.hidden, false);
    assert.equal(document.documentElement.dataset.zenRoute, 'zen-article');
    assert.deepEqual(b.documentEvents[0].detail, { route: 'zen-article', postId: '42' });
    assert.equal(f.reads, 1);
    await f.open(post.url, { history: 'replace', scrollTop: false });
    assert.equal(b.history.at(-1)[0], 'replace');
    f.findPost = async () => null; assert.equal(await f.open('/2026/08/no.html'), false);
  } finally { b.restore(); }
});

test('document link interception preserves native semantics and falls back to Blogger', async () => {
  const b = browser();
  const oldError = console.error;
  try {
    const f = new ArticleFeature();
    const a = new Anchor('https://example.test/2026/08/doc.html');
    const target = new El('span'); target.closestMap.set('a[href]', a);
    f.open = async () => true;
    const e = click(target); f.onDocumentClick(e); await flush();
    assert.equal(e.prevented, true); assert.equal(b.assigned.length, 0);
    const ctrl = click(target); ctrl.ctrlKey = true; f.onDocumentClick(ctrl); assert.equal(ctrl.prevented, undefined);
    a.target = '_blank'; const blank = click(target); f.onDocumentClick(blank); assert.equal(blank.prevented, undefined); a.target = '';
    f.open = async () => false; const miss = click(target); f.onDocumentClick(miss); await flush(); assert.equal(b.assigned.at(-1), a.href);
    console.error = () => {}; f.open = async () => { throw new Error('x'); };
    const bad = click(target); f.onDocumentClick(bad); await flush(); assert.equal(b.assigned.at(-1), a.href);
  } finally { console.error = oldError; b.restore(); }
});

test('reader controls print, copy, TOC and heading navigation', async () => {
  const b = browser();
  try {
    const f = new ArticleFeature(); f.shell = new El(); f.mount = new El();
    f.currentPost = { title: 'Documento', url: 'https://example.test/2026/08/doc.html' };
    const action = (name) => { const t = new El('button'), n = new El('button'); n.setAttribute('data-action', name); t.closestMap.set('[data-action]', n); return t; };
    f.onMountClick({ target: action('toc-open') }); assert.equal(f.shell.getAttribute('data-toc-open'), 'true');
    f.onMountClick({ target: action('toc-close') }); assert.equal(f.shell.hasAttribute('data-toc-open'), false);
    f.onMountClick({ target: action('print') }); assert.equal(b.prints.length, 1);
    f.onMountClick({ target: action('copy-reference') }); await flush(); assert.equal(b.copies[0], 'Documento — https://example.test/2026/08/doc.html');
    const heading = new El('h2'), a = new Anchor('#parte'), t = new El('span'); a.setAttribute('href', '#parte');
    t.closestMap.set('[data-action]', null); t.closestMap.set('.zen-article-toc a[href^="#"]', a); f.mount.q.set('#parte', heading);
    const e = { target: t, preventDefault() { this.prevented = true; } }; f.onMountClick(e);
    assert.equal(e.prevented, true); assert.deepEqual(heading.scrolled, { behavior: 'smooth', block: 'start' });
  } finally { b.restore(); }
});

test('popstate and route-change preserve direct Blogger fallback semantics', () => {
  const b = browser('https://example.test/2026/08/doc.html');
  try {
    const applied = []; const f = new ArticleFeature({ navigation: { apply: (r) => applied.push(r) } });
    const opens = []; f.open = (href, options) => { opens.push([href, options]); return Promise.resolve(true); };
    f.onPopState(); assert.deepEqual(opens[0][1], { history: 'none', scrollTop: false });
    b.go('https://example.test/#zen-explore'); f.currentPost = { id: '1' }; f.onPopState(); assert.equal(applied.at(-1), 'zen-explore');
    b.go('https://example.test/2026/08/doc.html'); f.currentPost = { id: '1' }; f.startedOnItemDocument = false;
    f.onRouteChanged({ detail: { route: 'zen-home' } }); assert.equal(b.history.at(-1)[2], '/#zen-home');
    b.go('https://example.test/2026/08/doc.html'); f.currentPost = { id: '1' }; f.startedOnItemDocument = true;
    const n = b.history.length; f.onRouteChanged({ detail: { route: 'zen-about' } }); assert.equal(b.history.length, n);
  } finally { b.restore(); }
});

test('reading progress and active TOC follow actual viewport geometry', () => {
  const b = browser();
  try {
    const body = new El(); body.offsetHeight = 3000; body.getBoundingClientRect = () => ({ top: 100 - window.scrollY });
    const h1 = new El('h2'); h1.id = 'uno'; h1.rect = { top: 80 };
    const h2 = new El('h3'); h2.id = 'dos'; h2.rect = { top: 160 };
    const h3 = new El('h2'); h3.id = 'tres'; h3.rect = { top: 260 };
    body.qa.set('h2[id], h3[id]', [h1, h2, h3]);
    const progress = new El('progress'); progress.value = 0;
    const l1 = new Anchor('#uno'), l2 = new Anchor('#dos'), l3 = new Anchor('#tres');
    const mount = new El(); mount.q.set('#zen-article-body', body); mount.q.set('.zen-reading-progress', progress); mount.qa.set('.zen-article-toc a', [l1, l2, l3]);
    const f = new ArticleFeature(); f.mount = mount; f.currentPost = { id: '1' };
    window.scrollY = 900; f.updateReadingState();
    assert.ok(progress.value > 40 && progress.value < 50); assert.equal(l2.getAttribute('aria-current'), 'true');
    window.scrollY = 10000; f.updateReadingState(); assert.equal(progress.value, 100);
    body.qa.set('h2[id], h3[id]', []); assert.doesNotThrow(() => f.updateReadingState());
    f.currentPost = null; progress.value = 17; f.updateReadingState(); assert.equal(progress.value, 17);
  } finally { b.restore(); }
});

test('boot and destroy wire lifecycle without changing product behavior', async () => {
  const b = browser();
  try {
    const mount = new El('section'), shell = new El('main');
    const root = { querySelector: (s) => s === '#zen-article' ? mount : s === '#zen-blog-prototype' ? shell : null };
    const f = new ArticleFeature({ root }); let loads = 0; f.loadPosts = () => { loads++; return Promise.resolve([]); };
    f.boot(); assert.equal(loads, 1); assert.equal(b.docListeners.filter(x => x[0] === 'add').length, 2); assert.equal(b.winListeners.filter(x => x[0] === 'add').length, 3);
    f.createdMount = true; f.currentPost = { id: '1' }; f.destroy();
    assert.equal(mount.removed, true); assert.equal(f.currentPost, null); assert.equal(f.mount, null); assert.equal(f.shell, null);

    b.go('https://example.test/2026/08/direct.html'); document.body.classList = new Classes('item-view');
    const directMount = new El('section');
    const direct = new ArticleFeature({ root: { querySelector: (s) => s === '#zen-article' ? directMount : s === '#zen-blog-prototype' ? new El('main') : null } });
    direct.loadPosts = () => Promise.resolve([]); const opened = []; direct.open = async (...args) => { opened.push(args); return true; };
    direct.boot(); await flush(); assert.equal(direct.startedOnItemDocument, true); assert.deepEqual(opened[0][1], { history: 'none' }); direct.destroy();
  } finally { b.restore(); }
});
