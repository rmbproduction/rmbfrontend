import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';
import TokenManager from '../../services/tokenManager';
import { User } from '../../schemas/auth';
import { useState, useEffect } from 'react';

interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
}

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginData) => {
      console.log('Login mutation data:', {
        email: data.email,
        password: data.password ? 'PROVIDED' : 'MISSING',
        rememberMe: data.rememberMe
      });
      
      const response = await apiService.auth.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      });

      // Transform the response to match expected format
      if (response.data) {
        const transformedData = {
          ...response,
          data: {
            user: response.data.user,
            tokens: {
              access: response.data.access,
              refresh: response.data.refresh
            }
          }
        };
        console.log('Transformed login response:', {
          hasTokens: !!transformedData.data.tokens,
          hasUser: !!transformedData.data.user
        });
        return transformedData;
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useSignup = () => {
  return useMutation({
    mutationFn: (data: SignupData) => 
      apiService.auth.signup(data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { refresh_token: string }) => 
      apiService.auth.logout(data),
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useProfile = () => {
  const hasToken = !!TokenManager.getAccessToken();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!hasToken) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching profile data...');
        const response = await apiService.auth.getProfile();
        console.log('Profile response:', response);
        
        if (!response.data) {
          console.log('No profile data received');
          TokenManager.clearTokens();
          setProfile(null);
          return;
        }
        
        // Check if the response has the user data in the correct format
        const userData = response.data.user || response.data;
        if (!userData || !userData.email) {
          console.error('Invalid profile data format:', userData);
          TokenManager.clearTokens();
          setProfile(null);
          return;
        }
        
        setProfile(userData);
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        if (error.response?.status === 401) {
          TokenManager.clearTokens();
        }
        setError(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [hasToken]);

  return { data: profile, isLoading, error };
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiService.auth.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: apiService.auth.forgotPassword,
  });
};

export const useGoogleLogin = () => {
  return useMutation({
    mutationFn: apiService.auth.googleLogin,
  });
}; 