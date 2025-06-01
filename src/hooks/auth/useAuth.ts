import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';
import TokenManager from '../../services/tokenManager';
import { User } from '../../schemas/auth';
import { useState, useEffect, useCallback } from 'react';

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
    mutationFn: (data: LoginData) => 
      apiService.auth.login(data),
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
      
      if (!response || !response.data) {
        console.error('No profile data received');
        setError(new Error('No profile data received'));
        setProfile(null);
        return;
      }
      
      // Map the profile data to User type
      const profileData = response.data;
      const userData: User = {
        id: profileData.user || profileData.id,
        email: profileData.email,
        username: profileData.username,
        profile: {
          name: profileData.name,
          phone: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          country: profileData.country,
          postal_code: profileData.postal_code,
          profile_photo: profileData.profile_photo,
          vehicle_name: profileData.vehicle_name,
          vehicle_type: profileData.vehicle_type,
          manufacturer: profileData.manufacturer
        }
      };
      
      setProfile(userData);
      setError(null);
    } catch (error: any) {
      console.error('Profile fetch error:', error);
      if (error.response?.status === 401) {
        TokenManager.clearTokens();
      }
      setError(error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      await fetchProfile();
    };
    loadProfile();
  }, [hasToken]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    return fetchProfile();
  }, []);

  return { data: profile, isLoading, error, refetch };
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