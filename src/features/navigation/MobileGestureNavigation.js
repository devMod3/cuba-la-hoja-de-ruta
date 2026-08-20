const ROUTES = Object.freeze(['zen-home', 'zen-explore', 'zen-about']);
const INTERACTIVE_SELECTOR = [
  'a', 'button', 'input', 'select', 'textarea', 'summary', '[contenteditable="true"]',
  '#zen-radio-player', '#zen-article', '.zen-results-scroll', '[data-zen-no-swipe]'
].join(',');

function coarseMobile() {
  return globalThis.matchMedia?.('(max-width: 900px) and (pointer: coarse)').matches ?? false;
}

export class MobileGestureNavigation {
  constructor({ root = document, navigation, threshold = 72, edgeGuard = 24 } = {}) {
    this.root = root;
    this.navigation = navigation;
    this.threshold = threshold;
    this.edgeGuard = edgeGuard;
    this.start = null;
    this.enabled = false;
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerCancel = this.onPointerCancel.bind(this);
  }

  canStart(event) {
    if (!this.enabled || event.pointerType !== 'touch' || event.isPrimary === false) return false;
    if (document.body.classList.contains('item-view')) return false;
    if (event.clientX <= this.edgeGuard || event.clientX >= innerWidth - this.edgeGuard) return false;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest(INTERACTIVE_SELECTOR)) return false;
    return ROUTES.includes(this.navigation?.currentRoute?.());
  }

  onPointerDown(event) {
    if (!this.canStart(event)) return;
    this.start = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() };
  }

  onPointerUp(event) {
    const start = this.start;
    this.start = null;
    if (!start || start.id !== event.pointerId) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const elapsed = performance.now() - start.at;
    const horizontal = Math.abs(dx) >= this.threshold && Math.abs(dx) > Math.abs(dy) * 1.35;
    if (!horizontal || elapsed > 900) return;

    const current = this.navigation.currentRoute();
    const index = ROUTES.indexOf(current);
    const nextIndex = dx < 0 ? index + 1 : index - 1;
    const next = ROUTES[nextIndex];
    if (!next) return;

    const hash = `#${next}`;
    if (location.hash === hash) this.navigation.apply(next);
    else location.hash = hash;
  }

  onPointerCancel() { this.start = null; }

  boot() {
    if (this.enabled || !coarseMobile()) return this;
    this.enabled = true;
    this.root.addEventListener('pointerdown', this.onPointerDown, { passive: true, capture: true });
    this.root.addEventListener('pointerup', this.onPointerUp, { passive: true, capture: true });
    this.root.addEventListener('pointercancel', this.onPointerCancel, { passive: true, capture: true });
    document.documentElement.dataset.zenGestures = 'on';
    return this;
  }

  destroy() {
    if (!this.enabled) return;
    this.enabled = false;
    this.start = null;
    this.root.removeEventListener('pointerdown', this.onPointerDown, true);
    this.root.removeEventListener('pointerup', this.onPointerUp, true);
    this.root.removeEventListener('pointercancel', this.onPointerCancel, true);
    delete document.documentElement.dataset.zenGestures;
  }
}
