import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'admin-stats-route',
    configureServer: (server) => mountStatsRoute(server),
    configurePreviewServer: (server) => mountStatsRoute(server),
  }],
  build: {
    rolldownOptions: {
      input: {
        portfolio: fileURLToPath(new URL('./index.html', import.meta.url)),
        admin: fileURLToPath(new URL('./admin/index.html', import.meta.url)),
      },
    },
  },
});

function mountStatsRoute(server) {
  server.middlewares.use((request, _response, next) => {
    if (/^\/admin\/stats\/?(?:\?|$)/.test(request.url)) request.url = '/admin/index.html';
    next();
  });
}
