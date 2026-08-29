from pathlib import Path


def replace_once(relative: str, old: str, new: str) -> None:
    path = Path(relative)
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{relative}: expected exactly one replacement, found {count}")
    path.write_text(text.replace(old, new, 1))


content = "apps/inspector-extension/src/content.ts"
replace_once(content, ") => boolean | void", ") => boolean | undefined")
replace_once(
    content,
    "type ZenInspectorTag = keyof HTMLElementTagNameMap;\n\n(() => {",
    """type ZenInspectorTag = keyof HTMLElementTagNameMap;

function isZenInspectorToggleMessage(message: unknown): message is ZenInspectorToggleMessage {
  if (typeof message !== 'object' || message === null || !('type' in message)) return false;
  const candidate = message as Readonly<{ type?: unknown }>;
  return candidate.type === 'zen-inspector:toggle';
}

(() => {""",
)
replace_once(
    content,
    """      const copied = document.execCommand('copy');
      copyStatus.textContent = copied ? 'Copiado' : 'Seleccionado para copiar';""",
    "      copyStatus.textContent = 'No se pudo copiar; log seleccionado';",
)
replace_once(
    content,
    """      if (
        typeof message !== 'object' ||
        message === null ||
        !('type' in message) ||
        (message as ZenInspectorToggleMessage).type !== 'zen-inspector:toggle'
      ) {
        return false;
      }""",
    "      if (!isZenInspectorToggleMessage(message)) return false;",
)

diagnostics = "apps/inspector-extension/src/diagnostics.ts"
replace_once(
    diagnostics,
    "typeof globalThis.CSS?.escape === 'function'",
    "typeof globalThis.CSS.escape === 'function'",
)
replace_once(
    diagnostics,
    """  return (
    (element.textContent ?? '').replace(/\\s+/gu, ' ').trim().slice(0, 320) || 'Sin texto visible'
  );""",
    "  return element.textContent.replace(/\\s+/gu, ' ').trim().slice(0, 320) || 'Sin texto visible';",
)
replace_once(
    diagnostics,
    "    .join('\\n');\n}",
    "    .join('\\n');\n}\n\nObject.assign(globalThis, { zenInspectorBuildLog });",
)

admin = "apps/web/components/admin/admin-shell.tsx"
replace_once(admin, "import { InspectorPanel } from './inspector-panel';\n", "")
replace_once(
    admin,
    "type AdminTab = 'metadata' | 'search' | 'about' | 'inspector';",
    "type AdminTab = 'metadata' | 'search' | 'about';",
)
replace_once(
    admin,
    """  { id: 'about', label: 'Acerca de' },
  { id: 'inspector', label: 'Inspector' }""",
    "  { id: 'about', label: 'Acerca de' }",
)
replace_once(
    admin,
    """        <section
          id="zas-pane-inspector"
          className="zas-pane"
          role="tabpanel"
          aria-label="Inspector"
          hidden={activeTab !== 'inspector'}
        >
          <InspectorPanel />
        </section>
""",
    "",
)

contract = "scripts/check-inspector-extension.ts"
replace_once(
    contract,
    "for (const legacy of [\n  'apps/web/components/inspector-runtime.tsx',",
    "for (const legacy of [\n  'apps/web/components/admin/inspector-panel.tsx',\n  'apps/web/components/inspector-runtime.tsx',",
)
