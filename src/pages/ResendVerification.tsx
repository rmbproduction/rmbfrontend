import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Loader } from 'lucide-react';
import { useResendVerification } from '../hooks/auth/useEmailVerification';

const ResendVerification = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const resendVerification = useResendVerification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await resendVerification.mutateAsync(email);
      toast.success('Verification email sent successfully!');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to send verification email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Resend Verification Email
        </h2>
        <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
        <p className="mt-4 text-center text-gray-600">
          Enter your email address and we'll send you a new verification link.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#FF5733] focus:border-[#FF5733]"
              placeholder="Enter your email"
            />
          </div>

          <button
            type="submit"
            disabled={resendVerification.isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#FF5733] hover:bg-[#ff4019] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5733] disabled:opacity-50"
          >
            {resendVerification.isPending ? (
              <>
                <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                Sending...
              </>
            ) : (
              'Send Verification Email'
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-[#FF5733] hover:underline"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResendVerification; 