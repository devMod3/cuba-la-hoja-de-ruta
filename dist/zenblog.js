import { createZenBlog } from '../src/bootstrap/createZenBlog.js?v=0.9.2';

function normalizeAdminSegment(value = '') {
  return String(value).replace(/\\/g, '/').replace(/\/+$/, '');
}

function isAdminLocation({ pathname = location.pathname, hash = location.hash } = {}) {
  const path = normalizeAdminSegment(pathname) || '/';
  const hashPath = normalizeAdminSegment(String(hash).replace(/^#/, ''));
  return path === '/p/admin.html'
    || path === '/admin'
    || path.endsWith('/admin')
    || hashPath === 'admin'
    || hashPath.endsWith('/admin');
}

const app = createZenBlog();

function bootPublicApp() {
  if (isAdminLocation()) return;
  app.boot();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootPublicApp, { once: true });
} else {
  bootPublicApp();
}
