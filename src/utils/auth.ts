import TokenManager from '../services/tokenManager';
 
export const checkUserAuthentication = (): boolean => {
  const token = TokenManager.getAccessToken();
  return !!token;
}; 