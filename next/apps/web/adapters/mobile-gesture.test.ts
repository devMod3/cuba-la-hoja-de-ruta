import { describe, expect, it } from 'vitest';
import {
  MOBILE_GESTURE_EDGE_GUARD_PX,
  classifyMobileSwipe,
  routeAfterMobileSwipe,
  type GestureSample
} from './mobile-gesture';

function gesture(overrides: Partial<GestureSample> = {}): GestureSample {
  return {
    startX: 300,
    startY: 200,
    endX: 200,
    endY: 210,
    startedAt: 100,
    endedAt: 300,
    viewportWidth: 390,
    ...overrides
  };
}

describe('classifyMobileSwipe', () => {
  it('classifies horizontally dominant swipes in both directions', () => {
    expect(classifyMobileSwipe(gesture())).toBe('next');
    expect(classifyMobileSwipe(gesture({ startX: 100, endX: 200 }))).toBe('previous');
  });

  it.each([
    gesture({ viewportWidth: MOBILE_GESTURE_EDGE_GUARD_PX * 2 }),
    gesture({ startX: MOBILE_GESTURE_EDGE_GUARD_PX }),
    gesture({ startX: 390 - MOBILE_GESTURE_EDGE_GUARD_PX }),
    gesture({ endedAt: 99 }),
    gesture({ endedAt: 1001 }),
    gesture({ endX: 240 }),
    gesture({ endX: 200, endY: 300 })
  ])('rejects unsafe or ambiguous gesture %#', (sample) => {
    expect(classifyMobileSwipe(sample)).toBeNull();
  });
});

describe('routeAfterMobileSwipe', () => {
  it('moves through the approved first-level route order without wrapping', () => {
    expect(routeAfterMobileSwipe('/', 'next')).toBe('/explorar/');
    expect(routeAfterMobileSwipe('/explorar', 'next')).toBe('/acerca-de/');
    expect(routeAfterMobileSwipe('/acerca-de/', 'previous')).toBe('/explorar/');
    expect(routeAfterMobileSwipe('/', 'previous')).toBeNull();
    expect(routeAfterMobileSwipe('/acerca-de/', 'next')).toBeNull();
  });

  it('does not gesture-navigate article or unknown routes', () => {
    expect(routeAfterMobileSwipe('/articulo/42/', 'next')).toBeNull();
    expect(routeAfterMobileSwipe('/otra-ruta/', 'previous')).toBeNull();
  });
});
