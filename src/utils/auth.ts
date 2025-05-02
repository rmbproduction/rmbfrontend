/**
 * Authentication utility functions
 */

/**
 * Check if the user is authenticated
 * @returns boolean indicating authentication status
 */
export const checkUserAuthentication = (): boolean => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return false;
  }
  return true;
}; 