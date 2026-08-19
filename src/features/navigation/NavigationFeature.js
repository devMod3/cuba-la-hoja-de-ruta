function isPlainPrimaryClick(event) {
  return event.button === 0
    && !event.metaKey
    && !event.ctrlKey
    && !event.shiftKey
    && !event.altKey;
}

export class NavigationFeature {
  constructor({ root = document } = {}) {
    this.root = root;
    this.allowed = new Set(['zen-home', 'zen-explore', 'zen-about']);
    this.onHashChange = this.onHashChange.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }

  currentRoute() {
    const route = location.hash.replace(/^#/, '');
    return this.allowed.has(route) ? route : 'zen-home';
  }

  apply(route = this.currentRoute()) {
    this.root.querySelectorAll('[data-zen-view]').forEach((view) => {
      const active = view.id === route;
      view.hidden = !active;
      view.setAttribute('aria-hidden', active ? 'false' : 'true');
    });

    this.root.querySelectorAll('[data-zen-route]').forEach((link) => {
      const active = link.dataset.zenRoute === route;
      link.setAttribute('aria-current', active ? 'page' : 'false');
    });

    document.documentElement.dataset.zenRoute = route;
    document.dispatchEvent(new CustomEvent('zenroute:changed', { detail: { route } }));
  }

  onDocumentClick(event) {
    if (!isPlainPrimaryClick(event)) return;

    const link = event.target instanceof Element
      ? event.target.closest('a[data-zen-route]')
      : null;
    if (!link) return;

    const route = link.dataset.zenRoute;
    if (!this.allowed.has(route)) return;

    // Direct Blogger article documents must return to the homepage document.
    // SPA-opened articles keep the original homepage body class, so they stay
    // inside the current document and ArticleFeature restores the shell URL.
    if (route === 'zen-home' && document.body.classList.contains('item-view')) {
      event.preventDefault();
      location.assign('/#zen-home');
      return;
    }

    event.preventDefault();
    const nextHash = `#${route}`;
    if (location.hash === nextHash) this.apply(route);
    else location.hash = nextHash;
  }

  onHashChange() {
    const raw = location.hash.replace(/^#/, '');
    if (!this.allowed.has(raw)) return;
    this.apply(raw);
  }

  boot() {
    document.addEventListener('click', this.onDocumentClick);
    window.addEventListener('hashchange', this.onHashChange);
    this.apply();
  }

  destroy() {
    document.removeEventListener('click', this.onDocumentClick);
    window.removeEventListener('hashchange', this.onHashChange);
  }
}
