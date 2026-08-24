import Link from 'next/link';
import { ZrpLauncher } from './zrp-launcher';

const routes = [
  { href: '/', label: 'Portada' },
  { href: '/explorar/', label: 'Explorar' },
  { href: '/acerca-de/', label: 'Acerca de' }
] as const;

export function GlobalHeader() {
  return (
    <header
      data-component="Global.Header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <div
        style={{
          minHeight: 64,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          width: 'min(1180px, calc(100% - 2rem))',
          margin: '0 auto'
        }}
      >
        <Link href="/" aria-label="Ir a la portada">
          La hoja de ruta
        </Link>
        <nav
          aria-label="Navegación principal"
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 16 }}
        >
          {routes.map((route) => (
            <Link key={route.href} href={route.href}>
              {route.label}
            </Link>
          ))}
          <ZrpLauncher />
        </nav>
      </div>
    </header>
  );
}
