'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAlert } from '@/components/AlertProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('signup'); // 'login' or 'signup' - default to signup
  // Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  // Signup state
  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    referralCode: '' // optional friend code
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { showSuccessAlert, showErrorAlert, showLoadingAlert, hideAlert } = useAlert();

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate requests
    if (loginLoading) return;
    
    setLoginLoading(true);
    setLoginError('');
    hideAlert(); // Clear any existing alerts
    
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      
      if (res.ok) {
        showSuccessAlert('Welcome Back!', 'Successfully logged in to your account.');
        // Complete app refresh and redirect to home
        setTimeout(() => {
          // Clear any cached data
          if (typeof window !== 'undefined') {
            // Clear localStorage and sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            // Show loading state during refresh
            showLoadingAlert('Refreshing App', 'Preparing your dashboard...');
            // Force a complete page refresh and redirect to home
            // Always redirect to home for complete refresh
            window.location.href = redirectTo || '/';
          }
        }, 1000);
      } else {
        const data = await res.json();
        const errorMessage = data.error || 'Login failed';
        setLoginError(errorMessage);
        showErrorAlert('Login Failed', errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Network error. Please check your connection.';
      setLoginError(errorMessage);
      showErrorAlert('Connection Error', errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  // Signup handler
  const handleSignup = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate requests
    if (signupLoading) return;
    
    setSignupLoading(true);
    setSignupError('');
    hideAlert(); // Clear any existing alerts
    
    try {
      // Show loading alert for signup process
      showLoadingAlert('Creating Account', 'Setting up your account...');
      
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });
      
      if (res.ok) {
        const data = await res.json();
        // Hide loading alert and show success
        hideAlert();
        showSuccessAlert('Welcome!', 'Account created and logged in successfully!');
        
        // Since backend automatically logs in user, redirect after short delay
        setTimeout(() => {
          // Clear any cached data
          if (typeof window !== 'undefined') {
            // Clear localStorage and sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            // Show loading state during refresh
            showLoadingAlert('Refreshing App', 'Preparing your dashboard...');
            // Force a complete page refresh and redirect to home
            window.location.href = redirectTo || '/';
          }
        }, 1500);
      } else {
        hideAlert();
        const data = await res.json();
        const errorMessage = data.error || 'Sign up failed';
        setSignupError(errorMessage);
        showErrorAlert('Signup Failed', errorMessage);
      }
    } catch (err) {
      hideAlert();
      const errorMessage = 'Network error. Please check your connection.';
      setSignupError(errorMessage);
      showErrorAlert('Connection Error', errorMessage);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
      
      {/* Minimal animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-xs sm:max-w-md mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="w-full p-4 sm:p-8 rounded-2xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            {/* Tab Switcher */}
            <div className="flex bg-black/30 rounded-xl p-1 mb-8 border border-gray-800">
              <button
                className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 rounded-lg font-medium text-sm sm:text-sm text-xs transition-all duration-300 ${
                  tab === 'login' 
                    ? 'bg-cyan-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setTab('login')}
                type="button"
                disabled={loginLoading || signupLoading}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 px-2 sm:py-3 sm:px-4 rounded-lg font-medium text-sm sm:text-sm text-xs transition-all duration-300 ${
                  tab === 'signup' 
                    ? 'bg-cyan-500 text-white shadow-lg' 
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setTab('signup')}
                type="button"
                disabled={loginLoading || signupLoading}
              >
                Sign Up
              </button>
            </div>

            {/* Form Content */}
            <AnimatePresence mode="wait">
              {tab === 'login' ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  {/* Username/Email Field */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <label className="text-sm text-gray-300">Username or Email</label>
                    </div>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      placeholder="Enter your username or email"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      required
                      autoFocus
                      disabled={loginLoading}
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <label className="text-sm text-gray-300">Password</label>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        className="w-full px-3 py-2.5 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loginLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        disabled={loginLoading}
                      >
                        {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      {loginError}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="signup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSignup}
                  className="space-y-4"
                >
                  {/* Username Field */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <label className="text-sm text-gray-300">Username</label>
                    </div>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      placeholder="Choose a username"
                      value={signupData.username}
                      onChange={e => setSignupData({ ...signupData, username: e.target.value })}
                      required
                      autoFocus
                      disabled={signupLoading}
                    />
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <label className="text-sm text-gray-300">Email</label>
                    </div>
                    <input
                      type="email"
                      className="w-full px-3 py-2.5 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={e => setSignupData({ ...signupData, email: e.target.value })}
                      required
                      disabled={signupLoading}
                    />
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <label className="text-sm text-gray-300">Password</label>
                    </div>
                    <div className="relative">
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        className="w-full px-3 py-2.5 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        placeholder="Create a password"
                        value={signupData.password}
                        onChange={e => setSignupData({ ...signupData, password: e.target.value })}
                        required
                        disabled={signupLoading}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        disabled={signupLoading}
                      >
                        {showSignupPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">First Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        placeholder="First name"
                        value={signupData.firstName}
                        onChange={e => setSignupData({ ...signupData, firstName: e.target.value })}
                        disabled={signupLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        placeholder="Last name"
                        value={signupData.lastName}
                        onChange={e => setSignupData({ ...signupData, lastName: e.target.value })}
                        disabled={signupLoading}
                      />
                    </div>
                  </div>

                  {/* Referral Code (optional) */}
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300 flex items-center gap-1">
                      Referral Code 
                      <span className="text-xs text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 rounded-lg bg-black/40 text-white placeholder-gray-500 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      placeholder="Friend's referral code"
                      value={signupData.referralCode}
                      onChange={e => setSignupData({ ...signupData, referralCode: e.target.value.toUpperCase().trim() })}
                      disabled={signupLoading}
                    />
                  </div>

                  {/* Error Message */}
                  {signupError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    >
                      {signupError}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                    disabled={signupLoading}
                  >
                    {signupLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </div>
  );
} 