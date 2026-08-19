import { SiteProfileStore, SOCIAL_PLATFORMS, RESOURCE_TYPES, isSafeExternalUrl } from './SiteProfileStore.js';

const SOCIAL_LABELS = new Map(SOCIAL_PLATFORMS.map((item) => [item.id, item.label]));
const RESOURCE_LABELS = new Map(RESOURCE_TYPES.map((item) => [item.id, item.label]));

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}
function externalLink(label, url, className = '') {
  if (!url || !isSafeExternalUrl(url)) return null;
  const a = node('a', className);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = label;
  return a;
}
function emailLink(email) {
  if (!email) return null;
  const a = node('a', 'zen-about-link');
  a.href = `mailto:${email}`;
  a.textContent = email;
  return a;
}
function joinedLocation(location = {}) { return [location.city, location.region, location.country].filter(Boolean).join(', '); }
function appendDefinition(list, label, value) {
  if (!value) return;
  const row = node('div', 'zen-about-def');
  row.append(node('dt', '', label), node('dd', '', value));
  list.appendChild(row);
}
function appendListDefinition(list, label, values) {
  if (!Array.isArray(values) || !values.length) return;
  appendDefinition(list, label, values.join(' · '));
}

export class AboutFeature {
  constructor({ store = new SiteProfileStore(), root = null } = {}) {
    this.store = store;
    this.root = root;
    this.unsubscribe = null;
  }
  mount() {
    this.root = this.root ?? document.getElementById('zen-about');
    if (!this.root) return null;
    this.root.dataset.zenAboutFeature = '0.1';
    this.render(this.store.load());
    this.unsubscribe = this.store.subscribe((profile) => this.render(profile));
    return this;
  }
  renderFallback() {
    this.root.replaceChildren();
    const wrap = node('div', 'zen-about-shell');
    const header = node('header', 'zen-about-intro');
    header.append(
      node('div', 'zen-about-eyebrow', 'Acerca de'),
      node('h1', '', 'La hoja de ruta'),
      node('p', 'zen-about-lead', 'Plataforma editorial y documental para organizar, leer y recuperar conocimiento sobre soberanía, Constitución y Estado.')
    );
    wrap.appendChild(header);
    this.root.appendChild(wrap);
  }
  render(data) {
    const profile = data?.profile ?? {};
    const social = (data?.social ?? []).filter((item) => item.visible && item.url);
    const resources = (data?.relatedResources ?? []).filter((item) => item.visible && item.title && item.url);
    const hasProfile = Boolean(
      profile.displayName || profile.photoUrl || profile.introduction || profile.occupation || profile.industry || profile.gender ||
      joinedLocation(profile.location) || profile.email || profile.website || profile.audioClipUrl || profile.wishlistUrl ||
      profile.randomQuestion || profile.randomAnswer || profile.bloggerProfileUrl || profile.interests?.length ||
      profile.favoriteMovies?.length || profile.favoriteMusic?.length || profile.favoriteBooks?.length
    );

    if (!hasProfile && !social.length && !resources.length) {
      this.renderFallback();
      return;
    }

    this.root.replaceChildren();
    const shell = node('div', 'zen-about-shell');
    const intro = node('header', 'zen-about-intro');
    intro.appendChild(node('div', 'zen-about-eyebrow', 'Acerca de'));
    const profileTop = node('div', 'zen-about-profile-top');
    if (profile.photoUrl && isSafeExternalUrl(profile.photoUrl)) {
      const img = node('img', 'zen-about-photo');
      img.src = profile.photoUrl;
      img.alt = profile.displayName ? `Foto de ${profile.displayName}` : 'Foto de perfil';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      profileTop.appendChild(img);
    }
    const identity = node('div', 'zen-about-identity');
    identity.appendChild(node('h1', '', profile.displayName || 'La hoja de ruta'));
    const professional = [profile.occupation, profile.industry].filter(Boolean).join(' · ');
    const location = joinedLocation(profile.location);
    if (professional || location) identity.appendChild(node('p', 'zen-about-meta-line', [professional, location].filter(Boolean).join(' · ')));
    if (profile.introduction) identity.appendChild(node('p', 'zen-about-lead', profile.introduction));
    profileTop.appendChild(identity);
    intro.appendChild(profileTop);
    shell.appendChild(intro);

    if (hasProfile) {
      const section = node('section', 'zen-about-section');
      const heading = node('div', 'zen-about-section-head');
      heading.append(node('h2', '', 'Perfil'), node('span', '', 'Blogger'));
      section.appendChild(heading);
      const defs = node('dl', 'zen-about-defs');
      appendDefinition(defs, 'Nombre', profile.displayName);
      appendDefinition(defs, 'Género', profile.gender);
      appendDefinition(defs, 'Sector / Industria', profile.industry);
      appendDefinition(defs, 'Ocupación', profile.occupation);
      appendDefinition(defs, 'Ubicación', location);
      if (profile.randomQuestion || profile.randomAnswer) appendDefinition(defs, 'Pregunta aleatoria', [profile.randomQuestion, profile.randomAnswer].filter(Boolean).join(' — '));
      appendListDefinition(defs, 'Intereses', profile.interests);
      appendListDefinition(defs, 'Películas favoritas', profile.favoriteMovies);
      appendListDefinition(defs, 'Música favorita', profile.favoriteMusic);
      appendListDefinition(defs, 'Libros favoritos', profile.favoriteBooks);
      section.appendChild(defs);
      const links = node('div', 'zen-about-links');
      [
        externalLink('Perfil de Blogger ↗', profile.bloggerProfileUrl, 'zen-about-link'),
        externalLink('Sitio web ↗', profile.website, 'zen-about-link'),
        externalLink('Audio Clip ↗', profile.audioClipUrl, 'zen-about-link'),
        externalLink('Wishlist ↗', profile.wishlistUrl, 'zen-about-link'),
        emailLink(profile.email)
      ].filter(Boolean).forEach((link) => links.appendChild(link));
      if (links.childElementCount) section.appendChild(links);
      shell.appendChild(section);
    }

    if (social.length) {
      const section = node('section', 'zen-about-section');
      const heading = node('div', 'zen-about-section-head');
      heading.append(node('h2', '', 'Redes sociales'), node('span', '', `${social.length}`));
      section.appendChild(heading);
      const list = node('div', 'zen-about-social-list');
      social.sort((a, b) => a.order - b.order).forEach((item) => {
        const a = externalLink('', item.url, 'zen-about-social');
        if (!a) return;
        a.replaceChildren(node('span', 'zen-about-social-name', item.label || SOCIAL_LABELS.get(item.platform) || 'Red social'), node('span', 'zen-about-social-user', item.username || 'Abrir ↗'));
        list.appendChild(a);
      });
      section.appendChild(list);
      shell.appendChild(section);
    }

    if (resources.length) {
      const section = node('section', 'zen-about-section');
      const heading = node('div', 'zen-about-section-head');
      heading.append(node('h2', '', 'Recursos relacionados'), node('span', '', `${resources.length}`));
      section.appendChild(heading);
      const list = node('div', 'zen-about-resource-list');
      resources.sort((a, b) => a.order - b.order).forEach((item) => {
        const a = externalLink('', item.url, 'zen-about-resource');
        if (!a) return;
        const top = node('div', 'zen-about-resource-top');
        top.append(node('strong', '', item.title), node('span', '', `${RESOURCE_LABELS.get(item.type) || 'Recurso'} ↗`));
        a.appendChild(top);
        if (item.description) a.appendChild(node('p', '', item.description));
        list.appendChild(a);
      });
      section.appendChild(list);
      shell.appendChild(section);
    }
    this.root.appendChild(shell);
  }
  destroy() { this.unsubscribe?.(); this.unsubscribe = null; }
}
