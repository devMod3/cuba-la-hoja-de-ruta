import { createZenBlog } from '../src/bootstrap/createZenBlog.js';

const app = createZenBlog();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.boot(), { once: true });
} else {
  app.boot();
}
