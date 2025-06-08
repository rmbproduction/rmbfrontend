import React from 'react';

const VerifyEmailPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow text-center max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-[#FF5733]">Verify Your Email</h1>
        <p className="mb-4 text-gray-700">
          We have sent a verification link to your email address.<br />
          Please check your inbox and follow the instructions to verify your account.
        </p>
        <p className="text-gray-500 text-sm">
          Didn&apos;t receive the email? Please check your spam folder or <a href="/contact" className="text-[#FF5733] hover:underline">contact support</a>.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 