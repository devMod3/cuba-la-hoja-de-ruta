'use client';

import {
  parsePublishedSiteProfile,
  KNOWN_RESOURCE_TYPES,
  KNOWN_SOCIAL_PLATFORMS,
  resourceTypeLabel,
  socialPlatformLabel,
  type PublishedSiteProfile
} from '@zenblog/site-config';
import { useRef, useState } from 'react';
import { createProfileFavicon, normalizeProfilePhoto } from './profile-photo';

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

const MAX_PROFILE_IMPORT_BYTES = 2_000_000;

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
  const [draft, setDraft] = useState<PublishedSiteProfile | null>(null);
  const [status, setStatus] = useState('Borrador local listo');
  const profile = draft ?? initialProfile;

  function setProfile(
    update: PublishedSiteProfile | ((current: PublishedSiteProfile) => PublishedSiteProfile)
  ): void {
    setDraft((current) => {
      const base = current ?? initialProfile;
      return typeof update === 'function' ? update(base) : update;
    });
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

  function persistDraft(message = 'Perfil guardado localmente'): PublishedSiteProfile | null {
    try {
      const canonical = parsePublishedSiteProfile({
        ...profile,
        updatedAt: new Date().toISOString()
      });
      onChange(canonical);
      setDraft(null);
      setStatus(message);
      return canonical;
    } catch (error) {
      setStatus(
        error instanceof Error ? `No se guardó: ${error.message}` : 'No se guardó el perfil.'
      );
      return null;
    }
  }

  function publish(): void {
    const saved = persistDraft(
      'Borrador guardado. Autoriza y sincroniza «Perfil público» para publicar.'
    );
    if (saved) onPublishRequest();
  }

  function openPublicPreview(): void {
    globalThis.open('../acerca-de/', '_blank', 'noopener,noreferrer');
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
      setStatus('Perfil importado al borrador; guarda para conservarlo.');
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
      setStatus('Foto optimizada y cargada en el borrador; guarda para conservarla.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo procesar la foto.');
    }
  }

  async function downloadFavicon(): Promise<void> {
    const source = profile.profile.photoUrl.trim();
    if (!source) {
      setStatus('Primero añade una foto de perfil.');
      return;
    }
    try {
      const data = await createProfileFavicon(source);
      const anchor = document.createElement('a');
      anchor.href = data;
      anchor.download = 'la-hoja-de-ruta-favicon.png';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setStatus('Favicon descargado.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo generar el favicon.');
    }
  }

  const p = profile.profile;
  return (
    <div id="zen-about-manager-root">
      <div className="zam-shell">
        <header className="zam-header">
          <div className="zam-brand">
            <small>Herramienta de autoría</small>
            <strong>Acerca de</strong>
          </div>
          <div className="zam-header-actions">
            <button type="button" onClick={openPublicPreview}>
              Vista pública ↗
            </button>
            <button type="button" onClick={exportProfile}>
              Exportar
            </button>
            <button
              type="button"
              onClick={() => {
                importInputRef.current?.click();
              }}
            >
              Importar
            </button>
            <button type="button" onClick={() => persistDraft()}>
              Guardar borrador
            </button>
            <button type="button" className="primary" onClick={publish}>
              Publicar
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
        <div
          className="zam-status"
          role="status"
          aria-live="polite"
          data-kind={/^(No |La foto|La imagen|Primero)/u.test(status) ? 'error' : 'ok'}
        >
          {status}
        </div>
        <main className="zam-main">
          <div className="zam-panel">
            <div className="zam-panel-intro">
              <div>
                <small>Perfil público</small>
                <h2>Identidad editorial</h2>
              </div>
              <p>Todos los campos pertenecen al documento compartido del repositorio.</p>
            </div>

            <section className="zam-group">
              <div className="zam-group-title">
                <span>Identidad</span>
                <span>Sitio público</span>
              </div>
              <label className="zam-field">
                <span>Nombre</span>
                <input
                  value={p.displayName}
                  onChange={(event) => {
                    updateText('displayName', event.target.value);
                  }}
                />
              </label>
              <div className="zam-photo-upload">
                <div className="zam-photo-preview" aria-label="Vista previa de foto">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- browser-only preview accepts data URLs and arbitrary author-provided URLs.
                    <img src={p.photoUrl} alt="Vista previa de foto de perfil" />
                  ) : (
                    <span aria-hidden="true">Foto</span>
                  )}
                </div>
                <div className="zam-photo-copy">
                  <strong>Foto de perfil</strong>
                  <small>
                    Se recorta al centro y se optimiza automáticamente antes de guardarse en el
                    perfil compartido.
                  </small>
                  <div className="zam-photo-actions">
                    <button
                      type="button"
                      onClick={() => {
                        photoInputRef.current?.click();
                      }}
                    >
                      Subir foto
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void downloadFavicon();
                      }}
                    >
                      Descargar favicon
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateText('photoUrl', '');
                        setStatus('Foto eliminada del borrador; guarda para conservar el cambio.');
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                  <details className="zam-photo-advanced">
                    <summary>Usar URL en su lugar</summary>
                    <label className="zam-field zam-photo-url-field">
                      <span>Foto (URL o data URL)</span>
                      <input
                        value={p.photoUrl}
                        onChange={(event) => {
                          updateText('photoUrl', event.target.value);
                        }}
                      />
                    </label>
                  </details>
                </div>
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
              </div>
              <label className="zam-field">
                <span>Introducción</span>
                <textarea
                  value={p.introduction}
                  onChange={(event) => {
                    updateText('introduction', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Correo</span>
                <input
                  type="email"
                  value={p.email}
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
                  onChange={(event) => {
                    updateText('website', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Audio</span>
                <input
                  type="url"
                  value={p.audioClipUrl}
                  onChange={(event) => {
                    updateText('audioClipUrl', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Wishlist</span>
                <input
                  type="url"
                  value={p.wishlistUrl}
                  onChange={(event) => {
                    updateText('wishlistUrl', event.target.value);
                  }}
                />
              </label>
            </section>

            <section className="zam-group">
              <div className="zam-group-title">
                <span>Perfil extendido</span>
                <span>Opcional</span>
              </div>
              <label className="zam-field">
                <span>Género</span>
                <input
                  value={p.gender}
                  onChange={(event) => {
                    updateText('gender', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Industria</span>
                <input
                  value={p.industry}
                  onChange={(event) => {
                    updateText('industry', event.target.value);
                  }}
                />
              </label>
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
                <span>Ciudad</span>
                <input
                  value={p.location.city}
                  onChange={(event) => {
                    updateLocation('city', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Región</span>
                <input
                  value={p.location.region}
                  onChange={(event) => {
                    updateLocation('region', event.target.value);
                  }}
                />
              </label>
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
                <span>Intereses (uno por línea)</span>
                <textarea
                  value={p.interests.join('\n')}
                  onChange={(event) => {
                    updateList('interests', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Películas favoritas</span>
                <textarea
                  value={p.favoriteMovies.join('\n')}
                  onChange={(event) => {
                    updateList('favoriteMovies', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Música favorita</span>
                <textarea
                  value={p.favoriteMusic.join('\n')}
                  onChange={(event) => {
                    updateList('favoriteMusic', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Libros favoritos</span>
                <textarea
                  value={p.favoriteBooks.join('\n')}
                  onChange={(event) => {
                    updateList('favoriteBooks', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Pregunta</span>
                <input
                  value={p.randomQuestion}
                  onChange={(event) => {
                    updateText('randomQuestion', event.target.value);
                  }}
                />
              </label>
              <label className="zam-field">
                <span>Respuesta</span>
                <textarea
                  value={p.randomAnswer}
                  onChange={(event) => {
                    updateText('randomAnswer', event.target.value);
                  }}
                />
              </label>
            </section>

            <section className="zam-group">
              <div className="zam-group-title">
                <span>Redes sociales</span>
                <button
                  type="button"
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
                          order: current.social.length
                        }
                      ]
                    }));
                  }}
                >
                  + Añadir
                </button>
              </div>
              <div className="zam-repeater">
                {profile.social.map((item, index) => (
                  <article className="zam-card" key={item.id}>
                    <div className="zam-card-head">
                      <strong>Red {String(index + 1)}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setProfile((current) => ({
                            ...current,
                            social: current.social.filter((entry) => entry.id !== item.id)
                          }));
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                    <label className="zam-field">
                      <span>Plataforma</span>
                      <select
                        value={item.platform}
                        onChange={(event) => {
                          updateSocial(item.id, { platform: event.target.value });
                        }}
                      >
                        {(!KNOWN_SOCIAL_PLATFORMS.includes(
                          item.platform as (typeof KNOWN_SOCIAL_PLATFORMS)[number]
                        )
                          ? [item.platform, ...KNOWN_SOCIAL_PLATFORMS]
                          : KNOWN_SOCIAL_PLATFORMS
                        ).map((platform) => (
                          <option key={platform} value={platform}>
                            {socialPlatformLabel(platform)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="zam-field">
                      <span>Etiqueta</span>
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
                    <label className="zam-check">
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={(event) => {
                          updateSocial(item.id, { visible: event.target.checked });
                        }}
                      />{' '}
                      Visible
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="zam-group">
              <div className="zam-group-title">
                <span>Recursos relacionados</span>
                <button
                  type="button"
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
                          order: current.relatedResources.length
                        }
                      ]
                    }));
                  }}
                >
                  + Añadir
                </button>
              </div>
              <div className="zam-repeater">
                {profile.relatedResources.map((item, index) => (
                  <article className="zam-card" key={item.id}>
                    <div className="zam-card-head">
                      <strong>Recurso {String(index + 1)}</strong>
                      <button
                        type="button"
                        onClick={() => {
                          setProfile((current) => ({
                            ...current,
                            relatedResources: current.relatedResources.filter(
                              (entry) => entry.id !== item.id
                            )
                          }));
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
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
                    <label className="zam-field">
                      <span>Descripción</span>
                      <textarea
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
                    <label className="zam-check">
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={(event) => {
                          updateResource(item.id, { visible: event.target.checked });
                        }}
                      />{' '}
                      Visible
                    </label>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
