import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { axiosInstance, API_ENDPOINTS } from '../config/api.config';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(60);
  const email = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ success?: string; error?: string }>({});

  useEffect(() => {
    if (!email) {
      setTimeout(() => {
        navigate('/login-signup');
      }, 3000);
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      setResendStatus({ error: 'Email address is required' });
      return;
    }

    try {
      setIsLoading(true);
      await axiosInstance.post(API_ENDPOINTS.auth.resendVerification, { email });
      setCountdown(60);
      setResendStatus({ success: 'Verification email has been resent!' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to resend verification email';
      setResendStatus({ error: errorMessage });
    } finally {
      setIsLoading(false);
      // Clear status after 3 seconds
      setTimeout(() => setResendStatus({}), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center"
      >
        {!email ? (
          // Show error state if no email
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-gray-800">Missing Email</h2>
            <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto mb-6" />
            <p className="text-gray-600 mb-8">No email address was provided. Redirecting to login page...</p>
          </div>
        ) : (
          // Show verification waiting state
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-[#FFF5F2]">
              <Mail className="h-8 w-8 text-[#FF5733]" />
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-gray-800">Check Your Email</h2>
            <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto mb-6" />
            
            <div className="space-y-6">
              <div className="text-center text-sm text-gray-600">
                <p className="mb-4">We've sent a verification link to:</p>
                <p className="font-medium text-gray-800 text-lg mb-4 break-all">{email}</p>
                <p className="mb-4">
                  Please check your email inbox and click the verification link to complete your registration.
                  Don't forget to check your spam folder if you can't find the email.
                </p>
                
                {/* Status messages */}
                {resendStatus.success && (
                  <div className="mb-4 text-green-600 font-medium">
                    {resendStatus.success}
                  </div>
                )}
                {resendStatus.error && (
                  <div className="mb-4 text-red-600 font-medium">
                    {resendStatus.error}
                  </div>
                )}
                
                <button
                  onClick={handleResendVerification}
                  disabled={countdown > 0 || isLoading}
                  className={`inline-flex items-center justify-center mt-2 font-medium ${
                    countdown > 0 || isLoading
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-[#FF5733] hover:text-[#ff4019]'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Sending...
                    </>
                  ) : countdown > 0 ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Resend available in {countdown}s
                    </>
                  ) : (
                    'Resend verification email'
                  )}
                </button>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={() => navigate('/login-signup')}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#FF5733] hover:bg-[#ff4019] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
              >
                Return to Login
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="text-sm font-medium text-[#FF5733] hover:text-[#ff4019]"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EmailVerification;