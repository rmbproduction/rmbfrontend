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

// Check if a URL is an API URL (works with any domain)
function isApiUrl(url) {
  return url.pathname.includes('/api/');
}

// Check if a URL is an image
function isImageUrl(url) {
  return url.pathname.match(/\.(jpe?g|png|gif|webp|avif|svg)$/i);
}

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  try {
    const url = new URL(event.request.url);
    
    // Handle API requests - using the path pattern instead of hardcoded origins
    if (isApiUrl(url)) {
      event.respondWith(
        caches.open(API_CACHE).then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request, { credentials: 'include' })
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(error => {
                console.warn(`Failed to fetch ${url.pathname}:`, error);
                // Return cached response or throw the error
                return cachedResponse || Promise.reject(error);
              });
              
            // Use cached response if available, otherwise try network
            return cachedResponse || fetchPromise;
          });
        }).catch(error => {
          console.error('Cache error:', error);
          // Fall back to network
          return fetch(event.request, { credentials: 'include' })
            .catch(err => {
              console.error('Network fetch also failed:', err);
              // If both cache and network fail, show a meaningful error
              return new Response(
                JSON.stringify({ error: 'Network and cache fetch failed' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              );
            });
        })
      );
      return;
    }

    // Handle image requests
    if (isImageUrl(url)) {
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
                // Return a placeholder image or error response
                return new Response(
                  'Image not available',
                  { status: 404, headers: { 'Content-Type': 'text/plain' } }
                );
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
  } catch (error) {
    console.error('Service worker error:', error);
    // Fall back to network for any errors in our service worker logic
    event.respondWith(fetch(event.request));
  }
}); 