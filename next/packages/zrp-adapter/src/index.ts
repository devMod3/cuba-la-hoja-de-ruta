export const ZRP_VERSION = '1.0.4' as const;
export const ZRP_SCRIPT_URL =
  `https://devmod3.github.io/zen-radio-player/assets/zen-radio-player.js?v=${ZRP_VERSION}` as const;
export const ZRP_OPEN_EVENT = 'zen-radio-player:open' as const;

export type ZenRadioPlayerVersion = typeof ZRP_VERSION;
