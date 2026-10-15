import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const offlineShell: Plugin = {
  name: 'tripzobox-offline-shell',
  generateBundle(_options, bundle) {
    const files = ['/index.html', '/', '/logo-horizontal.png', '/logo-icon.png', ...Object.keys(bundle).filter((name) => /\.(js|css|woff2?|png|svg|webp)$/.test(name)).map((name) => '/' + name)];
    const cacheName = 'tripzobox-shell-' + Object.keys(bundle).filter((name) => name.endsWith('.js')).join('-');
    this.emitFile({ type: 'asset', fileName: 'sw.js', source: `
const CACHE = ${JSON.stringify(cacheName)};
const FILES = ${JSON.stringify(files)};
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('tripzobox-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html').then(response => response || new Response('Open Tripzobox online once to enable offline access.', {status: 503}))));
  } else if (FILES.includes(url.pathname)) {
    event.respondWith(caches.match(request, {ignoreSearch: true}).then(response => response || fetch(request)));
  }
});
` });
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), offlineShell],
  server: {
    port: 5173,
    host: true
  }
})
