import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Signup Schema
export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type SignupInput = z.infer<typeof signupSchema>;

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// User Type
export interface User {
  id: number;
  email: string;
  username: string;
  is_first_login?: boolean;
  isVerified?: boolean;
  created_at?: string;
  name?: string;
  phone?: string;
  address?: string;
  preferred_location?: string;
  profile?: {
    name: string;
    phone: string;
    address: string;
    profile_photo?: string | null;
    preferred_location?: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    vehicle_name: number | null;
    vehicle_type: number | null;
    manufacturer: number | null;
  };
}

// API Response Types
export interface AuthResponse {
  message: string;
  status: 'success' | 'error';
  verified?: boolean;
  user?: User;
  redirect_url?: string;
}

export interface LoginResponse extends AuthResponse {
  tokens: {
    access: string;
    refresh: string;
  };
  is_first_login: boolean;
  user: User;
}

export interface UserResponse {
  user: User;
}

// Profile Update Types
export interface ProfileUpdateData {
  username?: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  preferred_location?: string;
  avatar?: File;
  vehicle_name?: number | null;
  vehicle_type?: number | null;
  manufacturer?: number | null;
}

// Profile Update Schema
export const profileUpdateSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
  name: z.string().max(255, 'Name must be less than 255 characters').optional(),
  phone: z.string().max(15, 'Phone must be less than 15 characters').optional(),
  address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  preferred_location: z.string().max(255, 'Preferred location must be less than 255 characters').optional(),
  avatar: z.instanceof(File).optional(),
});

export type ProfileUpdatePayload = ProfileUpdateData | FormData; 