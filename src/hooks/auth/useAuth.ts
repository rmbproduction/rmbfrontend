import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';
import TokenManager from '../../services/tokenManager';
import { User } from '../../schemas/auth';

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
  
  return useQuery<User | null>({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        console.log('Fetching profile data...');
        const response = await apiService.auth.getProfile();
        console.log('Profile response:', response);
        
        if (!response.data) {
          console.log('No profile data received');
          TokenManager.clearTokens();
          return null;
        }
        
        // Check if the response has the user data in the correct format
        const userData = response.data.user || response.data;
        if (!userData || !userData.email) {
          console.error('Invalid profile data format:', userData);
          TokenManager.clearTokens();
          return null;
        }
        
        return userData;
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        if (error.response?.status === 401) {
          TokenManager.clearTokens();
        }
        throw error;
      }
    },
    enabled: hasToken,
    retry: 1,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });
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