import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RefreshCw, Mail } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('loading');
  const [countdown, setCountdown] = useState(60);

  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.post(
          API_CONFIG.getApiUrl(`/auth/registration/account-confirm-email/${token}/`)
        );

        if (response.status === 200) {
          setVerificationStatus('success');
        } else {
          setVerificationStatus('error');
        }
      } catch (error) {
        setVerificationStatus('error');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setVerificationStatus('pending');
    }
  }, [token]);

  useEffect(() => {
    if ((verificationStatus === 'error' || verificationStatus === 'pending') && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verificationStatus, countdown]);

  const handleResendVerification = async () => {
    try {
      await axios.post(API_CONFIG.getApiUrl('/auth/resend-email/'), { email });
      setCountdown(60);
    } catch (error) {
      console.error('Failed to resend verification email');
    }
  };

  const handleContinue = () => {
    navigate('/login-signup');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg"
      >
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-[#FFF5F2]">
            <Mail className="h-8 w-8 text-[#FF5733]" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Email Verification</h2>
          <p className="mt-2 text-sm text-gray-600">
            {verificationStatus === 'loading' ? (
              'Verifying your email address...'
            ) : verificationStatus === 'success' ? (
              'Your email has been verified successfully!'
            ) : verificationStatus === 'pending' ? (
              `We sent a verification link to ${email}`
            ) : (
              'There was an error verifying your email.'
            )}
          </p>
        </div>

        <div className="mt-8">
          {verificationStatus === 'loading' ? (
            <div className="flex justify-center">
              <RefreshCw className="h-8 w-8 text-[#FF5733] animate-spin" />
            </div>
          ) : verificationStatus === 'success' ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <button
                onClick={handleContinue}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#FF5733] hover:bg-[#ff4019] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733]"
              >
                Continue to Login
              </button>
            </div>
          ) : verificationStatus === 'pending' ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <Mail className="h-16 w-16 text-[#FF5733]" />
              </div>
              <div className="text-center text-sm text-gray-600">
                <p>Please check your email inbox for the verification link</p>
                <button
                  onClick={handleResendVerification}
                  disabled={countdown > 0}
                  className={`mt-2 font-medium ${
                    countdown > 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-[#FF5733] hover:text-[#ff4019]'
                  }`}
                >
                  {countdown > 0
                    ? `Resend email in ${countdown}s`
                    : 'Click to resend verification email'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <XCircle className="h-16 w-16 text-red-500" />
              </div>
              <div className="text-center text-sm text-gray-600">
                <p>There was an error verifying your email.</p>
                <button
                  onClick={handleResendVerification}
                  disabled={countdown > 0}
                  className={`mt-2 font-medium ${
                    countdown > 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-[#FF5733] hover:text-[#ff4019]'
                  }`}
                >
                  {countdown > 0
                    ? `Resend email in ${countdown}s`
                    : 'Click to resend verification email'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-sm font-medium text-[#FF5733] hover:text-[#ff4019]"
          >
            Return to Homepage
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerification;
