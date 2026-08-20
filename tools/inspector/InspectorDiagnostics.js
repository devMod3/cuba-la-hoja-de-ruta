export const DEFAULT_COMPONENT_REGISTRY = Object.freeze([
  { selector:'#zen-explore-search-input', name:'<Explore.Search.Input>', description:'Campo de búsqueda por título.' },
  { selector:'#zen-explore-search-clear', name:'<Explore.Search.Clear>', description:'Limpia la consulta de búsqueda.' },
  { selector:'#zen-advanced-open', name:'<Explore.Search.Advanced>', description:'Abre Búsqueda avanzada.' },
  { selector:'#zen-explore-search-mode', name:'<Explore.Search.Mode>', description:'Modo de búsqueda simple.' },
  { selector:'#zen-explore-search', name:'<Explore.Search>', description:'Componente de búsqueda simple.' },
  { selector:'#zen-advanced-back', name:'<Explore.Filters.Back>', description:'Regresa a búsqueda simple.' },
  { selector:'#zen-explore-advanced-mode', name:'<Explore.Filters.Mode>', description:'Modo de búsqueda avanzada.' },
  { selector:'#zen-filter-pillar', name:'<Explore.Filters.Pillar>', description:'Filtra por Pilar.' },
  { selector:'#zen-filter-type', name:'<Explore.Filters.Type>', description:'Filtra por Tipo.' },
  { selector:'#zen-filter-year-mode', name:'<Explore.Filters.Year>', description:'Filtra por periodo/año.' },
  { selector:'#zen-year-from', name:'<Explore.Filters.YearFrom>', description:'Año inicial del rango.' },
  { selector:'#zen-year-to', name:'<Explore.Filters.YearTo>', description:'Año final del rango.' },
  { selector:'#zen-year-range', name:'<Explore.Filters.YearRange>', description:'Rango temporal Desde/Hasta.' },
  { selector:'#zen-sort-order', name:'<Explore.Sort>', description:'Ordena los resultados.' },
  { selector:'#zen-reset-filters', name:'<Explore.Filters.Reset>', description:'Restablece todos los criterios avanzados.' },
  { selector:'.zen-explore-controls', name:'<Explore.Filters>', description:'Búsqueda avanzada: filtros y orden.' },
  { selector:'#zen-view-archive .zen-archive-row .zen-row-type', name:'<Explore.Results.Row.Type>', description:'Tipo documental de la fila.' },
  { selector:'#zen-view-archive .zen-archive-row .zen-row-date', name:'<Explore.Results.Row.Date>', description:'Fecha de la fila.' },
  { selector:'#zen-view-archive .zen-archive-row h2', name:'<Explore.Results.Row.Title>', description:'Título del resultado.' },
  { selector:'#zen-view-archive .zen-archive-row-arrow', name:'<Explore.Results.Row.Action>', description:'Indicador de apertura del resultado.' },
  { selector:'#zen-view-archive .zen-archive-row', name:'<Explore.Results.Row>', description:'Fila individual de resultados.' },
  { selector:'#archive-count', name:'<Explore.Results.Count>', description:'Cantidad de resultados visibles.' },
  { selector:'#zen-results-scroll', name:'<Explore.Results.Scroll>', description:'Contenedor desplazable de resultados.' },
  { selector:'#zen-archive-list', name:'<Explore.Results.List>', description:'Lista de resultados.' },
  { selector:'.zen-results-panel', name:'<Explore.Results>', description:'Panel completo de resultados.' },
  { selector:'.zen-explore-head', name:'<Explore.Header>', description:'Cabecera funcional de Explorar.' },
  { selector:'.zen-explore-title-block h1', name:'<Explore.Title>', description:'Título de la vista Explorar.' },
  { selector:'#zen-view-archive,#zen-explore', name:'<Explore>', description:'Vista Explorar.' },
  { selector:'.zen-home-statement', name:'<Home.Statement>', description:'Declaración principal de Portada.' },
  { selector:'.zen-home-feature-slot', name:'<Home.Feature>', description:'Contenido destacado de Portada.' },
  { selector:'#zen-home', name:'<Home>', description:'Vista Portada.' },
  { selector:'#zen-article .zen-article-header', name:'<Article.Header>', description:'Cabecera editorial del artículo.' },
  { selector:'#zen-article .zen-article-body', name:'<Article.Body>', description:'Cuerpo de lectura del artículo.' },
  { selector:'#zen-article .zen-article-rail', name:'<Article.Rail>', description:'Navegación contextual del artículo.' },
  { selector:'#zen-article', name:'<Article>', description:'Vista de lectura del artículo.' },
  { selector:'#zen-about .zen-about-profile-top', name:'<About.Profile>', description:'Perfil principal de Acerca de.' },
  { selector:'#zen-about .zen-about-social-section', name:'<About.Social>', description:'Redes sociales.' },
  { selector:'#zen-about .zen-about-resources-section', name:'<About.Resources>', description:'Recursos relacionados.' },
  { selector:'#zen-about', name:'<About>', description:'Vista Acerca de.' },
  { selector:'.zen-brand-mark,.zen-mark', name:'<Global.Brand.Logo>', description:'Marca visual.' },
  { selector:'.zen-brand', name:'<Global.Brand>', description:'Identidad del sitio.' },
  { selector:'.zen-primary-nav', name:'<Global.Nav>', description:'Navegación principal.' },
  { selector:'.zen-site-header,.zen-global-header', name:'<Global.Header>', description:'Cabecera persistente.' },
  { selector:'#zen-radio-player', name:'<Global.Player>', description:'Reproductor externo/persistente.', protected:true },
  { selector:'#Blog1', name:'<Blogger.Core.Blog1>', description:'Widget principal de Blogger.', protected:true },
  { selector:'#page_body', name:'<Blogger.Core.PageBody>', description:'Contenedor canónico de Blogger.', protected:true }
]);

function escapeCSS(value) {
  if (globalThis.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

export function exactPath(el) {
  if (!el || el.nodeType !== 1) return '';
  if (el.id) return `#${escapeCSS(el.id)}`;
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && node !== document.documentElement) {
    if (node.id) {
      parts.unshift(`#${escapeCSS(node.id)}`);
      break;
    }
    let part = node.tagName.toLowerCase();
    const stable = [...(node.classList || [])]
      .filter((name) => !/^is-|^active$|^selected$|^open$/.test(name))
      .slice(0, 3);
    if (stable.length) part += `.${stable.map(escapeCSS).join('.')}`;
    const parent = node.parentElement;
    if (parent) {
      const same = [...parent.children].filter((item) => item.tagName === node.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
    if (parts.length >= 12) break;
  }
  return parts.join(' > ');
}

export function genericName(el) {
  const explicit = el?.getAttribute?.('data-zen-component') || el?.getAttribute?.('data-component');
  if (explicit) return `<${String(explicit).replace(/^<|>$/g, '')}>`;
  if (el?.id) return `<DOM#${el.id}>`;
  const cls = [...(el?.classList || [])].slice(0, 3).join('.');
  return `<DOM.${el?.tagName?.toLowerCase?.() || 'node'}${cls ? `.${cls}` : ''}>`;
}

function exactRegistryMatch(el, registry) {
  for (const item of registry) {
    try { if (el.matches(item.selector)) return item; }
    catch {}
  }
  return null;
}

function nearestRegisteredOwner(target, registry) {
  let node = target?.parentElement || null;
  while (node && node !== document.documentElement) {
    const match = exactRegistryMatch(node, registry);
    if (match) return { element: node, ...match };
    node = node.parentElement;
  }
  return null;
}

export function resolveInspectorTarget(target, registry = DEFAULT_COMPONENT_REGISTRY) {
  const exact = exactRegistryMatch(target, registry);
  if (exact) {
    return {
      element: target,
      ...exact,
      ownerElement: target,
      ownerName: exact.name,
      ownerSelector: exact.selector
    };
  }

  const owner = nearestRegisteredOwner(target, registry);
  return {
    element: target,
    selector: '',
    name: genericName(target),
    description: 'Elemento DOM inspeccionado directamente.',
    protected: Boolean(owner?.protected),
    ownerElement: owner?.element || null,
    ownerName: owner?.name || '',
    ownerSelector: owner?.selector || ''
  };
}

export function componentTree(target, registry = DEFAULT_COMPONENT_REGISTRY) {
  const nodes = [];
  let node = target;
  while (node && node.nodeType === 1 && node !== document.documentElement) {
    const match = exactRegistryMatch(node, registry);
    const name = match ? match.name : genericName(node);
    if (name && nodes[nodes.length - 1] !== name) nodes.push(name);
    node = node.parentElement;
  }
  nodes.reverse();
  if (!nodes.length) nodes.push(genericName(target));
  return nodes.map((name, index) => index === 0 ? name : `${'  '.repeat(index)}└─ ${name}`).join('\n');
}

function datasetText(el) {
  const pairs = Object.keys(el.dataset || {}).slice(0, 16).map((key) => `${key}=${String(el.dataset[key]).slice(0, 140)}`);
  return pairs.length ? pairs.join(' | ') : 'Sin data-*';
}

function interactionInfo(el) {
  const out = [];
  if (el.tagName === 'A') {
    const href = el.getAttribute('href') ?? el.getAttribute('data-zen-inspector-href') ?? '';
    out.push(`href=${href}`);
  }
  if (el.tagName === 'BUTTON') out.push(`type=${el.getAttribute('type') || 'submit'}`);
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
    out.push(`name=${el.getAttribute('name') || '—'}`);
    out.push(`value=${'value' in el ? String(el.value) : '—'}`);
  }
  const role = el.getAttribute('role');
  if (role) out.push(`role=${role}`);
  const aria = ['aria-label','aria-expanded','aria-pressed','aria-selected','aria-controls']
    .map((name) => el.hasAttribute(name) ? `${name}=${el.getAttribute(name)}` : '')
    .filter(Boolean);
  return out.concat(aria).join(' | ') || 'Sin acción/ARIA específica detectada';
}

export function describeElement(el) {
  if (!(el instanceof Element)) return null;
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || '',
    classes: [...el.classList].slice(0, 8),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

export function buildInspectorLog(info, registry = DEFAULT_COMPONENT_REGISTRY) {
  const el = info.element;
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const owner = info.ownerName && info.ownerName !== info.name
    ? `COMPONENTE PROPIETARIO:\n${info.ownerName}\nSelector: ${info.ownerSelector || '—'}\n`
    : '';
  const protection = info.protected
    ? 'PROTECCIÓN:\nComponente protegido: evita modificar su arquitectura sin una decisión explícita.\n'
    : '';
  return [
    'ZEN INSPECTOR', '',
    'SCOPE:', info.name, '',
    owner.trim(), '',
    'DESCRIPCIÓN:', info.description || '—', '',
    'TREE:', componentTree(el, registry), '',
    'DOM:',
    `Elemento: ${el.tagName.toLowerCase()}`,
    `Selector registrado: ${info.selector || 'No registrado'}`,
    `Selector exacto: ${exactPath(el)}`,
    `ID: ${el.id || '—'}`,
    `Clases: ${typeof el.className === 'string' ? el.className : '—'}`, '',
    'INTERACCIÓN:', interactionInfo(el), '',
    'VIEWPORT:', `${window.innerWidth} × ${window.innerHeight} px`, '',
    'GEOMETRÍA:',
    `x: ${Math.round(rect.x)} px`, `y: ${Math.round(rect.y)} px`,
    `width: ${Math.round(rect.width)} px`, `height: ${Math.round(rect.height)} px`, '',
    'LAYOUT:',
    `display: ${style.display}`, `position: ${style.position}`, `z-index: ${style.zIndex}`,
    `overflow-x: ${style.overflowX}`, `overflow-y: ${style.overflowY}`,
    `grid-template-columns: ${style.gridTemplateColumns}`, `grid-template-rows: ${style.gridTemplateRows}`,
    `flex-direction: ${style.flexDirection}`, `justify-content: ${style.justifyContent}`,
    `align-items: ${style.alignItems}`, `gap: ${style.gap}`, '',
    'BOX MODEL:', `margin: ${style.margin}`, `padding: ${style.padding}`,
    `border: ${style.border}`, `border-radius: ${style.borderRadius}`, '',
    'TIPOGRAFÍA:', `font-family: ${style.fontFamily}`, `font-size: ${style.fontSize}`,
    `font-weight: ${style.fontWeight}`, `line-height: ${style.lineHeight}`,
    `letter-spacing: ${style.letterSpacing}`, `color: ${style.color}`,
    `background: ${style.backgroundColor}`, '',
    'DATA:', datasetText(el), '',
    'TEXTO:', (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 400) || 'Sin texto visible', '',
    protection.trim(), '',
    'PETICIÓN:', '[Escribe aquí qué quieres cambiar.]'
  ].filter((line, index, array) => !(line === '' && array[index - 1] === '')).join('\n');
}
