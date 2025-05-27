import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../config/api.config';

interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

export const useResetPassword = (token: string) => {
  return useMutation({
    mutationFn: (data: ResetPasswordData) => 
      apiService.auth.resetPassword(token, data),
  });
}; 