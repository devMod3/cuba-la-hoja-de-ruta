export const MOBILE_GESTURE_EDGE_GUARD_PX = 24;
export const MOBILE_GESTURE_THRESHOLD_PX = 72;
export const MOBILE_GESTURE_DOMINANCE_RATIO = 1.35;
export const MOBILE_GESTURE_MAX_DURATION_MS = 900;

export type GestureDirection = 'next' | 'previous';

export interface GestureSample {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly viewportWidth: number;
}

const gestureRoutes = ['/', '/explorar/', '/acerca-de/'] as const;

function normalizePathname(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function classifyMobileSwipe(sample: GestureSample): GestureDirection | null {
  if (sample.viewportWidth <= MOBILE_GESTURE_EDGE_GUARD_PX * 2) return null;
  if (sample.startX <= MOBILE_GESTURE_EDGE_GUARD_PX) return null;
  if (sample.startX >= sample.viewportWidth - MOBILE_GESTURE_EDGE_GUARD_PX) return null;

  const duration = sample.endedAt - sample.startedAt;
  if (duration < 0 || duration > MOBILE_GESTURE_MAX_DURATION_MS) return null;

  const deltaX = sample.endX - sample.startX;
  const deltaY = sample.endY - sample.startY;
  const horizontalDistance = Math.abs(deltaX);
  const verticalDistance = Math.abs(deltaY);

  if (horizontalDistance < MOBILE_GESTURE_THRESHOLD_PX) return null;
  if (horizontalDistance < verticalDistance * MOBILE_GESTURE_DOMINANCE_RATIO) return null;

  return deltaX < 0 ? 'next' : 'previous';
}

export function routeAfterMobileSwipe(
  pathname: string,
  direction: GestureDirection
): string | null {
  const normalized = normalizePathname(pathname);
  const currentIndex = gestureRoutes.findIndex((route) => route === normalized);
  if (currentIndex < 0) return null;

  const targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
  return gestureRoutes[targetIndex] ?? null;
}
