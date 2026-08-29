export interface InspectorRegistryEntry {
  readonly selector: string;
  readonly name: string;
  readonly description: string;
  readonly protected?: boolean;
}

export interface InspectorTargetInfo extends InspectorRegistryEntry {
  readonly element: Element;
  readonly ownerElement: Element | null;
  readonly ownerName: string;
  readonly ownerSelector: string;
}

export const DEFAULT_COMPONENT_REGISTRY: readonly InspectorRegistryEntry[] = Object.freeze([
  {
    selector: '[data-component="Explore.PublicSearch"]',
    name: '<Explore>',
    description: 'Vista Explorar.'
  },
  {
    selector: '.explore-search input',
    name: '<Explore.Search.Input>',
    description: 'Campo de búsqueda por título.'
  },
  {
    selector: '.explore-filters',
    name: '<Explore.Filters>',
    description: 'Filtros de búsqueda avanzada.'
  },
  { selector: '.explore-results', name: '<Explore.Results>', description: 'Lista de resultados.' },
  { selector: '[data-component="Home"]', name: '<Home>', description: 'Vista Portada.' },
  {
    selector: '[data-component="Article.Reader"]',
    name: '<Article>',
    description: 'Vista de lectura del artículo.'
  },
  { selector: '#zen-about', name: '<About>', description: 'Vista Acerca de.' },
  { selector: '.zen-brand', name: '<Global.Brand>', description: 'Identidad del sitio.' },
  { selector: '.zen-primary-nav', name: '<Global.Nav>', description: 'Navegación principal.' },
  { selector: '.zen-global-header', name: '<Global.Header>', description: 'Cabecera persistente.' },
  {
    selector: '[data-component="ZRP.Launcher"]',
    name: '<ZRP.Launcher>',
    description: 'Lanzador ZRP.',
    protected: true
  }
]);

function escapeCss(value: string): string {
  return globalThis.CSS.escape(value);
}

export function exactPath(element: Element): string {
  if (element.id) return `#${escapeCss(element.id)}`;
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== document.documentElement) {
    if (node.id) {
      parts.unshift(`#${escapeCss(node.id)}`);
      break;
    }
    let part = node.tagName.toLocaleLowerCase('en');
    const stable = [...node.classList]
      .filter((name) => !/^(?:is-|active$|selected$|open$)/u.test(name))
      .slice(0, 3);
    if (stable.length > 0) part += `.${stable.map(escapeCss).join('.')}`;
    const parent: Element | null = node.parentElement;
    if (parent) {
      const tagName = node.tagName;
      const siblings: Element[] = [];
      for (let index = 0; index < parent.children.length; index += 1) {
        const child = parent.children.item(index);
        if (child && child.tagName === tagName) siblings.push(child);
      }
      if (siblings.length > 1) part += `:nth-of-type(${String(siblings.indexOf(node) + 1)})`;
    }
    parts.unshift(part);
    node = parent;
    if (parts.length >= 12) break;
  }
  return parts.join(' > ');
}

export function genericName(element: Element): string {
  const explicit =
    element.getAttribute('data-zen-component') ?? element.getAttribute('data-component');
  if (explicit) return `<${explicit.replace(/^<|>$/gu, '')}>`;
  if (element.id) return `<DOM#${element.id}>`;
  const classes = [...element.classList].slice(0, 3).join('.');
  return `<DOM.${element.tagName.toLocaleLowerCase('en')}${classes ? `.${classes}` : ''}>`;
}

function exactRegistryMatch(
  element: Element,
  registry: readonly InspectorRegistryEntry[]
): InspectorRegistryEntry | null {
  for (const item of registry) {
    try {
      if (element.matches(item.selector)) return item;
    } catch {
      // Invalid custom selectors are ignored; built-in selectors are validated in code review.
    }
  }
  return null;
}

export function resolveInspectorTarget(
  element: Element,
  registry: readonly InspectorRegistryEntry[] = DEFAULT_COMPONENT_REGISTRY
): InspectorTargetInfo {
  const exact = exactRegistryMatch(element, registry);
  if (exact) {
    return {
      ...exact,
      element,
      ownerElement: element,
      ownerName: exact.name,
      ownerSelector: exact.selector
    };
  }

  let ownerElement = element.parentElement;
  while (ownerElement && ownerElement !== document.documentElement) {
    const owner = exactRegistryMatch(ownerElement, registry);
    if (owner) {
      return {
        element,
        selector: '',
        name: genericName(element),
        description: 'Elemento DOM inspeccionado directamente.',
        protected: Boolean(owner.protected),
        ownerElement,
        ownerName: owner.name,
        ownerSelector: owner.selector
      };
    }
    ownerElement = ownerElement.parentElement;
  }

  return {
    element,
    selector: '',
    name: genericName(element),
    description: 'Elemento DOM inspeccionado directamente.',
    protected: false,
    ownerElement: null,
    ownerName: '',
    ownerSelector: ''
  };
}

function componentTree(element: Element, registry: readonly InspectorRegistryEntry[]): string {
  const nodes: string[] = [];
  let node: Element | null = element;
  while (node && node !== document.documentElement) {
    const name = exactRegistryMatch(node, registry)?.name ?? genericName(node);
    if (nodes.at(-1) !== name) nodes.push(name);
    node = node.parentElement;
  }
  nodes.reverse();
  return nodes
    .map((name, index) => (index === 0 ? name : `${'  '.repeat(index)}└─ ${name}`))
    .join('\n');
}

function interactionInfo(element: Element): string {
  const values: string[] = [];
  if (element instanceof HTMLAnchorElement) values.push(`href=${element.href}`);
  if (element instanceof HTMLButtonElement) values.push(`type=${element.type}`);
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    values.push(`name=${element.name || '—'}`);
    values.push(`value=${element.value}`);
  }
  const role = element.getAttribute('role');
  if (role) values.push(`role=${role}`);
  for (const name of [
    'aria-label',
    'aria-expanded',
    'aria-pressed',
    'aria-selected',
    'aria-controls'
  ] as const) {
    if (element.hasAttribute(name)) values.push(`${name}=${element.getAttribute(name) ?? ''}`);
  }
  return values.join(' | ') || 'Sin acción/ARIA específica detectada';
}

function datasetText(element: HTMLElement): string {
  const values = Object.entries(element.dataset)
    .slice(0, 16)
    .map(([key, value]) => `${key}=${String(value).slice(0, 140)}`);
  return values.join(' | ') || 'Sin data-*';
}

export function buildInspectorLog(
  info: InspectorTargetInfo,
  registry: readonly InspectorRegistryEntry[] = DEFAULT_COMPONENT_REGISTRY
): string {
  const element = info.element;
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const htmlElement = element instanceof HTMLElement ? element : null;
  const owner =
    info.ownerName && info.ownerName !== info.name
      ? `COMPONENTE PROPIETARIO:\n${info.ownerName}\nSelector: ${info.ownerSelector || '—'}`
      : '';
  const protection = info.protected
    ? 'PROTECCIÓN:\nComponente protegido: evita modificar su arquitectura sin una decisión explícita.'
    : '';

  return [
    'ZEN INSPECTOR',
    '',
    'SCOPE:',
    info.name,
    '',
    owner,
    '',
    'DESCRIPCIÓN:',
    info.description || '—',
    '',
    'TREE:',
    componentTree(element, registry),
    '',
    'DOM:',
    `Elemento: ${element.tagName.toLocaleLowerCase('en')}`,
    `Selector registrado: ${info.selector || 'No registrado'}`,
    `Selector exacto: ${exactPath(element)}`,
    `ID: ${element.id || '—'}`,
    `Clases: ${element.className || '—'}`,
    '',
    'INTERACCIÓN:',
    interactionInfo(element),
    '',
    'VIEWPORT:',
    `${String(window.innerWidth)} × ${String(window.innerHeight)} px`,
    '',
    'GEOMETRÍA:',
    `x: ${String(Math.round(rect.x))} px`,
    `y: ${String(Math.round(rect.y))} px`,
    `width: ${String(Math.round(rect.width))} px`,
    `height: ${String(Math.round(rect.height))} px`,
    '',
    'LAYOUT:',
    `display: ${style.display}`,
    `position: ${style.position}`,
    `z-index: ${style.zIndex}`,
    `overflow-x: ${style.overflowX}`,
    `overflow-y: ${style.overflowY}`,
    `gap: ${style.gap}`,
    '',
    'BOX MODEL:',
    `margin: ${style.margin}`,
    `padding: ${style.padding}`,
    `border: ${style.border}`,
    `border-radius: ${style.borderRadius}`,
    '',
    'TIPOGRAFÍA:',
    `font-family: ${style.fontFamily}`,
    `font-size: ${style.fontSize}`,
    `font-weight: ${style.fontWeight}`,
    `line-height: ${style.lineHeight}`,
    `color: ${style.color}`,
    `background: ${style.backgroundColor}`,
    '',
    'DATA:',
    htmlElement ? datasetText(htmlElement) : 'Sin data-*',
    '',
    'TEXTO:',
    element.textContent.replace(/\s+/gu, ' ').trim().slice(0, 400) || 'Sin texto visible',
    '',
    protection,
    '',
    'PETICIÓN:',
    '[Escribe aquí qué quieres cambiar.]'
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');
}
