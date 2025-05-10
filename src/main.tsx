import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import axios from 'axios';
import { initializeDB } from './services/persistentStorageService';

// Performance monitoring
const startTime = performance.now();
console.log('[App] Initialization started');

// Initialize application with better error handling
const initializeApp = async () => {
  try {
    // Initialize persistence layer first
    await initializeDB();
    console.log('[App] Persistence layer initialized');
    
    // Setup API defaults
    setupApiDefaults();
    
    // Start cache maintenance in the background
    setupCacheMaintenance();

    // Register service worker in the background
    registerServiceWorker();
    
    // Measure and log startup performance
    const loadTime = Math.round(performance.now() - startTime);
    console.log(`[App] Initialization completed in ${loadTime}ms`);
    
    // Render application
    renderApp();
  } catch (error) {
    console.error('[App] Initialization error:', error);
    // Still render app even if initialization fails
    renderApp();
    
    // Report error to monitoring service if available
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(error);
    }
  }
};

// Setup API defaults
const setupApiDefaults = () => {
  // Initialize axios with authentication token if available
  const token = localStorage.getItem('accessToken');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // Set default timeout
  axios.defaults.timeout = 15000; // 15 seconds
  
  // Add response interceptor for global error handling
  axios.interceptors.response.use(
    response => response,
    error => {
      // Log API errors but don't interrupt application flow
      console.error('[API] Request failed:', error?.response?.status || 'Network Error');
      return Promise.reject(error);
    }
  );
};

// Clean up expired cache items
const setupCacheMaintenance = () => {
  // Run maintenance less frequently (every hour) to reduce resource usage
  const MAINTENANCE_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  // Initial cleanup on startup after app is rendered
  setTimeout(() => {
    cleanupExpiredItems();
  }, 10000); // Wait 10 seconds after app load to avoid slowing initial render
  
  // Schedule periodic cleanups
  setInterval(cleanupExpiredItems, MAINTENANCE_INTERVAL);
};

// Function to clean up expired items from storage
const cleanupExpiredItems = () => {
  console.log('[App] Running cache maintenance');
  const now = Date.now();
  
  try {
    // Clean up any expired items from sessionStorage
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('vehicle_')) {
        try {
          const item = sessionStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            // Check if item has expired
            if (data.expiry && now > data.expiry) {
              sessionStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Skip items that can't be parsed
        }
      }
    }
    
    // Do the same for localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vehicle_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            // Check if item has expired
            if (data.expiry && now > data.expiry) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Skip items that can't be parsed
        }
      }
    }
    
    console.log('[App] Cache maintenance complete');
  } catch (error) {
    console.warn('[App] Error during cache maintenance:', error);
  }
};

// Register service worker in the background
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('[SW] ServiceWorker registered:', registration);
        })
        .catch(error => {
          console.error('[SW] ServiceWorker registration failed:', error);
        });
    });
  }
};

// Render the application
const renderApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('[App] Root element not found!');
    return;
  }
  
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('[App] Unhandled error:', error, errorInfo);
          }}
        >
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (error) {
    console.error('[App] Rendering failed:', error);
    
    // Fallback render with error message
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center;">
        <h2>Something went wrong</h2>
        <p>The application couldn't load properly. Please try refreshing the page.</p>
        <button onclick="window.location.reload()">Refresh</button>
      </div>
    `;
  }
};

// Start the application
initializeApp();
