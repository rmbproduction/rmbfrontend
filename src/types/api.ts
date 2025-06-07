export interface User {
  id: number;
  username: string;
  email: string;
  email_verified: boolean;
  name: string;
  phone_number?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  profile_photo?: string;
  vehicle_type?: {
    id: number;
    name: string;
  };
  manufacturer?: {
    id: number;
    name: string;
  };
  vehicle_name?: {
    id: number;
    name: string;
  };
}

export interface LoginResponse {
  message: string;
  is_first_login: boolean;
  tokens: {
    access: string;
    refresh: string;
  };
  user: User;
}

export interface SignupResponse {
  message: string;
  user: User;
}

export interface GoogleAuthResponse {
  auth_url: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyEmailResponse {
  message: string;
  email_verified: boolean;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
} 