import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Loader } from 'lucide-react';
import { apiService, API_CONFIG } from '../config/api.config';

const VerifyEmail = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('Verification token is missing');
        setIsVerifying(false);
        return;
      }

      try {
        console.log('Attempting to verify email with token:', token);
        // Construct the full verification URL
        const verificationUrl = `${API_CONFIG.baseURL}/accounts/verify-email/${token}/`;
        console.log('Making verification request to:', verificationUrl);
        
        const response = await apiService.auth.verifyEmail(token);
        console.log('Verification response:', response);

        if (response.status === 200 || response.status === 204) {
          toast.success('Email verified successfully!');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          throw new Error('Verification failed');
        }
      } catch (error: any) {
        console.error('Verification error:', error);
        console.error('Error response:', error.response);
        
        // Handle different error cases
        if (error.response?.status === 404) {
          setError('Invalid verification link or link has expired');
        } else if (error.response?.status === 400) {
          setError(error.response.data?.error || 'Invalid verification link');
        } else {
          setError('Failed to verify email. Please try again.');
        }
        
        toast.error('Email verification failed');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-4xl font-extrabold text-center text-gray-800">Email Verification</h2>
        <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
        
        {isVerifying ? (
          <div className="mt-8 flex flex-col items-center">
            <Loader className="animate-spin h-8 w-8 text-[#FF5733]" />
            <p className="mt-4 text-gray-600">Verifying your email...</p>
            <p className="mt-2 text-sm text-gray-500">This may take a few moments...</p>
          </div>
        ) : error ? (
          <div className="mt-8">
            <div className="p-4 bg-red-50 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => navigate('/resend-verification')}
                className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors"
              >
                Request New Verification Link
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-2 px-4 border border-[#FF5733] text-[#FF5733] rounded-md hover:bg-[#fff5f2] transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 text-center">
            <p className="text-green-600">Your email has been verified successfully!</p>
            <p className="mt-2 text-gray-600">Redirecting to login page...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; 