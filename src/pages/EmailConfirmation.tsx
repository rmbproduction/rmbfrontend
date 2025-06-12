import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { axiosInstance, API_ENDPOINTS } from '../config/api.config';

const EmailConfirmation = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!key) {
        setVerificationStatus('error');
        setErrorMessage('No verification key provided');
        return;
      }

      try {
        console.log('Attempting to verify email with key:', key);
        const response = await axiosInstance.get(API_ENDPOINTS.auth.verifyEmail(key));
        console.log('Verification response:', response);

        // Check if the response indicates success
        if (response.status === 200 || response.status === 204) {
          console.log('Email verification successful');
          setVerificationStatus('success');
          // Redirect to login after 3 seconds on success
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          console.log('Unexpected response status:', response.status);
          setVerificationStatus('error');
          setErrorMessage('Unexpected response from server');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        console.error('Error response:', error.response);
        
        setVerificationStatus('error');
        // Handle different error scenarios
        if (error.response?.status === 404) {
          setErrorMessage('Invalid verification link or link has expired');
        } else if (error.response?.data?.message) {
          setErrorMessage(error.response.data.message);
        } else if (error.response?.data?.detail) {
          setErrorMessage(error.response.data.detail);
        } else {
          setErrorMessage('Failed to verify email address. Please try again.');
        }
      }
    };

    verifyEmail();
  }, [key, navigate]);

  const renderContent = () => {
    switch (verificationStatus) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-gray-800">Verifying Email</h2>
            <div className="mt-2 h-1 w-16 bg-blue-500 mx-auto mb-6" />
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-gray-800">Email Verified!</h2>
            <div className="mt-2 h-1 w-16 bg-green-500 mx-auto mb-6" />
            <p className="text-gray-600">Your email has been successfully verified.</p>
            <p className="text-gray-600 mt-2">Redirecting to login page...</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-gray-800">Verification Failed</h2>
            <div className="mt-2 h-1 w-16 bg-red-500 mx-auto mb-6" />
            <p className="text-gray-600 mb-8">{errorMessage}</p>
            <div className="space-y-4">
              <button
                onClick={() => navigate('/login')}
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
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8"
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

export default EmailConfirmation;