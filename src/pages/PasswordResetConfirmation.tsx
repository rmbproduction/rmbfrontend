import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_CONFIG } from '../config/api.config';

const PasswordResetConfirmation = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Extract token from URL path
  const token = location.pathname.split('/').pop();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match!', {
        position: 'top-center',
        autoClose: 5000,
      });
      return;
    }

    try {
      const response = await axios.post(
        API_CONFIG.getApiUrl(`/accounts/password-reset/${token}/`),
        { password }
      );

      toast.success('Password has been reset successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Redirect to login page
      navigate('/login-signup');
    } catch (error: any) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error, {
          position: 'top-right',
          autoClose: 5000,
        });
      } else {
        toast.error('An error occurred. Please try again.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <h2 className="text-4xl font-extrabold text-center text-gray-800">Reset Password</h2>
        <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
        <p className="mt-3 text-center text-gray-500">Enter your new password</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetConfirmation;
