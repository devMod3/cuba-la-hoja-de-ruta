import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZenBlog Admin',
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function AdminPage() {
  return (
    <main data-component="Admin" aria-busy="true">
      <h1>ZenBlog Admin</h1>
      <p className="muted" role="status" aria-live="polite">
        Cargando herramientas de administración…
      </p>
    </main>
  );
}
