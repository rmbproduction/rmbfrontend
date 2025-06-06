import { useGoogleLogin } from '../../hooks/auth/useAuth';
import { FaGoogle } from 'react-icons/fa';
import { toast } from 'react-toastify';

export const GoogleLoginButton = () => {
  const googleLoginMutation = useGoogleLogin();

  const handleGoogleLogin = async () => {
    try {
      const response = await googleLoginMutation.mutateAsync();
      if (response.data?.auth_url) {
        // Redirect to Google's auth URL
        window.location.href = response.data.auth_url;
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error('Failed to initialize Google login');
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
    >
      <FaGoogle className="text-[#4285F4]" />
      <span>Continue with Google</span>
    </button>
  );
}; 