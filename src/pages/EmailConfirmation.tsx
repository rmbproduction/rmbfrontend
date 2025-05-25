import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { authApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const EmailConfirmation = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail(key || '');
        
        if (response.status === 'success') {
          toast.success(response.message || 'Email verified successfully!');
          setSuccess(true);
          
          // Wait for 3 seconds before redirecting
          setTimeout(() => {
            // Use the redirect_url from the backend if available, otherwise default to login page
            if (response.redirect_url) {
              if (response.redirect_url.startsWith('http')) {
                window.location.href = response.redirect_url;
              } else {
                navigate(response.redirect_url);
              }
            } else {
              navigate('/login-signup');
            }
          }, 3000);
        }
      } catch (error: any) {
        setSuccess(false);
        const errorMessage = error.response?.data?.message || "An error occurred during email verification";
        toast.error(errorMessage);
      } finally {
        setLoading(false);
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