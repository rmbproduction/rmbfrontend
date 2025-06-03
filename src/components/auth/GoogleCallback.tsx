import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Loader } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api.config';

export const GoogleCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');

        if (!code) {
          toast.error('No authorization code received');
          navigate('/login-signup');
          return;
        }

        // Exchange the code for tokens
        const response = await axios({
          method: 'GET',
          url: `${API_CONFIG.baseURL}/accounts/google/callback/`,
          params: { code },
          withCredentials: true
        });

        if (response.data?.tokens) {
          // Handle successful login with tokens
          await login(response.data.tokens);
          toast.success('Successfully logged in with Google!');
          navigate('/profile');
        } else {
          throw new Error('No tokens received from server');
        }
      } catch (error: any) {
        console.error('Google OAuth error:', error);
        toast.error(error.response?.data?.error || 'Failed to authenticate with Google');
        navigate('/login-signup');
      }
    };

    handleCallback();
  }, [location, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4]">
      <div className="text-center">
        <Loader className="animate-spin h-8 w-8 text-[#FF5733] mx-auto mb-4" />
        <p className="text-gray-600">Completing Google sign-in...</p>
      </div>
    </div>
  );
}; 