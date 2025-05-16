/**
 * API utility functions to handle common tasks like retries and error handling
 */
import { AxiosResponse } from 'axios';

// Define a basic error shape for typechecking
interface ErrorWithCode {
  message?: string;
  code?: string;
  [key: string]: any;
}

// Timeout constants
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const OFFLINE_RETRY_MAX = 3;    // Maximum retries when offline
const OFFLINE_RETRY_DELAY = 3000; // 3 seconds between offline retries

/**
 * Check if the error is likely due to network issues
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for common network error patterns
  const isTimeout = 
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' || 
    (error.message && (
      error.message.includes('timeout') ||
      error.message.includes('network') ||
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch')
    ));
    
  // Check for offline status
  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
  
  return isTimeout || isOffline;
};

/**
 * Retries a function multiple times with exponential backoff until it succeeds
 * @param fn The async function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelayMs Initial delay in milliseconds
 * @returns Promise that resolves with the result of the function or rejects after all retries
 */
export const retryOnError = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 500
): Promise<T> => {
  let lastError: ErrorWithCode = {};
  let delayMs = initialDelayMs;
  
  // Check connection status first
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.warn('Device is offline. Will retry when online.');
    
    // Wait for online status if we're offline
    if (maxRetries > 0) {
      await new Promise<void>((resolve) => {
        const onlineHandler = () => {
          window.removeEventListener('online', onlineHandler);
          console.log('Network connection restored. Retrying request.');
          resolve();
        };
        
        // Resolve if we come back online
        window.addEventListener('online', onlineHandler);
        
        // Also try again after a delay even if still offline
        setTimeout(() => {
          window.removeEventListener('online', onlineHandler);
          console.log('Still offline, but trying request anyway');
          resolve();
        }, Math.min(delayMs * 5, 15000)); // Longer delay when offline
      });
    }
  }
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // If it's a retry, log that we're retrying
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${maxRetries} after ${delayMs}ms`);
      }
      
      // Try to execute the function
      return await fn();
    } catch (error: any) {
      // Store the error for potential later rejection
      lastError = error;
      
      // If this was the last attempt, don't delay
      if (attempt === maxRetries) {
        break;
      }
      
      // Determine if this error is worth retrying
      const shouldRetry = isNetworkError(error);
      
      // Skip retry for errors that aren't network-related
      if (!shouldRetry) {
        console.warn('Not a network-related error, not retrying:', error);
        break;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Increase delay for next attempt (exponential backoff)
      delayMs *= 2;
    }
  }
  
  // If we got here, all retries failed
  throw lastError;
};

/**
 * Adds retry capability to any API function that returns a Promise
 * @param apiFunction The async function to wrap with retry logic
 * @returns A new function with built-in retry capabilities
 */
export const withRetry = <T>(
  apiFunction: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> => {
  return retryOnError(apiFunction, maxRetries);
};

/**
 * Creates a timeout promise that rejects after the specified time
 * @param ms Timeout in milliseconds
 * @returns A promise that rejects after the timeout
 */
export const createTimeout = (ms: number = DEFAULT_TIMEOUT): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);
  });
};

/**
 * Executes a function with a timeout
 * @param fn The function to execute
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise that resolves with the function result or rejects on timeout
 */
export const withTimeout = async <T>(
  fn: () => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<T> => {
  try {
    // Race between the function and a timeout
    return await Promise.race([
      fn(),
      createTimeout(timeoutMs)
    ]);
  } catch (error) {
    // Enhance the error with timeout information if it was a timeout
    if (error instanceof Error && error.message.includes('timed out')) {
      error.name = 'TimeoutError';
      (error as any).code = 'ETIMEDOUT';
    }
    throw error;
  }
};

export default {
  retryOnError,
  withRetry,
  withTimeout,
  isNetworkError
}; 