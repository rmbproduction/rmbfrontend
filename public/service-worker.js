// Cache names
const STATIC_CACHE = 'rmb-static-v1';
const API_CACHE = 'rmb-api-v1';
const IMAGE_CACHE = 'rmb-images-v1';

// Static assets to cache - only include essential files
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Use a more reliable approach to cache static assets
      // Instead of addAll (which fails if any single resource fails),
      // we'll try to cache each resource individually
      return Promise.allSettled(
        STATIC_ASSETS.map(url => 
          cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![STATIC_CACHE, API_CACHE, IMAGE_CACHE].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(error => {
              console.warn(`Failed to fetch ${url.pathname}:`, error);
              throw error;
            });
          return cachedResponse || fetchPromise;
        });
      }).catch(error => {
        console.error('Cache error:', error);
        return fetch(event.request);
      })
    );
    return;
  }

  // Handle image requests
  if (url.pathname.match(/\.(jpe?g|png|gif|webp|avif|svg)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(error => {
              console.warn(`Failed to fetch image ${url.pathname}:`, error);
              throw error;
            });
        });
      }).catch(error => {
        console.error('Image cache error:', error);
        return fetch(event.request);
      })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
}); 