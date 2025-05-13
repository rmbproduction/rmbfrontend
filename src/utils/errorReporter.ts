/**
 * Error reporting utilities for consistent error handling across the application
 * Can be extended to send errors to external monitoring services like Sentry
 */

import { API_CONFIG } from '../config/api.config';

// Configure your error reporting settings
const ERROR_CONFIG = {
  // Enable reporting to console in all environments
  logToConsole: true,
  
  // Enable reporting to API endpoint (set to true in prod)
  reportToApi: process.env.NODE_ENV === 'production',
  
  // Enable reporting to external service (e.g., Sentry)
  reportToService: process.env.NODE_ENV === 'production',
  
  // Log URL for collecting errors
  errorEndpoint: `${API_CONFIG.BASE_URL}/logs/client-error`
};

// Context data to attach to all errors
let contextData = {
  userId: null as string | null,
  sessionId: generateSessionId(),
  userAgent: navigator.userAgent,
  timestamp: Date.now(),
  applicationVersion: import.meta.env.VITE_APP_VERSION || 'dev'
};

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Update context data with user information
 */
export const updateErrorContext = (data: Partial<typeof contextData>): void => {
  contextData = {
    ...contextData,
    ...data,
    timestamp: Date.now() // Always refresh timestamp
  };
};

/**
 * Set user ID for error reporting
 */
export const setUserId = (userId: string | null): void => {
  contextData.userId = userId;
};

/**
 * Format error object for consistent reporting
 */
const formatError = (error: unknown, componentInfo?: string, additionalData?: Record<string, any>) => {
  // Handle different types of errors
  let errorObject = {
    message: 'Unknown error',
    stack: '',
    type: 'unknown'
  };
  
  if (error instanceof Error) {
    errorObject = {
      message: error.message,
      stack: error.stack || '',
      type: error.name
    };
  } else if (typeof error === 'string') {
    errorObject = {
      message: error,
      stack: new Error().stack || '',
      type: 'string'
    };
  } else if (error && typeof error === 'object') {
    try {
      errorObject = {
        message: String((error as any).message || JSON.stringify(error)),
        stack: (error as any).stack || new Error().stack || '',
        type: (error as any).name || 'object'
      };
    } catch (e) {
      errorObject = {
        message: 'Unserializable error object',
        stack: new Error().stack || '',
        type: 'unserializable'
      };
    }
  }
  
  // Build complete error report
  return {
    error: errorObject,
    component: componentInfo || 'unknown',
    context: contextData,
    additionalData: additionalData || {},
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
};

/**
 * Log errors to console
 */
const logToConsole = (formattedError: ReturnType<typeof formatError>): void => {
  if (!ERROR_CONFIG.logToConsole) return;
  
  console.error(
    `[ERROR] ${formattedError.component}: ${formattedError.error.message}`,
    {
      ...formattedError,
      error: {
        ...formattedError.error,
        original: formattedError.error
      }
    }
  );
};

/**
 * Send errors to backend API
 */
const reportToApi = async (formattedError: ReturnType<typeof formatError>): Promise<void> => {
  if (!ERROR_CONFIG.reportToApi) return;
  
  try {
    const response = await fetch(ERROR_CONFIG.errorEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formattedError),
      // Use keepalive to ensure the request completes even if the page is unloading
      keepalive: true
    });
    
    if (!response.ok) {
      console.error('Failed to send error to API:', response.status);
    }
  } catch (e) {
    // Don't recursively report this error
    console.error('Error reporting to API:', e);
  }
};

/**
 * Send errors to third-party service like Sentry
 * You would need to initialize the service elsewhere
 */
const reportToService = (formattedError: ReturnType<typeof formatError>): void => {
  if (!ERROR_CONFIG.reportToService) return;
  
  // Placeholder for integration with services like Sentry, LogRocket, etc.
  // Example with Sentry:
  /*
  if (window.Sentry) {
    window.Sentry.withScope((scope) => {
      scope.setExtra('component', formattedError.component);
      scope.setExtra('additionalData', formattedError.additionalData);
      
      if (formattedError.context.userId) {
        scope.setUser({ id: formattedError.context.userId });
      }
      
      window.Sentry.captureException(formattedError.error.original || formattedError.error);
    });
  }
  */
};

/**
 * Main error reporting function
 */
export const reportError = (
  error: unknown,
  componentInfo?: string,
  additionalData?: Record<string, any>
): void => {
  const formattedError = formatError(error, componentInfo, additionalData);
  
  // Report through all configured channels
  logToConsole(formattedError);
  void reportToApi(formattedError);
  reportToService(formattedError);
};

/**
 * Error boundary handler - designed to work with ErrorBoundary component
 */
export const handleBoundaryError = (
  error: Error,
  errorInfo: React.ErrorInfo,
  componentName: string
): void => {
  reportError(error, componentName, { componentStack: errorInfo.componentStack });
};

/**
 * Safely execute a function and report any errors
 */
export const safeExecute = async <T>(
  fn: () => Promise<T> | T,
  componentInfo: string,
  fallbackValue: T
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    reportError(error, componentInfo);
    return fallbackValue;
  }
};

export default {
  reportError,
  handleBoundaryError,
  updateErrorContext,
  setUserId,
  safeExecute
}; 