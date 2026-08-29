'use client';

import {
  KNOWN_RESOURCE_TYPES,
  KNOWN_SOCIAL_PLATFORMS,
  parsePublishedSiteProfile,
  resourceTypeLabel,
  socialPlatformLabel,
  type PublishedSiteProfile
} from '@zenblog/site-config';
import { useRef, useState } from 'react';
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
        <header className="zam-header">
          <div className="zam-brand">
            <small>Acerca de</small>
            <strong>Perfil</strong>
          </div>
          <div className="zam-header-actions">
            <button type="button" onClick={openPublicPreview}>
              Vista Previa ↗
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
          data-kind={/^(No |El Audio|La foto|La imagen|Primero)/u.test(status) ? 'error' : 'ok'}
        >
          {status}
        </div>

        <main className="zam-main">
          <div className="zam-panel">
            <div className="zam-panel-intro">
              <div>
                <small>Perfil</small>
                <h2>Identidad editorial</h2>
              </div>
              <div className="zam-panel-copy">
                <p>Todos los campos pertenecen al documento compartido del repositorio.</p>
                <p>
                  Replica los campos del perfil público de Blogger y sólo publica los que tengan
                  contenido.
                </p>
              </div>
            </div>

            <section className="zam-group" aria-labelledby="about-identity-heading">
              <div className="zam-group-title">
                <span id="about-identity-heading">Identidad y contacto</span>
                <span>Principal</span>
              </div>

              <div className="zam-photo-upload">
                <div className="zam-photo-preview">
                  {p.photoUrl ? (
                    <span
                      className="zam-photo-preview-image"
                      role="img"
                      aria-label="Vista previa de foto de perfil"
                      style={{ backgroundImage: `url(${JSON.stringify(p.photoUrl)})` }}
                    />
                  ) : (
                    <span aria-hidden="true">Foto</span>
                  )}
                </div>
                <div className="zam-photo-copy">
                  <strong>Foto de perfil</strong>
                  <small>
                    Se recorta al centro y se optimiza automáticamente. La vista pública usa marco
                    circular.
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
                        updateText('photoUrl', '');
                        setStatus('Foto eliminada; hay cambios pendientes de publicación.');
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                  <label className="zam-field zam-media-source-field">
                    <span>Foto (URL o data URL)</span>
                    <input
                      value={p.photoUrl}
                      onChange={(event) => {
                        updateText('photoUrl', event.target.value);
                      }}
                    />
                  </label>
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
                <span>Nombre visible</span>
                <input
                  value={p.displayName}
                  onChange={(event) => {
                    updateText('displayName', event.target.value);
                  }}
                />
              </label>
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
                <span>Correo electrónico</span>
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
                <span>Perfil de Blogger</span>
                <input
                  type="url"
                  value={p.externalProfileUrl}
                  onChange={(event) => {
                    updateText('externalProfileUrl', event.target.value);
                  }}
                />
              </label>
            </section>

            <section className="zam-group" aria-labelledby="about-extended-heading">
              <div className="zam-group-title">
                <span id="about-extended-heading">Perfil extendido</span>
                <span>Acerca de Blogger</span>
              </div>
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
            </section>

            <section className="zam-group" aria-labelledby="about-location-heading">
              <div className="zam-group-title">
                <span id="about-location-heading">Ubicación</span>
                <span>Opcional</span>
              </div>
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
            </section>

            <section className="zam-group" aria-labelledby="about-favorites-heading">
              <div className="zam-group-title">
                <span id="about-favorites-heading">Intereses y favoritos</span>
                <span>Uno por línea</span>
              </div>
              <label className="zam-field">
                <span>Intereses</span>
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
                <span>Libro favorito</span>
                <textarea
                  value={p.favoriteBooks.join('\n')}
                  onChange={(event) => {
                    updateList('favoriteBooks', event.target.value);
                  }}
                />
              </label>
            </section>

            <section className="zam-group" aria-labelledby="about-classic-heading">
              <div className="zam-group-title">
                <span id="about-classic-heading">Campos clásicos de Blogger</span>
                <span>Perfil público</span>
              </div>

              <div className="zam-audio-upload">
                <div className="zam-audio-copy">
                  <strong>Audio Clip</strong>
                  <small>Usa un archivo breve o una URL pública.</small>
                </div>
                <div className="zam-audio-actions">
                  <button
                    type="button"
                    onClick={() => {
                      audioInputRef.current?.click();
                    }}
                  >
                    Subir audio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateText('audioClipUrl', '');
                      setStatus('Audio Clip eliminado; hay cambios pendientes de publicación.');
                    }}
                  >
                    Eliminar
                  </button>
                </div>
                <label className="zam-field zam-audio-source-field">
                  <span>Audio Clip (URL o data URL)</span>
                  <input
                    value={p.audioClipUrl}
                    onChange={(event) => {
                      updateText('audioClipUrl', event.target.value);
                    }}
                  />
                </label>
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
              <label className="zam-field">
                <span>Pregunta aleatoria</span>
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

            <section className="zam-group" aria-labelledby="about-social-heading">
              <div className="zam-group-title zam-group-title-with-action">
                <div>
                  <span id="about-social-heading">Redes sociales</span>
                  <small>Enlaces públicos</small>
                </div>
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
                  + Añadir red
                </button>
              </div>

              <div className="zam-repeater zam-repeater-contained">
                {profile.social.length === 0 ? (
                  <p className="zam-empty">No hay redes sociales añadidas.</p>
                ) : null}
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
                    <label className="zam-check">
                      <input
                        type="checkbox"
                        checked={item.visible}
                        onChange={(event) => {
                          updateSocial(item.id, { visible: event.target.checked });
                        }}
                      />
                      Visible
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="zam-group" aria-labelledby="about-resources-heading">
              <div className="zam-group-title zam-group-title-with-action">
                <div>
                  <span id="about-resources-heading">Recursos relacionados</span>
                  <small>Directorio editorial</small>
                </div>
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
                  + Añadir recurso
                </button>
              </div>

              <div className="zam-repeater zam-repeater-contained">
                {profile.relatedResources.length === 0 ? (
                  <p className="zam-empty">No hay recursos relacionados añadidos.</p>
                ) : null}
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
                      />
                      Visible
                    </label>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>

        <footer className="zam-footer">
          <span>Publicación pública autenticada</span>
          <button type="button" className="primary" onClick={saveForPublication}>
            Guardar
          </button>
        </footer>
      </div>
    </div>
  );
}
