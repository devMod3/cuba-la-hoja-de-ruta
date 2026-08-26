import test from 'node:test';
import assert from 'node:assert/strict';
import { AdaptiveMetadataUI, ADAPTIVE_RULES, preferredBlocks } from '../tools/admin/AdaptiveMetadataUI.js';

class Classes {
  constructor() { this.values = new Set(); }
  add(...names) { names.forEach((n) => this.values.add(n)); }
  contains(name) { return this.values.has(name); }
}

class El {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.id = '';
    this.className = '';
    this.dataset = {};
    this.children = [];
    this.parentElement = null;
    this.classList = new Classes();
    this.listeners = [];
    this.q = new Map();
    this.qa = new Map();
    this.value = '';
    this.hidden = false;
    this.open = false;
    this.textContent = '';
    this._innerHTML = '';
  }
  set innerHTML(value) {
    this._innerHTML = String(value);
    if (this._innerHTML.includes('zmm-more-body')) {
      const summary = new El('summary');
      const label = new El('small'); label.id = 'zmm-more-count'; label.textContent = 'Campos secundarios';
      const body = new El('div'); body.id = 'zmm-more-body';
      summary.appendChild(label); this.append(summary, body);
      this.q.set('#zmm-more-body', body); this.q.set('#zmm-more-count', label);
    }
  }
  get innerHTML() { return this._innerHTML; }
  append(...nodes) { nodes.forEach((n) => this.appendChild(n)); }
  appendChild(node) {
    if (node.parentElement) node.parentElement.children = node.parentElement.children.filter((x) => x !== node);
    node.parentElement = this; this.children.push(node); return node;
  }
  insertBefore(node, before) {
    if (node.parentElement) node.parentElement.children = node.parentElement.children.filter((x) => x !== node);
    node.parentElement = this;
    const i = this.children.indexOf(before);
    if (i < 0) this.children.push(node); else this.children.splice(i, 0, node);
    return node;
  }
  querySelector(selector) {
    if (this.q.has(selector)) return this.q.get(selector);
    if (selector.startsWith('#')) return this.find((x) => `#${x.id}` === selector);
    if (selector === '.zmm-section-title') return this.find((x) => x.className === 'zmm-section-title');
    return null;
  }
  querySelectorAll(selector) { return this.qa.get(selector) ?? []; }
  find(predicate) {
    for (const child of this.children) {
      if (predicate(child)) return child;
      const nested = child.find?.(predicate); if (nested) return nested;
    }
    return null;
  }
  closest(selector) {
    let node = this;
    while (node) {
      if (selector === '.zmm-field' && node.className === 'zmm-field') return node;
      if (selector === '.zmm-section' && node.className === 'zmm-section') return node;
      node = node.parentElement;
    }
    return null;
  }
  addEventListener(type, fn) { this.listeners.push([type, fn]); }
  get lastElementChild() { return this.children.at(-1) ?? null; }
}

class Observer {
  static instances = [];
  constructor(callback) { this.callback = callback; this.observations = []; Observer.instances.push(this); }
  observe(target, options) { this.observations.push([target, options]); }
}

function field(control) {
  const wrapper = new El(); wrapper.className = 'zmm-field'; wrapper.appendChild(control); return wrapper;
}

function sectionWith(control) {
  const section = new El('section'); section.className = 'zmm-section'; section.appendChild(control); return section;
}

function fixture() {
  const saved = new Map();
  const set = (name, value) => {
    saved.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  };
  const root = new El(), editor = new El(), body = new El(), migration = new El(), classification = new El('section');
  editor.id = 'zmm-editor'; classification.className = 'zmm-section'; migration.id = 'zmm-migration-section';
  const title = new El(), titleLeft = new El('span'), titleRight = new El('span');
  title.className = 'zmm-section-title'; title.append(titleLeft, titleRight); classification.appendChild(title);
  const type = new El('select'); type.id = 'zmm-type';
  const year = new El('input'); year.id = 'zmm-year';
  const primary = new El('select'); primary.id = 'zmm-primary-pillar';
  const related = new El(); related.id = 'zmm-related-pillars';
  const status = new El('input'); status.id = 'zmm-status-field';
  const revision = new El('input'); revision.id = 'zmm-revision';
  const primaryField = field(primary), typeField = field(type), yearField = field(year), relatedField = field(related), statusField = field(status), revisionField = field(revision);
  classification.append(primaryField, typeField);
  const conceptsPicker = new El(), normsPicker = new El();
  conceptsPicker.id = 'zmm-concept-picker'; normsPicker.id = 'zmm-norm-picker';
  const concepts = sectionWith(conceptsPicker), norms = sectionWith(normsPicker);
  body.append(classification, concepts, norms, migration); editor.appendChild(body); root.appendChild(editor);
  const brand = new El(), brandSmall = new El('small'); brand.appendChild(brandSmall); root.appendChild(brand);
  const map = {
    '.zmm-editor-body': body, '#zmm-migration-section': migration, '#zmm-primary-pillar': primary,
    '#zmm-related-pillars': related, '#zmm-type': type, '#zmm-year': year, '#zmm-status-field': status,
    '#zmm-revision': revision, '#zmm-concept-picker': conceptsPicker, '#zmm-norm-picker': normsPicker,
    '.zmm-brand small': brandSmall, '#zmm-editor': editor
  };
  for (const [k, v] of Object.entries(map)) root.q.set(k, v);
  root.qa.set('#zmm-related-pillars input:checked', []);
  const originalQuery = root.querySelector.bind(root);
  root.querySelector = (selector) => {
    if (selector === '#zmm-concept-tags .zmm-tag') return root.conceptTag ?? null;
    if (selector === '#zmm-norm-list [data-norm-index]') return root.normItem ?? null;
    return originalQuery(selector);
  };
  const document = { createElement: (tag) => new El(tag), getElementById: (id) => id === 'zen-metadata-manager-root' ? root : null };
  set('document', document); set('MutationObserver', Observer); set('window', { ZenMetadataManager: null });
  return {
    root, editor, body, migration, classification, type, year, primary, related, status, revision,
    concepts, norms, brandSmall,
    checked(n) { root.qa.set('#zmm-related-pillars input:checked', Array.from({ length: n }, () => new El('input'))); },
    restore() { Observer.instances.length = 0; for (const [name, d] of saved) d ? Object.defineProperty(globalThis, name, d) : delete globalThis[name]; }
  };
}

test('adaptive rules expose stable priorities without leaking mutable arrays', () => {
  assert.equal(Object.keys(ADAPTIVE_RULES).length, 7);
  assert.deepEqual(preferredBlocks('norma'), ['norms', 'year']);
  const blocks = preferredBlocks('concepto'); blocks.push('year');
  assert.deepEqual(preferredBlocks('concepto'), ['concepts']);
  assert.deepEqual(preferredBlocks('otro'), []);
});

test('mount composes v0.6 zones, binds observers and publishes manager versions', () => {
  const f = fixture();
  try {
    const manager = {}; const ui = new AdaptiveMetadataUI({ metadataManager: manager });
    assert.equal(ui.mount(), ui);
    assert.equal(f.editor.dataset.adaptiveUi, '0.6');
    assert.equal(f.brandSmall.textContent, 'ZenBlog · LAB · Metadata v0.6');
    assert.equal(f.classification.querySelector('.zmm-section-title').lastElementChild.textContent, 'Esencial');
    assert.equal(ui.blocks.size, 3); assert.equal(ui.details.id, 'zmm-more-details');
    assert.equal(ui.mainZone.id, 'zmm-adaptive-zone'); assert.equal(ui.secondaryZone.id, 'zmm-secondary-zone');
    assert.equal(manager.version, '0.6.0'); assert.equal(manager.adaptiveUIVersion, '0.6.0');
    assert.equal(Observer.instances.length, 2); assert.equal(Observer.instances[0].observations.length, 1);
    assert.equal(f.type.listeners.some(([name]) => name === 'change'), true);
    assert.equal(ui.mount(), ui);
  } finally { f.restore(); }
});

test('layout follows type priorities and promotes populated secondary blocks on type changes', () => {
  const f = fixture();
  try {
    const ui = new AdaptiveMetadataUI({ metadataManager: {} }).mount();
    f.type.value = 'norma'; ui.layout();
    assert.deepEqual(ui.mainZone.children.map((x) => x.dataset.adaptiveBlock), ['norms', 'year']);
    assert.equal(ui.blocks.get('concepts').parentElement, ui.secondaryZone);
    assert.equal(ui.note.dataset.type, 'norma'); assert.match(ui.note.textContent, /^Norma ·/);
    f.root.conceptTag = new El('span'); ui.onTypeChange();
    assert.deepEqual(ui.mainZone.children.map((x) => x.dataset.adaptiveBlock), ['norms', 'year', 'concepts']);
    f.type.value = ''; f.root.conceptTag = null; f.root.normItem = null; f.year.value = ''; ui.layout();
    assert.equal(ui.mainZone.hidden, true); assert.equal(ui.note.dataset.type, 'none');
    assert.match(ui.note.textContent, /Selecciona un Tipo/);
  } finally { f.restore(); }
});

test('secondary detail count reflects relationships, editorial fields and populated adaptive blocks', () => {
  const f = fixture();
  try {
    const ui = new AdaptiveMetadataUI({ metadataManager: {} }).mount();
    f.type.value = 'concepto'; ui.layout();
    f.checked(2); f.status.value = 'vigente'; f.revision.value = 'r2'; f.root.normItem = new El(); f.year.value = '2026';
    ui.updateMoreDetailsCount();
    assert.equal(f.root.querySelector('#zmm-more-count').textContent, '6 datos guardados');
    f.checked(0); f.status.value = ''; f.revision.value = ''; f.root.normItem = null; f.year.value = '';
    ui.updateMoreDetailsCount(); assert.equal(f.root.querySelector('#zmm-more-count').textContent, 'Campos secundarios');
    f.checked(1); ui.updateMoreDetailsCount(); assert.equal(f.root.querySelector('#zmm-more-count').textContent, '1 dato guardado');
    ui.root = null; assert.doesNotThrow(() => ui.updateMoreDetailsCount());
  } finally { f.restore(); }
});

test('block data detection distinguishes concepts norms year and unknown blocks', () => {
  const f = fixture();
  try {
    const ui = new AdaptiveMetadataUI({ metadataManager: {} }); ui.root = f.root;
    assert.equal(ui.blockHasData('concepts'), false); f.root.conceptTag = new El(); assert.equal(ui.blockHasData('concepts'), true);
    assert.equal(ui.blockHasData('norms'), false); f.root.normItem = new El(); assert.equal(ui.blockHasData('norms'), true);
    assert.equal(ui.blockHasData('year'), false); f.year.value = ' 2026 '; assert.equal(ui.blockHasData('year'), true);
    assert.equal(ui.blockHasData('unknown'), false);
  } finally { f.restore(); }
});

test('observer callbacks reset details and recalculate layout only when editor becomes visible', () => {
  const f = fixture();
  try {
    const ui = new AdaptiveMetadataUI({ metadataManager: {} }).mount();
    ui.details.open = true; f.editor.hidden = false; let layouts = 0; const original = ui.layout.bind(ui);
    ui.layout = (options) => { layouts++; return original(options); };
    Observer.instances[0].callback();
    assert.equal(ui.details.open, false); assert.equal(layouts, 1);
    f.editor.hidden = true; ui.details.open = true; Observer.instances[0].callback();
    assert.equal(ui.details.open, true); assert.equal(layouts, 1);
    assert.doesNotThrow(() => Observer.instances[1].callback());
  } finally { f.restore(); }
});

test('mount and compose fail closed on missing or incompatible Metadata Manager structure', () => {
  const f = fixture();
  try {
    const oldGet = document.getElementById; document.getElementById = () => null;
    assert.throws(() => new AdaptiveMetadataUI({ metadataManager: {} }).mount(), /no está montado/);
    document.getElementById = oldGet;
    f.root.q.delete('.zmm-editor-body');
    assert.throws(() => new AdaptiveMetadataUI({ metadataManager: {} }).mount(), /Estructura Metadata v0.5 incompatible/);
  } finally { f.restore(); }
});
