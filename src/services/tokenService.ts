// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';
const STORAGE_TYPE_KEY = 'token_storage_type';

export const tokenService = {
  // Get the current access token
  getAccessToken: (): string | null => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    return token ? `Bearer ${token}` : null;
  },

  // Get raw access token without Bearer prefix
  getRawToken: (): string | null => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  // Set a new access token
  setToken: (token: string): void => {
    if (!token) {
      console.error('Attempted to store empty token');
      return;
    }
    // Remove Bearer prefix if present
    const cleanToken = token.replace('Bearer ', '').trim();
    localStorage.setItem(ACCESS_TOKEN_KEY, cleanToken);
    
    // Set token expiry (30 minutes from now)
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 30);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiry.getTime().toString());
  },

  // Get the refresh token
  getRefreshToken: (): string | null => {
    const storageType = localStorage.getItem(STORAGE_TYPE_KEY) || 'local';
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    const token = storage.getItem(REFRESH_TOKEN_KEY);
    return token ? token.replace('Bearer ', '').trim() : null;
  },

  // Set a new refresh token
  setRefreshToken: (token: string): void => {
    if (!token) {
      console.error('Attempted to store empty refresh token');
      return;
    }
    // Remove Bearer prefix if present
    const cleanToken = token.replace('Bearer ', '').trim();
    localStorage.setItem(REFRESH_TOKEN_KEY, cleanToken);
  },

  // Clear all tokens
  clearTokens: (): void => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(STORAGE_TYPE_KEY);
  },

  // Set both tokens at once (useful after login)
  setTokens: (access: string, refresh: string, rememberMe: boolean = false): void => {
    try {
      if (!access || !refresh) {
        throw new Error('Invalid tokens provided');
      }

      const storage = rememberMe ? localStorage : sessionStorage;
      
      // Remove Bearer prefix if present and clean tokens
      const cleanAccess = access.replace('Bearer ', '').trim();
      const cleanRefresh = refresh.replace('Bearer ', '').trim();
      
      if (!cleanAccess || !cleanRefresh) {
        throw new Error('Invalid token format');
      }
      
      // Store tokens in the selected storage
      storage.setItem(ACCESS_TOKEN_KEY, cleanAccess);
      storage.setItem(REFRESH_TOKEN_KEY, cleanRefresh);
      
      // Always store storage type in localStorage for reference
      localStorage.setItem(STORAGE_TYPE_KEY, rememberMe ? 'local' : 'session');
      
      // Set token expiry (30 minutes from now)
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30);
      storage.setItem(TOKEN_EXPIRY_KEY, expiry.getTime().toString());
      
      console.log('Tokens stored successfully in:', rememberMe ? 'localStorage' : 'sessionStorage');
    } catch (error) {
      console.error('Error storing tokens:', error);
      this.clearTokens();
      throw error;
    }
  },

  // Check if we have valid tokens
  hasValidTokens: (): boolean => {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return !!accessToken && !!refreshToken;
  },

  // Parse JWT token and get expiration
  getTokenExpiration: (token: string): number | null => {
    try {
      // Remove Bearer prefix if present
      const cleanToken = token.replace('Bearer ', '').trim();
      const base64Url = cleanToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const { exp } = JSON.parse(jsonPayload);
      return exp ? exp * 1000 : null; // Convert to milliseconds
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  },

  // Check if access token is expired
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) return true;

    const expiration = tokenService.getTokenExpiration(token);
    if (!expiration) return true;

    return Date.now() >= expiration;
  }
};

export default tokenService; 