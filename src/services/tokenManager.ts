import axios from 'axios';

export interface Tokens {
  access: string;
  refresh: string;
}

class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';
  private static readonly STORAGE_TYPE_KEY = 'token_storage_type';
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly API_BASE_URL = 'https://repairmybike.up.railway.app/api';

  static setTokens(tokens: { access: string; refresh: string }, rememberMe: boolean = false): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    try {
      // First verify tokens are valid
      if (!tokens.access || !tokens.refresh) {
        throw new Error('Invalid tokens provided');
      }

      // Store tokens
      storage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
      storage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
      
      // Store storage type for future reference
      localStorage.setItem(this.STORAGE_TYPE_KEY, rememberMe ? 'local' : 'session');
      
      // Set token expiry (30 minutes from now for access token)
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30);
      storage.setItem(this.TOKEN_EXPIRY_KEY, expiry.getTime().toString());
      
      // Verify storage was successful
      const storedAccess = this.getAccessToken();
      const storedRefresh = this.getRefreshToken();
      
      if (!storedAccess || !storedRefresh) {
        throw new Error('Token storage verification failed');
      }
      
      console.log('Tokens stored successfully in:', rememberMe ? 'localStorage' : 'sessionStorage');
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
    const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
    const storage = storageType === 'local' ? localStorage : sessionStorage;
    return storage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.STORAGE_TYPE_KEY);
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
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

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
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
        return false;
      }

      const response = await axios.post(
        `${this.API_BASE_URL}/accounts/token/refresh/`,
        { refresh: refreshToken }
      );

      if (response.data.access) {
        const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
        const storage = storageType === 'local' ? localStorage : sessionStorage;
        storage.setItem(this.ACCESS_TOKEN_KEY, response.data.access);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      return false;
    }
  }
}

export default TokenManager; 