import { validateSiteProfile } from '../about/SiteProfileStore.js';

export const PRODUCTION_BLOGGER_HOST = 'cubalahojaderuta.blogspot.com';
export const PUBLIC_PROFILE_URL = 'https://devmod3.github.io/cuba-la-hoja-de-ruta/config/site-profile.public.json';
export const GITHUB_OWNER = 'devMod3';
export const GITHUB_REPO = 'cuba-la-hoja-de-ruta';
export const GITHUB_BRANCH = 'main';
export const GITHUB_PROFILE_PATH = 'config/site-profile.public.json';

const API_ROOT = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

export function isProductionBloggerLocation(locationLike = globalThis.location) {
  return String(locationLike?.hostname || '').toLowerCase() === PRODUCTION_BLOGGER_HOST;
}

function utf8ToBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function authHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2026-03-10'
  };
}

async function responseError(response, fallback) {
  try {
    const data = await response.json();
    return new Error(data?.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

export function requestEphemeralGitHubToken({ documentRef = globalThis.document } = {}) {
  if (!documentRef?.body) return Promise.reject(new Error('No hay interfaz disponible para autorizar la publicación.'));

  return new Promise((resolve, reject) => {
    const overlay = documentRef.createElement('div');
    overlay.dataset.zenPublishAuth = 'true';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:rgba(0,0,0,.78);padding:20px';

    const panel = documentRef.createElement('form');
    panel.style.cssText = 'width:min(520px,100%);background:#171a1d;border:1px solid #434a50;padding:22px;color:#f1f0eb;font:14px/1.45 system-ui,sans-serif';
    panel.innerHTML = `
      <h2 style="margin:0 0 10px;font-size:18px">Autorizar publicación pública</h2>
      <p style="margin:0 0 14px;color:#b4b6b8">Introduce un token fine-grained de GitHub limitado a <strong>${GITHUB_OWNER}/${GITHUB_REPO}</strong> con permiso <strong>Contents: write</strong>. Se usa sólo para esta publicación y no se guarda.</p>
      <label style="display:grid;gap:6px">Token de publicación
        <input name="token" type="password" autocomplete="off" spellcheck="false" required style="min-height:42px;background:#121416;border:1px solid #434a50;color:#f1f0eb;padding:0 10px"/>
      </label>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">
        <button type="button" data-cancel style="min-height:40px">Cancelar</button>
        <button type="submit" style="min-height:40px">Autorizar y publicar</button>
      </div>`;

    const finish = (callback) => {
      overlay.remove();
      callback();
    };

    panel.querySelector('[data-cancel]').addEventListener('click', () => finish(() => reject(new Error('Publicación cancelada.'))), { once: true });
    panel.addEventListener('submit', (event) => {
      event.preventDefault();
      const token = String(new FormData(panel).get('token') || '').trim();
      if (!token) return;
      finish(() => resolve(token));
    }, { once: true });

    overlay.appendChild(panel);
    documentRef.body.appendChild(overlay);
    panel.querySelector('input')?.focus();
  });
}

export class GitHubPublicProfilePublisher {
  constructor({
    fetchImpl = globalThis.fetch,
    tokenProvider = requestEphemeralGitHubToken,
    publicProfileUrl = PUBLIC_PROFILE_URL,
    delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    pollAttempts = 30,
    pollIntervalMs = 2000
  } = {}) {
    this.fetchImpl = fetchImpl;
    this.tokenProvider = tokenProvider;
    this.publicProfileUrl = publicProfileUrl;
    this.delay = delay;
    this.pollAttempts = pollAttempts;
    this.pollIntervalMs = pollIntervalMs;
  }

  async verifyOwner(token) {
    const response = await this.fetchImpl('https://api.github.com/user', { headers: authHeaders(token) });
    if (!response.ok) throw await responseError(response, `GitHub authorization HTTP ${response.status}`);
    const user = await response.json();
    if (String(user?.login || '').toLowerCase() !== GITHUB_OWNER.toLowerCase()) {
      throw new Error(`Cuenta GitHub no autorizada: se requiere ${GITHUB_OWNER}.`);
    }
  }

  async currentFile(token) {
    const url = `${API_ROOT}/contents/${GITHUB_PROFILE_PATH}?ref=${encodeURIComponent(GITHUB_BRANCH)}`;
    const response = await this.fetchImpl(url, { headers: authHeaders(token), cache: 'no-store' });
    if (!response.ok) throw await responseError(response, `No se pudo leer el perfil público: HTTP ${response.status}`);
    return response.json();
  }

  async writeFile(token, profile, sha) {
    const body = {
      message: 'content: publish About profile from Blogger Admin',
      content: utf8ToBase64(`${JSON.stringify(profile, null, 2)}\n`),
      sha,
      branch: GITHUB_BRANCH
    };
    const response = await this.fetchImpl(`${API_ROOT}/contents/${GITHUB_PROFILE_PATH}`, {
      method: 'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw await responseError(response, `No se pudo publicar el perfil: HTTP ${response.status}`);
    return response.json();
  }

  async waitForPublicSnapshot(updatedAt) {
    for (let attempt = 0; attempt < this.pollAttempts; attempt += 1) {
      const url = new URL(this.publicProfileUrl);
      url.searchParams.set('publishedAt', updatedAt || String(Date.now()));
      url.searchParams.set('attempt', String(attempt));
      try {
        const response = await this.fetchImpl(url.href, { cache: 'no-store', credentials: 'omit' });
        if (response.ok) {
          const data = await response.json();
          if (data?.updatedAt === updatedAt) return data;
        }
      } catch {}
      if (attempt < this.pollAttempts - 1) await this.delay(this.pollIntervalMs);
    }
    throw new Error('GitHub aceptó el cambio, pero el snapshot público todavía no se propagó a GitHub Pages.');
  }

  async publish(value) {
    const validation = validateSiteProfile(value);
    if (!validation.ok) throw new Error(validation.errors.join(' · '));
    const profile = { ...validation.value, updatedAt: value?.updatedAt || new Date().toISOString() };
    const token = await this.tokenProvider();
    try {
      await this.verifyOwner(token);
      const current = await this.currentFile(token);
      const write = await this.writeFile(token, profile, current.sha);
      await this.waitForPublicSnapshot(profile.updatedAt);
      return Object.freeze({ profile, commitSha: write?.commit?.sha || null, publicUrl: this.publicProfileUrl });
    } finally {
      // Token remains operation-local and is never written to localStorage/sessionStorage/global state.
    }
  }
}

export function installPublicProfilePublishing(manager, {
  publisher = new GitHubPublicProfilePublisher(),
  isProduction = () => isProductionBloggerLocation()
} = {}) {
  const originalBuildShell = manager.buildShell.bind(manager);

  manager.buildShell = function buildShellWithPublicationState() {
    originalBuildShell();
    const label = this.root?.querySelector('.zam-footer span');
    if (label) label.textContent = isProduction()
      ? 'zenSiteProfile.v1 · guardado local + publicación pública autenticada'
      : 'zenSiteProfile.v1 · almacenamiento local';
  };

  manager.save = async function saveWithPublicParity() {
    const button = this.root?.querySelector('[data-zam-action="save"]');
    if (button?.disabled) return null;
    if (button) button.disabled = true;

    let saved = null;
    try {
      saved = this.store.save(this.collect());
      this.data = saved;

      if (!isProduction()) {
        this.status('Acerca de guardado localmente. Entorno LOCAL / PRUEBAS: no se publica.', 'ok');
        return saved;
      }

      this.status('Borrador local guardado. Publicando en Blogger Real…', 'info');
      const result = await publisher.publish(saved);
      this.status('Acerca de guardado y publicado. El snapshot público ya está disponible.', 'ok');
      document.dispatchEvent(new CustomEvent('zenabout:published', {
        detail: { profile: saved, commitSha: result.commitSha, publicUrl: result.publicUrl }
      }));
      return saved;
    } catch (error) {
      const prefix = saved ? 'Guardado localmente, pero NO publicado' : 'No se guardó';
      this.status(`${prefix}: ${error.message}`, 'error');
      return null;
    } finally {
      if (button) button.disabled = false;
    }
  };

  return manager;
}
