'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { AboutProfileView } from '../../app/acerca-de/about-profile-view';
import { createSiteProfileDraftStore } from './admin-model';

export function AboutDraftPreview() {
  const store = useMemo(() => createSiteProfileDraftStore(), []);
  const profile = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  return (
    <div data-component="AboutDraftPreview">
      <p role="status" aria-live="polite">
        Vista previa local del borrador. Estos cambios todavía no están publicados.
      </p>
      <AboutProfileView data={profile} />
    </div>
  );
}
