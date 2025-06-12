import axios from 'axios';

interface TokenResponse {
  access: string;
  refresh?: string;
}

export interface Tokens {
  access: string;
  refresh: string;
}

class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private static readonly STORAGE_TYPE_KEY = 'token_storage_type';
  private static readonly API_BASE_URL = 'https://repairmybike.up.railway.app/api';

  static setTokens(tokens: Tokens, rememberMe: boolean = false): void {
    // Always store refresh token in localStorage for persistence across sessions
    // This ensures the 7-day refresh token works even if browser is closed
    
    try {
      // First verify tokens are valid
      if (!tokens.access || !tokens.refresh) {
        throw new Error('Invalid tokens provided');
      }

      // Store access token in the selected storage
      const accessStorage = rememberMe ? localStorage : sessionStorage;
      accessStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
      
      // Always store refresh token in localStorage for persistence
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
      
      // Store storage type for future reference
      localStorage.setItem(this.STORAGE_TYPE_KEY, rememberMe ? 'local' : 'session');
      
      // Set token expiry (30 minutes from now for access token)
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30);
      accessStorage.setItem(this.TOKEN_EXPIRY_KEY, expiry.getTime().toString());
      
      // Verify storage was successful
      const storedAccess = this.getAccessToken();
      const storedRefresh = this.getRefreshToken();
      
      if (!storedAccess || !storedRefresh) {
        throw new Error('Token storage verification failed');
      }
      
      console.log('Tokens stored successfully. Access token in:', rememberMe ? 'localStorage' : 'sessionStorage', 'Refresh token in: localStorage');
    } catch (error) {
      console.error('Error storing tokens:', error);
      this.clearTokens();
      throw error;
    }
  }

  static getAccessToken(): string | null {
    const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    return storage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    // Always get refresh token from localStorage regardless of storage type
    // This ensures the 7-day refresh token works even if browser is closed
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    // Clear tokens from both storage types to ensure complete logout
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    
    // Keep storage type preference
  }

  static isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  static willExpireSoon(minutesThreshold: number = 5): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expiryTime - currentTime;
      
      // Check if token will expire within the specified minutes
      return timeUntilExpiry < (minutesThreshold * 60 * 1000);
    } catch {
      return true;
    }
  }

  static hasValidTokens(): boolean {
    const access = this.getAccessToken();
    const refresh = this.getRefreshToken();
    return !!(access && refresh && !this.isTokenExpired());
  }

  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.error('No refresh token available');
        return false;
      }

      console.log('Attempting to refresh token with refresh token');
      
      const response = await axios.post<TokenResponse>(
        `${this.API_BASE_URL}/accounts/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.data?.access) {
        console.error('Invalid refresh token response');
        return false;
      }

      console.log('Token refresh successful, updating tokens');
      
      // Get current storage preference
      const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY) || 'local';
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      
      // Store new access token in the appropriate storage
      storage.setItem(this.ACCESS_TOKEN_KEY, response.data.access);

      // Update token expiry
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30);
      storage.setItem(this.TOKEN_EXPIRY_KEY, expiry.getTime().toString());

      // If a new refresh token was provided, update it too
      if (response.data.refresh) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.data.refresh);
      }

      // Verify token storage
      const storedToken = this.getAccessToken();
      if (!storedToken) {
        console.error('Token storage verification failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      return false;
    }
  }
}

export default TokenManager; 