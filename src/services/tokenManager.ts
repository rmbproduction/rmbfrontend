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

  private static getStorage(): Storage {
    const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
    return storageType === 'local' ? localStorage : sessionStorage;
  }

  static getAccessToken(): string | null {
    try {
      const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      const token = storage.getItem(this.ACCESS_TOKEN_KEY);
      
      if (!token) {
        // Try alternate storage as fallback
        const altStorage = storageType === 'local' ? sessionStorage : localStorage;
        return altStorage.getItem(this.ACCESS_TOKEN_KEY);
      }
      
      return token;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      const token = storage.getItem(this.REFRESH_TOKEN_KEY);
      
      if (!token) {
        // Try alternate storage as fallback
        const altStorage = storageType === 'local' ? sessionStorage : localStorage;
        return altStorage.getItem(this.REFRESH_TOKEN_KEY);
      }
      
      return token;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  static clearTokens(): void {
    try {
      // Clear from both storage types to be safe
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      localStorage.removeItem(this.STORAGE_TYPE_KEY);
      
      sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      
      console.log('All tokens cleared successfully');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  static isTokenExpired(): boolean {
    try {
      const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      const expiry = storage.getItem(this.TOKEN_EXPIRY_KEY);
      
      if (!expiry) {
        // Try alternate storage
        const altStorage = storageType === 'local' ? sessionStorage : localStorage;
        const altExpiry = altStorage.getItem(this.TOKEN_EXPIRY_KEY);
        if (!altExpiry) return true;
        return Date.now() > parseInt(altExpiry);
      }
      
      return Date.now() > parseInt(expiry);
    } catch (error) {
      console.error('Error checking token expiry:', error);
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
}

export default TokenManager; 