'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { buildInspectorLog, resolveInspectorTarget } from './inspector-diagnostics';
import {
  getInspectorServerSnapshot,
  getInspectorSnapshot,
  setInspectorEnabled,
  subscribeInspector
} from './inspector-state';
const UI_ATTRIBUTE = 'data-zen-inspector-ui';

function inspectorUi(element: Element): boolean {
  return element.closest(`[${UI_ATTRIBUTE}="true"]`) !== null;
}

export function InspectorRuntime() {
  const pathname = usePathname();
  const isAdmin = pathname.replace(/\/+$/u, '') === '/admin';
  const enabled = useSyncExternalStore(
    subscribeInspector,
    getInspectorSnapshot,
    getInspectorServerSnapshot
  );
  const [selected, setSelected] = useState<Element | null>(null);
  const [hovered, setHovered] = useState<Element | null>(null);
  const [hud, setHud] = useState('');
  const [componentName, setComponentName] = useState('');
  const [log, setLog] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.documentElement.dataset['zenInspector'] = !isAdmin && enabled ? 'on' : 'off';
  }, [enabled, isAdmin]);

  useEffect(() => {
    if (isAdmin) return undefined;

    const choose = (target: Element, openDialog: boolean) => {
      const info = resolveInspectorTarget(target);
      const rect = target.getBoundingClientRect();
      setSelected(target);
      setHud(`${info.name} · ${String(Math.round(rect.width))}×${String(Math.round(rect.height))}`);
      if (openDialog) {
        setComponentName(info.name);
        setLog(buildInspectorLog(info));
        dialogRef.current?.showModal();
      }
    };

    const onPointerOver = (event: PointerEvent) => {
      if (!enabled || !(event.target instanceof Element) || inspectorUi(event.target)) return;
      setHovered(event.target);
      choose(event.target, false);
    };
    const onClick = (event: MouseEvent) => {
      if (!enabled || !(event.target instanceof Element) || inspectorUi(event.target)) return;
      event.preventDefault();
      event.stopPropagation();
      choose(event.target, true);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLocaleLowerCase('en') === 'i') {
        event.preventDefault();
        const next = !enabled;
        setInspectorEnabled(next);
        if (!next) {
          setSelected(null);
          setHovered(null);
          dialogRef.current?.close();
        }
        return;
      }
      if (event.key === 'Escape' && enabled && !dialogRef.current?.open) setSelected(null);
    };
    const reposition = () => {
      const target = selected ?? hovered;
      if (enabled && target && document.documentElement.contains(target)) choose(target, false);
    };

    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, { passive: true, capture: true });
    return () => {
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [enabled, hovered, isAdmin, selected]);

  const rect = selected?.getBoundingClientRect() ?? null;

  async function copy(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard is optional; the readonly fields remain manually copyable.
    }
  }

  if (isAdmin) return null;

  return (
    <>
      {enabled && rect ? (
        <div
          id="zen-inspector-outline"
          aria-hidden="true"
          data-zen-inspector-ui="true"
          style={{
            left: Math.max(0, rect.left),
            top: Math.max(0, rect.top),
            width: Math.max(0, rect.width),
            height: Math.max(0, rect.height)
          }}
        />
      ) : null}
      {enabled && hud ? (
        <div id="zen-inspector-hud" role="status" data-zen-inspector-ui="true">
          {hud}
        </div>
      ) : null}
      <dialog
        ref={dialogRef}
        id="zen-inspector-modal"
        aria-labelledby="zen-inspector-modal-title"
        data-zen-inspector-ui="true"
      >
        <header className="zi-modal-head">
          <div className="zi-modal-brand">
            <small>Zen Inspector</small>
            <strong id="zen-inspector-modal-title">Componente seleccionado</strong>
          </div>
          <button
            type="button"
            className="zi-modal-close"
            aria-label="Cerrar inspector"
            onClick={() => dialogRef.current?.close()}
          >
            ×
          </button>
        </header>
        <div className="zi-component-field">
          <label htmlFor="zen-inspector-component-name">Componente</label>
          <input
            id="zen-inspector-component-name"
            value={componentName}
            readOnly
            spellCheck={false}
          />
        </div>
        <div className="zi-log-wrap">
          <div className="zi-log-label">
            <span>Log técnico</span>
            <small>lectura</small>
          </div>
          <textarea id="zen-inspector-log" value={log} readOnly spellCheck={false} />
        </div>
        <footer className="zi-modal-actions">
          <span className="zi-modal-hint">Esc para cerrar · Alt+I para desactivar</span>
          <div className="zi-modal-buttons">
            <button type="button" onClick={() => void copy(componentName)}>
              Copiar componente
            </button>
            <button type="button" className="zi-primary" onClick={() => void copy(log)}>
              Copiar log
            </button>
          </div>
        </footer>
      </dialog>
    </>
  );
}
