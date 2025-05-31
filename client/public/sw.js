// Service Worker to handle cache invalidation
const CACHE_NAME = 'tailtrack-v1.2.0';
const urlsToCache = [];

self.addEventListener('install', function(event) {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // Don't cache, always fetch from network
  event.respondWith(
    fetch(event.request).catch(function() {
      // Only return cached version if network fails
      return caches.match(event.request);
    })
  );
});