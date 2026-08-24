'use client';

import { useEffect } from 'react';
import { ZRP_SCRIPT_URL } from '@zenblog/zrp-adapter';

const ZRP_LOADER_SELECTOR = 'script[data-component="ZRP.Loader"]';

export function ZrpLoader() {
  useEffect(() => {
    if (document.querySelector(ZRP_LOADER_SELECTOR)) return;

    const script = document.createElement('script');
    script.type = 'module';
    script.src = ZRP_SCRIPT_URL;
    script.setAttribute('data-component', 'ZRP.Loader');
    document.body.append(script);
  }, []);

  return null;
}
