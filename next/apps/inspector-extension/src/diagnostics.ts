interface ZenInspectorTargetInfo {
  readonly name: string;
  readonly exactPath: string;
  readonly ownerName: string;
  readonly ownerPath: string;
}

function zenInspectorEscapeCss(value: string): string {
  if (typeof globalThis.CSS?.escape === 'function') return globalThis.CSS.escape(value);
  return value.replace(
    /[^a-zA-Z0-9_-]/gu,
    (character) => `\\${character.codePointAt(0)?.toString(16) ?? '0'} `
  );
}

function zenInspectorParent(element: Element): Element | null {
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

function zenInspectorExactPath(element: Element): string {
  if (element.id) return `#${zenInspectorEscapeCss(element.id)}`;
  const parts: string[] = [];
  let node: Element | null = element;
  while (node && node !== document.documentElement) {
    if (node.id) {
      parts.unshift(`#${zenInspectorEscapeCss(node.id)}`);
      break;
    }
    let part = node.tagName.toLocaleLowerCase('en');
    const stableClasses = [...node.classList]
      .filter((name) => !/^(?:is-|has-|js-|active$|selected$|open$|focus$)/u.test(name))
      .slice(0, 3);
    if (stableClasses.length > 0) {
      part += `.${stableClasses.map(zenInspectorEscapeCss).join('.')}`;
    }
    const parent = zenInspectorParent(node);
    if (parent) {
      const siblings = [...parent.children].filter((child) => child.tagName === node?.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${String(siblings.indexOf(node) + 1)})`;
    }
    parts.unshift(part);
    const root = node.getRootNode();
    if (!node.parentElement && root instanceof ShadowRoot) parts.unshift('>>>');
    node = parent;
    if (parts.length >= 18) break;
  }
  return parts.join(' > ').replace(/>\s*>>>\s*>/gu, '>>>');
}

function zenInspectorGenericName(element: Element): string {
  const explicit =
    element.getAttribute('data-zen-component') ?? element.getAttribute('data-component');
  if (explicit) return `<${explicit.replace(/^<|>$/gu, '')}>`;
  if (element.id) return `<DOM#${element.id}>`;
  const role = element.getAttribute('role');
  if (role) return `<DOM.${element.tagName.toLocaleLowerCase('en')}[role=${role}]>`;
  const classes = [...element.classList].slice(0, 2).join('.');
  return `<DOM.${element.tagName.toLocaleLowerCase('en')}${classes ? `.${classes}` : ''}>`;
}

function zenInspectorResolveTarget(element: Element): ZenInspectorTargetInfo {
  let owner: Element | null = element;
  while (owner) {
    const explicit =
      owner.getAttribute('data-zen-component') ?? owner.getAttribute('data-component');
    if (explicit) {
      return {
        name: zenInspectorGenericName(element),
        exactPath: zenInspectorExactPath(element),
        ownerName: `<${explicit.replace(/^<|>$/gu, '')}>`,
        ownerPath: zenInspectorExactPath(owner)
      };
    }
    owner = zenInspectorParent(owner);
  }
  return {
    name: zenInspectorGenericName(element),
    exactPath: zenInspectorExactPath(element),
    ownerName: '',
    ownerPath: ''
  };
}

function zenInspectorSafeUrl(raw: string): string {
  try {
    const parsed = new URL(raw, document.baseURI);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return `${parsed.origin}${parsed.pathname}`;
    }
    if (parsed.protocol === 'file:') return parsed.pathname;
    if (parsed.protocol === 'mailto:' || parsed.protocol === 'tel:')
      return `${parsed.protocol}[redacted]`;
    return `${parsed.protocol}[redacted]`;
  } catch {
    return '[unparseable URL]';
  }
}

function zenInspectorInteractionInfo(element: Element): string {
  const values: string[] = [];
  if (element instanceof HTMLAnchorElement)
    values.push(`href=${zenInspectorSafeUrl(element.href)}`);
  if (element instanceof HTMLButtonElement) values.push(`type=${element.type}`);
  if (element instanceof HTMLInputElement) {
    values.push(`input-type=${element.type || 'text'}`);
    values.push(`name=${element.name || '—'}`);
    values.push(`autocomplete=${element.autocomplete || '—'}`);
    values.push(`value-present=${element.value.length > 0 ? 'yes' : 'no'} [value redacted]`);
  }
  if (element instanceof HTMLTextAreaElement) {
    values.push(`name=${element.name || '—'}`);
    values.push(`value-present=${element.value.length > 0 ? 'yes' : 'no'} [value redacted]`);
  }
  if (element instanceof HTMLSelectElement) {
    values.push(`name=${element.name || '—'}`);
    values.push(`selected-index=${String(element.selectedIndex)}`);
    values.push('[selected value redacted]');
  }
  const role = element.getAttribute('role');
  if (role) values.push(`role=${role}`);
  for (const name of ['aria-expanded', 'aria-pressed', 'aria-selected', 'aria-controls'] as const) {
    if (element.hasAttribute(name)) values.push(`${name}=${element.getAttribute(name) ?? ''}`);
  }
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && !(element instanceof HTMLInputElement && element.type === 'password')) {
    values.push(`aria-label=${ariaLabel.slice(0, 140)}`);
  }
  return values.join(' | ') || 'Sin acción/ARIA específica detectada';
}

function zenInspectorDatasetInfo(element: Element): string {
  if (!(element instanceof HTMLElement)) return 'Sin data-*';
  const keys = Object.keys(element.dataset).slice(0, 20);
  return keys.length > 0 ? `Claves: ${keys.join(', ')} [valores no capturados]` : 'Sin data-*';
}

function zenInspectorTextPreview(element: Element): string {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return '[contenido de formulario no capturado]';
  }
  return (
    (element.textContent ?? '').replace(/\s+/gu, ' ').trim().slice(0, 320) || 'Sin texto visible'
  );
}

function zenInspectorComponentTree(element: Element): string {
  const nodes: string[] = [];
  let node: Element | null = element;
  while (node && node !== document.documentElement) {
    const name = zenInspectorGenericName(node);
    if (nodes.at(-1) !== name) nodes.push(name);
    node = zenInspectorParent(node);
    if (nodes.length >= 12) break;
  }
  nodes.reverse();
  return nodes
    .map((name, index) => (index === 0 ? name : `${'  '.repeat(index)}└─ ${name}`))
    .join('\n');
}

function zenInspectorBuildLog(element: Element): string {
  const info = zenInspectorResolveTarget(element);
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const owner =
    info.ownerName && info.ownerName !== info.name
      ? `COMPONENTE PROPIETARIO:\n${info.ownerName}\nRuta: ${info.ownerPath}`
      : '';
  const pageUrl = zenInspectorSafeUrl(globalThis.location.href);

  return [
    'ZEN INSPECTOR',
    '',
    'PÁGINA:',
    pageUrl,
    `Título: ${document.title.slice(0, 180) || '—'}`,
    '',
    'SCOPE:',
    info.name,
    '',
    owner,
    '',
    'TREE:',
    zenInspectorComponentTree(element),
    '',
    'DOM:',
    `Elemento: ${element.tagName.toLocaleLowerCase('en')}`,
    `Selector exacto: ${info.exactPath}`,
    `ID: ${element.id || '—'}`,
    `Clases: ${element.getAttribute('class') || '—'}`,
    '',
    'INTERACCIÓN:',
    zenInspectorInteractionInfo(element),
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
    zenInspectorDatasetInfo(element),
    '',
    'TEXTO:',
    zenInspectorTextPreview(element),
    '',
    'PRIVACIDAD:',
    'No se capturan valores de formularios, secretos data-* ni query strings/hash de URLs.',
    '',
    'PETICIÓN:',
    '[Escribe aquí qué quieres cambiar.]'
  ]
    .filter((line, index, all) => !(line === '' && all[index - 1] === ''))
    .join('\n');
}
