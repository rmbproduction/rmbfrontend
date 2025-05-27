export interface Tokens {
  access: string;
  refresh: string;
}

class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly EXPIRES_AT_KEY = 'token_expires_at';
  private static readonly STORAGE_TYPE_KEY = 'token_storage_type';
  private static readonly TOKEN_KEY = 'auth_token';

  static setTokens(tokens: Tokens, rememberMe: boolean = false): void {
    // First, clear any existing tokens
    this.clearTokens();
    
    const storage = rememberMe ? localStorage : sessionStorage;
    
    try {
      // Store the storage type preference
      localStorage.setItem(this.STORAGE_TYPE_KEY, rememberMe ? 'local' : 'session');
      
      // Store tokens
      storage.setItem(this.ACCESS_TOKEN_KEY, tokens.access);
      storage.setItem(this.REFRESH_TOKEN_KEY, tokens.refresh);
      
      // Set expiration time (15 minutes from now for access token)
      const expiresAt = new Date().getTime() + 15 * 60 * 1000;
      storage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
      
      console.log('Tokens stored successfully in:', rememberMe ? 'localStorage' : 'sessionStorage');
    } catch (error) {
      console.error('Failed to store tokens:', error);
      this.clearTokens();
      throw error;
    }
  }

  private static getStorage(): Storage {
    const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
    return storageType === 'local' ? localStorage : sessionStorage;
  }

  static getAccessToken(): string | null {
    const storage = this.getStorage();
    const token = storage.getItem(this.ACCESS_TOKEN_KEY);
    console.log('Retrieved access token from:', storage === localStorage ? 'localStorage' : 'sessionStorage');
    return token;
  }

  static getRefreshToken(): string | null {
    const storage = this.getStorage();
    const token = storage.getItem(this.REFRESH_TOKEN_KEY);
    console.log('Retrieved refresh token from:', storage === localStorage ? 'localStorage' : 'sessionStorage');
    return token;
  }

  static clearTokens(): void {
    console.log('Clearing all tokens...');
    // Clear from both storages to ensure complete cleanup
    [localStorage, sessionStorage].forEach(storage => {
      storage.removeItem(this.ACCESS_TOKEN_KEY);
      storage.removeItem(this.REFRESH_TOKEN_KEY);
      storage.removeItem(this.EXPIRES_AT_KEY);
    });
    localStorage.removeItem(this.STORAGE_TYPE_KEY);
    console.log('All tokens cleared');
  }

  static isTokenExpired(): boolean {
    const storage = this.getStorage();
    const expiresAt = storage.getItem(this.EXPIRES_AT_KEY);
    if (!expiresAt) return true;
    const isExpired = new Date().getTime() > parseInt(expiresAt);
    console.log('Token expiration check:', isExpired ? 'expired' : 'valid');
    return isExpired;
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static hasValidToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}

export default TokenManager; 