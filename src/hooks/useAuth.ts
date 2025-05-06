import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import marketplaceService from '../services/marketplaceService';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });
  const navigate = useNavigate();

  // Check if user is authenticated
  const checkAuth = useCallback(() => {
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
          // Legacy token with no expiration, consider it valid
          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
          });
          
          // Ensure axios headers are set
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return;
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
  }, []);

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
  }, []);

  // Logout function
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
    
    // Navigate to home
    navigate('/');
  }, [navigate]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    
    // Set up interval to periodically check token expiration
    const interval = setInterval(checkAuth, 60000); // Check every minute
    
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
  };
};

export default useAuth; 