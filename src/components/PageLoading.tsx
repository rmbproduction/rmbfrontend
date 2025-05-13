import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PageLoadingProps {
  message?: string;
}

/**
 * PageLoading - A standardized full-page loading component
 * Used for consistent loading states across full page transitions
 */
const PageLoading: React.FC<PageLoadingProps> = ({ 
  message = 'Loading page content...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner 
        size="lg" 
        message={message}
      />
    </div>
  );
};

export default PageLoading; 