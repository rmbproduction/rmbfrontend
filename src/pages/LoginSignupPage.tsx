// LoginSignupPage.tsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGoogle, FaFacebookF, FaEye, FaEyeSlash, FaCheck } from "react-icons/fa";
import { Loader } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { apiService } from "../config/api.config";

// Import our custom hooks and context
import { useAuth } from "../contexts/AuthContext";
import { useSignup, useForgotPassword, useGoogleLogin } from "../hooks/auth/useAuth";
import TokenManager from "../services/tokenManager";

// Define interfaces based on actual backend response
interface LoginResponseData {
  message?: string;
  user: {
    email: string;
    username: string;
    is_admin: boolean;
    is_staff_member: boolean;
    is_field_staff: boolean;
    is_customer: boolean;
    email_verified: boolean;
  };
  tokens: {
    access: string;
    refresh: string;
  };
  is_first_login?: boolean;
}

interface SignupResponseData {
  message: string;
  user: {
    email: string;
    username: string;
  };
}

interface LoginResult {
  status: number;
  data: LoginResponseData;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  rememberMe: boolean;
  timezone: string;
  timezone_offset: number;
}

interface PasswordCriteria {
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasMinLength: boolean;
}

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

interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
    };
    status?: number;
  };
  message: string;
}

const LoginSignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Check if we should show the resend verification form
  useEffect(() => {
    if (location.state?.showResendVerification) {
      setShowResendVerification(true);
    }
  }, [location.state]);

  // Get redirect path from location state
  const from = location.state?.from?.pathname || "/profile";
  
  const [mode, setMode] = useState<Mode>("login");
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    rememberMe: true,
    timezone: "Asia/Kolkata",
    timezone_offset: 5.5
  });
  const [error, setError] = useState("");
  const [direction, setDirection] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [passwordCriteria, setPasswordCriteria] = useState<PasswordCriteria>({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSymbol: false,
    hasMinLength: false,
  });
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendingVerification, setResendingVerification] = useState(false);

  // Use our custom hooks
  const signupMutation = useSignup();
  const forgotPasswordMutation = useForgotPassword();
  const googleLoginMutation = useGoogleLogin();

  // Check for existing lockout
  useEffect(() => {
    const storedLockout = localStorage.getItem('loginLockoutUntil');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem('loginLockoutUntil');
      }
    }
  }, []);

  const handleLoginFailure = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    
    if (newAttempts >= 5) {
      const lockoutTime = Date.now() + 15 * 60 * 1000; // 15 minutes
      setLockoutUntil(lockoutTime);
      localStorage.setItem('loginLockoutUntil', lockoutTime.toString());
      toast.error("Too many failed attempts. Please try again in 15 minutes.");
      setError("Account is temporarily locked. Please try again in 15 minutes.");
    }
  };

  const validatePassword = (password: string) => {
    setPasswordCriteria({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
    if (error) setError("");
    
    // Validate password on change
    if (e.target.name === 'password') {
      validatePassword(e.target.value as string);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleApiError = (error: any) => {
    console.error('API Error:', error);

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) : 15 * 60;
      const minutesLeft = Math.ceil(waitTime / 60);
      toast.error(`Too many attempts. Please try again in ${minutesLeft} minutes.`);
      setError(`Account is temporarily locked. Please try again in ${minutesLeft} minutes.`);
      return;
    }

    if (error.response?.data) {
      const data = error.response.data;
      if (data.detail) {
        setError(data.detail);
      } else if (data.non_field_errors) {
        setError(data.non_field_errors[0]);
      } else {
        const firstError = Object.entries(data)[0];
        if (firstError) {
          setError(`${firstError[0]}: ${firstError[1]}`);
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
    
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / (60 * 1000));
      toast.error(`Account is temporarily locked. Please try again in ${minutesLeft} minutes.`);
      return;
    }

    try {
      if (mode === "login") {
        console.log("=== LOGIN FORM SUBMISSION ===");
        console.log("Form data:", {
          email: formData.email,
          hasPassword: !!formData.password,
          rememberMe: formData.rememberMe
        });

        // Clear any existing tokens before login
        TokenManager.clearTokens();

        try {
          const loginResult = await login(
            formData.email,
            formData.password,
            formData.rememberMe
          );

          // Log the raw response for debugging
          console.log('=== RAW LOGIN RESPONSE ===');
          console.log(loginResult);

          // Validate tokens
          if (!loginResult?.tokens?.access || !loginResult?.tokens?.refresh) {
            console.error('=== LOGIN VALIDATION FAILED ===');
            console.error('Response data:', loginResult);
            throw new Error('Login failed: Invalid token response');
          }

          // Store tokens immediately after successful login
          TokenManager.setTokens(
            {
              access: loginResult.tokens.access,
              refresh: loginResult.tokens.refresh
            },
            formData.rememberMe
          );

          // Verify token storage
          if (!TokenManager.hasValidTokens()) {
            throw new Error('Token storage verification failed');
          }

          // Success path
          console.log('=== LOGIN SUCCESSFUL ===');
          setLoginAttempts(0);
          localStorage.removeItem('loginLockoutUntil');
          toast.success("Login successful");
          
          console.log('Redirecting to:', from);
          navigate(from, { replace: true });
        } catch (error) {
          console.error('=== LOGIN ERROR ===');
          console.error('Error details:', error);
          handleLoginFailure();

          const apiError = error as ApiError;
          const errorMessage = apiError.response?.data?.detail || 
                             apiError.response?.data?.message || 
                             apiError.message || 
                             "An error occurred during login";
          
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } else if (mode === "signup") {
        const signupResponse = await signupMutation.mutateAsync({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });

        toast.success("Account created! Please verify your email.");
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);

      } else if (mode === "forgot") {
        await forgotPasswordMutation.mutateAsync({
          email: formData.email
        });
        
        sessionStorage.setItem('resetPasswordEmail', formData.email);
        navigate("/password-reset-confirmation");
        toast.success("Password reset link sent to your email!");
      }
    } catch (error) {
      // Enhanced error logging
      console.error('Form submission error:', error);

      if (mode === "login") {
        handleLoginFailure();
      }

      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.detail || 
                         apiError.response?.data?.message || 
                         apiError.message || 
                         "An unexpected error occurred";

      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await googleLoginMutation.mutateAsync();
      // Handle the response based on the actual structure
      const authUrl = response?.auth_url || response?.data?.auth_url;
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (error: any) {
      handleApiError(error);
    }
  };
  
  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error("Please enter your email address");
      return;
    }
    
    try {
      setResendingVerification(true);
      await apiService.auth.resendVerification({ email: resendEmail });
      toast.success("Verification email sent! Please check your inbox.");
      setShowResendVerification(false);
    } catch (error: any) {
      console.error("Resend verification error:", error);
      toast.error(error.response?.data?.error || "Failed to resend verification email. Please try again.");
    } finally {
      setResendingVerification(false);
    }
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
      rememberMe: true,
      timezone: "Asia/Kolkata",
      timezone_offset: 5.5
    });
    setError("");
    setMode(newMode);
  };

  const isLoading = authLoading || signupMutation.isPending || 
                    forgotPasswordMutation.isPending || googleLoginMutation.isPending;

  const PasswordCriteriaItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center space-x-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: isValid ? 1 : 0 }}
        className="w-5 h-5 flex items-center justify-center rounded-full"
      >
        {isValid && <FaCheck className="text-green-500" size={14} />}
      </motion.div>
      <span className={`text-sm ${isValid ? 'text-green-500' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  );

  // Prevent rendering during initial auth check
  if (authLoading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4]">
        <Loader className="animate-spin h-8 w-8 text-[#FF5733]" />
      </div>
    );
  }

  return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-white to-[#ffe4d4] p-6">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 overflow-hidden">
        {showResendVerification ? (
          <div>
            <h2 className="text-4xl font-extrabold text-center text-gray-800">Resend Verification</h2>
            <div className="mt-2 h-1 w-16 bg-[#FF5733] mx-auto" />
            <p className="mt-3 text-center text-gray-500">Enter your email to receive a new verification link</p>
            
            <form onSubmit={handleResendVerification} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Email</label>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF5733]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={resendingVerification}
                className="w-full py-2 px-4 bg-[#FF5733] text-white rounded-md hover:bg-[#ff4019] transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {resendingVerification ? (
                  <>
                    <Loader className="animate-spin mr-2 h-4 w-4" />
                    Sending...
                  </>
                ) : "Send Verification Email"}
              </button>
              <button
                type="button"
                onClick={() => setShowResendVerification(false)}
                className="w-full py-2 px-4 border border-[#FF5733] text-[#FF5733] rounded-md hover:bg-[#fff5f2] transition-colors"
              >
                Back to Login
              </button>
            </form>
          </div>
        ) : (
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
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 space-y-1"
                    >
                      <PasswordCriteriaItem isValid={passwordCriteria.hasUpperCase} text="At least one uppercase letter" />
                      <PasswordCriteriaItem isValid={passwordCriteria.hasLowerCase} text="At least one lowercase letter" />
                      <PasswordCriteriaItem isValid={passwordCriteria.hasNumber} text="At least one number" />
                      <PasswordCriteriaItem isValid={passwordCriteria.hasSymbol} text="At least one special character" />
                      <PasswordCriteriaItem isValid={passwordCriteria.hasMinLength} text="Minimum 8 characters" />
                    </motion.div>
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
        )}
      </div>
    </div>
  );
};

export default LoginSignupPage;