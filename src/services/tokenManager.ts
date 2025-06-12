import axios from 'axios';
import tokenService from './tokenService';

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
      
      // Also set tokens in tokenService for consistency
      tokenService.setTokens(tokens.access, tokens.refresh, rememberMe);
      
      // Verify storage was successful - with retry mechanism and more resilient check
      setTimeout(() => {
        try {
          const storedAccess = storage.getItem(this.ACCESS_TOKEN_KEY);
          const storedRefresh = storage.getItem(this.REFRESH_TOKEN_KEY);
          
          if (!storedAccess || !storedRefresh) {
            console.warn('Token storage verification delayed check: tokens not found, retrying...');
            // Try one more time with a bit more delay
            setTimeout(() => {
              const retryAccess = storage.getItem(this.ACCESS_TOKEN_KEY);
              const retryRefresh = storage.getItem(this.REFRESH_TOKEN_KEY);
              
              if (!retryAccess || !retryRefresh) {
                console.error('Token storage verification failed after retry');
              } else {
                console.log('Token storage verification confirmed after retry');
              }
            }, 200);
          } else {
            console.log('Token storage verification confirmed on delayed check');
          }
        } catch (err) {
          console.error('Error during token verification:', err);
        }
      }, 300);
      
      console.log('Tokens stored successfully in:', rememberMe ? 'localStorage' : 'sessionStorage');
    } catch (error) {
      console.error('Error storing tokens:', error);
      this.clearAllTokens();
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
    // This method is kept for backward compatibility
    this.clearAllTokens();
  }

  static clearAllTokens(): void {
    // Clear tokens from both TokenManager and tokenService
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    localStorage.removeItem(this.STORAGE_TYPE_KEY);
    sessionStorage.removeItem(this.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    
    // Also clear tokens in tokenService
    tokenService.clearTokens();
    
    // Force clear any user-related data that might be cached
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user_data');
    
    console.log('All tokens and user data cleared successfully');
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

  static hasValidTokens(): boolean {
    try {
      const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
      if (!storageType) return false;
      
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      const access = storage.getItem(this.ACCESS_TOKEN_KEY);
      const refresh = storage.getItem(this.REFRESH_TOKEN_KEY);
      
      // Check both TokenManager and tokenService for consistency
      const tokenServiceHasTokens = tokenService.hasValidTokens();
      
      // For debugging
      console.log('Token validation check:', {
        storageType,
        hasAccess: !!access,
        hasRefresh: !!refresh,
        isExpired: access ? this.isTokenExpired() : true,
        tokenServiceHasTokens
      });
      
      // If there's a mismatch, synchronize the tokens
      if ((!!access && !!refresh) !== tokenServiceHasTokens) {
        console.warn('Token state mismatch detected between TokenManager and tokenService');
        if (access && refresh && !tokenServiceHasTokens) {
          // Sync to tokenService
          tokenService.setTokens(access, refresh, storageType === 'local');
        } else if (tokenServiceHasTokens && (!access || !refresh)) {
          // We'll return false and let the system handle re-authentication
          return false;
        }
      }
      
      return !!(access && refresh && !this.isTokenExpired());
    } catch (error) {
      console.error('Error in hasValidTokens:', error);
      return false;
    }
  }

  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        console.error('No refresh token available');
        return false;
      }

      const response = await axios.post<TokenResponse>(
        `${this.API_BASE_URL}/accounts/token/refresh/`,
        { refresh: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000 // Increased timeout to 30 seconds
        }
      );

      if (!response.data?.access) {
        console.error('Invalid refresh token response');
        return false;
      }

      // Store new access token
      const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY);
      const storage = storageType === 'local' ? localStorage : sessionStorage;
      storage.setItem(this.ACCESS_TOKEN_KEY, response.data.access);

      // Update token expiry
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + 30);
      storage.setItem(this.TOKEN_EXPIRY_KEY, expiry.getTime().toString());
      
      // Also update in tokenService
      tokenService.setToken(response.data.access);

      // Verify token storage with retry mechanism
      let retries = 0;
      const maxRetries = 2;
      
      const verifyToken = (): Promise<boolean> => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const storedToken = this.getAccessToken();
            if (!storedToken) {
              if (retries < maxRetries) {
                retries++;
                console.warn(`Token storage verification failed, retrying (${retries}/${maxRetries})...`);
                resolve(verifyToken());
              } else {
                console.error('Token storage verification failed after retries');
                resolve(false);
              }
            } else {
              console.log('Token refresh verified successfully');
              resolve(true);
            }
          }, 200);
        });
      };
      
      return await verifyToken();
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAllTokens();
      return false;
    }
  }
  
  static logout(): void {
    // Enhanced logout that ensures all auth-related data is cleared
    this.clearAllTokens();
    
    // Clear any additional user-related data
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_profile');
    sessionStorage.removeItem('user_data');
    sessionStorage.removeItem('user_profile');
    
    console.log('User logged out successfully');
  }
}

export default TokenManager; 