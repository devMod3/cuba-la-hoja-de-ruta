'use client';

import {
  AuthoringError,
  canonicalJson,
  type AuthoringConnection,
  type AuthoringConnector,
  type DocumentKey,
  type VersionedJsonDocument
} from '@zenblog/authoring-core';
import {
  parsePublishedSiteProfile,
  parseSharedMetadataRegistry,
  type PublishedSiteProfile,
  type SharedMetadataRegistry
} from '@zenblog/site-config';
import { useRef, useState } from 'react';
import { metadataIsMeaningful, profileIsMeaningful } from './admin-model';

type ConnectionState = 'disconnected' | 'authenticating' | 'authorized' | 'error';
type SyncState = 'empty' | 'local-only' | 'remote-only' | 'equal' | 'divergent';

type MetadataDocument = VersionedJsonDocument<SharedMetadataRegistry>;
type ProfileDocument = VersionedJsonDocument<PublishedSiteProfile>;

interface RemoteDocuments {
  readonly metadata: MetadataDocument | null;
  readonly profile: ProfileDocument | null;
}

interface SharedAuthoringProps {
  readonly connector: AuthoringConnector;
  readonly metadata: SharedMetadataRegistry;
  readonly profile: PublishedSiteProfile;
  readonly onMetadataAdopted: (value: SharedMetadataRegistry) => void;
  readonly onProfileAdopted: (value: PublishedSiteProfile) => void;
}

function safeFailure(error: unknown): string {
  if (error instanceof AuthoringError) return error.message;
  return 'No se pudo completar la operación compartida.';
}

function stateLabel(state: SyncState): string {
  return {
    empty: 'sin datos',
    'local-only': 'sólo local',
    'remote-only': 'sólo remoto',
    equal: 'sincronizado',
    divergent: 'divergente'
  }[state];
}

function stateDetail(state: SyncState): string {
  return {
    empty: 'No hay contenido significativo en ninguno de los dos lados.',
    'local-only': 'Hay un borrador local que todavía no existe en el repositorio compartido.',
    'remote-only':
      'El repositorio compartido contiene una versión sin borrador local significativo.',
    equal: 'El borrador local y la versión remota son equivalentes.',
    divergent: 'El borrador local y la versión compartida difieren. Revisa antes de sobrescribir.'
  }[state];
}

export function SharedAuthoring({
  connector,
  metadata,
  profile,
  onMetadataAdopted,
  onProfileAdopted
}: SharedAuthoringProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [token, setToken] = useState('');
  const [connection, setConnection] = useState<AuthoringConnection | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [status, setStatus] = useState('Desconectado. Los borradores locales siguen intactos.');
  const [remote, setRemote] = useState<RemoteDocuments>({ metadata: null, profile: null });
  const [conflicts, setConflicts] = useState<ReadonlySet<DocumentKey>>(new Set());

  const login = connection?.session.identity.login ?? null;

  function open(): void {
    dialogRef.current?.showModal();
  }

  function close(): void {
    dialogRef.current?.close();
  }

  async function readMetadata(
    activeConnection: AuthoringConnection
  ): Promise<MetadataDocument | null> {
    try {
      return await activeConnection.repository.read(
        'metadata-registry',
        parseSharedMetadataRegistry
      );
    } catch (error) {
      if (error instanceof AuthoringError && error.code === 'not-found') return null;
      throw error;
    }
  }

  async function readProfile(
    activeConnection: AuthoringConnection
  ): Promise<ProfileDocument | null> {
    try {
      return await activeConnection.repository.read('site-profile', parsePublishedSiteProfile);
    } catch (error) {
      if (error instanceof AuthoringError && error.code === 'not-found') return null;
      throw error;
    }
  }

  async function refreshAll(activeConnection = connection): Promise<void> {
    if (!activeConnection) return;
    setStatus('Leyendo versiones remotas…');
    const [remoteMetadata, remoteProfile] = await Promise.all([
      readMetadata(activeConnection),
      readProfile(activeConnection)
    ]);
    setRemote({ metadata: remoteMetadata, profile: remoteProfile });
    setConflicts(new Set());
    setStatus('Estado remoto actualizado. Ninguna escritura se realiza automáticamente.');
  }

  async function connect(): Promise<void> {
    const credential = token.trim();
    setToken('');
    if (!credential) {
      setStatus('Introduce una credencial temporal para conectar.');
      return;
    }

    setConnectionState('authenticating');
    setStatus('Autenticando identidad y permiso de escritura…');
    try {
      const nextConnection = await connector.connect(credential);
      connection?.disconnect();
      setConnection(nextConnection);
      setConnectionState('authorized');
      await refreshAll(nextConnection);
    } catch (error) {
      connection?.disconnect();
      setConnection(null);
      setConnectionState('error');
      setStatus(safeFailure(error));
    }
  }

  function disconnect(): void {
    connection?.disconnect();
    setConnection(null);
    setRemote({ metadata: null, profile: null });
    setConflicts(new Set());
    setConnectionState('disconnected');
    setStatus('Desconectado. Los borradores locales siguen intactos.');
  }

  function metadataState(): SyncState {
    const meaningful = metadataIsMeaningful(metadata);
    if (!remote.metadata) return meaningful ? 'local-only' : 'empty';
    if (!meaningful) return 'remote-only';
    return canonicalJson(metadata) === canonicalJson(remote.metadata.value) ? 'equal' : 'divergent';
  }

  function profileState(): SyncState {
    const meaningful = profileIsMeaningful(profile);
    if (!remote.profile) return meaningful ? 'local-only' : 'empty';
    if (!meaningful) return 'remote-only';
    return canonicalJson(profile) === canonicalJson(remote.profile.value) ? 'equal' : 'divergent';
  }

  async function uploadMetadata(overwrite: boolean): Promise<void> {
    if (!connection) return;
    try {
      const written = await connection.repository.write(
        {
          key: 'metadata-registry',
          value: metadata,
          expectedVersion: overwrite ? (remote.metadata?.version ?? null) : null,
          message: 'content: update shared metadata registry'
        },
        parseSharedMetadataRegistry
      );
      const readBack = await connection.repository.read(
        'metadata-registry',
        parseSharedMetadataRegistry
      );
      if (readBack.version !== written.version) {
        throw new AuthoringError(
          'conflict',
          'La versión de metadata cambió durante la verificación posterior a la escritura'
        );
      }
      setRemote((current) => ({ ...current, metadata: readBack }));
      setConflicts((current) => {
        const next = new Set(current);
        next.delete('metadata-registry');
        return next;
      });
      setStatus(`Metadata sincronizada; versión ${readBack.version} verificada.`);
    } catch (error) {
      if (error instanceof AuthoringError && error.code === 'conflict') {
        const refreshed = await readMetadata(connection);
        setRemote((current) => ({ ...current, metadata: refreshed }));
        setConflicts((current) => new Set(current).add('metadata-registry'));
        setStatus(
          'Conflicto de concurrencia: la versión remota se recargó sin reintento destructivo.'
        );
        return;
      }
      setStatus(safeFailure(error));
    }
  }

  async function uploadProfile(overwrite: boolean): Promise<void> {
    if (!connection) return;
    try {
      const written = await connection.repository.write(
        {
          key: 'site-profile',
          value: profile,
          expectedVersion: overwrite ? (remote.profile?.version ?? null) : null,
          message: 'content: update shared site profile'
        },
        parsePublishedSiteProfile
      );
      const readBack = await connection.repository.read('site-profile', parsePublishedSiteProfile);
      if (readBack.version !== written.version) {
        throw new AuthoringError(
          'conflict',
          'La versión del perfil cambió durante la verificación posterior a la escritura'
        );
      }
      setRemote((current) => ({ ...current, profile: readBack }));
      setConflicts((current) => {
        const next = new Set(current);
        next.delete('site-profile');
        return next;
      });
      setStatus(`Perfil sincronizado; versión ${readBack.version} verificada.`);
    } catch (error) {
      if (error instanceof AuthoringError && error.code === 'conflict') {
        const refreshed = await readProfile(connection);
        setRemote((current) => ({ ...current, profile: refreshed }));
        setConflicts((current) => new Set(current).add('site-profile'));
        setStatus(
          'Conflicto de concurrencia: la versión remota se recargó sin reintento destructivo.'
        );
        return;
      }
      setStatus(safeFailure(error));
    }
  }

  const metadataSyncState = metadataState();
  const profileSyncState = profileState();

  return (
    <>
      <button
        type="button"
        className="zsa-launcher"
        data-state={connectionState}
        aria-label={login ? `Compartido · @${login}` : 'Compartido · desconectado'}
        onClick={open}
      >
        {login ? `Compartido · @${login}` : 'Compartido · desconectado'}
      </button>

      <dialog
        id="zen-shared-authoring-dialog"
        ref={dialogRef}
        className="zsa-dialog"
        aria-label="Estado compartido"
      >
        <div className="zsa-panel">
          <header className="zsa-head">
            <div>
              <small>Repositorio compartido</small>
              <h2>Estado compartido</h2>
            </div>
            <button type="button" className="zsa-close" aria-label="Cerrar" onClick={close}>
              ×
            </button>
          </header>

          {connectionState !== 'authorized' ? (
            <form
              className="zsa-connect"
              onSubmit={(event) => {
                event.preventDefault();
                void connect();
              }}
            >
              <label>
                <span>Credencial temporal</span>
                <input
                  type="password"
                  value={token}
                  autoComplete="off"
                  onChange={(event) => {
                    setToken(event.target.value);
                  }}
                  disabled={connectionState === 'authenticating'}
                />
              </label>
              <button
                type="submit"
                className="zsa-primary"
                disabled={connectionState === 'authenticating'}
              >
                {connectionState === 'authenticating' ? 'Conectando…' : 'Conectar'}
              </button>
            </form>
          ) : (
            <div className="zsa-session">
              <span>Identidad</span>
              <strong>@{login}</strong>
            </div>
          )}

          <div role="status" aria-live="polite" className="zsa-status">
            {status}
          </div>

          {connectionState === 'authorized' ? (
            <div className="zsa-documents">
              <DocumentCard
                documentKey="metadata-registry"
                label="Metadata"
                state={metadataSyncState}
                conflict={conflicts.has('metadata-registry')}
                onUpload={() => {
                  void uploadMetadata(false);
                }}
                onOverwrite={() => {
                  if (
                    globalThis.confirm(
                      'Sobrescribir Metadata remoto con el borrador local revisado?'
                    )
                  ) {
                    void uploadMetadata(true);
                  }
                }}
                onAdopt={() => {
                  if (remote.metadata) onMetadataAdopted(remote.metadata.value);
                }}
              />
              <DocumentCard
                documentKey="site-profile"
                label="Perfil público"
                state={profileSyncState}
                conflict={conflicts.has('site-profile')}
                onUpload={() => {
                  void uploadProfile(false);
                }}
                onOverwrite={() => {
                  if (
                    globalThis.confirm(
                      'Sobrescribir Perfil público remoto con el borrador local revisado?'
                    )
                  ) {
                    void uploadProfile(true);
                  }
                }}
                onAdopt={() => {
                  if (remote.profile) onProfileAdopted(remote.profile.value);
                }}
              />
            </div>
          ) : null}

          {connectionState === 'authorized' ? (
            <footer className="zsa-actions">
              <button
                type="button"
                onClick={() => {
                  void refreshAll();
                }}
              >
                Actualizar remoto
              </button>
              <button type="button" onClick={disconnect}>
                Desconectar
              </button>
            </footer>
          ) : null}
        </div>
      </dialog>
    </>
  );
}

interface DocumentCardProps {
  readonly documentKey: DocumentKey;
  readonly label: string;
  readonly state: SyncState;
  readonly conflict: boolean;
  readonly onUpload: () => void;
  readonly onOverwrite: () => void;
  readonly onAdopt: () => void;
}

function DocumentCard({
  documentKey,
  label,
  state,
  conflict,
  onUpload,
  onOverwrite,
  onAdopt
}: DocumentCardProps) {
  return (
    <article className="zsa-document" data-zsa-key={documentKey}>
      <div className="zsa-document-head">
        <strong>{label}</strong>
        <span data-state={conflict ? 'conflict' : state}>
          {conflict ? 'conflicto' : stateLabel(state)}
        </span>
      </div>
      <p>
        {conflict
          ? 'El repositorio rechazó una escritura obsoleta. La versión remota actual se recargó; revisa antes de intentar otra acción.'
          : stateDetail(state)}
      </p>
      <div className="zsa-document-actions">
        {state === 'local-only' ? (
          <button type="button" className="zsa-primary" onClick={onUpload}>
            Subir local
          </button>
        ) : null}
        {state === 'remote-only' ? (
          <button type="button" className="zsa-primary" onClick={onAdopt}>
            Adoptar remoto
          </button>
        ) : null}
        {state === 'divergent' || conflict ? (
          <>
            <button type="button" onClick={onAdopt}>
              Adoptar remoto
            </button>
            <button type="button" className="zsa-primary" onClick={onOverwrite}>
              Sobrescribir remoto
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}
