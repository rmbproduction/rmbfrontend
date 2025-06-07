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

  // Set both tokens at once
  setTokens: (access: string, refresh: string): void => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },

  // Check if we have valid tokens
  hasValidTokens: (): boolean => {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    return !!accessToken && !!refreshToken;
  }
};

export default tokenService; 