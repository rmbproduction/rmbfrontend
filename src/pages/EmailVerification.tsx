import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { authApi } from '../services/api';
import { getTokenError } from '../utils/tokenUtils';

const EmailVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent double verification attempts
      if (verificationAttempted.current) return;
      verificationAttempted.current = true;

      if (!token) {
        console.log('No token provided');
        setError('Verification token is missing');
        setVerifying(false);
        return;
      }

      console.log('Attempting to verify email with token:', token);

      // Validate token format
      const tokenError = getTokenError(token);
      if (tokenError) {
        console.log('Token validation failed:', tokenError);
        setError(tokenError);
        setVerifying(false);
        toast.error(tokenError);
        return;
      }

      try {
        console.log('Making API request to verify email...');
        const response = await authApi.verifyEmail(token);
        console.log('Verification API response:', response);
        
        setVerified(true);
        setError(null);
        toast.success(response.message || 'Email verified successfully!');
        
        // Extract path from full URL if needed and map to correct frontend route
        let redirectPath = response.redirect_url || '/login/';
        try {
          if (redirectPath.startsWith('http')) {
            const url = new URL(redirectPath);
            redirectPath = url.pathname + url.search + url.hash;
          }
          
          // Map backend routes to frontend routes
          const routeMapping: Record<string, string> = {
            '/login-signup': '/login/',
            'http://localhost:5173/login-signup': '/login/'
          };
          
          redirectPath = routeMapping[redirectPath] || redirectPath;
        } catch (e) {
          redirectPath = '/login/';
        }

        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 3000);
      } catch (error: any) {
        console.error('Verification failed:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.message);
        
        // Handle the case where the email was already verified
        if (error.response?.status === 400 && error.response?.data?.verified) {
          setVerified(true);
          setError(null);
          toast.info('Email was already verified. Redirecting to login...');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
          return;
        }

        const errorMessage = 
          error.response?.data?.message ||
          error.response?.data?.detail ||
          error.response?.data?.error ||
          (error.response?.status === 400 ? 'Invalid or expired verification link' : 'Failed to verify email');
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {verifying
              ? 'Verifying your email...'
              : verified
              ? 'Your email has been verified!'
              : error || 'Failed to verify email'}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          {verifying ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
          ) : verified ? (
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <p className="mt-4 text-sm text-gray-600">
                Redirecting to login page...
              </p>
            </div>
          ) : (
            <div className="text-center">
              {error?.includes('expired') ? (
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
              ) : (
                <XCircle className="mx-auto h-12 w-12 text-red-500" />
              )}
              <p className="mt-4 text-sm text-gray-600">
                {error || 'Please try again or contact support if the problem persists.'}
              </p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => navigate('/login')}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF5733] hover:bg-[#ff4019] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
                >
                  Go to Login
                </button>
                {error?.includes('expired') && (
                  <button
                    onClick={() => navigate('/resend-verification')}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-[#FF5733] text-sm font-medium rounded-md shadow-sm text-[#FF5733] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
                  >
                    Resend Verification Email
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;