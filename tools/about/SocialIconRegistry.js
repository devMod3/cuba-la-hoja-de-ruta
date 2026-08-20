const ICON_FILES = Object.freeze({
  x: 'x.svg',
  github: 'github.svg',
  youtube: 'youtube.svg',
  telegram: 'telegram.svg',
  linkedin: 'linkedin.svg',
  instagram: 'instagram.svg',
  facebook: 'facebook.svg',
  bluesky: 'bluesky.svg',
  mastodon: 'mastodon.svg',
  other: 'other.svg'
});

export function socialIconUrl(platform = 'other') {
  const file = ICON_FILES[platform] || ICON_FILES.other;
  return new URL(`./icons/${file}`, import.meta.url).href;
}

export function applySocialIcon(element, platform = 'other') {
  if (!element) return element;
  const url = socialIconUrl(platform);
  element.dataset.platform = platform in ICON_FILES ? platform : 'other';
  element.style.setProperty('--zen-social-icon', `url("${url}")`);
  return element;
}

export function supportedSocialIcons() {
  return Object.keys(ICON_FILES);
}
