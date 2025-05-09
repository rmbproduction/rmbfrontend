// LoginSignupPage.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaFacebookF, FaEye, FaEyeSlash } from "react-icons/fa";
import { Loader } from "lucide-react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { API_CONFIG } from "../config/api.config";
import marketplaceService from "../services/marketplaceService";
import useAuth from "../hooks/useAuth";

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
  
  // Check if we have a redirect destination in location state
  const redirectTo = location.state?.redirectTo || '/';
  
  const [mode, setMode] = useState<Mode>("login");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    rememberMe: true // Default to remember me checked
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    // Clear error when user starts typing
    if (error) setError("");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError("");
    
    try {
      if (mode === "login") {
        // Clear all user session data before logging in with new account
        // This prevents mixing data from different accounts
        marketplaceService.clearUserSession();

        const response = await axios.post(`${API_CONFIG.BASE_URL}/accounts/login/`, {
          email: formData.email,
          password: formData.password,
        });

        // Clear any existing profile data first
        localStorage.removeItem("userProfile");
        sessionStorage.removeItem("userProfile");
        
        // Use our new login function from the useAuth hook
        login(response.data.user, response.data.tokens, formData.rememberMe);

        // After successful login, check for redirects based on stored session data
        const postLoginRedirect = sessionStorage.getItem('postLoginRedirect');
        const selectedServiceId = sessionStorage.getItem('selectedServiceId');
        
        // Check for redirect from location state (redirected from protected route)
        const locationState = location.state as { from?: string };
        if (locationState?.from) {
          navigate(locationState.from);
        } else if (postLoginRedirect) {
          navigate(postLoginRedirect);
          sessionStorage.removeItem('postLoginRedirect');
        } else if (selectedServiceId) {
          navigate(`/services/${selectedServiceId}`);
          sessionStorage.removeItem('selectedServiceId');
        } else {
          navigate('/');
        }

      } else if (mode === "signup") {
        // No password logging for security
        await axios.post(`${API_CONFIG.BASE_URL}/accounts/signup/`, {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        navigate("/verify-email");

      } else if (mode === "forgot") {
        await axios.post(`${API_CONFIG.BASE_URL}/accounts/password-reset/`, {
          email: formData.email,
        });

        navigate("/Password-reset-confirmation");
      }
    } catch (error: any) {
      // Handle errors without exposing sensitive data
      if (error.response) {
        // Server responded with error
        if (error.response.data.detail) {
          setError(error.response.data.detail);
        } else if (error.response.data.non_field_errors) {
          setError(error.response.data.non_field_errors[0]);
        } else if (error.response.data.email) {
          setError(`Email: ${error.response.data.email[0]}`);
        } else if (error.response.data.password) {
          setError(`Password: ${error.response.data.password[0]}`);
        } else if (error.response.data.username) {
          setError(`Username: ${error.response.data.username[0]}`);
        } else {
          setError("An error occurred. Please try again.");
        }
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: Mode) => {
    // Set direction for animation
    setDirection(
      mode === "login" && newMode === "signup" ? 1 : 
      mode === "signup" && newMode === "login" ? -1 :
      mode === "login" && newMode === "forgot" ? 1 : 
      mode === "forgot" && newMode === "login" ? -1 : 0
    );
    
    // Reset form data and errors
    setFormData({
      username: "",
      email: "",
      password: "",
      rememberMe: true
    });
    setError("");
    setMode(newMode);
  };

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
                    disabled={loading}
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {loading ? (
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
                    disabled={loading}
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {loading ? (
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
                    disabled={loading}
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors flex items-center justify-center disabled:opacity-70"
                  >
                    {loading ? (
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
                <button className="flex items-center justify-center border border-gray-300 p-2 rounded-full hover:bg-gray-100 transition-colors">
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
