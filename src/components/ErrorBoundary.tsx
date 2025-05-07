import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * A React error boundary to catch JavaScript errors anywhere in the component tree,
 * log those errors, and display a fallback UI instead of crashing the whole app.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Store the error info in state for rendering
    this.setState({
      errorInfo
    });
    
    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // You could also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }
  
  handleRefresh = (): void => {
    // Clear error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    
    // Reload the current page
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center text-red-500 mb-4">
                <AlertCircle size={50} />
              </div>
              <h2 className="text-center text-2xl font-bold text-gray-800 mb-2">
                Something went wrong
              </h2>
              <p className="text-gray-600 text-center mb-6">
                We're sorry, but an error occurred while rendering this page.
              </p>
              
              {/* Display error details in development */}
              {process.env.NODE_ENV !== 'production' && this.state.error && (
                <div className="bg-gray-100 p-4 rounded-md mb-4 overflow-auto max-h-48">
                  <p className="font-mono text-sm text-red-600 mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-700 mb-1">
                        Stack trace
                      </summary>
                      <pre className="whitespace-pre-wrap text-xs overflow-auto">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={this.handleRefresh}
                  className="flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg py-2 px-4 transition-colors"
                >
                  <RefreshCw size={18} />
                  Refresh page
                </button>
                <a
                  href="/"
                  className="flex items-center justify-center gap-2 text-gray-800 bg-gray-200 hover:bg-gray-300 font-medium rounded-lg py-2 px-4 transition-colors"
                >
                  <Home size={18} />
                  Go to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 