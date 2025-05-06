import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733]"></div>
    </div>;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Redirect to login with the current path as a redirect destination
    return <Navigate to="/login-signup" state={{ from: location.pathname }} />;
  }
  
  // If authenticated, render the protected component
  return <>{children}</>;
};

export default ProtectedRoute; 