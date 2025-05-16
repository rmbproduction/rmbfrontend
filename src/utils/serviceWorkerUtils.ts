/**
 * Service Worker utilities for registration and offline state management
 */

// Interface for registration options
interface ServiceWorkerOptions {
  scope?: string;
  immediate?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

// Service worker registration
export const registerServiceWorker = (options: ServiceWorkerOptions = {}) => {
  // Default options
  const {
    scope = '/',
    immediate = false,
    onSuccess = () => console.log('[SW] Service worker registered successfully'),
    onError = (error) => console.error('[SW] Service worker registration failed:', error),
    onOffline = () => console.log('[SW] App is now offline'),
    onOnline = () => console.log('[SW] App is now online')
  } = options;

  // Only register if service workers are supported
  if ('serviceWorker' in navigator) {
    const registerSW = () => {
      navigator.serviceWorker.register('/service-worker.js', { scope })
        .then(registration => {
          console.log('[SW] ServiceWorker registered with scope:', registration.scope);
          
          // Setup update check every hour
          setInterval(() => {
            registration.update().catch(err => 
              console.warn('[SW] Update check failed:', err)
            );
          }, 60 * 60 * 1000);
          
          onSuccess();
        })
        .catch(error => {
          console.error('[SW] ServiceWorker registration failed:', error);
          onError(error);
        });
    };

    // Setup online/offline handlers
    window.addEventListener('online', () => {
      console.log('[Network] Device is online');
      document.body.classList.remove('app-offline');
      onOnline();
    });

    window.addEventListener('offline', () => {
      console.log('[Network] Device is offline');
      document.body.classList.add('app-offline');
      onOffline();
    });

    // Add offline class if already offline
    if (!navigator.onLine) {
      document.body.classList.add('app-offline');
      onOffline();
    }

    // Register immediately or wait for load
    if (immediate) {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }

    return true;
  } else {
    console.warn('[SW] Service workers are not supported in this browser');
    return false;
  }
};

// Check if the app is working offline with SW
export const isServiceWorkerActive = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    return !!registration.active;
  } catch (error) {
    console.warn('[SW] Error checking service worker status:', error);
    return false;
  }
};

// Message the service worker
export const sendMessageToSW = async (message: any): Promise<any> => {
  if (!('serviceWorker' in navigator)) {
    return Promise.reject(new Error('Service workers not supported'));
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      return Promise.reject(new Error('No active service worker'));
    }
    
    return new Promise((resolve, reject) => {
      // Create a message channel for two-way communication
      const messageChannel = new MessageChannel();
      
      // Setup the response handler
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };
      
      // Send the message
      // Ensure active is not null before sending (though we already checked above)
      if (registration.active) {
        registration.active.postMessage(message, [messageChannel.port2]);
      } else {
        reject(new Error('Service worker is no longer active'));
        return;
      }
      
      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Service worker did not respond')), 5000);
    });
  } catch (error) {
    console.error('[SW] Error sending message to service worker:', error);
    return Promise.reject(error);
  }
};

export default {
  registerServiceWorker,
  isServiceWorkerActive,
  sendMessageToSW
}; 