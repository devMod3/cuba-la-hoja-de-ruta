import { expect, test, type Page } from '@playwright/test';

const gestureMedia = '(max-width: 900px) and (pointer: coarse)';

async function enableDeterministicTouchMedia(page: Page) {
  await page.addInitScript((query) => {
    const original = globalThis.matchMedia.bind(globalThis);
    globalThis.matchMedia = (media) => {
      if (media !== query) return original(media);
      return {
        matches: true,
        media,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true
      };
    };
  }, gestureMedia);
  await page.setViewportSize({ width: 390, height: 844 });
}

async function swipe(page: Page, selector: string, startX: number, endX: number) {
  await page.locator(selector).evaluate(
    (target, coordinates) => {
      const common = {
        bubbles: true,
        cancelable: true,
        pointerId: 41,
        pointerType: 'touch',
        isPrimary: true,
        clientY: 300
      };
      target.dispatchEvent(
        new PointerEvent('pointerdown', { ...common, clientX: coordinates.startX })
      );
      target.dispatchEvent(new PointerEvent('pointerup', { ...common, clientX: coordinates.endX }));
    },
    { startX, endX }
  );
}

test.beforeEach(async ({ page }) => {
  await enableDeterministicTouchMedia(page);
});

test('mobile swipe follows the approved first-level route order without wrapping', async ({
  page
}) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-zen-gestures', 'on');

  await swipe(page, 'main', 300, 180);
  await expect(page).toHaveURL(/\/explorar\/$/);

  await swipe(page, 'main', 300, 180);
  await expect(page).toHaveURL(/\/acerca-de\/$/);

  await swipe(page, 'main', 100, 220);
  await expect(page).toHaveURL(/\/explorar\/$/);
});

test('mobile swipe ignores interactive surfaces and article routes', async ({ page }) => {
  await page.goto('/');
  await swipe(page, 'a[aria-label="Ir a la portada"]', 300, 180);
  await expect(page).toHaveURL(/\/$/);

  await page.goto('/articulo/1102067444728853158/');
  await swipe(page, 'main', 300, 180);
  await expect(page).toHaveURL(/\/articulo\/1102067444728853158\/$/);
});
