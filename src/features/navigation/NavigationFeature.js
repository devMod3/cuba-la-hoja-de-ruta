export class NavigationFeature {
  constructor({ root = document } = {}) {
    this.root = root;
    this.allowed = new Set(['zen-home', 'zen-explore', 'zen-about']);
    this.onHashChange = this.onHashChange.bind(this);
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

  onHashChange() {
    const raw = location.hash.replace(/^#/, '');
    if (!this.allowed.has(raw)) return;
    this.apply(raw);
  }

  boot() {
    window.addEventListener('hashchange', this.onHashChange);
    this.apply();
  }

  destroy() {
    window.removeEventListener('hashchange', this.onHashChange);
  }
}
