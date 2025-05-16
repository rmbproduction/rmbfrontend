/**
 * Network utilities for offline detection and status monitoring
 */

import { sendMessageToSW } from './serviceWorkerUtils';
import { API_CONFIG } from '../config/api.config';

// Network status interface
export interface NetworkStatus {
  online: boolean;
  lastChecked: number;
  connectionType?: string;
  responseTime?: number;
}

// Global network status cache
let cachedNetworkStatus: NetworkStatus = {
  online: navigator.onLine,
  lastChecked: Date.now(),
  connectionType: (navigator as any).connection?.type || 'unknown'
};

// Event listeners for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    cachedNetworkStatus.online = true;
    cachedNetworkStatus.lastChecked = Date.now();
    console.log('[Network] Connection detected - online');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('networkStatusChanged', {
      detail: { ...cachedNetworkStatus }
    }));
  });
  
  window.addEventListener('offline', () => {
    cachedNetworkStatus.online = false;
    cachedNetworkStatus.lastChecked = Date.now();
    console.log('[Network] Connection lost - offline');
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('networkStatusChanged', {
      detail: { ...cachedNetworkStatus }
    }));
  });
}

/**
 * Check if the device has network connectivity
 * @returns Current online status from the browser
 */
export const isOnline = (): boolean => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true; // Default to online in SSR
};

/**
 * Get the current connection type if available
 * @returns Connection type or 'unknown'
 */
export const getConnectionType = (): string => {
  if (typeof navigator !== 'undefined' && (navigator as any).connection) {
    return (navigator as any).connection.type || 'unknown';
  }
  return 'unknown';
};

/**
 * Check network status by testing connectivity to an API endpoint
 * @param url Optional URL to test (defaults to API health endpoint)
 * @returns Promise that resolves to a network status object
 */
export const checkNetworkStatus = async (
  url: string = `${API_CONFIG.BASE_URL}/health/`
): Promise<NetworkStatus> => {
  // First check navigator.onLine as a quick check
  if (!navigator.onLine) {
    cachedNetworkStatus = {
      online: false,
      lastChecked: Date.now(),
      connectionType: getConnectionType()
    };
    return cachedNetworkStatus;
  }
  
  try {
    // Try using the service worker for the test if available
    try {
      const swResponse = await sendMessageToSW({ 
        action: 'networkTest', 
        url 
      });
      
      if (swResponse && swResponse.success) {
        cachedNetworkStatus = {
          online: swResponse.result.online,
          lastChecked: Date.now(),
          connectionType: getConnectionType(),
          responseTime: swResponse.result.responseTime
        };
        return cachedNetworkStatus;
      }
    } catch (swError) {
      console.warn('Service worker network test failed, falling back to fetch:', swError);
    }
    
    // Fallback to direct fetch if service worker is unavailable
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const endTime = Date.now();
    
    cachedNetworkStatus = {
      online: response.ok,
      lastChecked: endTime,
      connectionType: getConnectionType(),
      responseTime: endTime - startTime
    };
    
    return cachedNetworkStatus;
  } catch (error) {
    console.warn('Network check failed:', error);
    
    cachedNetworkStatus = {
      online: false,
      lastChecked: Date.now(),
      connectionType: getConnectionType(),
      responseTime: undefined
    };
    
    return cachedNetworkStatus;
  }
};

/**
 * Get the cached network status without performing a new check
 * @returns The cached network status
 */
export const getCachedNetworkStatus = (): NetworkStatus => {
  return { ...cachedNetworkStatus };
};

/**
 * Register a callback for network status changes
 * @param callback Function to call when network status changes
 * @returns Function to unregister the callback
 */
export const onNetworkStatusChange = (
  callback: (status: NetworkStatus) => void
): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<NetworkStatus>;
    callback(customEvent.detail);
  };
  
  window.addEventListener('networkStatusChanged', handler);
  
  return () => {
    window.removeEventListener('networkStatusChanged', handler);
  };
};

export default {
  isOnline,
  checkNetworkStatus,
  getCachedNetworkStatus,
  onNetworkStatusChange,
  getConnectionType
}; 