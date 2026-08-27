'use client';

import { useEffect } from 'react';

interface AdminRuntimeLoaderProps {
  readonly src: string;
}

export function AdminRuntimeLoader({ src }: AdminRuntimeLoaderProps) {
  useEffect(() => {
    const id = 'zen-admin-route-runtime';
    if (document.getElementById(id)) return;

    const script = document.createElement('script');
    script.id = id;
    script.type = 'module';
    script.src = src;
    document.body.appendChild(script);
  }, [src]);

  return null;
}
