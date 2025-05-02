// LoginSignupPage.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";
import { API_CONFIG } from "../config/api.config";
import marketplaceService from "../services/marketplaceService";

type Mode = "login" | "signup" | "forgot";

const LoginSignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we have a redirect destination in location state
  const redirectTo = location.state?.redirectTo || '/';
  
  const [mode, setMode] = useState<Mode>("login");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    rememberMe: true // Default to remember me checked
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const displayErrorMessages = (errorData: any) => {
    let messages: string[] = [];
    for (const key in errorData) {
      if (Array.isArray(errorData[key])) {
        messages = messages.concat(errorData[key]);
      } else {
        messages.push(String(errorData[key]));
      }
    }
    const finalMessage = messages.join(" ");
    if (finalMessage.toLowerCase().includes("already exists")) {
      toast.error("User already exists. Please try logging in.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      toast.error(finalMessage, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        
        // Calculate expiration time (1 month from now if rememberMe is checked)
        const expirationTime = formData.rememberMe 
          ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days in milliseconds
          : Date.now() + (24 * 60 * 60 * 1000); // 1 day (default token expiration)
        
        // Store tokens with expiration metadata
        localStorage.setItem("accessToken", response.data.tokens.access);
        localStorage.setItem("refreshToken", response.data.tokens.refresh);
        localStorage.setItem("tokenExpiration", expirationTime.toString());
        localStorage.setItem("rememberMe", formData.rememberMe.toString());
        
        // Store user info
        localStorage.setItem("user", JSON.stringify(response.data.user));

        toast.success("Login successful!", {
          position: "top-right",
          autoClose: 3000,
        });

        // Handle first login differently if needed
        if (response.data.is_first_login) {
          toast.info("Welcome! This is your first login.", {
            position: "top-right",
            autoClose: 5000,
          });
        }

        // After successful login, check for redirects based on stored session data
        const postLoginRedirect = sessionStorage.getItem('postLoginRedirect');
        const selectedServiceId = sessionStorage.getItem('selectedServiceId');
        const pendingServiceData = sessionStorage.getItem('pendingServiceData');
        const pendingVehicleData = sessionStorage.getItem('userVehicleOwnership') || sessionStorage.getItem('pendingVehicleData');

        console.log('[DEBUG] Post-login redirect path:', postLoginRedirect);
        console.log('[DEBUG] Pending service data:', pendingServiceData);
        console.log('[DEBUG] Selected service ID:', selectedServiceId);
        console.log('[DEBUG] Vehicle data:', pendingVehicleData);

        // If we have a pending service and vehicle data, proceed to service checkout
        if (postLoginRedirect === '/service-checkout' && pendingServiceData) {
          // Ensure the vehicle data is properly set
          if (sessionStorage.getItem('pendingVehicleData')) {
            sessionStorage.setItem('userVehicleOwnership', sessionStorage.getItem('pendingVehicleData')!);
            sessionStorage.removeItem('pendingVehicleData');
          }
          
          toast.info("Continuing with your service booking...");
          navigate('/service-checkout');
        } 
        // If we have a specific redirect path, use it
        else if (postLoginRedirect) {
          navigate(postLoginRedirect);
        }
        // Otherwise go to the default redirectTo from location state or home page
        else {
          navigate(redirectTo);
        }

      } else if (mode === "signup") {
        console.log("Attempting signup with:", formData);
        console.log("API URL:", `${API_CONFIG.BASE_URL}/accounts/signup/`);
        
        const response = await axios.post(`${API_CONFIG.BASE_URL}/accounts/signup/`, {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        console.log("Signup response:", response);

        toast.success("Registration successful! Please check your email for verification.", {
          position: "top-right",
          autoClose: 5000,
        });

        navigate("/verify-email");

      } else if (mode === "forgot") {
        const response = await axios.post(`${API_CONFIG.BASE_URL}/accounts/password-reset/`, {
          email: formData.email,
        });

        toast.success("If an account exists with this email, you will receive a password reset link.", {
          position: "top-right",
          autoClose: 5000,
        });
        navigate("/Password-reset-confirmation");
      }
    } catch (error: any) {
      console.error("Error occurred:", error);
      if (error.response && error.response.data) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);
        
        if (error.response.status === 429) {
          // Rate limit error
          toast.error(error.response.data.error || "Too many attempts. Please try again later.", {
            position: "top-right",
            autoClose: 5000,
          });
        } else if (error.response.status === 401 && error.response.data.email_verification_required) {
          // Email verification required
          toast.error("Please verify your email before logging in. Check your inbox for the verification link.", {
            position: "top-right",
            autoClose: 5000,
          });
        } else {
          displayErrorMessages(error.response.data);
        }
      } else {
        toast.error("An error occurred. Please try again.", {
          position: "top-right",
          autoClose: 5000,
        });
      }
    }
  };

  const switchMode = (newMode: Mode) => {
    setFormData({
      username: "",
      email: "",
      password: "",
      rememberMe: true // Default to remember me checked
    });
    setMode(newMode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.4 }}
          >
            {mode === "login" && (
              <>
                <h2 className="text-4xl font-extrabold text-center text-gray-800">Welcome Back</h2>
                <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
                <p className="mt-3 text-center text-gray-500">Log in to your account</p>
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
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      required
                    />
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
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors"
                  >
                    Login
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
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors"
                  >
                    Sign Up
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
                    className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors"
                  >
                    Reset Password
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
