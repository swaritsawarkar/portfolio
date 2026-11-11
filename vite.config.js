import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'page-routes',
    configureServer: (server) => mountPageRoutes(server),
    configurePreviewServer: (server) => mountPageRoutes(server),
  }],
  build: {
    rolldownOptions: {
      input: {
        portfolio: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
        journal: fileURLToPath(new URL('./journal/index.html', import.meta.url)),
        journalArticle: fileURLToPath(new URL('./journal/ai-web-design-skills/index.html', import.meta.url)),
      },
    },
  },
});

function mountPageRoutes(server) {
  server.middlewares.use((request, _response, next) => {
    if (/^\/admin\/stats\/?(?:\?|$)/.test(request.url)) request.url = '/admin/index.html';
    request.url = request.url.replace(/^(\/journal(?:\/ai-web-design-skills)?)\/?(?=\?|$)/, '$1/index.html');
    next();
  });
}
