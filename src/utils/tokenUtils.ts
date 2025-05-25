import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  exp?: number;
  iat?: number;
  email?: string;
}

const tokenRegex = /^[A-Za-z0-9_-]+$/;

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<TokenPayload>(token);
    if (!decoded.exp) return true;
    
    // Check if current time is past expiration
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true; // If we can't decode the token, consider it expired
  }
};

// Email verification tokens are handled differently from JWT tokens
export const isTokenValid = (token: string): boolean => {
  // Only check the format for email verification tokens
  if (!tokenRegex.test(token)) return false;
  if (token.length < 32) return false;
  return true;
};

export const getTokenError = (token: string): string | null => {
  if (!token) return 'Verification token is missing';
  if (!tokenRegex.test(token)) return 'Invalid token format';
  if (token.length < 32) return 'Token length is invalid';
  return null;
}; 