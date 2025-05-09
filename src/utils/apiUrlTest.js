/**
 * API URL Test Utility
 * 
 * This file provides helper functions to test API URLs and debug connection issues.
 * To use it, import this file in your component and call testApiEndpoint.
 */

import { API_CONFIG } from '../config/api.config';

/**
 * Tests an API endpoint and logs the result
 * @param {string} endpoint - The endpoint to test, without leading slash
 */
export const testApiEndpoint = async (endpoint) => {
  const url = `${API_CONFIG.BASE_URL}/${endpoint}`;
  console.log(`[API TEST] Testing API endpoint: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      // Don't send credentials to avoid CORS preflight
      credentials: 'omit'
    });
    
    console.log(`[API TEST] Status code: ${response.status}`);
    console.log(`[API TEST] Status text: ${response.statusText}`);
    console.log(`[API TEST] Headers:`, Object.fromEntries([...response.headers.entries()]));
    
    if (response.ok) {
      try {
        const data = await response.json();
        console.log(`[API TEST] Response data:`, data);
        return { success: true, data };
      } catch (e) {
        console.log(`[API TEST] Not a valid JSON response`);
        const text = await response.text();
        console.log(`[API TEST] Response text:`, text.substring(0, 500) + (text.length > 500 ? '...' : ''));
        return { success: false, error: 'Invalid JSON', text };
      }
    } else {
      console.log(`[API TEST] Request failed`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error(`[API TEST] Error during fetch:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Logs important environment variables and API configuration
 */
export const logApiConfig = () => {
  console.log(`[API CONFIG] BASE_URL: ${API_CONFIG.BASE_URL}`);
  console.log(`[API CONFIG] MARKETPLACE_URL: ${API_CONFIG.MARKETPLACE_URL}`);
  console.log(`[API CONFIG] MEDIA_URL: ${API_CONFIG.MEDIA_URL}`);
  console.log(`[API CONFIG] NODE_ENV: ${process.env.NODE_ENV}`);
};

// Export helper for direct usage in console
window.testApiUrl = testApiEndpoint;
window.logApiConfig = logApiConfig;

// Automatically log API config when this file is imported
console.log('[API URL TESTER] Loaded - API config:');
logApiConfig();

export default {
  testApiEndpoint,
  logApiConfig
}; 