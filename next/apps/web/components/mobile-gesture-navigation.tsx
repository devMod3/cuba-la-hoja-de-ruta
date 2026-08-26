'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { classifyMobileSwipe, routeAfterMobileSwipe } from '../adapters/mobile-gesture';

const MOBILE_GESTURE_MEDIA = '(max-width: 900px) and (pointer: coarse)';
const INTERACTIVE_TARGETS = [
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable="true"]',
  '#zen-radio-slot',
  '#zen-radio-player',
  '[data-zrp-root]',
  '[data-zen-zrp]',
  '[data-zen-zrp-ready]',
  '.zen-zrp-sticky',
  '.zen-zrp-floating-launcher',
  '.zen-zrp-iframe',
  '.zen-zrp-embedded',
  '[data-zen-article]',
  '[data-zen-results-scroll]',
  '[data-zen-no-swipe]'
].join(',');

interface ActivePointer {
  readonly id: number;
  readonly x: number;
  readonly y: number;
  readonly startedAt: number;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_TARGETS) !== null;
}

export function MobileGestureNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const activePointer = useRef<ActivePointer | null>(null);

  useEffect(() => {
    const media = globalThis.matchMedia(MOBILE_GESTURE_MEDIA);
    const root = document.documentElement;

    const updateCapability = () => {
      root.dataset.zenGestures = media.matches ? 'on' : 'off';
      if (!media.matches) activePointer.current = null;
    };

    const supportsCurrentRoute =
      routeAfterMobileSwipe(pathname, 'next') !== null ||
      routeAfterMobileSwipe(pathname, 'previous') !== null;

    const onPointerDown = (event: PointerEvent) => {
      if (!supportsCurrentRoute || !media.matches) return;
      if (!event.isPrimary || event.pointerType !== 'touch') return;
      if (isInteractiveTarget(event.target)) return;

      activePointer.current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startedAt: event.timeStamp
      };
    };

    const onPointerUp = (event: PointerEvent) => {
      const start = activePointer.current;
      activePointer.current = null;
      if (!start || start.id !== event.pointerId || !media.matches) return;

      const direction = classifyMobileSwipe({
        startX: start.x,
        startY: start.y,
        endX: event.clientX,
        endY: event.clientY,
        startedAt: start.startedAt,
        endedAt: event.timeStamp,
        viewportWidth: globalThis.innerWidth
      });
      if (!direction) return;

      const destination = routeAfterMobileSwipe(pathname, direction);
      if (destination) router.push(destination);
    };

    const onPointerCancel = () => {
      activePointer.current = null;
    };

    updateCapability();
    media.addEventListener('change', updateCapability);
    globalThis.addEventListener('pointerdown', onPointerDown, { passive: true });
    globalThis.addEventListener('pointerup', onPointerUp, { passive: true });
    globalThis.addEventListener('pointercancel', onPointerCancel, { passive: true });

    return () => {
      media.removeEventListener('change', updateCapability);
      globalThis.removeEventListener('pointerdown', onPointerDown);
      globalThis.removeEventListener('pointerup', onPointerUp);
      globalThis.removeEventListener('pointercancel', onPointerCancel);
      delete root.dataset.zenGestures;
      activePointer.current = null;
    };
  }, [pathname, router]);

  return null;
}
