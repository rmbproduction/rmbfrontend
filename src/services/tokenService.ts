// Token storage keys
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenService = {
  // Get the current access token
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  // Set a new access token
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  // Get the refresh token
  getRefreshToken: (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  // Set a new refresh token
  setRefreshToken: (token: string): void => {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  // Clear all tokens
  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // Set both tokens at once (useful after login)
  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },

  // Check if we have valid tokens
  hasValidTokens: (): boolean => {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return !!accessToken && !!refreshToken;
  },

  // Parse JWT token and get expiration
  getTokenExpiration: (token: string): number | null => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const { exp } = JSON.parse(jsonPayload);
      return exp ? exp * 1000 : null; // Convert to milliseconds
    } catch (e) {
      return null;
    }
  },

  // Check if access token is expired
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return true;

    const expiration = tokenService.getTokenExpiration(token);
    if (!expiration) return true;

    return Date.now() >= expiration;
  }
};

export default tokenService; 