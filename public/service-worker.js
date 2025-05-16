// Cache names
const STATIC_CACHE = 'rmb-static-v3';
const API_CACHE = 'rmb-api-v3';
const IMAGE_CACHE = 'rmb-images-v3';
const FONT_CACHE = 'rmb-fonts-v1';

// Static assets to cache - only include essential files
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html'
];

// API retry configuration
const API_RETRY_CONFIG = {
  MAX_RETRIES: 2,
  INITIAL_BACKOFF_MS: 1000,
  MAX_BACKOFF_MS: 5000
};

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
          if (![STATIC_CACHE, API_CACHE, IMAGE_CACHE, FONT_CACHE].includes(cacheName)) {
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

// Check if a URL is a font file
function isFontUrl(url) {
  return url.pathname.match(/\.(woff2?|ttf|otf|eot)$/i) || 
         url.hostname.includes('fonts.gstatic.com') || 
         url.hostname.includes('fonts.googleapis.com');
}

// Check if request is a cross-origin request (for special handling)
function isCrossOrigin(url) {
  return url.origin !== self.location.origin;
}

// Check if the URL is for a page (HTML) rather than an asset
function isPageRequest(url, request) {
  // Check if the request accepts HTML
  const acceptHeader = request.headers.get('Accept');
  const wantsHTML = acceptHeader && acceptHeader.includes('text/html');
  
  // Check for page-like paths (no extension or .html)
  const isHTMLPath = url.pathname.endsWith('/') || 
                    url.pathname.endsWith('.html') || 
                    !url.pathname.includes('.');
                    
  return wantsHTML || isHTMLPath;
}

// Retry function with exponential backoff
async function retryFetch(request, retries = API_RETRY_CONFIG.MAX_RETRIES, backoff = API_RETRY_CONFIG.INITIAL_BACKOFF_MS) {
  try {
    // Try the fetch
    return await fetch(request.clone(), { credentials: 'include' });
  } catch (error) {
    // If we have retries left, wait and try again
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      
      // Increase backoff for next retry, but cap it
      const nextBackoff = Math.min(backoff * 2, API_RETRY_CONFIG.MAX_BACKOFF_MS);
      
      console.log(`Retrying fetch for ${request.url}, ${retries} attempts left`);
      return retryFetch(request, retries - 1, nextBackoff);
    }
    
    // If we're out of retries, throw the original error
    throw error;
  }
}

// Fetch API with better error handling and retries
async function fetchApi(request, cache) {
  // Start with cached response
  const cachedResponse = await cache.match(request);
  
  try {
    // Try to get from network with retries
    const networkResponse = await retryFetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    } else {
      console.warn(`API returned error status: ${networkResponse.status}`);
      // Return the cached response if we have one, otherwise return the error response
      return cachedResponse || networkResponse;
    }
  } catch (error) {
    console.warn(`Failed to fetch API ${request.url} after retries:`, error);
    
    // Use cached response if available
    if (cachedResponse) {
      console.log(`Using cached response for ${request.url}`);
      return cachedResponse;
    }
    
    // If no cached response, return a friendly error
    return new Response(
      JSON.stringify({ 
        error: 'Unable to reach the server',
        message: 'Please check your internet connection and try again'
      }),
      { 
        status: 503, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Handle font requests with cache-first strategy
async function handleFontRequest(request, cache) {
  try {
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const response = await fetch(request, { 
      mode: 'cors',
      credentials: 'omit' // Important for cross-origin font requests
    });
    
    if (response.ok) {
      await cache.put(request, response.clone());
      return response;
    }
    
    // If response is not OK, return the response anyway
    return response;
  } catch (error) {
    console.error(`Error fetching font: ${request.url}`, error);
    // For font errors, we should pass through to browser's default handling
    // rather than providing our own response
    throw error;
  }
}

// Get the offline page
async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE);
  return await cache.match('/offline.html') || new Response(
    'You are offline. Please check your connection.',
    { headers: { 'Content-Type': 'text/html' } }
  );
}

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  try {
    const url = new URL(event.request.url);
    
    // Pass through requests to Google Fonts CSS (we'll cache the font files themselves)
    if (url.hostname.includes('fonts.googleapis.com')) {
      // Don't try to cache or manipulate the Google Fonts CSS requests
      return;
    }
    
    // Handle font files specially
    if (isFontUrl(url)) {
      event.respondWith(
        caches.open(FONT_CACHE)
          .then(cache => handleFontRequest(event.request, cache))
          .catch(() => fetch(event.request))
      );
      return;
    }
    
    // Handle API requests - using the path pattern instead of hardcoded origins
    if (isApiUrl(url)) {
      event.respondWith(
        caches.open(API_CACHE)
          .then(cache => fetchApi(event.request, cache))
          .catch(error => {
            console.error('API handler error:', error);
            // Last resort fallback
            return fetch(event.request, { credentials: 'include' })
              .catch(() => {
                return new Response(
                  JSON.stringify({ error: 'Network error' }),
                  { status: 503, headers: { 'Content-Type': 'application/json' } }
                );
              });
          })
      );
      return;
    }

    // Handle image requests with cache-first strategy
    if (isImageUrl(url)) {
      event.respondWith(
        caches.open(IMAGE_CACHE).then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              // If we have a cached version, use it but also update cache in background
              fetch(event.request)
                .then(networkResponse => {
                  if (networkResponse.ok) {
                    cache.put(event.request, networkResponse);
                  }
                })
                .catch(err => console.warn('Background image fetch failed:', err));
                
              return cachedResponse;
            }
            
            // If not in cache, try network
            return fetch(event.request)
              .then((networkResponse) => {
                if (networkResponse.ok) {
                  cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              })
              .catch(error => {
                console.warn(`Failed to fetch image ${url.pathname}:`, error);
                // Return a placeholder image if configured
                const placeholderUrl = '/assets/placeholder.jpg';
                return caches.match(placeholderUrl)
                  .then(placeholderResponse => {
                    return placeholderResponse || new Response(
                      'Image not available',
                      { status: 404, headers: { 'Content-Type': 'text/plain' } }
                    );
                  });
              });
          });
        }).catch(error => {
          console.error('Image cache error:', error);
          return fetch(event.request);
        })
      );
      return;
    }

    // Handle page requests with network-first but offline fallback
    if (isPageRequest(url, event.request)) {
      event.respondWith(
        fetch(event.request)
          .catch(async () => {
            console.log('Page fetch failed, falling back to cache or offline page');
            // Try to get from cache
            const cache = await caches.open(STATIC_CACHE);
            const cachedResponse = await cache.match(event.request);
            
            // Return cached version or fallback to offline page
            return cachedResponse || getOfflinePage();
          })
      );
      return;
    }
    
    // Special handling for cross-origin requests - pass through without interference
    if (isCrossOrigin(url)) {
      // Don't intercept cross-origin requests by default
      return;
    }

    // Handle other requests with network-first strategy
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } catch (error) {
    console.error('Service worker error:', error);
    // Fall back to network for any errors in our service worker logic
    event.respondWith(fetch(event.request));
  }
});

// Message handler for communication with the main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  // Make sure we have a port to respond to
  if (!event.ports || !event.ports[0]) {
    console.warn('[SW] No port to respond to message');
    return;
  }
  
  const port = event.ports[0];
  const data = event.data || {};
  const action = data.action || '';
  
  // Handle different message types
  switch(action) {
    case 'clearCache':
      // Clear a specific cache or all caches
      handleClearCache(data.cacheName)
        .then(result => {
          port.postMessage({ success: true, result });
        })
        .catch(error => {
          console.error('[SW] Error clearing cache:', error);
          port.postMessage({ 
            success: false, 
            error: error.message || 'Failed to clear cache' 
          });
        });
      break;
      
    case 'networkTest':
      // Perform a network test to the specified URL
      handleNetworkTest(data.url || 'https://repairmybike.up.railway.app/api/health/')
        .then(result => {
          port.postMessage({ success: true, result });
        })
        .catch(error => {
          port.postMessage({ 
            success: false, 
            error: error.message || 'Network test failed',
            isOffline: true
          });
        });
      break;
      
    case 'cacheSize':
      // Get the size of the cache
      getCacheSize()
        .then(sizes => {
          port.postMessage({ success: true, sizes });
        })
        .catch(error => {
          port.postMessage({ 
            success: false, 
            error: error.message || 'Failed to get cache size' 
          });
        });
      break;
      
    case 'ping':
      // Simple ping to check if service worker is responding
      port.postMessage({ success: true, message: 'pong' });
      break;
      
    default:
      // Unknown action
      port.postMessage({ 
        success: false, 
        error: `Unknown action: ${action}` 
      });
  }
});

// Clear one or all caches
async function handleClearCache(cacheName) {
  if (cacheName) {
    // Clear specific cache
    await caches.delete(cacheName);
    return { message: `Cache ${cacheName} cleared` };
  } else {
    // Clear all caches
    const allCaches = await caches.keys();
    await Promise.all(allCaches.map(name => caches.delete(name)));
    return { message: `All ${allCaches.length} caches cleared` };
  }
}

// Perform a network test
async function handleNetworkTest(url) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    return { 
      online: true,
      responseTime,
      status: response.status
    };
  } catch (error) {
    console.error('[SW] Network test failed:', error);
    return {
      online: false,
      error: error.message || 'Network error',
      responseTime: Date.now() - startTime
    };
  }
}

// Get the size of all caches
async function getCacheSize() {
  const sizes = {};
  const allCaches = await caches.keys();
  
  for (const cacheName of allCaches) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    sizes[cacheName] = keys.length;
  }
  
  return {
    caches: sizes,
    total: Object.values(sizes).reduce((sum, size) => sum + size, 0)
  };
} 