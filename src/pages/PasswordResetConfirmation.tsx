import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const PasswordResetConfirmation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Password Reset Successful
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Your password has been successfully reset. You will be redirected to the login page in a few seconds.
        </p>
      </div>
    </div>
  );
};

export default PasswordResetConfirmation;