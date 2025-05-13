import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Verifying authentication..." />
      </div>
    );
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