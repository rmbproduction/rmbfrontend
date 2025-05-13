import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import marketplaceService from '../services/marketplaceService';
import { API_CONFIG } from '../config/api.config';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
}

interface TokenResponse {
  access: string;
  refresh: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });
  const navigate = useNavigate();
  
  // Logout function - moving this before checkAuth to fix reference issue
  const logout = useCallback(() => {
    // Clear user session data
    marketplaceService.clearUserSession();
    
    // Clear authentication tokens
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiration');
    localStorage.removeItem('rememberMe');
    
    // Clear axios auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Update state
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
    
    // Dispatch a custom event to notify all components about the auth state change
    window.dispatchEvent(new Event('auth-state-changed'));
    
    // Navigate to home
    navigate('/');
  }, [navigate]);
  
  // Token refresh function
  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      return false;
    }
    
    try {
      const response = await axios.post<TokenResponse>(
        `${API_CONFIG.BASE_URL}/auth/refresh/`,
        { refresh: refreshToken }
      );
      
      const { access } = response.data;
      
      // Calculate new expiration time based on whether "remember me" was selected
      const rememberMe = localStorage.getItem('rememberMe') === 'true';
      const expirationTime = rememberMe 
        ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        : Date.now() + (24 * 60 * 60 * 1000); // 1 day
      
      // Update tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('tokenExpiration', expirationTime.toString());
      
      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, []);

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    const tokenExpiration = localStorage.getItem('tokenExpiration');
    
    if (userStr && token) {
      try {
        const user = JSON.parse(userStr);
        
        // Check token expiration
        if (tokenExpiration) {
          const expirationTime = parseInt(tokenExpiration, 10);
          const currentTime = Date.now();
          
          // If token is about to expire (less than 5 minutes left), try to refresh it
          if (currentTime > expirationTime - 5 * 60 * 1000) {
            const refreshed = await refreshToken();
            
            if (!refreshed) {
              // If refresh failed, log the user out
              logout();
              return;
            }
          }
          
          if (currentTime < expirationTime) {
            // Token is valid
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false,
            });
            
            // Ensure axios headers are set
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return;
          }
        } else {
          // Legacy token with no expiration, try to validate against backend
          try {
            // Make a lightweight call to validate the token
            await axios.get(`${API_CONFIG.BASE_URL}/auth/verify/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            // If successful, the token is valid
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false,
            });
            
            // Ensure axios headers are set
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return;
          } catch (error) {
            // Token validation failed, try to refresh
            const refreshed = await refreshToken();
            
            if (!refreshed) {
              // If refresh failed, log the user out
              logout();
              return;
            }
            
            // If refresh succeeded, set auth state
            setAuthState({
              isAuthenticated: true,
              user,
              loading: false,
            });
            return;
          }
        }
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
    
    // Not authenticated or token expired
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
    
    // Clear axios auth header
    delete axios.defaults.headers.common['Authorization'];
  }, [logout, refreshToken]);

  // Login function
  const login = useCallback((userData: any, tokens: any, rememberMe: boolean = false) => {
    // Calculate expiration time
    const expirationTime = rememberMe 
      ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
      : Date.now() + (24 * 60 * 60 * 1000); // 1 day
    
    // Store authentication data
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
    localStorage.setItem('tokenExpiration', expirationTime.toString());
    localStorage.setItem('rememberMe', rememberMe.toString());
    
    // Update axios headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
    
    // Update state
    setAuthState({
      isAuthenticated: true,
      user: userData,
      loading: false,
    });
    
    // Dispatch a custom event to notify all components about the auth state change
    // This ensures the Navbar immediately updates without requiring a page refresh
    window.dispatchEvent(new Event('auth-state-changed'));
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    
    // Set up interval to periodically check token expiration
    const interval = setInterval(checkAuth, 5 * 60 * 1000); // Check every 5 minutes
    
    // Listen for storage events (login/logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'user') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  return {
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    loading: authState.loading,
    login,
    logout,
    checkAuth,
    refreshToken,
  };
};

export default useAuth; 