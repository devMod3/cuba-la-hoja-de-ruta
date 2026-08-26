'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ZrpLauncher } from './zrp-launcher';

const routes = [
  { href: '/', label: 'Portada' },
  { href: '/explorar/', label: 'Explorar' },
  { href: '/acerca-de/', label: 'Acerca de' }
] as const;

function routeIsActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href);
}

export function GlobalHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="site-header" data-component="Global.Header">
      <div className="site-header-inner">
        <Link className="brand" href="/" aria-label="Ir a la portada">
          <span className="brand-mark" aria-hidden="true">
            HR
          </span>
          <span className="brand-copy">
            <strong>La hoja de ruta</strong>
            <small>Soberanía · Constitución · Estado</small>
          </span>
        </Link>

        <button
          className="nav-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="visually-hidden">{menuOpen ? 'Cerrar navegación' : 'Abrir navegación'}</span>
          <span aria-hidden="true">{menuOpen ? '×' : 'Menú'}</span>
        </button>

        <nav
          id="primary-navigation"
          className="primary-nav"
          data-open={menuOpen ? 'true' : 'false'}
          aria-label="Navegación principal"
        >
          {routes.slice(0, 2).map((route) => (
            <Link
              key={route.href}
              href={route.href}
              aria-current={routeIsActive(pathname, route.href) ? 'page' : undefined}
            >
              {route.label}
            </Link>
          ))}
          <ZrpLauncher />
          <Link
            href={routes[2].href}
            aria-current={routeIsActive(pathname, routes[2].href) ? 'page' : undefined}
          >
            {routes[2].label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
