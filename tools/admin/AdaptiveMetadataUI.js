export const ADAPTIVE_RULES = Object.freeze({
  concepto: Object.freeze({ label: 'Concepto', note: 'Prioriza vocabulario conceptual.', primary: Object.freeze(['concepts']) }),
  analisis: Object.freeze({ label: 'Análisis', note: 'Prioriza conceptos y referencias que sostienen el análisis.', primary: Object.freeze(['concepts', 'norms']) }),
  norma: Object.freeze({ label: 'Norma', note: 'Prioriza referencias normativas y año documental.', primary: Object.freeze(['norms', 'year']) }),
  documento: Object.freeze({ label: 'Documento', note: 'Prioriza procedencia normativa y contexto temporal.', primary: Object.freeze(['norms', 'year']) }),
  cronologia: Object.freeze({ label: 'Cronología', note: 'Prioriza año documental y conceptos del hecho.', primary: Object.freeze(['year', 'concepts']) }),
  historia: Object.freeze({ label: 'Historia', note: 'Prioriza contexto temporal y conceptos históricos.', primary: Object.freeze(['year', 'concepts']) }),
  dossier: Object.freeze({ label: 'Dossier', note: 'Prioriza conceptos y referencias documentales relacionadas.', primary: Object.freeze(['concepts', 'norms']) })
});

const BLOCK_NAMES = Object.freeze(['concepts', 'norms', 'year']);

export function preferredBlocks(type) {
  return [...(ADAPTIVE_RULES[type]?.primary ?? [])];
}

function section(title, subtitle) {
  const element = document.createElement('section');
  element.className = 'zmm-section';
  const head = document.createElement('div');
  head.className = 'zmm-section-title';
  const left = document.createElement('span');
  left.textContent = title;
  const right = document.createElement('span');
  right.textContent = subtitle;
  head.append(left, right);
  element.appendChild(head);
  return element;
}

export class AdaptiveMetadataUI {
  constructor({ metadataManager = window.ZenMetadataManager } = {}) {
    this.metadataManager = metadataManager;
    this.root = null;
    this.editor = null;
    this.mainZone = null;
    this.secondaryZone = null;
    this.details = null;
    this.note = null;
    this.blocks = new Map();
    this.observer = null;
    this.dataObserver = null;
    this.onTypeChange = this.onTypeChange.bind(this);
    this.updateMoreDetailsCount = this.updateMoreDetailsCount.bind(this);
  }

  field(selector) {
    return this.root?.querySelector(selector)?.closest('.zmm-field') ?? null;
  }

  blockHasData(name) {
    if (name === 'concepts') return Boolean(this.root.querySelector('#zmm-concept-tags .zmm-tag'));
    if (name === 'norms') return Boolean(this.root.querySelector('#zmm-norm-list [data-norm-index]'));
    if (name === 'year') return Boolean(this.root.querySelector('#zmm-year')?.value.trim());
    return false;
  }

  compose() {
    const body = this.root.querySelector('.zmm-editor-body');
    const migration = this.root.querySelector('#zmm-migration-section');
    const classification = this.root.querySelector('#zmm-primary-pillar')?.closest('.zmm-section');
    if (!body || !classification || !migration) throw new Error('Estructura Metadata v0.5 incompatible con Adaptive UI v0.6');

    const primaryField = this.field('#zmm-primary-pillar');
    const relatedField = this.field('#zmm-related-pillars');
    const typeField = this.field('#zmm-type');
    const yearField = this.field('#zmm-year');
    const statusField = this.field('#zmm-status-field');
    const revisionField = this.field('#zmm-revision');
    const conceptsSection = this.root.querySelector('#zmm-concept-picker')?.closest('.zmm-section');
    const normsSection = this.root.querySelector('#zmm-norm-picker')?.closest('.zmm-section');

    if (![primaryField, relatedField, typeField, yearField, statusField, revisionField, conceptsSection, normsSection].every(Boolean)) {
      throw new Error('Faltan controles requeridos para Adaptive UI v0.6');
    }

    const classificationTitle = classification.querySelector('.zmm-section-title');
    if (classificationTitle?.lastElementChild) classificationTitle.lastElementChild.textContent = 'Esencial';
    classification.append(primaryField, typeField);

    this.note = document.createElement('div');
    this.note.id = 'zmm-adaptive-note';
    this.note.className = 'zmm-adaptive-note';
    classification.appendChild(this.note);

    this.mainZone = document.createElement('div');
    this.mainZone.id = 'zmm-adaptive-zone';
    this.mainZone.className = 'zmm-adaptive-zone';
    body.insertBefore(this.mainZone, classification.nextSibling);

    this.details = document.createElement('details');
    this.details.id = 'zmm-more-details';
    this.details.className = 'zmm-more-details';
    this.details.innerHTML = '<summary><span>Más detalles</span><small id="zmm-more-count">Campos secundarios</small></summary><div class="zmm-more-body" id="zmm-more-body"></div>';
    body.insertBefore(this.details, migration);

    const moreBody = this.details.querySelector('#zmm-more-body');
    const relations = section('Relaciones', 'Secundario');
    relations.appendChild(relatedField);
    const editorial = section('Editorial', 'Secundario');
    editorial.append(statusField, revisionField);
    moreBody.append(relations, editorial);

    this.secondaryZone = document.createElement('div');
    this.secondaryZone.id = 'zmm-secondary-zone';
    this.secondaryZone.className = 'zmm-secondary-zone';
    moreBody.appendChild(this.secondaryZone);

    const yearSection = section('Temporal', 'Documento');
    yearSection.id = 'zmm-year-section';
    yearSection.appendChild(yearField);

    conceptsSection.dataset.adaptiveBlock = 'concepts';
    normsSection.dataset.adaptiveBlock = 'norms';
    yearSection.dataset.adaptiveBlock = 'year';
    conceptsSection.classList.add('zmm-adaptive-block');
    normsSection.classList.add('zmm-adaptive-block');
    yearSection.classList.add('zmm-adaptive-block');

    this.blocks.set('concepts', conceptsSection);
    this.blocks.set('norms', normsSection);
    this.blocks.set('year', yearSection);
    this.secondaryZone.append(conceptsSection, normsSection, yearSection);

    this.editor.dataset.adaptiveUi = '0.6';
  }

  layout({ promotePopulated = false } = {}) {
    const type = this.root.querySelector('#zmm-type')?.value ?? '';
    const rule = ADAPTIVE_RULES[type] ?? null;
    const preferredOrder = [...(rule?.primary ?? [])];
    const promotedExtras = BLOCK_NAMES.filter((name) =>
      !preferredOrder.includes(name) && promotePopulated && this.blockHasData(name)
    );
    const primaryOrder = [...preferredOrder, ...promotedExtras];
    const primary = new Set(primaryOrder);

    for (const name of primaryOrder) {
      const block = this.blocks.get(name);
      if (!block) continue;
      this.mainZone.appendChild(block);
      block.dataset.priority = 'primary';
    }

    for (const name of BLOCK_NAMES) {
      if (primary.has(name)) continue;
      const block = this.blocks.get(name);
      if (!block) continue;
      this.secondaryZone.appendChild(block);
      block.dataset.priority = 'secondary';
    }

    this.mainZone.hidden = this.mainZone.children.length === 0;
    this.note.textContent = rule
      ? `${rule.label} · ${rule.note}`
      : 'Selecciona un Tipo para priorizar los campos pertinentes.';
    this.note.dataset.type = type || 'none';
    this.updateMoreDetailsCount();
  }

  updateMoreDetailsCount() {
    if (!this.root) return;
    let count = this.root.querySelectorAll('#zmm-related-pillars input:checked').length;
    ['#zmm-status-field', '#zmm-revision'].forEach((selector) => {
      if (String(this.root.querySelector(selector)?.value ?? '').trim()) count += 1;
    });
    for (const name of BLOCK_NAMES) {
      const block = this.blocks.get(name);
      if (block?.parentElement === this.secondaryZone && this.blockHasData(name)) count += 1;
    }
    const label = this.root.querySelector('#zmm-more-count');
    if (label) label.textContent = count ? `${count} dato${count === 1 ? '' : 's'} guardado${count === 1 ? '' : 's'}` : 'Campos secundarios';
  }

  onTypeChange() {
    this.layout({ promotePopulated: true });
  }

  bind() {
    this.root.querySelector('#zmm-type')?.addEventListener('change', this.onTypeChange);
    this.details.addEventListener('toggle', this.updateMoreDetailsCount);
    ['#zmm-year', '#zmm-status-field', '#zmm-revision'].forEach((selector) => {
      const control = this.root.querySelector(selector);
      control?.addEventListener('input', this.updateMoreDetailsCount);
      control?.addEventListener('change', this.updateMoreDetailsCount);
    });
    this.root.querySelector('#zmm-related-pillars')?.addEventListener('change', this.updateMoreDetailsCount);

    this.observer = new MutationObserver(() => {
      if (!this.editor.hidden) {
        this.details.open = false;
        this.layout({ promotePopulated: true });
      }
    });
    this.observer.observe(this.editor, { attributes: true, attributeFilter: ['hidden'] });

    this.dataObserver = new MutationObserver(this.updateMoreDetailsCount);
    const concepts = this.root.querySelector('#zmm-concept-tags');
    const norms = this.root.querySelector('#zmm-norm-list');
    if (concepts) this.dataObserver.observe(concepts, { childList: true, subtree: true });
    if (norms) this.dataObserver.observe(norms, { childList: true, subtree: true });
  }

  mount() {
    this.root = document.getElementById('zen-metadata-manager-root');
    this.editor = this.root?.querySelector('#zmm-editor') ?? null;
    if (!this.root || !this.editor) throw new Error('Metadata Manager no está montado');
    if (this.editor.dataset.adaptiveUi === '0.6') return this;

    const brandVersion = this.root.querySelector('.zmm-brand small');
    if (brandVersion) brandVersion.textContent = 'ZenBlog · LAB · Metadata v0.6';

    this.compose();
    this.bind();
    this.layout({ promotePopulated: true });

    if (this.metadataManager) {
      this.metadataManager.version = '0.6.0';
      this.metadataManager.adaptiveUIVersion = '0.6.0';
    }
    return this;
  }
}
