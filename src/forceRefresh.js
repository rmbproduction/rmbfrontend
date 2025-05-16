/**
 * Force Refresh Utility
 * 
 * This script can be used to clear all service worker caches and reload the application
 * for a fresh start when data seems stale or corrupted.
 */

// Define the cache names used in service worker
const CACHE_NAMES = [
  'rmb-static-v3',
  'rmb-api-v3',
  'rmb-images-v3',
  'rmb-fonts-v1'
];

// Function to clear all caches through the service worker
const clearAllCaches = async () => {
  console.log('Attempting to clear all caches...');
  
  try {
    // Check if service worker is active and registered
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported in this browser');
      return false;
    }
    
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.warn('No service worker registration found');
      return false;
    }
    
    // Send message to service worker to clear all caches
    const messageSent = await sendMessageToServiceWorker({ action: 'clearCache' });
    
    if (messageSent) {
      console.log('Successfully cleared all caches');
      return true;
    } else {
      console.warn('Failed to communicate with service worker');
      
      // Fallback: try to clear caches directly
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(key => caches.delete(key))
      );
      console.log('Cleared caches directly:', cacheKeys);
      return true;
    }
  } catch (error) {
    console.error('Error clearing caches:', error);
    return false;
  }
};

// Function to communicate with the service worker
const sendMessageToServiceWorker = async (message) => {
  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      return false;
    }
    
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      // Setup response handler
      messageChannel.port1.onmessage = (event) => {
        if (event.data && event.data.success) {
          resolve(true);
        } else {
          console.warn('Service worker reported an error:', event.data);
          resolve(false);
        }
      };
      
      // Send the message with the message channel
      registration.active.postMessage(message, [messageChannel.port2]);
      
      // Timeout after 3 seconds
      setTimeout(() => {
        console.warn('Service worker did not respond in time');
        resolve(false);
      }, 3000);
    });
  } catch (error) {
    console.error('Error communicating with service worker:', error);
    return false;
  }
};

// Function to unregister service worker
const unregisterServiceWorker = async () => {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const unregistered = await registration.unregister();
      console.log('Service worker unregistered:', unregistered);
      return unregistered;
    }
    return false;
  } catch (error) {
    console.error('Error unregistering service worker:', error);
    return false;
  }
};

// Function to clear all browser storage
const clearBrowserStorage = () => {
  try {
    // Clear session storage
    sessionStorage.clear();
    console.log('Session storage cleared');
    
    // Clear relevant local storage items (keeping auth tokens)
    const authToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    // Get all keys that start with 'rmb-'
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('rmb-')) {
        keys.push(key);
      }
    }
    
    // Remove all RMB keys
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keys.length} RMB-specific items from local storage`);
    
    // Restore auth tokens if they existed
    if (authToken) localStorage.setItem('accessToken', authToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    
    return true;
  } catch (error) {
    console.error('Error clearing browser storage:', error);
    return false;
  }
};

// Main function to force a complete refresh
export const forceRefresh = async () => {
  console.log('Starting force refresh process...');
  
  // Display a loading indicator
  const body = document.body;
  const loadingElement = document.createElement('div');
  loadingElement.style.position = 'fixed';
  loadingElement.style.top = '0';
  loadingElement.style.left = '0';
  loadingElement.style.width = '100%';
  loadingElement.style.height = '100%';
  loadingElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  loadingElement.style.zIndex = '10000';
  loadingElement.style.display = 'flex';
  loadingElement.style.justifyContent = 'center';
  loadingElement.style.alignItems = 'center';
  loadingElement.style.flexDirection = 'column';
  loadingElement.style.color = 'white';
  loadingElement.style.fontFamily = 'sans-serif';
  
  const spinnerSize = '60px';
  loadingElement.innerHTML = `
    <div style="width: ${spinnerSize}; height: ${spinnerSize}; border: 5px solid #f3f3f3; 
                border-top: 5px solid #ff5733; border-radius: 50%; 
                animation: spin 1s linear infinite;"></div>
    <div style="margin-top: 20px; font-size: 18px;">Refreshing Application...</div>
    <div style="margin-top: 10px; font-size: 14px; max-width: 80%; text-align: center;">
      Clearing cached data and refreshing. Please wait a moment.
    </div>
  `;
  
  // Add the loading indicator to the body
  body.appendChild(loadingElement);
  
  // Add spinner animation
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  try {
    // Step 1: Clear all caches
    await clearAllCaches();
    
    // Step 2: Clear browser storage
    clearBrowserStorage();
    
    // Step 3: Unregister service worker
    await unregisterServiceWorker();
    
    // Step 4: Reload the page
    console.log('Force refresh complete. Reloading page...');
    window.location.reload(true);
  } catch (error) {
    console.error('Error during force refresh:', error);
    
    // Add error message to loading screen
    const errorMsg = document.createElement('div');
    errorMsg.style.marginTop = '20px';
    errorMsg.style.color = '#ff5733';
    errorMsg.style.padding = '10px';
    errorMsg.style.backgroundColor = 'rgba(255,255,255,0.1)';
    errorMsg.style.borderRadius = '5px';
    errorMsg.textContent = 'An error occurred. Please try manually refreshing the page.';
    loadingElement.appendChild(errorMsg);
    
    // Add a manual refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh Page';
    refreshBtn.style.marginTop = '15px';
    refreshBtn.style.padding = '10px 20px';
    refreshBtn.style.backgroundColor = '#ff5733';
    refreshBtn.style.color = 'white';
    refreshBtn.style.border = 'none';
    refreshBtn.style.borderRadius = '5px';
    refreshBtn.style.cursor = 'pointer';
    refreshBtn.onclick = () => window.location.reload(true);
    loadingElement.appendChild(refreshBtn);
  }
};

// Export all utilities
export default {
  forceRefresh,
  clearAllCaches,
  unregisterServiceWorker,
  clearBrowserStorage
}; 