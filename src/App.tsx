import React, { useState } from 'react';
import { useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Phone, Hash, GraduationCap, Lock, KeyRound, ArrowLeft } from 'lucide-react';
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    setSuccessMessage('');
    
    if (isForgotPassword) {
      handleForgotPassword();
      return;
    }
    
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

  const handleForgotPassword = async () => {
    if (!formData.email.trim()) {
      setAuthError('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setAuthError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    try {
      await authService.resetPassword(formData.email);
      setSuccessMessage('Password reset email sent! Check your inbox and follow the instructions to reset your password.');
      setAuthError('');
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
    setSuccessMessage('');
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
    setErrors({});
    setAuthError('');
    setSuccessMessage('');
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

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsLogin(true);
    setErrors({});
    setAuthError('');
    setSuccessMessage('');
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
    setSuccessMessage('');
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        <div className="absolute top-1/2 right-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse delay-3000"></div>
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white bg-opacity-10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 mx-4 sm:mx-0 transition-all duration-500 hover:bg-opacity-15">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-lg">
              <img
                src={isteLogo}
                alt="ISTE Logo"
                className="w-12 h-12"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Join ISTE'}
            </h1>
            <p className="text-gray-300 text-xs sm:text-sm">
              {isForgotPassword 
                ? 'Enter your email to receive reset instructions' 
                : isLogin 
                ? 'Sign in to access your recruitment portal' 
                : 'Create your account for ISTE recruitment'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Auth Error Message */}
            {authError && (
              <div className="bg-red-500 bg-opacity-20 border border-red-400/50 rounded-xl p-4 text-red-300 text-xs sm:text-sm text-center backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2">
                  <XCircle className="w-4 h-4" />
                  <span>{authError}</span>
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-500 bg-opacity-20 border border-green-400/50 rounded-xl p-4 text-green-300 text-xs sm:text-sm text-center backdrop-blur-sm">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            {/* Back to Login (Forgot Password) */}
            {isForgotPassword && (
              <button
                type="button"
                onClick={toggleForgotPassword}
                className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
            )}

            {/* Email Field */}
            <div className="transition-all duration-300 ease-in-out">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 group-focus-within:text-purple-300 transition-colors" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base backdrop-blur-sm hover:bg-opacity-15"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs sm:text-sm mt-2 ml-1">{errors.email}</p>}
            </div>

            {/* Show only email field for forgot password */}
            {isForgotPassword ? (
              <>
                {/* Reset Password Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending Reset Email...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <KeyRound className="w-5 h-5" />
                      <span>Send Reset Email</span>
                    </div>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Name Field (Signup only) */}
                {!isLogin && (
                  <div className="transition-all duration-300 ease-in-out">
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 group-focus-within:text-purple-300 transition-colors" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base backdrop-blur-sm hover:bg-opacity-15"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs sm:text-sm mt-2 ml-1">{errors.name}</p>}
                  </div>
                )}

                {/* Phone Field (Signup only) */}
                {!isLogin && (
                  <div className="transition-all duration-300 ease-in-out">
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 group-focus-within:text-purple-300 transition-colors" />
                      <input
                        type="tel"
                        placeholder="Phone Number (10 digits)"
                        maxLength={10}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base backdrop-blur-sm hover:bg-opacity-15"
                      />
                    </div>
                    {errors.phone && <p className="text-red-400 text-xs sm:text-sm mt-2 ml-1">{errors.phone}</p>}
                  </div>
                )}

                {/* Admission Number Field (Signup only) */}
                {!isLogin && (
                  <div className="transition-all duration-300 ease-in-out">
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 group-focus-within:text-purple-300 transition-colors" />
                      <input
                        type="text"
                        placeholder="Admission Number (6 digits)"
                        maxLength={6}
                        value={formData.admissionNumber}
                        onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base backdrop-blur-sm hover:bg-opacity-15"
                      />
                    </div>
                    {errors.admissionNumber && <p className="text-red-400 text-xs sm:text-sm mt-2 ml-1">{errors.admissionNumber}</p>}
                  </div>
                )}

                {/* Branch Field (Signup only) */}
                {!isLogin && (
                  <div className="transition-all duration-300 ease-in-out">
                    <div className="relative group">
                      <GraduationCap className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 group-focus-within:text-purple-300 transition-colors z-10" />
                      <select
                        value={formData.branch}
                        onChange={(e) => handleInputChange('branch', e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white bg-opacity-10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base backdrop-blur-sm hover:bg-opacity-15 appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-gray-800 text-gray-300">Select your branch</option>
                        {branches.map((branch) => (
                          <option key={branch} value={branch} className="bg-gray-800 text-white">
                            {branch}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.branch && <p className="text-red-400 text-xs sm:text-sm mt-2 ml-1">{errors.branch}</p>}
                  </div>
                )}

                {/* Password Field */}
                <div className="transition-all duration-300 ease-in-out">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 group-focus-within:text-purple-300 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-white bg-opacity-10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base backdrop-blur-sm hover:bg-opacity-15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-xs sm:text-sm mt-2 ml-1">{errors.password}</p>}
                </div>

                {/* Confirm Password Field (Signup only) */}
                {!isLogin && (
                  <div className="transition-all duration-300 ease-in-out">
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5 group-focus-within:text-purple-300 transition-colors" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="w-full pl-12 pr-12 py-4 bg-white bg-opacity-10 border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-sm sm:text-base backdrop-blur-sm hover:bg-opacity-15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-400 text-xs sm:text-sm mt-2 ml-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Forgot Password Link (Login only) */}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={toggleForgotPassword}
                      className="text-purple-400 hover:text-purple-300 transition-colors text-xs sm:text-sm"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      {isLogin ? <User className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    </div>
                  )}
                </button>

                {/* Toggle Mode */}
                <div className="text-center pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-purple-400 hover:text-purple-300 transition-colors duration-300 text-xs sm:text-sm"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Additional Info for Signup */}
          {!isLogin && !isForgotPassword && (
            <div className="mt-6 p-4 bg-purple-500 bg-opacity-10 border border-purple-400/30 rounded-xl">
              <h3 className="text-purple-300 font-semibold text-sm mb-2">Registration Guidelines:</h3>
              <ul className="text-purple-200 text-xs space-y-1">
                <li>• Use your official college email address</li>
                <li>• Enter your correct admission number</li>
                <li>• Select your engineering branch accurately</li>
                <li>• Use a strong password (min 6 characters)</li>
              </ul>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs">
              🔒 Your data is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
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
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
