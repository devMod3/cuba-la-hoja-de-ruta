'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ZrpLauncher } from './zrp-launcher';

const primaryRoutes = [
  { href: '/', label: 'Portada' },
  { href: '/explorar/', label: 'Explorar' }
] as const;

const aboutRoute = { href: '/acerca-de/', label: 'Acerca de' } as const;

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
          {primaryRoutes.map((route) => (
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
            href={aboutRoute.href}
            aria-current={routeIsActive(pathname, aboutRoute.href) ? 'page' : undefined}
          >
            {aboutRoute.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
