'use client';

import {
  KNOWN_RESOURCE_TYPES,
  KNOWN_SOCIAL_PLATFORMS,
  parsePublishedSiteProfile,
  resourceTypeLabel,
  socialPlatformLabel,
  type PublishedSiteProfile
} from '@zenblog/site-config';
import { useRef, useState, type KeyboardEvent } from 'react';
import { readProfileAudio } from './profile-audio';
import { normalizeProfilePhoto } from './profile-photo';

interface AboutManagerProps {
  readonly profile: PublishedSiteProfile;
  readonly onChange: (profile: PublishedSiteProfile) => void;
  readonly onPublishRequest: () => void;
}

type SocialEntry = PublishedSiteProfile['social'][number];
type ResourceEntry = PublishedSiteProfile['relatedResources'][number];

type ProfileTextField =
  | 'displayName'
  | 'photoUrl'
  | 'email'
  | 'website'
  | 'externalProfileUrl'
  | 'audioClipUrl'
  | 'wishlistUrl'
  | 'randomQuestion'
  | 'randomAnswer'
  | 'gender'
  | 'industry'
  | 'occupation'
  | 'introduction';

type LocationField = 'city' | 'region' | 'country';
type ListField = 'interests' | 'favoriteMovies' | 'favoriteMusic' | 'favoriteBooks';

const MAX_PROFILE_IMPORT_BYTES = 2_000_000;
const SOCIAL_PLATFORM_OPTIONS = KNOWN_SOCIAL_PLATFORMS.filter((platform) => platform !== 'other');
const ABOUT_TABS = [
  { id: 'personal', label: 'Detalles', description: 'Perfil extendido' },
  { id: 'favorites', label: 'Intereses', description: 'Gustos y favoritos' },
  { id: 'connections', label: 'Social & Recursos', description: 'Enlaces y directorio' }
] as const;

type AboutTabId = (typeof ABOUT_TABS)[number]['id'];

function lines(value: string): readonly string[] {
  return [
    ...new Set(
      value
        .split(/\r?\n/u)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ];
}

function uid(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function nextOrder(items: readonly { readonly order: number }[]): number {
  return items.reduce((maximum, item) => Math.max(maximum, item.order), -1) + 1;
}

function downloadTextFile(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function AboutManager({
  profile: initialProfile,
  onChange,
  onPublishRequest
}: AboutManagerProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<PublishedSiteProfile | null>(null);
  const [status, setStatus] = useState('Perfil listo para editar');
  const [activeTab, setActiveTab] = useState<AboutTabId>('personal');
  const profile = draft ?? initialProfile;

  function setProfile(
    update: PublishedSiteProfile | ((current: PublishedSiteProfile) => PublishedSiteProfile)
  ): void {
    setDraft((current) => {
      const base = current ?? initialProfile;
      return typeof update === 'function' ? update(base) : update;
    });
    setStatus('Cambios locales pendientes de publicación.');
  }

  function updateText(field: ProfileTextField, value: string): void {
    setProfile((current) => ({
      ...current,
      profile: { ...current.profile, [field]: value }
    }));
  }

  function updateLocation(field: LocationField, value: string): void {
    setProfile((current) => ({
      ...current,
      profile: {
        ...current.profile,
        location: { ...current.profile.location, [field]: value }
      }
    }));
  }

  function updateList(field: ListField, value: string): void {
    setProfile((current) => ({
      ...current,
      profile: { ...current.profile, [field]: lines(value) }
    }));
  }

  function updateSocial(id: string, update: Partial<SocialEntry>): void {
    setProfile((current) => ({
      ...current,
      social: current.social.map((item) => (item.id === id ? { ...item, ...update } : item))
    }));
  }

  function updateResource(id: string, update: Partial<ResourceEntry>): void {
    setProfile((current) => ({
      ...current,
      relatedResources: current.relatedResources.map((item) =>
        item.id === id ? { ...item, ...update } : item
      )
    }));
  }

  function moveSocial(id: string, direction: -1 | 1): void {
    setProfile((current) => {
      const items = [...current.social].sort((left, right) => left.order - right.order);
      const index = items.findIndex((item) => item.id === id);
      const target = index + direction;
      const item = items[index];
      const targetItem = items[target];
      if (index < 0 || target < 0 || target >= items.length || !item || !targetItem) return current;
      items[index] = targetItem;
      items[target] = item;
      return {
        ...current,
        social: items.map((entry, order) => ({ ...entry, order }))
      };
    });
  }

  function moveResource(id: string, direction: -1 | 1): void {
    setProfile((current) => {
      const items = [...current.relatedResources].sort((left, right) => left.order - right.order);
      const index = items.findIndex((item) => item.id === id);
      const target = index + direction;
      const item = items[index];
      const targetItem = items[target];
      if (index < 0 || target < 0 || target >= items.length || !item || !targetItem) return current;
      items[index] = targetItem;
      items[target] = item;
      return {
        ...current,
        relatedResources: items.map((entry, order) => ({ ...entry, order }))
      };
    });
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabList = event.currentTarget.closest('[role="tablist"]');
    const tabs = tabList
      ? Array.from(tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      : [];
    if (tabs.length === 0) return;
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;

    const target = tabs[nextIndex];
    if (!target) return;
    event.preventDefault();
    target.focus();
    target.click();
  }

  function saveForPublication(): void {
    try {
      const canonical = parsePublishedSiteProfile({
        ...profile,
        updatedAt: new Date().toISOString()
      });
      onChange(canonical);
      setDraft(null);
      setStatus('Perfil validado. Completa la publicación pública autenticada.');
      onPublishRequest();
    } catch (error) {
      setStatus(
        error instanceof Error ? `No se guardó: ${error.message}` : 'No se guardó el perfil.'
      );
    }
  }

  function openPublicPreview(): void {
    try {
      const canonical = parsePublishedSiteProfile(profile);
      onChange(canonical);
      setStatus('Borrador local validado para vista previa; todavía no está publicado.');
      globalThis.open('./acerca-de-preview/', '_blank', 'noopener,noreferrer');
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `No se abrió la vista previa: ${error.message}`
          : 'No se abrió la vista previa.'
      );
    }
  }

  function exportProfile(): void {
    try {
      const canonical = parsePublishedSiteProfile(profile);
      downloadTextFile(
        'site-profile.json',
        `${JSON.stringify(canonical, null, 2)}\n`,
        'application/json;charset=utf-8'
      );
      setStatus('Perfil exportado como JSON.');
    } catch (error) {
      setStatus(error instanceof Error ? `No se exportó: ${error.message}` : 'No se exportó.');
    }
  }

  async function importProfile(file: File | null): Promise<void> {
    if (!file) return;
    if (file.size > MAX_PROFILE_IMPORT_BYTES) {
      setStatus('No se importó: el archivo supera 2 MB.');
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const canonical = parsePublishedSiteProfile(parsed);
      setDraft(canonical);
      setStatus('Perfil importado; hay cambios pendientes de publicación.');
    } catch (error) {
      setStatus(error instanceof Error ? `No se importó: ${error.message}` : 'No se importó.');
    }
  }

  async function importPhoto(file: File | null): Promise<void> {
    if (!file) return;
    try {
      setStatus('Procesando foto…');
      const normalized = await normalizeProfilePhoto(file);
      updateText('photoUrl', normalized);
      setStatus('Foto optimizada y cargada; hay cambios pendientes de publicación.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo procesar la foto.');
    }
  }

  async function importAudio(file: File | null): Promise<void> {
    if (!file) return;
    try {
      setStatus('Procesando Audio Clip…');
      const source = await readProfileAudio(file);
      updateText('audioClipUrl', source);
      setStatus('Audio Clip cargado; hay cambios pendientes de publicación.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo procesar el Audio Clip.');
    }
  }

  const p = profile.profile;

  return (
    <div id="zen-about-manager-root">
      <div className="zam-shell">
        <header className="zam-header zam-profile-header">
          <div className="zam-profile-heading">
            <small>Acerca de</small>
            <h1>Configuración de perfil</h1>
            <p>Gestiona tu identidad pública sin mezclar borrador, publicación y delivery.</p>
          </div>

          <div className="zam-header-actions zam-profile-actions">
            <div
              className="zam-status"
              role="status"
              aria-live="polite"
              data-kind={/^(No |El Audio|La foto|La imagen|Primero)/u.test(status) ? 'error' : 'ok'}
            >
              {status}
            </div>
            <button type="button" className="zam-btn zam-btn-ghost" onClick={openPublicPreview}>
              Vista Previa ↗
            </button>
            <button type="button" className="zam-btn zam-btn-ghost" onClick={exportProfile}>
              Exportar
            </button>
            <button
              type="button"
              className="zam-btn zam-btn-ghost"
              onClick={() => {
                importInputRef.current?.click();
              }}
            >
              Importar
            </button>
            <button type="button" className="zam-btn zam-btn-primary" onClick={saveForPublication}>
              Guardar
            </button>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            aria-label="Importar perfil JSON"
            onChange={(event) => {
              const input = event.currentTarget;
              void importProfile(input.files?.[0] ?? null).finally(() => {
                input.value = '';
              });
            }}
          />
        </header>

        <div className="zam-profile-body">
          <aside className="zam-profile-sidebar" aria-label="Identidad y contacto">
            <section className="zam-avatar-section" aria-labelledby="about-identity-heading">
              <div className="zam-avatar">
                {p.photoUrl ? (
                  <span
                    className="zam-photo-preview-image"
                    role="img"
                    aria-label="Vista previa de foto de perfil"
                    style={{ backgroundImage: `url(${JSON.stringify(p.photoUrl)})` }}
                  />
                ) : (
                  <span className="zam-avatar-placeholder" aria-hidden="true">
                    Foto
                  </span>
                )}
              </div>

              <div className="zam-avatar-actions">
                <button
                  type="button"
                  className="zam-btn zam-btn-ghost"
                  onClick={() => {
                    photoInputRef.current?.click();
                  }}
                >
                  Subir foto
                </button>
                <button
                  type="button"
                  className="zam-btn zam-btn-ghost zam-btn-danger"
                  onClick={() => {
                    updateText('photoUrl', '');
                    setStatus('Foto eliminada; hay cambios pendientes de publicación.');
                  }}
                >
                  Eliminar
                </button>
              </div>
              <p className="zam-avatar-hint">Se recorta al centro y se optimiza automáticamente.</p>

              <details className="zam-advanced-field">
                <summary>URL avanzada de la foto</summary>
                <label className="zam-field">
                  <span>Foto (URL o data URL)</span>
                  <input
                    value={p.photoUrl}
                    onChange={(event) => {
                      updateText('photoUrl', event.target.value);
                    }}
                  />
                </label>
              </details>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                aria-label="Seleccionar foto de perfil"
                onChange={(event) => {
                  const input = event.currentTarget;
                  void importPhoto(input.files?.[0] ?? null).finally(() => {
                    input.value = '';
                  });
                }}
              />
            </section>

            <section className="zam-sidebar-fields">
              <h2 id="about-identity-heading">Identidad y contacto</h2>

              <label className="zam-field">
                <span>Nombre visible</span>
                <input
                  value={p.displayName}
                  placeholder="Tu nombre público"
                  onChange={(event) => {
                    updateText('displayName', event.target.value);
                  }}
                />
              </label>

              <label className="zam-field">
                <span>Introducción</span>
                <textarea
                  rows={3}
                  value={p.introduction}
                  placeholder="Cuéntanos algo sobre ti…"
                  onChange={(event) => {
                    updateText('introduction', event.target.value);
                  }}
                />
              </label>

              <label className="zam-field">
                <span>Correo electrónico</span>
                <input
                  type="email"
                  value={p.email}
                  placeholder="correo@dominio.com"
                  onChange={(event) => {
                    updateText('email', event.target.value);
                  }}
                />
              </label>

              <label className="zam-field">
                <span>Sitio web</span>
                <input
                  type="url"
                  value={p.website}
                  placeholder="https://..."
                  onChange={(event) => {
                    updateText('website', event.target.value);
                  }}
                />
              </label>

              <label className="zam-field">
                <span>Perfil de Blogger</span>
                <input
                  type="url"
                  value={p.externalProfileUrl}
                  placeholder="https://www.blogger.com/profile/..."
                  onChange={(event) => {
                    updateText('externalProfileUrl', event.target.value);
                  }}
                />
              </label>
            </section>
          </aside>

          <main className="zam-main zam-profile-main">
            <div className="zam-tabs" role="tablist" aria-label="Secciones del perfil">
              {ABOUT_TABS.map((tab) => {
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`about-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-label={tab.label}
                    aria-selected={selected}
                    aria-controls={`about-panel-${tab.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => {
                      setActiveTab(tab.id);
                    }}
                    onKeyDown={handleTabKeyDown}
                  >
                    <span className="zam-tab-label">{tab.label}</span>
                    <small className="zam-tab-meta">{tab.description}</small>
                  </button>
                );
              })}
            </div>

            <div className="zam-tab-content">
              <section
                id="about-panel-personal"
                className="zam-panel"
                role="tabpanel"
                aria-labelledby="about-tab-personal"
                hidden={activeTab !== 'personal'}
              >
                <section className="zam-section" aria-labelledby="about-extended-heading">
                  <div className="zam-section-heading">
                    <h2 id="about-extended-heading">Perfil extendido</h2>
                    <p>
                      Información profesional y de contexto que sólo se publica cuando tiene
                      contenido.
                    </p>
                  </div>
                  <div className="zam-form-grid zam-form-grid-3">
                    <label className="zam-field">
                      <span>Ocupación</span>
                      <input
                        value={p.occupation}
                        onChange={(event) => {
                          updateText('occupation', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field">
                      <span>Sector / Industria</span>
                      <input
                        value={p.industry}
                        onChange={(event) => {
                          updateText('industry', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field">
                      <span>Género</span>
                      <input
                        value={p.gender}
                        onChange={(event) => {
                          updateText('gender', event.target.value);
                        }}
                      />
                    </label>
                  </div>
                </section>

                <section className="zam-section" aria-labelledby="about-location-heading">
                  <div className="zam-section-heading zam-section-heading-inline">
                    <h2 id="about-location-heading">Ubicación</h2>
                    <span className="zam-badge">Opcional</span>
                  </div>
                  <div className="zam-form-grid zam-form-grid-3">
                    <label className="zam-field">
                      <span>País</span>
                      <input
                        value={p.location.country}
                        onChange={(event) => {
                          updateLocation('country', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field">
                      <span>Estado / Región</span>
                      <input
                        value={p.location.region}
                        onChange={(event) => {
                          updateLocation('region', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field">
                      <span>Ciudad</span>
                      <input
                        value={p.location.city}
                        onChange={(event) => {
                          updateLocation('city', event.target.value);
                        }}
                      />
                    </label>
                  </div>
                </section>

                <section className="zam-section" aria-labelledby="about-classic-heading">
                  <div className="zam-section-heading">
                    <h2 id="about-classic-heading">Personalización clásica</h2>
                    <p>
                      Campos compatibles con el perfil histórico sin contaminar el dominio con el
                      proveedor.
                    </p>
                  </div>

                  <div className="zam-audio-box">
                    <div className="zam-audio-copy">
                      <strong>Audio Clip</strong>
                      <small>Usa un archivo breve o una URL pública.</small>
                    </div>
                    <div className="zam-audio-actions">
                      <button
                        type="button"
                        className="zam-btn zam-btn-ghost"
                        onClick={() => {
                          audioInputRef.current?.click();
                        }}
                      >
                        Subir audio
                      </button>
                      <button
                        type="button"
                        className="zam-btn zam-btn-ghost zam-btn-danger"
                        onClick={() => {
                          updateText('audioClipUrl', '');
                          setStatus('Audio Clip eliminado; hay cambios pendientes de publicación.');
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="zam-audio-url" title={p.audioClipUrl || 'Sin audio'}>
                      {p.audioClipUrl || 'Sin audio cargado'}
                    </div>
                    <details className="zam-advanced-field zam-audio-advanced">
                      <summary>Editar URL avanzada</summary>
                      <label className="zam-field">
                        <span>Audio Clip (URL o data URL)</span>
                        <input
                          value={p.audioClipUrl}
                          onChange={(event) => {
                            updateText('audioClipUrl', event.target.value);
                          }}
                        />
                      </label>
                    </details>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav,audio/x-wav,audio/webm"
                      hidden
                      aria-label="Seleccionar Audio Clip"
                      onChange={(event) => {
                        const input = event.currentTarget;
                        void importAudio(input.files?.[0] ?? null).finally(() => {
                          input.value = '';
                        });
                      }}
                    />
                  </div>

                  <div className="zam-form-grid">
                    <label className="zam-field">
                      <span>Wishlist</span>
                      <input
                        type="url"
                        value={p.wishlistUrl}
                        placeholder="https://..."
                        onChange={(event) => {
                          updateText('wishlistUrl', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field">
                      <span>Pregunta aleatoria</span>
                      <input
                        value={p.randomQuestion}
                        onChange={(event) => {
                          updateText('randomQuestion', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field zam-field-wide">
                      <span>Respuesta</span>
                      <textarea
                        rows={3}
                        value={p.randomAnswer}
                        onChange={(event) => {
                          updateText('randomAnswer', event.target.value);
                        }}
                      />
                    </label>
                  </div>
                </section>
              </section>

              <section
                id="about-panel-favorites"
                className="zam-panel"
                role="tabpanel"
                aria-labelledby="about-tab-favorites"
                hidden={activeTab !== 'favorites'}
              >
                <section className="zam-section" aria-labelledby="about-favorites-heading">
                  <div className="zam-section-heading zam-section-heading-inline">
                    <div>
                      <h2 id="about-favorites-heading">Intereses y favoritos</h2>
                      <p>
                        Cada línea se convierte en una entrada independiente del perfil público.
                      </p>
                    </div>
                    <span className="zam-badge">Uno por línea</span>
                  </div>
                  <div className="zam-form-grid">
                    <label className="zam-field">
                      <span>Intereses</span>
                      <textarea
                        rows={4}
                        value={p.interests.join('\n')}
                        onChange={(event) => {
                          updateList('interests', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field">
                      <span>Películas favoritas</span>
                      <textarea
                        rows={4}
                        value={p.favoriteMovies.join('\n')}
                        onChange={(event) => {
                          updateList('favoriteMovies', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field">
                      <span>Música favorita</span>
                      <textarea
                        rows={4}
                        value={p.favoriteMusic.join('\n')}
                        onChange={(event) => {
                          updateList('favoriteMusic', event.target.value);
                        }}
                      />
                    </label>
                    <label className="zam-field">
                      <span>Libros favoritos</span>
                      <textarea
                        rows={4}
                        value={p.favoriteBooks.join('\n')}
                        onChange={(event) => {
                          updateList('favoriteBooks', event.target.value);
                        }}
                      />
                    </label>
                  </div>
                </section>
              </section>

              <section
                id="about-panel-connections"
                className="zam-panel"
                role="tabpanel"
                aria-labelledby="about-tab-connections"
                hidden={activeTab !== 'connections'}
              >
                <section className="zam-section" aria-labelledby="about-social-heading">
                  <div className="zam-add-bar">
                    <div className="zam-section-heading">
                      <h2 id="about-social-heading">Redes sociales</h2>
                      <p>Ordena los enlaces como deben aparecer y controla su visibilidad.</p>
                    </div>
                    <button
                      type="button"
                      className="zam-btn zam-btn-add"
                      onClick={() => {
                        setProfile((current) => ({
                          ...current,
                          social: [
                            ...current.social,
                            {
                              id: uid('social'),
                              platform: 'x',
                              label: '',
                              username: '',
                              url: '',
                              visible: true,
                              order: nextOrder(current.social)
                            }
                          ]
                        }));
                      }}
                    >
                      + Añadir red
                    </button>
                  </div>

                  <div className="zam-repeater">
                    {profile.social.length === 0 ? (
                      <p className="zam-empty">No hay redes sociales añadidas.</p>
                    ) : null}

                    {profile.social.map((item, index) => (
                      <article className="zam-card" key={item.id}>
                        <div className="zam-card-head">
                          <strong>Red {String(index + 1)}</strong>
                          <div className="zam-card-actions">
                            <button
                              type="button"
                              className="zam-icon-btn"
                              aria-label={`Subir red ${String(index + 1)}`}
                              disabled={index === 0}
                              onClick={() => {
                                moveSocial(item.id, -1);
                              }}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="zam-icon-btn"
                              aria-label={`Bajar red ${String(index + 1)}`}
                              disabled={index === profile.social.length - 1}
                              onClick={() => {
                                moveSocial(item.id, 1);
                              }}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="zam-icon-btn zam-icon-btn-danger"
                              aria-label={`Eliminar red ${String(index + 1)}`}
                              onClick={() => {
                                setProfile((current) => ({
                                  ...current,
                                  social: current.social
                                    .filter((entry) => entry.id !== item.id)
                                    .map((entry, order) => ({ ...entry, order }))
                                }));
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="zam-form-grid">
                          <label className="zam-field">
                            <span>Plataforma</span>
                            <select
                              value={item.platform}
                              onChange={(event) => {
                                updateSocial(item.id, { platform: event.target.value });
                              }}
                            >
                              {(!SOCIAL_PLATFORM_OPTIONS.includes(
                                item.platform as (typeof SOCIAL_PLATFORM_OPTIONS)[number]
                              )
                                ? [item.platform, ...SOCIAL_PLATFORM_OPTIONS]
                                : SOCIAL_PLATFORM_OPTIONS
                              ).map((platform) => (
                                <option key={platform} value={platform}>
                                  {socialPlatformLabel(platform)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="zam-field">
                            <span>Etiqueta personalizada</span>
                            <input
                              value={item.label}
                              onChange={(event) => {
                                updateSocial(item.id, { label: event.target.value });
                              }}
                            />
                          </label>
                          <label className="zam-field">
                            <span>Usuario</span>
                            <input
                              value={item.username}
                              onChange={(event) => {
                                updateSocial(item.id, { username: event.target.value });
                              }}
                            />
                          </label>
                          <label className="zam-field">
                            <span>URL</span>
                            <input
                              type="url"
                              value={item.url}
                              onChange={(event) => {
                                updateSocial(item.id, { url: event.target.value });
                              }}
                            />
                          </label>
                          <label className="zam-toggle-field zam-field-wide">
                            <input
                              type="checkbox"
                              checked={item.visible}
                              onChange={(event) => {
                                updateSocial(item.id, { visible: event.target.checked });
                              }}
                            />
                            <span className="zam-toggle-track" aria-hidden="true" />
                            <span>Visibilidad pública</span>
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="zam-section" aria-labelledby="about-resources-heading">
                  <div className="zam-add-bar">
                    <div className="zam-section-heading">
                      <h2 id="about-resources-heading">Recursos relacionados</h2>
                      <p>
                        Referencias editoriales que acompañan el perfil sin mezclarse con su
                        identidad.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="zam-btn zam-btn-add"
                      onClick={() => {
                        setProfile((current) => ({
                          ...current,
                          relatedResources: [
                            ...current.relatedResources,
                            {
                              id: uid('resource'),
                              title: '',
                              url: '',
                              description: '',
                              type: 'project',
                              visible: true,
                              order: nextOrder(current.relatedResources)
                            }
                          ]
                        }));
                      }}
                    >
                      + Añadir recurso
                    </button>
                  </div>

                  <div className="zam-repeater">
                    {profile.relatedResources.length === 0 ? (
                      <p className="zam-empty">No hay recursos relacionados añadidos.</p>
                    ) : null}

                    {profile.relatedResources.map((item, index) => (
                      <article className="zam-card" key={item.id}>
                        <div className="zam-card-head">
                          <strong>Recurso {String(index + 1)}</strong>
                          <div className="zam-card-actions">
                            <button
                              type="button"
                              className="zam-icon-btn"
                              aria-label={`Subir recurso ${String(index + 1)}`}
                              disabled={index === 0}
                              onClick={() => {
                                moveResource(item.id, -1);
                              }}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="zam-icon-btn"
                              aria-label={`Bajar recurso ${String(index + 1)}`}
                              disabled={index === profile.relatedResources.length - 1}
                              onClick={() => {
                                moveResource(item.id, 1);
                              }}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="zam-icon-btn zam-icon-btn-danger"
                              aria-label={`Eliminar recurso ${String(index + 1)}`}
                              onClick={() => {
                                setProfile((current) => ({
                                  ...current,
                                  relatedResources: current.relatedResources
                                    .filter((entry) => entry.id !== item.id)
                                    .map((entry, order) => ({ ...entry, order }))
                                }));
                              }}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="zam-form-grid">
                          <label className="zam-field">
                            <span>Título</span>
                            <input
                              value={item.title}
                              onChange={(event) => {
                                updateResource(item.id, { title: event.target.value });
                              }}
                            />
                          </label>
                          <label className="zam-field">
                            <span>URL</span>
                            <input
                              type="url"
                              value={item.url}
                              onChange={(event) => {
                                updateResource(item.id, { url: event.target.value });
                              }}
                            />
                          </label>
                          <label className="zam-field zam-field-wide">
                            <span>Descripción</span>
                            <textarea
                              rows={3}
                              value={item.description}
                              onChange={(event) => {
                                updateResource(item.id, { description: event.target.value });
                              }}
                            />
                          </label>
                          <label className="zam-field">
                            <span>Tipo</span>
                            <select
                              value={item.type}
                              onChange={(event) => {
                                updateResource(item.id, { type: event.target.value });
                              }}
                            >
                              {(!KNOWN_RESOURCE_TYPES.includes(
                                item.type as (typeof KNOWN_RESOURCE_TYPES)[number]
                              )
                                ? [item.type, ...KNOWN_RESOURCE_TYPES]
                                : KNOWN_RESOURCE_TYPES
                              ).map((type) => (
                                <option key={type} value={type}>
                                  {resourceTypeLabel(type)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="zam-toggle-field">
                            <input
                              type="checkbox"
                              checked={item.visible}
                              onChange={(event) => {
                                updateResource(item.id, { visible: event.target.checked });
                              }}
                            />
                            <span className="zam-toggle-track" aria-hidden="true" />
                            <span>Visibilidad pública</span>
                          </label>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
