import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useVerifyEmail } from '../hooks/auth/useEmailVerification';

interface VerificationState {
  status: 'verifying' | 'success' | 'error';
  message: string;
}

const EmailVerification = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<VerificationState>({
    status: 'verifying',
    message: 'Verifying your email...'
  });

  const verifyEmail = useVerifyEmail();

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setState({
          status: 'error',
          message: 'No verification token provided.'
        });
        return;
      }

      try {
        await verifyEmail.mutateAsync(token);
        setState({
          status: 'success',
          message: 'Email verified successfully!'
        });
        toast.success('Email verified successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } catch (error: any) {
        setState({
          status: 'error',
          message: error.response?.data?.detail || 'Failed to verify email.'
        });
        toast.error('Failed to verify email.');
      }
    };

    verifyToken();
  }, [token, navigate, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
        {state.status === 'verifying' && (
          <>
            <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-800">Verifying Email</h2>
          </>
        )}
        
        {state.status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-800">Email Verified!</h2>
          </>
        )}
        
        {state.status === 'error' && (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-800">Verification Failed</h2>
          </>
        )}
        
        <p className="mt-2 text-gray-600">{state.message}</p>
        
        {state.status === 'error' && (
          <div className="mt-6">
            <button
              onClick={() => navigate('/resend-verification')}
              className="text-[#FF5733] hover:underline"
            >
              Resend verification email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;