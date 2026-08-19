import { createZenBlog } from '../src/bootstrap/createZenBlog.js?v=0.3.3';

const app = createZenBlog();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.boot(), { once: true });
} else {
  app.boot();
}
