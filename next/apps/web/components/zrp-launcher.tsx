'use client';

import { ZRP_OPEN_EVENT } from '@zenblog/zrp-adapter';

interface ZrpLauncherProps {
  readonly onOpen?: () => void;
}

export function ZrpLauncher({ onOpen }: ZrpLauncherProps = {}) {
  return (
    <button
      type="button"
      data-component="ZRP.Launcher"
      onClick={() => {
        onOpen?.();
        window.dispatchEvent(new CustomEvent(ZRP_OPEN_EVENT));
      }}
      style={{
        appearance: 'none',
        border: 0,
        padding: 0,
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
        cursor: 'pointer'
      }}
    >
      Reproductor
    </button>
  );
}
