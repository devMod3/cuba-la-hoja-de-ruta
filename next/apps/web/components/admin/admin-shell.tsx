'use client';

import { createGitHubAuthoringConnector } from '@zenblog/authoring-github';
import { useMemo, useState, useSyncExternalStore } from 'react';
import { AboutManager } from './about-manager';
import {
  createMetadataDraftStore,
  createSiteProfileDraftStore,
  writeMetadataDraft,
  writeSiteProfileDraft
} from './admin-model';
import { InspectorPanel } from './inspector-panel';
import { MetadataManager } from './metadata-manager';
import { SearchLab } from './search-lab';
import { SharedAuthoring } from './shared-authoring';

type AdminTab = 'metadata' | 'search' | 'about' | 'inspector';

const authoringConnector = createGitHubAuthoringConnector({
  owner: 'devMod3',
  repository: 'cuba-la-hoja-de-ruta',
  documents: {
    'metadata-registry': 'next/packages/site-config/data/metadata-registry.json',
    'site-profile': 'next/packages/site-config/data/site-profile.json'
  }
});

const TABS: ReadonlyArray<Readonly<{ id: AdminTab; label: string }>> = [
  { id: 'metadata', label: 'Metadata' },
  { id: 'search', label: 'Search Lab' },
  { id: 'about', label: 'Acerca de' },
  { id: 'inspector', label: 'Inspector' }
];

export function AdminShell() {
  const [activeTab, setActiveTab] = useState<AdminTab>('metadata');
  const [profilePublishRequest, setProfilePublishRequest] = useState(0);
  const metadataStore = useMemo(() => createMetadataDraftStore(), []);
  const profileStore = useMemo(() => createSiteProfileDraftStore(), []);
  const metadata = useSyncExternalStore(
    metadataStore.subscribe,
    metadataStore.getSnapshot,
    metadataStore.getServerSnapshot
  );
  const profile = useSyncExternalStore(
    profileStore.subscribe,
    profileStore.getSnapshot,
    profileStore.getServerSnapshot
  );

  return (
    <div id="zen-admin-shell" data-component="Admin">
      <header className="zas-header">
        <a
          className="zas-brand"
          href="../"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir La hoja de ruta"
        >
          <span className="zas-mark" aria-hidden="true">
            HR
          </span>
          <span>
            <strong>ZenBlog Admin</strong>
            <small>La hoja de ruta</small>
          </span>
        </a>
        <nav className="zas-tabs" role="tablist" aria-label="Herramientas de administración">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="zas-tab"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`zas-pane-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => {
                setActiveTab(tab.id);
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="zas-header-actions">
          <SharedAuthoring
            connector={authoringConnector}
            metadata={metadata}
            profile={profile}
            onMetadataAdopted={(value) => {
              writeMetadataDraft(globalThis.localStorage, value);
            }}
            onProfileAdopted={(value) => {
              writeSiteProfileDraft(globalThis.localStorage, value);
            }}
            openProfileRequest={profilePublishRequest}
          />
          <a className="zas-site-link" href="../" target="_blank" rel="noopener noreferrer">
            Sitio ↗
          </a>
        </div>
      </header>
      <main className="zas-content">
        <section
          id="zas-pane-metadata"
          className="zas-pane"
          role="tabpanel"
          aria-label="Metadata"
          hidden={activeTab !== 'metadata'}
        >
          <MetadataManager
            registry={metadata}
            onChange={(value) => {
              writeMetadataDraft(globalThis.localStorage, value);
            }}
          />
        </section>
        <section
          id="zas-pane-search"
          className="zas-pane"
          role="tabpanel"
          aria-label="Search Lab"
          hidden={activeTab !== 'search'}
        >
          <SearchLab registry={metadata} />
        </section>
        <section
          id="zas-pane-about"
          className="zas-pane"
          role="tabpanel"
          aria-label="Acerca de"
          hidden={activeTab !== 'about'}
        >
          <AboutManager
            profile={profile}
            onChange={(value) => {
              writeSiteProfileDraft(globalThis.localStorage, value);
            }}
            onPublishRequest={() => {
              setProfilePublishRequest((request) => request + 1);
            }}
          />
        </section>
        <section
          id="zas-pane-inspector"
          className="zas-pane"
          role="tabpanel"
          aria-label="Inspector"
          hidden={activeTab !== 'inspector'}
        >
          <InspectorPanel />
        </section>
      </main>
    </div>
  );
}
