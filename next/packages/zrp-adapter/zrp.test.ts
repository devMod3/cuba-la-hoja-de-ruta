import { describe, expect, it } from 'vitest';
import { ZRP_OPEN_EVENT, ZRP_SCRIPT_URL, ZRP_VERSION } from './src/index';

describe('Zen Radio Player public integration contract', () => {
  it('pins the approved v1.0.4 loader and public open event', () => {
    expect(ZRP_VERSION).toBe('1.0.4');
    expect(ZRP_SCRIPT_URL).toBe(
      'https://devmod3.github.io/zen-radio-player/assets/zen-radio-player.js?v=1.0.4'
    );
    expect(ZRP_OPEN_EVENT).toBe('zen-radio-player:open');
  });
});
