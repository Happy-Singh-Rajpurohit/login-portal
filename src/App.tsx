import React, { useState } from 'react';
import { useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Phone, Hash, GraduationCap, Lock } from 'lucide-react';
import { authService } from './services/authService';
import ExamPortal from './components/ExamPortal';
import type { UserProfile } from './lib/firebase';
import isteLogo from './assets/istelogo.png';


interface FormData {
  name: string;
  email: string;
  phone: string;
  admissionNumber: string;
  branch: string;
  password: string;
  confirmPassword: string;
}

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    admissionNumber: '',
    branch: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const branches = [
    'Computer Science Engineering',
    'Information Technology',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Chemical Engineering',
    'Biotechnology'
  ];

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          const profile = await authService.getUserProfile(user.uid);
          if (profile) {
            setCurrentUser(user);
            setUserProfile(profile);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, []);

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!isLogin) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone number must be exactly 10 digits';
      if (!formData.admissionNumber.trim()) newErrors.admissionNumber = 'Admission number is required';
      else if (!/^\d{6}$/.test(formData.admissionNumber)) newErrors.admissionNumber = 'Admission number must be exactly 6 digits';
      if (!formData.branch) newErrors.branch = 'Branch is required';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email must contain @ and . symbols';

    if (!formData.password.trim()) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (validateForm()) {
      setIsLoading(true);
      handleAuth();
    }
  };

  const handleAuth = async () => {
    try {
      if (isLogin) {
        const result = await authService.login({
          email: formData.email,
          password: formData.password
        });
        setCurrentUser(result.user);
        setUserProfile(result.profile);
        setIsAuthenticated(true);
      } else {
        const result = await authService.signup({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          admissionNumber: formData.admissionNumber,
          branch: formData.branch,
          password: formData.password
        });
        setCurrentUser(result.user);
        setUserProfile(result.profile);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    setAuthError('');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetMessage('');
    
    if (!resetEmail.trim()) {
      setResetError('Email is required');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setResetError('Please enter a valid email address');
      return;
    }
    
    setIsResetting(true);
    
    try {
      await authService.resetPassword(resetEmail);
      setResetMessage('Password reset email sent! Check your inbox and follow the instructions to reset your password.');
      setResetEmail('');
    } catch (error: any) {
      setResetError(error.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetMessage('');
    setResetError('');
  };
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setAuthError('');
    setShowForgotPassword(false);
    setResetEmail('');
    setResetMessage('');
    setResetError('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      admissionNumber: '',
      branch: '',
      password: '',
      confirmPassword: ''
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserProfile(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      admissionNumber: '',
      branch: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
    setAuthError('');
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mb-4 animate-pulse">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show exam portal if authenticated
  if (isAuthenticated && currentUser && userProfile) {
    return (
      <ExamPortal 
        user={currentUser} 
        userProfile={userProfile} 
        onLogout={handleLogout}
      />
    );
  }

  // Show login/signup form if not authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-cyan-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black bg-opacity-40 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-500/20 p-6 sm:p-8 mx-4 sm:mx-0">
          {/* Forgot Password Form */}
          {showForgotPassword ? (
            <div>
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
                  <img
                    src={isteLogo}
                    alt="ISTE Logo"
                    className="w-12 h-12"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-300 text-xs sm:text-sm">
                  Enter your email to receive reset instructions
                </p>
              </div>

              {/* Reset Form */}
              <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-6">
                {/* Success Message */}
                {resetMessage && (
                  <div className="bg-green-500 bg-opacity-20 border border-green-500 rounded-lg p-3 text-green-400 text-xs sm:text-sm text-center">
                    {resetMessage}
                  </div>
                )}

                {/* Error Message */}
                {resetError && (
                  <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3 text-red-400 text-xs sm:text-sm text-center">
                    {resetError}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-800 bg-opacity-50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isResetting}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isResetting ? 'Sending Reset Email...' : 'Send Reset Email'}
                </button>

                {/* Back to Login */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-blue-400 hover:text-blue-300 transition-colors duration-300 text-xs sm:text-sm"
                  >
                    ← Back to Login
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16  mb-4">
              <img
                src={isteLogo}
                alt="ISTE Logo"
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Join ISTE'}
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm">
              {isLogin ? 'Sign in' : 'Create your account'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Auth Error Message */}
            {authError && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3 text-red-400 text-xs sm:text-sm text-center">
                {authError}
              </div>
            )}

            {/* Name Field (Signup only) */}
            {!isLogin && (
              <div className="transition-all duration-300 ease-in-out">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 bg-opacity-50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.name}</p>}
              </div>
            )}

            {/* Email Field */}
            <div className="transition-all duration-300 ease-in-out">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 bg-opacity-50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone Field (Signup only) */}
            {!isLogin && (
              <div className="transition-all duration-300 ease-in-out">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 bg-opacity-50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                </div>
                {errors.phone && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.phone}</p>}
              </div>
            )}

            {/* Admission Number Field (Signup only) */}
            {!isLogin && (
              <div className="transition-all duration-300 ease-in-out">
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Admission Number"
                    maxLength={6}
                    value={formData.admissionNumber}
                    onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 bg-opacity-50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                </div>
                {errors.admissionNumber && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.admissionNumber}</p>}
              </div>
            )}

            {/* Branch Field (Signup only) */}
            {!isLogin && (
              <div className="transition-all duration-300 ease-in-out">
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Branch (e.g., Computer Science Engineering)"
                    value={formData.branch}
                    onChange={(e) => handleInputChange('branch', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-800 bg-opacity-50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                </div>
                {errors.branch && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.branch}</p>}
              </div>
            )}

            {/* Password Field */}
            <div className="transition-all duration-300 ease-in-out">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-gray-800 bg-opacity-50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password Field (Signup only) */}
            {!isLogin && (
              <div className="transition-all duration-300 ease-in-out">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-5 h-5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-gray-800 bg-opacity-50 border border-blue-500/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs sm:text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            {/* Toggle Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 transition-colors duration-300 text-xs sm:text-sm"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {/* Forgot Password Link (Login only) */}
            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-gray-400 hover:text-gray-300 transition-colors duration-300 text-xs sm:text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
