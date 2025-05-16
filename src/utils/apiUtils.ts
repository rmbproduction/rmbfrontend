/**
 * API utility functions to handle common tasks like retries and error handling
 */

// Define a basic error shape for typechecking
interface ErrorWithCode {
  message?: string;
  code?: string;
  [key: string]: any;
}

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
      
      // If error mentions timeout, this is a good candidate for retry
      const isTimeout = error?.message?.includes('timeout') || 
                       error?.code === 'ECONNABORTED' ||
                       error?.code === 'ETIMEDOUT';
      
      // Skip retry for non-timeout errors
      if (!isTimeout) {
        console.warn('Not a timeout error, not retrying:', error);
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
 * Adds retry capability to any API function
 * @param apiFunction The API function to wrap with retry logic
 * @returns A new function with built-in retry capabilities
 */
export const withRetry = <T extends any[], R>(
  apiFunction: (...args: T) => Promise<R>,
  maxRetries: number = 3
): ((...args: T) => Promise<R>) => {
  return (...args: T): Promise<R> => {
    return retryOnError(() => apiFunction(...args), maxRetries);
  };
};

export default {
  retryOnError,
  withRetry
}; 