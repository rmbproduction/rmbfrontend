import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '../utils/noToast';
import { API_CONFIG } from '../config/api.config';

const EmailConfirmation = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

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
      }
    };

    verifyEmail();
  }, [key, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-4">Email Verification</h2>
        <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto mb-6" />
        
        {verifying ? (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF5733] mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        ) : (
          <p className="text-gray-600">Redirecting to login page...</p>
        )}
      </div>
    </div>
  );
};

export default EmailConfirmation;
