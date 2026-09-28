const CACHE_NAME = 'tallyflow-cache-v4';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => {
        if (self.location.hostname === 'localhost' || self.location.hostname.includes('run.app')) {
          return self.registration.unregister();
        }
      })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // In development, preview, or for active scripts/modules/APIs: always go directly to network
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('.vite') ||
    url.pathname.startsWith('/api/') ||
    url.hostname === 'localhost' ||
    url.hostname.includes('run.app') ||
    event.request.method !== 'GET'
  ) {
    return; // Let browser handle naturally
  }
});
