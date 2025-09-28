
// Minimal service worker stub — VitePWA will generate a production-ready worker when building with the plugin.
// This file is intentionally minimal for local development.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  clients.claim();
});
self.addEventListener('fetch', (event) => {
  // Let the network handle requests; the VitePWA plugin will populate precaches in production builds.
});
