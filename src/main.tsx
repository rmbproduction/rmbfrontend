import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';
import axios from 'axios';

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
    </ErrorBoundary>
  </StrictMode>
);
