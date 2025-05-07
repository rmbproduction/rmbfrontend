import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import axios from 'axios';
import { initializeDB } from './services/persistentStorageService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Initialize persistence layer
initializeDB()
  .then(() => {
    console.log('Persistence layer initialized successfully');
    
    // Set up automatic cache maintenance
    const setupCacheMaintenance = () => {
      // Run cache maintenance every hour
      const MAINTENANCE_INTERVAL = 60 * 60 * 1000; // 1 hour
      
      // Perform initial cleanup of old session data on startup
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
                if (data.expiry && Date.now() > data.expiry) {
                  console.log(`Removing expired session item: ${key}`);
                  sessionStorage.removeItem(key);
                }
              }
            } catch (e) {
              console.warn(`Error processing session item ${key}:`, e);
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
                if (data.expiry && Date.now() > data.expiry) {
                  console.log(`Removing expired local storage item: ${key}`);
                  localStorage.removeItem(key);
                }
              }
            } catch (e) {
              console.warn(`Error processing local storage item ${key}:`, e);
            }
          }
        }
      } catch (error) {
        console.error('Error during initial cleanup:', error);
      }
      
      // Set up periodic cache cleanup
      setInterval(() => {
        try {
          // Perform the same cleanup periodically
          for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('vehicle_')) {
              try {
                const item = sessionStorage.getItem(key);
                if (item) {
                  const data = JSON.parse(item);
                  if (data.expiry && Date.now() > data.expiry) {
                    sessionStorage.removeItem(key);
                  }
                }
              } catch (e) {
                // Skip items that can't be parsed
              }
            }
          }
          
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('vehicle_')) {
              try {
                const item = localStorage.getItem(key);
                if (item) {
                  const data = JSON.parse(item);
                  if (data.expiry && Date.now() > data.expiry) {
                    localStorage.removeItem(key);
                  }
                }
              } catch (e) {
                // Skip items that can't be parsed
              }
            }
          }
          
          console.log('Cache maintenance completed');
        } catch (error) {
          console.error('Error during cache maintenance:', error);
        }
      }, MAINTENANCE_INTERVAL);
    };
    
    // Start cache maintenance
    setupCacheMaintenance();
  })
  .catch(error => {
    console.error('Failed to initialize persistence layer:', error);
    // Still continue with the app, just show an error message
    toast.error('Failed to initialize storage. Some features may not work properly.');
  });

// Initialize axios with authentication token if available
const token = localStorage.getItem('accessToken');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to any error monitoring service (like Sentry)
        console.error('Application crash detected:', error, errorInfo);
      }}
    >
      <App />
      <ToastContainer position="top-right" autoClose={3000} />
    </ErrorBoundary>
  </StrictMode>
);
