import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';

export const useVerifyEmail = () => {
  return useMutation({
    mutationFn: (token: string) => 
      apiService.auth.verifyEmail(token),
  });
};

export const useResendVerification = () => {
  return useMutation({
    mutationFn: (email: string) => 
      apiService.auth.resendVerification(email),
  });
}; 