// LoginSignupPage.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa";
import { Loader } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../config/api.config";

// Schema imports
import { loginSchema, signupSchema, forgotPasswordSchema } from "../schemas/auth";
import type { LoginInput, SignupInput, ForgotPasswordInput } from "../schemas/auth";

// Define a static API URL for the static version

type Mode = "login" | "signup" | "forgot";

// Animation variants
const pageVariants = {
  initial: (direction: number) => ({
    x: direction * 250,
    opacity: 0,
  }),
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.4 }
    }
  },
  exit: (direction: number) => ({
    x: direction * -250,
    opacity: 0,
    transition: {
      x: { type: "spring", stiffness: 300, damping: 30 },
      opacity: { duration: 0.4 }
    }
  })
};

const LoginSignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get redirect path from location state
  const from = location.state?.from?.pathname || "/profile";
  
  const [mode, setMode] = useState<Mode>("login");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    rememberMe: true
  });
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      try {
        const validatedData = loginSchema.parse(data);
        await login(validatedData.email, validatedData.password);
        return { success: true };
      } catch (error: any) {
        if (error.errors) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }
    },
    onSuccess: () => {
      navigate(from, { replace: true });
      toast.success("Successfully logged in!");
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async (data: SignupInput) => {
      try {
        const validatedData = signupSchema.parse(data);
        return await apiService.auth.signup(validatedData);
      } catch (error: any) {
        if (error.errors) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }
    },
    onSuccess: (response) => {
      if (response?.data?.verification_token || response?.data?.key) {
        const token = response.data.verification_token || response.data.key;
        navigate(`/verify-email/${token}`);
      } else {
        navigate("/verify-email");
      }
      toast.success(response?.data?.message || "Account created! Please verify your email.");
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      try {
        const validatedData = forgotPasswordSchema.parse(data);
        const response = await apiService.auth.forgotPassword(validatedData);
        return response.data;
      } catch (error: any) {
        if (error.errors) {
          throw new Error(error.errors[0].message);
        }
        throw error;
      }
    },
    onSuccess: () => {
      sessionStorage.setItem('resetPasswordEmail', formData.email);
      navigate("/password-reset-confirmation");
      toast.success("Password reset link sent to your email!");
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });

  // Google login mutation
  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      const response = await apiService.auth.googleLogin();
      return response.data;
    },
    onSuccess: (data: { auth_url: string }) => {
      window.location.href = data.auth_url;
    },
    onError: (error: any) => {
      handleApiError(error);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    if (error) setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleApiError = (error: any) => {
    if (error.response?.data) {
      const data = error.response.data;
      if (data.detail) {
        setError(data.detail);
      } else if (data.non_field_errors) {
        setError(data.non_field_errors[0]);
      } else {
        const firstError = Object.entries(data)[0] as [string, string[]];
        if (firstError) {
          setError(`${firstError[0]}: ${firstError[1][0]}`);
        }
      }
    } else if (error.message) {
      setError(error.message);
    } else {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      if (mode === "login") {
        loginMutation.mutate({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe
        });
      } else if (mode === "signup") {
        signupMutation.mutate({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
      } else if (mode === "forgot") {
        forgotPasswordMutation.mutate({
          email: formData.email
        });
      }
    } catch (error: any) {
      if (error.errors) {
        setError(error.errors[0].message);
      }
    }
  };

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate();
  };

  const switchMode = (newMode: Mode) => {
    setDirection(
      mode === "login" && newMode === "signup" ? 1 : 
      mode === "signup" && newMode === "login" ? -1 :
      mode === "login" && newMode === "forgot" ? 1 : 
      mode === "forgot" && newMode === "login" ? -1 : 0
    );
    
    setFormData({
      username: "",
      email: "",
      password: "",
      rememberMe: true
    });
    setError("");
    setMode(newMode);
  };

  const isLoading = loginMutation.isPending || signupMutation.isPending || 
                    forgotPasswordMutation.isPending || googleLoginMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={mode}
            custom={direction}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full"
          >
            {mode === "login" && (
              <>
                <h2 className="text-4xl font-extrabold text-center text-gray-800">Welcome Back</h2>
                <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
                <p className="mt-3 text-center text-gray-500">Log in to your account</p>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                        required
                      />
                      <button 
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#FF5733] focus:ring-[#FF5733] border-gray-300 rounded"
                    />
                    <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                      Remember me for 1 month
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="animate-spin mr-2 h-4 w-4" />
                        Logging in...
                      </>
                    ) : "Login"}
                  </button>
                </form>
                <div className="mt-4 flex justify-between text-sm">
                  <button onClick={() => switchMode("forgot")} className="text-[#FF5733] hover:underline">
                    Forgot Password?
                  </button>
                  <button onClick={() => switchMode("signup")} className="text-[#FF5733] hover:underline">
                    Sign Up
                  </button>
                </div>
              </>
            )}

            {mode === "signup" && (
              <>
                <h2 className="text-4xl font-extrabold text-center text-gray-800">Create Account</h2>
                <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
                <p className="mt-3 text-center text-gray-500">Sign up for a new account</p>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                        required
                        minLength={8}
                      />
                      <button 
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="animate-spin mr-2 h-4 w-4" />
                        Creating Account...
                      </>
                    ) : "Sign Up"}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => switchMode("login")} className="text-sm text-[#FF5733] hover:underline">
                    Already have an account? Login
                  </button>
                </div>
              </>
            )}

            {mode === "forgot" && (
              <>
                <h2 className="text-4xl font-extrabold text-center text-gray-800">Reset Password</h2>
                <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
                <p className="mt-3 text-center text-gray-500">
                  Enter your email to reset your password
                </p>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="animate-spin mr-2 h-4 w-4" />
                        Sending Reset Link...
                      </>
                    ) : "Reset Password"}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <button onClick={() => switchMode("login")} className="text-sm text-[#FF5733] hover:underline">
                    Back to Login
                  </button>
                </div>
              </>
            )}

            <div className="mt-8">
              <p className="text-center text-sm text-gray-500">or continue with</p>
              <div className="mt-4 flex justify-center space-x-4">
                <button 
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center border border-gray-300 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FaGoogle className="text-red-500" size={20} />
                </button>
                <button className="flex items-center justify-center border border-gray-300 p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <FaFacebookF className="text-blue-800" size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoginSignupPage;