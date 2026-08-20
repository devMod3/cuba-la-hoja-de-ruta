import { SiteProfileStore, SOCIAL_PLATFORMS, RESOURCE_TYPES, isSafeExternalUrl, isSafeImageSource } from './SiteProfileStore.js';
import { applySocialIcon } from './SocialIconRegistry.js';

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
  const a = node('a', className, label);
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

function emailLink(email) {
  if (!email) return null;
  const a = node('a', 'zen-about-link', email);
  a.href = `mailto:${email}`;
  return a;
}

function joinedLocation(location = {}) {
  return [location.city, location.region, location.country].filter(Boolean).join(', ');
}

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

function hasExtendedProfile(profile, location) {
  return Boolean(
    profile.gender || profile.industry || profile.occupation || location || profile.randomQuestion || profile.randomAnswer ||
    profile.interests?.length || profile.favoriteMovies?.length || profile.favoriteMusic?.length || profile.favoriteBooks?.length ||
    profile.audioClipUrl || profile.wishlistUrl || profile.bloggerProfileUrl || profile.website || profile.email
  );
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
    this.root.dataset.zenAboutFeature = '0.1.3';
    this.render(this.store.load());
    this.unsubscribe = this.store.subscribe((profile) => this.render(profile));
    return this;
  }

  renderFallback() {
    this.root.replaceChildren();
    const wrap = node('div', 'zen-about-shell');
    const header = node('header', 'zen-about-intro zen-about-intro--fallback');
    header.append(
      node('h1', '', 'La hoja de ruta'),
      node('p', 'zen-about-lead', 'Plataforma editorial y documental para organizar, leer y recuperar conocimiento sobre soberanía, Constitución y Estado.')
    );
    wrap.appendChild(header);
    this.root.appendChild(wrap);
  }

  render(data) {
    const profile = data?.profile ?? {};
    const social = (data?.social ?? []).filter((item) => item.visible && item.url).sort((a, b) => a.order - b.order);
    const resources = (data?.relatedResources ?? []).filter((item) => item.visible && item.title && item.url).sort((a, b) => a.order - b.order);
    const location = joinedLocation(profile.location);
    const hasProfile = Boolean(
      profile.displayName || profile.photoUrl || profile.introduction || profile.occupation || profile.industry || profile.gender ||
      location || profile.email || profile.website || profile.audioClipUrl || profile.wishlistUrl || profile.randomQuestion ||
      profile.randomAnswer || profile.bloggerProfileUrl || profile.interests?.length || profile.favoriteMovies?.length ||
      profile.favoriteMusic?.length || profile.favoriteBooks?.length
    );

    if (!hasProfile && !social.length && !resources.length) {
      this.renderFallback();
      return;
    }

    this.root.replaceChildren();
    const shell = node('div', 'zen-about-shell');
    const intro = node('header', 'zen-about-intro');
    const profileTop = node('div', 'zen-about-profile-top');

    if (profile.photoUrl && isSafeImageSource(profile.photoUrl)) {
      const frame = node('div', 'zen-about-photo-frame');
      const img = node('img', 'zen-about-photo');
      img.src = profile.photoUrl;
      img.alt = profile.displayName ? `Foto de ${profile.displayName}` : 'Foto de perfil';
      img.loading = 'lazy';
      if (/^https?:/i.test(profile.photoUrl)) img.referrerPolicy = 'no-referrer';
      frame.appendChild(img);
      profileTop.appendChild(frame);
    }

    const identity = node('div', 'zen-about-identity');
    identity.appendChild(node('h1', '', profile.displayName || 'La hoja de ruta'));

    const professional = [profile.occupation, profile.industry].filter(Boolean).join(' · ');
    if (professional || location) {
      identity.appendChild(node('p', 'zen-about-meta-line', [professional, location].filter(Boolean).join(' · ')));
    }
    if (profile.introduction) identity.appendChild(node('p', 'zen-about-lead', profile.introduction));

    const quickLinks = node('div', 'zen-about-quick-links');
    [
      externalLink('Blogger ↗', profile.bloggerProfileUrl, 'zen-about-link'),
      externalLink('Sitio web ↗', profile.website, 'zen-about-link'),
      emailLink(profile.email)
    ].filter(Boolean).forEach((link) => quickLinks.appendChild(link));
    if (quickLinks.childElementCount) identity.appendChild(quickLinks);

    profileTop.appendChild(identity);
    intro.appendChild(profileTop);
    shell.appendChild(intro);

    if (hasProfile && hasExtendedProfile(profile, location)) {
      const details = node('details', 'zen-about-profile-details');
      const summary = node('summary', 'zen-about-profile-summary');
      summary.appendChild(node('span', '', 'Más sobre el perfil'));
      details.appendChild(summary);

      const body = node('div', 'zen-about-profile-details-body');
      const defs = node('dl', 'zen-about-defs');
      appendDefinition(defs, 'Género', profile.gender);
      appendDefinition(defs, 'Sector / Industria', profile.industry);
      appendDefinition(defs, 'Ocupación', profile.occupation);
      appendDefinition(defs, 'Ubicación', location);
      if (profile.randomQuestion || profile.randomAnswer) {
        appendDefinition(defs, 'Pregunta aleatoria', [profile.randomQuestion, profile.randomAnswer].filter(Boolean).join(' — '));
      }
      appendListDefinition(defs, 'Intereses', profile.interests);
      appendListDefinition(defs, 'Películas favoritas', profile.favoriteMovies);
      appendListDefinition(defs, 'Música favorita', profile.favoriteMusic);
      appendListDefinition(defs, 'Libros favoritos', profile.favoriteBooks);
      if (defs.childElementCount) body.appendChild(defs);

      const legacyLinks = node('div', 'zen-about-links');
      [
        externalLink('Audio Clip ↗', profile.audioClipUrl, 'zen-about-link'),
        externalLink('Wishlist ↗', profile.wishlistUrl, 'zen-about-link')
      ].filter(Boolean).forEach((link) => legacyLinks.appendChild(link));
      if (legacyLinks.childElementCount) body.appendChild(legacyLinks);

      details.appendChild(body);
      shell.appendChild(details);
    }

    if (social.length) {
      const section = node('section', 'zen-about-section zen-about-social-section');
      const heading = node('div', 'zen-about-section-head');
      heading.appendChild(node('h2', '', 'Redes sociales'));
      section.appendChild(heading);

      const list = node('div', 'zen-about-social-list');
      social.forEach((item) => {
        const a = externalLink('', item.url, 'zen-about-social');
        if (!a) return;

        const icon = applySocialIcon(node('span', 'zen-about-social-icon'), item.platform);
        icon.setAttribute('aria-hidden', 'true');

        const copy = node('span', 'zen-about-social-copy');
        copy.appendChild(node('span', 'zen-about-social-name', item.label || SOCIAL_LABELS.get(item.platform) || 'Red social'));
        if (item.username) copy.appendChild(node('span', 'zen-about-social-user', item.username));

        const arrow = node('span', 'zen-about-social-arrow', '↗');
        arrow.setAttribute('aria-hidden', 'true');
        a.replaceChildren(icon, copy, arrow);
        list.appendChild(a);
      });
      section.appendChild(list);
      shell.appendChild(section);
    }

    if (resources.length) {
      const section = node('section', 'zen-about-section zen-about-resources-section');
      const heading = node('div', 'zen-about-section-head');
      heading.appendChild(node('h2', '', 'Recursos relacionados'));
      section.appendChild(heading);

      const list = node('div', 'zen-about-resource-list');
      resources.forEach((item) => {
        const a = externalLink('', item.url, 'zen-about-resource');
        if (!a) return;

        const copy = node('span', 'zen-about-resource-copy');
        const top = node('span', 'zen-about-resource-top');
        top.append(node('strong', '', item.title), node('span', 'zen-about-resource-type', RESOURCE_LABELS.get(item.type) || 'Recurso'));
        copy.appendChild(top);
        if (item.description) copy.appendChild(node('span', 'zen-about-resource-description', item.description));

        a.append(copy, node('span', 'zen-about-resource-arrow', '↗'));
        list.appendChild(a);
      });
      section.appendChild(list);
      shell.appendChild(section);
    }

    this.root.appendChild(shell);
  }

  destroy() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
