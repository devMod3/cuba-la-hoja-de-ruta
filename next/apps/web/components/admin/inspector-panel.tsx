'use client';

import { useSyncExternalStore } from 'react';
import {
  getInspectorServerSnapshot,
  getInspectorSnapshot,
  setInspectorEnabled,
  subscribeInspector
} from '../inspector-state';

export function InspectorPanel() {
  const enabled = useSyncExternalStore(
    subscribeInspector,
    getInspectorSnapshot,
    getInspectorServerSnapshot
  );

  return (
    <div className="zas-tool-page">
      <header className="zas-tool-head">
        <div>
          <small>Herramienta de autoría</small>
          <h1>Inspector</h1>
        </div>
        <label className="zas-switch-row" htmlFor="zas-inspector-switch">
          <span>
            <strong>Inspector</strong>
            <small>Intercepta clics en el sitio para identificar elementos.</small>
          </span>
          <span className="zas-switch">
            <input
              id="zas-inspector-switch"
              type="checkbox"
              role="switch"
              checked={enabled}
              onChange={(event) => {
                setInspectorEnabled(event.target.checked);
              }}
            />
            <i aria-hidden="true" />
          </span>
        </label>
      </header>
      <section className="zas-inspector-info">
        <p>
          Actívalo aquí y abre el sitio. El estado se conserva en el almacenamiento local del
          navegador.
        </p>
        <div className="zas-inspector-state">
          <span>Estado</span>
          <strong id="zas-inspector-state">{enabled ? 'ON' : 'OFF'}</strong>
        </div>
        <a className="zas-primary-link" href="/" target="_blank" rel="noopener noreferrer">
          Abrir sitio para inspeccionar ↗
        </a>
      </section>
    </div>
  );
}
