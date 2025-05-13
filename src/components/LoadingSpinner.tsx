import React from 'react';
import { Loader } from 'lucide-react';

interface LoadingSpinnerProps {
  // Display variants
  variant?: 'default' | 'inline' | 'button' | 'fullscreen';
  
  // Sizing options
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Styling
  color?: string;
  bgColor?: string;
  className?: string;
  
  // Content
  message?: string;
  showMessage?: boolean;
}

/**
 * Universal LoadingSpinner component
 * Used for all loading states across the application
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  variant = 'default',
  size = 'md', 
  color = '#FF5733',
  bgColor,
  className = '',
  message = 'Loading...',
  showMessage = true
}) => {
  // Size mapping for the spinner
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Text size mapping based on spinner size
  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  // Create specific variant configurations
  const variantClasses = {
    default: 'flex flex-col items-center justify-center',
    inline: 'inline-flex items-center',
    button: 'inline-flex mr-2',
    fullscreen: 'fixed inset-0 flex flex-col items-center justify-center bg-white/80 z-50'
  };

  // For button variant, override some settings
  if (variant === 'button') {
    showMessage = false;
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`} style={{ backgroundColor: bgColor }}>
      <Loader 
        className={`${sizeClasses[size]} animate-spin`} 
        style={{ color }}
      />
      
      {showMessage && message && (
        <p className={`${variant === 'inline' ? 'ml-2' : 'mt-4'} ${textSizeClasses[size]} text-gray-700`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 