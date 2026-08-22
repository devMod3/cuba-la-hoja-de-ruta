import { createZenBlog } from '../src/bootstrap/createZenBlog.js?v=0.9.2';

const app = createZenBlog();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.boot(), { once: true });
} else {
  app.boot();
}
