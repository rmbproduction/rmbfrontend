import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '../utils/noToast';
import { API_CONFIG } from '../config/api.config';
import { CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const EmailConfirmation = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(API_CONFIG.getApiUrl(`/accounts/verify-email/${key}/`));
        
        if (response.data.status === 'success') {
          toast.success(response.data.message);
          
          // Wait for 3 seconds before redirecting
          setTimeout(() => {
            // Use the redirect_url from the backend if available, otherwise default to login page
            if (response.data.redirect_url) {
              // Use full URL if it's a complete URL, otherwise navigate internally
              if (response.data.redirect_url.startsWith('http')) {
                window.location.href = response.data.redirect_url;
              } else {
                navigate(response.data.redirect_url);
              }
            } else {
              navigate('/login-signup');
            }
          }, 3000);
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || "An error occurred during email verification";
        toast.error(errorMessage);
      } finally {
        setVerifying(false);
        setLoading(false);
        setSuccess(true);
      }
    };

    verifyEmail();
  }, [key, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        {loading ? (
          <div className="text-center">
            <LoadingSpinner size="lg" message="Verifying your email..." />
          </div>
        ) : success ? (
          <div className="text-center">
            <CheckCircle className="text-green-500 w-16 h-16 mb-4" />
            <p className="text-gray-600">Redirecting to login page...</p>
          </div>
        ) : (
          <div className="text-center">
            <AlertCircle className="text-red-500 w-16 h-16 mb-4" />
            <p className="text-gray-600">An error occurred during email verification. Please try again later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation;
