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
      // Store both access and refresh tokens
      storage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
      storage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
      
      // Store storage type for future reference
      localStorage.setItem(this.STORAGE_TYPE_KEY, rememberMe ? 'local' : 'session');
      
      // Set token expiry (24 hours from now)
      const expiry = new Date();
      expiry.setHours(expiry.getHours() + 24);
      storage.setItem(this.TOKEN_EXPIRY_KEY, expiry.getTime().toString());
      
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
      // Try localStorage first, then sessionStorage
      const token = localStorage.getItem(this.ACCESS_TOKEN_KEY) || 
                   sessionStorage.getItem(this.ACCESS_TOKEN_KEY);
      
      if (token) {
        console.log('Retrieved access token from:', 
          localStorage.getItem(this.ACCESS_TOKEN_KEY) ? 'localStorage' : 'sessionStorage');
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  static getRefreshToken(): string | null {
    try {
      // Try localStorage first, then sessionStorage
      const token = localStorage.getItem(this.REFRESH_TOKEN_KEY) || 
                   sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
      
      if (token) {
        console.log('Retrieved refresh token from:', 
          localStorage.getItem(this.REFRESH_TOKEN_KEY) ? 'localStorage' : 'sessionStorage');
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  static clearTokens(): void {
    console.log('Clearing all tokens...');
    try {
      // Clear from both storage types to be safe
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      
      sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
      
      console.log('All tokens cleared');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  static isTokenExpired(): boolean {
    try {
      const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY) || 
                    sessionStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      if (!expiry) return true;
      
      return Date.now() > parseInt(expiry);
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static hasValidToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}

export default TokenManager; 