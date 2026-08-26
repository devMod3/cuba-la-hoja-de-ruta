import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ArticleFeature,
  estimateReadingMinutes,
  isBloggerPostPath,
  slugifyHeading
} from '../src/features/article/ArticleFeature.js';

class FakeClassList {
  constructor(values = []) {
    this.values = new Set(values);
  }

  contains(value) {
    return this.values.has(value);
  }

  toggle(value, force) {
    const enabled = force === undefined ? !this.values.has(value) : Boolean(force);
    if (enabled) this.values.add(value);
    else this.values.delete(value);
    return enabled;
  }
}

class FakeElement {
  constructor(tagName = 'div') {
    this.tagName = String(tagName).toUpperCase();
    this.dataset = {};
    this.attributes = new Map();
    this.classList = new FakeClassList();
    this.children = [];
    this.hidden = false;
    this.id = '';
    this.className = '';
    this.textContent = '';
    this.innerHTML = '';
    this.offsetHeight = 0;
    this.removed = false;
    this.listeners = [];
    this.queryMap = new Map();
    this.queryAllMap = new Map();
    this.closestMap = new Map();
    this.rect = { top: 0 };
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    if (name === 'href' && typeof this.href === 'string') return this.href;
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  append(child) {
    this.children.push(child);
    child.parentElement = this;
  }

  replaceChildren(...children) {
    this.children = [...children];
  }

  remove() {
    this.removed = true;
  }

  addEventListener(type, handler, options) {
    this.listeners.push({ op: 'add', type, handler, options });
  }

  removeEventListener(type, handler, options) {
    this.listeners.push({ op: 'remove', type, handler, options });
  }

  querySelector(selector) {
    return this.queryMap.get(selector) ?? null;
  }

  querySelectorAll(selector) {
    return this.queryAllMap.get(selector) ?? [];
  }

  closest(selector) {
    return this.closestMap.get(selector) ?? null;
  }

  getBoundingClientRect() {
    return this.rect;
  }

  scrollIntoView(options) {
    this.scrollOptions = options;
  }
}

class FakeAnchor extends FakeElement {
  constructor(href = '') {
    super('a');
    this.href = href;
    this.target = '';
  }
}

class FakeDOMParser {
  parseFromString(value) {
    const textContent = String(value)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    return { body: { textContent } };
  }
}

class FakeCustomEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
}

function installGlobal(name, value, saved) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  saved.set(name, descriptor);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value
  });
}

function installBrowser(href = 'https://example.test/#zen-home') {
  const saved = new Map();
  let currentUrl = new URL(href);
  const assigned = [];
  const historyCalls = [];
  const scrollCalls = [];
  const printCalls = [];
  const clipboardWrites = [];
  const documentEvents = [];
  const documentListeners = [];
  const windowListeners = [];

  const locationObject = {
    assign(value) {
      assigned.push(String(value));
      currentUrl = new URL(value, currentUrl);
    }
  };
  Object.defineProperties(locationObject, {
    href: { get: () => currentUrl.href },
    origin: { get: () => currentUrl.origin },
    pathname: { get: () => currentUrl.pathname },
    hash: { get: () => currentUrl.hash }
  });

  const documentObject = {
    documentElement: new FakeElement('html'),
    body: new FakeElement('body'),
    createElement(tagName) {
      return String(tagName).toLowerCase() === 'a'
        ? new FakeAnchor()
        : new FakeElement(tagName);
    },
    dispatchEvent(event) {
      documentEvents.push(event);
      return true;
    },
    addEventListener(type, handler, options) {
      documentListeners.push({ op: 'add', type, handler, options });
    },
    removeEventListener(type, handler, options) {
      documentListeners.push({ op: 'remove', type, handler, options });
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };

  const windowObject = {
    innerHeight: 1000,
    scrollY: 0,
    history: {
      pushState(state, title, value) {
        historyCalls.push({ method: 'push', state, title, value: String(value) });
        currentUrl = new URL(value, currentUrl);
      },
      replaceState(state, title, value) {
        historyCalls.push({ method: 'replace', state, title, value: String(value) });
        currentUrl = new URL(value, currentUrl);
      }
    },
    scrollTo(options) {
      scrollCalls.push(options);
      if (typeof options?.top === 'number') this.scrollY = options.top;
    },
    print() {
      printCalls.push(true);
    },
    addEventListener(type, handler, options) {
      windowListeners.push({ op: 'add', type, handler, options });
    },
    removeEventListener(type, handler, options) {
      windowListeners.push({ op: 'remove', type, handler, options });
    }
  };

  const navigatorObject = {
    clipboard: {
      writeText(value) {
        clipboardWrites.push(String(value));
        return Promise.resolve();
      }
    }
  };

  installGlobal('Element', FakeElement, saved);
  installGlobal('HTMLAnchorElement', FakeAnchor, saved);
  installGlobal('DOMParser', FakeDOMParser, saved);
  installGlobal('CustomEvent', FakeCustomEvent, saved);
  installGlobal('CSS', { escape: (value) => String(value) }, saved);
  installGlobal('document', documentObject, saved);
  installGlobal('window', windowObject, saved);
  installGlobal('location', locationObject, saved);
  installGlobal('navigator', navigatorObject, saved);

  return {
    assigned,
    clipboardWrites,
    documentEvents,
    documentListeners,
    documentObject,
    historyCalls,
    locationObject,
    navigate(value) {
      currentUrl = new URL(value, currentUrl);
    },
    printCalls,
    restore() {
      for (const [name, descriptor] of saved) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
    scrollCalls,
    windowListeners,
    windowObject
  };
}

function plainClick(target) {
  return {
    altKey: false,
    button: 0,
    ctrlKey: false,
    defaultPrevented: false,
    metaKey: false,
    shiftKey: false,
    target,
    preventDefault() {
      this.prevented = true;
    }
  };
}

function actionTarget(action) {
  const target = new FakeElement('button');
  const actionNode = new FakeElement('button');
  actionNode.setAttribute('data-action', action);
  target.closestMap.set('[data-action]', actionNode);
  return target;
}

async function flushPromises() {
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

test('recognizes Blogger post URLs without matching static pages', () => {
  assert.equal(isBloggerPostPath('/2026/08/que-es-pueblo.html'), true);
  assert.equal(isBloggerPostPath('/2026/8/que-es-pueblo.html'), false);
  assert.equal(isBloggerPostPath('/p/acerca-de.html'), false);
  assert.equal(isBloggerPostPath('/search'), false);
});

test('creates stable accent-insensitive TOC slugs with deterministic fallback', () => {
  assert.equal(slugifyHeading('Soberanía y Constitución'), 'soberania-y-constitucion');
  assert.equal(slugifyHeading('  Artículo 40  '), 'articulo-40');
  assert.equal(slugifyHeading('***'), 'seccion');
});

test('reading time never collapses below one minute', () => {
  assert.equal(estimateReadingMinutes('texto breve'), 1);
  assert.equal(estimateReadingMinutes('palabra '.repeat(441)), 3);
  assert.equal(estimateReadingMinutes('', 100), 1);
});

test('ensureMount reuses the existing article view or creates the canonical mount', () => {
  const browser = installBrowser();
  try {
    const existing = new FakeElement('section');
    const rootWithExisting = {
      querySelector(selector) {
        return selector === '#zen-article' ? existing : null;
      }
    };
    const reused = new ArticleFeature({ root: rootWithExisting });
    reused.ensureMount();
    assert.equal(reused.mount, existing);
    assert.equal(reused.createdMount, false);

    const app = new FakeElement('main');
    const root = {
      querySelector(selector) {
        if (selector === '#zen-article') return null;
        if (selector === '#zen-app') return app;
        return null;
      }
    };
    const created = new ArticleFeature({ root });
    created.ensureMount();
    assert.equal(created.createdMount, true);
    assert.equal(created.mount.id, 'zen-article');
    assert.equal(created.mount.dataset.zenView, 'article');
    assert.equal(created.mount.hidden, true);
    assert.equal(created.mount.getAttribute('aria-hidden'), 'true');
    assert.equal(app.children[0], created.mount);

    const missingApp = new ArticleFeature({
      root: { querySelector: () => null }
    });
    missingApp.ensureMount();
    assert.equal(missingApp.mount, null);
  } finally {
    browser.restore();
  }
});

test('loadPosts caches one content fetch and findPost normalizes Blogger paths', async () => {
  const browser = installBrowser('https://example.test/#zen-home');
  try {
    let listCalls = 0;
    const posts = [
      { id: '1', url: 'https://example.test/2026/08/uno.html' },
      { id: '2', url: 'https://example.test/2026/08/dos.html/' },
      { id: 'ignored' }
    ];
    const feature = new ArticleFeature({
      contentSource: {
        async listPosts() {
          listCalls += 1;
          return posts;
        }
      }
    });

    const first = feature.loadPosts();
    const second = feature.loadPosts();
    assert.equal(first, second);
    assert.equal(await first, posts);
    assert.equal(listCalls, 1);
    assert.equal((await feature.findPost('/2026/08/uno.html')).id, '1');
    assert.equal((await feature.findPost('https://example.test/2026/08/dos.html')).id, '2');
    assert.equal(await feature.findPost('/2026/08/missing.html'), null);
  } finally {
    browser.restore();
  }
});

test('render preserves article HTML while escaping metadata and exposing fallback reading content', () => {
  const browser = installBrowser();
  try {
    const mount = new FakeElement('section');
    const feature = new ArticleFeature();
    feature.mount = mount;
    let tocBuilds = 0;
    feature.buildToc = () => {
      tocBuilds += 1;
    };

    feature.render({
      id: '42',
      title: '<Riesgo & "control">',
      url: 'https://example.test/2026/08/documento.html',
      content: '<h2>Ámbito</h2><p>uno dos tres</p>',
      summary: '<p>Resumen <strong>seguro</strong></p>',
      publishedAt: '2026-08-20T12:00:00.000Z',
      labels: ['Tipo/Norma', 'Pilar/Estado', 'Tema <x>']
    });

    assert.equal(tocBuilds, 1);
    assert.match(mount.innerHTML, /&lt;Riesgo &amp; &quot;control&quot;&gt;/);
    assert.match(mount.innerHTML, /Resumen seguro/);
    assert.match(mount.innerHTML, /zen-article-type">Norma</);
    assert.match(mount.innerHTML, /zen-article-pillar">Estado</);
    assert.match(mount.innerHTML, /Tema &lt;x&gt;/);
    assert.match(mount.innerHTML, /<h2>Ámbito<\/h2><p>uno dos tres<\/p>/);
    assert.match(mount.innerHTML, /1 min de lectura/);

    feature.render({
      id: '43',
      title: 'Sin cuerpo',
      url: 'https://example.test/2026/08/sin-cuerpo.html',
      content: '',
      summary: '',
      publishedAt: 'not-a-date',
      labels: []
    });
    assert.equal(tocBuilds, 2);
    assert.match(mount.innerHTML, /Este documento no contiene cuerpo de lectura/);
    assert.match(mount.innerHTML, /not-a-date/);
    assert.doesNotMatch(mount.innerHTML, /zen-article-identity/);
    assert.doesNotMatch(mount.innerHTML, /zen-article-matters/);
  } finally {
    browser.restore();
  }
});

test('buildToc generates unique heading anchors and collapses the rail when headings disappear', () => {
  const browser = installBrowser();
  try {
    const body = new FakeElement('div');
    const first = new FakeElement('h2');
    first.textContent = 'Soberanía y Constitución';
    const second = new FakeElement('h3');
    second.textContent = 'Soberanía y Constitución';
    const blank = new FakeElement('h2');
    blank.textContent = '   ';
    const preserved = new FakeElement('h2');
    preserved.textContent = 'Original';
    preserved.id = 'id-editorial';
    body.queryAllMap.set('h2, h3', [first, second, blank, preserved]);

    const toc = new FakeElement('nav');
    const rail = new FakeElement('aside');
    const toggle = new FakeElement('button');
    const layout = new FakeElement('div');
    const mount = new FakeElement('section');
    mount.queryMap.set('#zen-article-body', body);
    mount.queryMap.set('.zen-article-toc', toc);
    mount.queryMap.set('.zen-article-rail', rail);
    mount.queryMap.set('.zen-article-toc-toggle', toggle);
    mount.queryMap.set('.zen-article-layout', layout);

    const feature = new ArticleFeature();
    feature.mount = mount;
    feature.buildToc();

    assert.equal(first.id, 'soberania-y-constitucion');
    assert.equal(second.id, 'soberania-y-constitucion-2');
    assert.equal(preserved.id, 'id-editorial');
    assert.deepEqual(toc.children.map((link) => link.textContent), [
      'Soberanía y Constitución',
      'Soberanía y Constitución',
      'Original'
    ]);
    assert.deepEqual(toc.children.map((link) => link.dataset.level), ['h2', 'h3', 'h2']);
    assert.equal(rail.hidden, false);
    assert.equal(toggle.hidden, false);
    assert.equal(layout.classList.contains('zen-article-layout-single'), false);
    assert.equal(mount.dataset.hasToc, 'true');

    body.queryAllMap.set('h2, h3', []);
    feature.buildToc();
    assert.equal(toc.children.length, 0);
    assert.equal(rail.hidden, true);
    assert.equal(toggle.hidden, true);
    assert.equal(layout.classList.contains('zen-article-layout-single'), true);
    assert.equal(mount.dataset.hasToc, 'false');

    feature.mount = new FakeElement('section');
    assert.doesNotThrow(() => feature.buildToc());
  } finally {
    browser.restore();
  }
});

test('activate owns the reader route, view visibility and route-change event', () => {
  const browser = installBrowser();
  try {
    const mount = new FakeElement('section');
    mount.hidden = true;
    const home = new FakeElement('section');
    const routeLink = new FakeAnchor('#zen-home');
    routeLink.setAttribute('aria-current', 'true');
    const root = {
      querySelectorAll(selector) {
        if (selector === '[data-zen-view]') return [home, mount];
        if (selector === '[data-zen-route]') return [routeLink];
        return [];
      }
    };
    const shell = new FakeElement('main');
    shell.setAttribute('data-toc-open', 'true');
    const feature = new ArticleFeature({ root });
    feature.mount = mount;
    feature.shell = shell;
    let readingUpdates = 0;
    feature.updateReadingState = () => {
      readingUpdates += 1;
    };
    const post = { id: '42' };

    feature.activate(post);
    assert.equal(home.hidden, true);
    assert.equal(home.getAttribute('aria-hidden'), 'true');
    assert.equal(mount.hidden, false);
    assert.equal(mount.getAttribute('aria-hidden'), 'false');
    assert.equal(routeLink.getAttribute('aria-current'), 'false');
    assert.equal(feature.currentPost, post);
    assert.equal(shell.hasAttribute('data-toc-open'), false);
    assert.equal(browser.documentObject.documentElement.dataset.zenRoute, 'zen-article');
    assert.deepEqual(browser.documentEvents[0].detail, { route: 'zen-article', postId: '42' });
    assert.deepEqual(browser.scrollCalls[0], { top: 0, behavior: 'auto' });
    assert.equal(readingUpdates, 1);

    feature.activate(post, { scrollTop: false });
    assert.equal(browser.scrollCalls.length, 1);
    assert.equal(readingUpdates, 2);

    const withoutMount = new ArticleFeature({ root });
    withoutMount.activate(post);
    assert.equal(withoutMount.currentPost, null);
  } finally {
    browser.restore();
  }
});

test('open applies push, replace and none history modes without navigating for missing posts', async () => {
  const browser = installBrowser('https://example.test/#zen-home');
  try {
    const feature = new ArticleFeature();
    feature.mount = new FakeElement('section');
    const post = {
      id: '42',
      url: 'https://example.test/2026/08/documento.html'
    };
    feature.findPost = async () => post;
    const rendered = [];
    const activated = [];
    feature.render = (value) => rendered.push(value);
    feature.activate = (value, options) => activated.push({ value, options });

    assert.equal(await feature.open(post.url, { history: 'push' }), true);
    assert.equal(browser.historyCalls.length, 1);
    assert.equal(browser.historyCalls[0].method, 'push');
    assert.deepEqual(browser.historyCalls[0].state, { zenArticleId: '42' });
    assert.equal(rendered[0], post);
    assert.deepEqual(activated[0].options, { scrollTop: true });

    assert.equal(await feature.open(post.url, { history: 'push', scrollTop: false }), true);
    assert.equal(browser.historyCalls.length, 1);
    assert.deepEqual(activated[1].options, { scrollTop: false });

    assert.equal(await feature.open(post.url, { history: 'replace' }), true);
    assert.equal(browser.historyCalls.at(-1).method, 'replace');

    assert.equal(await feature.open(post.url, { history: 'none' }), true);
    assert.equal(browser.historyCalls.length, 2);

    feature.findPost = async () => null;
    assert.equal(await feature.open('/2026/08/missing.html'), false);
    assert.equal(rendered.length, 4);
  } finally {
    browser.restore();
  }
});

test('document click interception respects native link semantics and falls back safely', async () => {
  const browser = installBrowser('https://example.test/#zen-home');
  const originalConsoleError = console.error;
  try {
    const feature = new ArticleFeature();
    const openCalls = [];
    feature.open = async (href, options) => {
      openCalls.push({ href, options });
      return true;
    };

    const anchor = new FakeAnchor('https://example.test/2026/08/documento.html');
    const target = new FakeElement('span');
    target.closestMap.set('a[href]', anchor);
    const event = plainClick(target);
    feature.onDocumentClick(event);
    await flushPromises();
    assert.equal(event.prevented, true);
    assert.equal(openCalls.length, 1);
    assert.deepEqual(openCalls[0].options, { history: 'push' });
    assert.equal(browser.assigned.length, 0);

    const modified = plainClick(target);
    modified.ctrlKey = true;
    feature.onDocumentClick(modified);
    assert.equal(modified.prevented, undefined);
    assert.equal(openCalls.length, 1);

    const external = new FakeAnchor('https://outside.test/2026/08/documento.html');
    const externalTarget = new FakeElement('span');
    externalTarget.closestMap.set('a[href]', external);
    const externalEvent = plainClick(externalTarget);
    feature.onDocumentClick(externalEvent);
    assert.equal(externalEvent.prevented, undefined);

    anchor.target = '_blank';
    const targetEvent = plainClick(target);
    feature.onDocumentClick(targetEvent);
    assert.equal(targetEvent.prevented, undefined);
    anchor.target = '';
    anchor.setAttribute('download', 'documento.html');
    const downloadEvent = plainClick(target);
    feature.onDocumentClick(downloadEvent);
    assert.equal(downloadEvent.prevented, undefined);
    anchor.removeAttribute('download');

    feature.open = async () => false;
    const fallbackEvent = plainClick(target);
    feature.onDocumentClick(fallbackEvent);
    await flushPromises();
    assert.equal(fallbackEvent.prevented, true);
    assert.equal(browser.assigned.at(-1), anchor.href);

    const errors = [];
    console.error = (...args) => errors.push(args);
    feature.open = async () => {
      throw new Error('fallo controlado');
    };
    browser.navigate('https://example.test/#zen-home');
    const rejectedEvent = plainClick(target);
    feature.onDocumentClick(rejectedEvent);
    await flushPromises();
    assert.equal(rejectedEvent.prevented, true);
    assert.equal(errors.length, 1);
    assert.equal(browser.assigned.at(-1), anchor.href);
  } finally {
    console.error = originalConsoleError;
    browser.restore();
  }
});

test('mount actions control the TOC, printing, reference copy and in-document heading navigation', async () => {
  const browser = installBrowser();
  try {
    const shell = new FakeElement('main');
    const mount = new FakeElement('section');
    const feature = new ArticleFeature();
    feature.shell = shell;
    feature.mount = mount;
    feature.currentPost = {
      title: 'Documento constitucional',
      url: 'https://example.test/2026/08/documento.html'
    };

    feature.onMountClick({ target: actionTarget('toc-open') });
    assert.equal(shell.getAttribute('data-toc-open'), 'true');
    feature.onMountClick({ target: actionTarget('toc-close') });
    assert.equal(shell.hasAttribute('data-toc-open'), false);
    feature.onMountClick({ target: actionTarget('print') });
    assert.equal(browser.printCalls.length, 1);
    feature.onMountClick({ target: actionTarget('copy-reference') });
    await flushPromises();
    assert.equal(
      browser.clipboardWrites[0],
      'Documento constitucional — https://example.test/2026/08/documento.html'
    );

    const heading = new FakeElement('h2');
    const tocLink = new FakeAnchor('#seccion');
    tocLink.setAttribute('href', '#seccion');
    const tocTarget = new FakeElement('span');
    tocTarget.closestMap.set('[data-action]', null);
    tocTarget.closestMap.set('.zen-article-toc a[href^="#"]', tocLink);
    mount.queryMap.set('#seccion', heading);
    shell.setAttribute('data-toc-open', 'true');
    const tocEvent = {
      target: tocTarget,
      preventDefault() {
        this.prevented = true;
      }
    };
    feature.onMountClick(tocEvent);
    assert.equal(tocEvent.prevented, true);
    assert.deepEqual(heading.scrollOptions, { behavior: 'smooth', block: 'start' });
    assert.equal(shell.hasAttribute('data-toc-open'), false);

    const textTarget = new FakeElement('span');
    assert.doesNotThrow(() => feature.onMountClick({ target: textTarget }));
  } finally {
    browser.restore();
  }
});

test('popstate reopens Blogger items or restores the shell route from the hash', () => {
  const browser = installBrowser('https://example.test/2026/08/documento.html');
  try {
    const applied = [];
    const feature = new ArticleFeature({
      navigation: { apply: (route) => applied.push(route) }
    });
    const opened = [];
    feature.open = (href, options) => {
      opened.push({ href, options });
      return Promise.resolve(true);
    };

    feature.onPopState();
    assert.equal(opened[0].href, 'https://example.test/2026/08/documento.html');
    assert.deepEqual(opened[0].options, { history: 'none', scrollTop: false });

    feature.currentPost = { id: '42' };
    browser.navigate('https://example.test/#zen-explore');
    feature.onPopState();
    assert.equal(feature.currentPost, null);
    assert.equal(applied.at(-1), 'zen-explore');

    browser.navigate('https://example.test/#desconocida');
    feature.onPopState();
    assert.equal(applied.at(-1), 'zen-home');
  } finally {
    browser.restore();
  }
});

test('shell route changes deactivate SPA articles and normalize only non-item document URLs', () => {
  const browser = installBrowser('https://example.test/2026/08/documento.html');
  try {
    const feature = new ArticleFeature();
    feature.shell = new FakeElement('main');
    feature.currentPost = { id: '42' };
    feature.startedOnItemDocument = false;
    feature.onRouteChanged({ detail: { route: 'zen-home' } });
    assert.equal(feature.currentPost, null);
    assert.equal(browser.historyCalls.at(-1).method, 'replace');
    assert.equal(browser.historyCalls.at(-1).value, '/#zen-home');

    browser.navigate('https://example.test/2026/08/documento.html');
    feature.currentPost = { id: '42' };
    feature.startedOnItemDocument = true;
    const historyCount = browser.historyCalls.length;
    feature.onRouteChanged({ detail: { route: 'zen-about' } });
    assert.equal(feature.currentPost, null);
    assert.equal(browser.historyCalls.length, historyCount);

    feature.currentPost = { id: '43' };
    feature.onRouteChanged({ detail: { route: 'zen-article' } });
    assert.deepEqual(feature.currentPost, { id: '43' });
  } finally {
    browser.restore();
  }
});

test('reading state tracks percentage and current TOC heading from viewport geometry', () => {
  const browser = installBrowser();
  try {
    const body = new FakeElement('div');
    body.offsetHeight = 3000;
    body.rect = { top: 100 };
    const first = new FakeElement('h2');
    first.id = 'primero';
    first.rect = { top: 80 };
    const second = new FakeElement('h3');
    second.id = 'segundo';
    second.rect = { top: 160 };
    const third = new FakeElement('h2');
    third.id = 'tercero';
    third.rect = { top: 260 };
    body.queryAllMap.set('h2[id], h3[id]', [first, second, third]);

    const progress = new FakeElement('progress');
    progress.value = 0;
    const firstLink = new FakeAnchor('#primero');
    firstLink.setAttribute('href', '#primero');
    const secondLink = new FakeAnchor('#segundo');
    secondLink.setAttribute('href', '#segundo');
    const thirdLink = new FakeAnchor('#tercero');
    thirdLink.setAttribute('href', '#tercero');

    const mount = new FakeElement('section');
    mount.hidden = false;
    mount.queryMap.set('#zen-article-body', body);
    mount.queryMap.set('.zen-reading-progress', progress);
    mount.queryAllMap.set('.zen-article-toc a', [firstLink, secondLink, thirdLink]);
    const feature = new ArticleFeature();
    feature.mount = mount;
    feature.currentPost = { id: '42' };
    browser.windowObject.scrollY = 900;
    browser.windowObject.innerHeight = 1000;

    feature.updateReadingState();
    assert.ok(progress.value > 40 && progress.value < 50);
    assert.equal(firstLink.getAttribute('aria-current'), 'false');
    assert.equal(secondLink.getAttribute('aria-current'), 'true');
    assert.equal(thirdLink.getAttribute('aria-current'), 'false');

    browser.windowObject.scrollY = 10000;
    feature.updateReadingState();
    assert.equal(progress.value, 100);

    body.queryAllMap.set('h2[id], h3[id]', []);
    assert.doesNotThrow(() => feature.updateReadingState());

    feature.currentPost = null;
    progress.value = 17;
    feature.updateReadingState();
    assert.equal(progress.value, 17);
  } finally {
    browser.restore();
  }
});

test('boot wires lifecycle listeners and destroy removes owned state and created mounts', async () => {
  const browser = installBrowser('https://example.test/#zen-home');
  try {
    const mount = new FakeElement('section');
    const shell = new FakeElement('main');
    const root = {
      querySelector(selector) {
        if (selector === '#zen-article') return mount;
        if (selector === '#zen-blog-prototype') return shell;
        return null;
      }
    };
    const feature = new ArticleFeature({ root });
    let loadCalls = 0;
    feature.loadPosts = () => {
      loadCalls += 1;
      return Promise.resolve([]);
    };

    feature.boot();
    assert.equal(feature.mount, mount);
    assert.equal(feature.shell, shell);
    assert.equal(feature.startedOnItemDocument, false);
    assert.equal(loadCalls, 1);
    assert.equal(browser.documentListeners.filter((entry) => entry.op === 'add').length, 2);
    assert.equal(browser.windowListeners.filter((entry) => entry.op === 'add').length, 3);
    assert.equal(mount.listeners.filter((entry) => entry.op === 'add').length, 1);

    shell.setAttribute('data-toc-open', 'true');
    feature.currentPost = { id: '42' };
    feature.createdMount = true;
    feature.destroy();
    assert.equal(browser.documentListeners.filter((entry) => entry.op === 'remove').length, 2);
    assert.equal(browser.windowListeners.filter((entry) => entry.op === 'remove').length, 3);
    assert.equal(mount.listeners.filter((entry) => entry.op === 'remove').length, 1);
    assert.equal(shell.hasAttribute('data-toc-open'), false);
    assert.equal(mount.removed, true);
    assert.equal(feature.currentPost, null);
    assert.equal(feature.mount, null);
    assert.equal(feature.shell, null);

    browser.navigate('https://example.test/2026/08/directo.html');
    browser.documentObject.body.classList = new FakeClassList(['item-view']);
    const directMount = new FakeElement('section');
    const direct = new ArticleFeature({
      root: {
        querySelector(selector) {
          if (selector === '#zen-article') return directMount;
          if (selector === '#zen-blog-prototype') return new FakeElement('main');
          return null;
        }
      }
    });
    direct.loadPosts = () => Promise.resolve([]);
    const directOpens = [];
    direct.open = async (href, options) => {
      directOpens.push({ href, options });
      return true;
    };
    direct.boot();
    await flushPromises();
    assert.equal(direct.startedOnItemDocument, true);
    assert.equal(directOpens[0].href, 'https://example.test/2026/08/directo.html');
    assert.deepEqual(directOpens[0].options, { history: 'none' });
    direct.destroy();
  } finally {
    browser.restore();
  }
});
