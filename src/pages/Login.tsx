import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PerformanceMonitor } from '../utils/performanceMonitor';
import DSALogo from '../components/ui/DSALogo';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, signInWithGoogle } = useAuth();
  
  // Performance monitoring
  useEffect(() => {
    const monitor = PerformanceMonitor.monitorComponent('Login');
    const endRender = monitor.onRenderStart();
    
    return () => {
      endRender();
    };
  }, []);

  // Optimized login handler with performance monitoring
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const timer = PerformanceMonitor.startTimer('user_login');
    
    setLoading(true);
    setError('');
    
    try {
      await login(email, password);
      console.log('✅ Login successful');
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      // Use the actual error message from the authentication system
      setError(error.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
      timer();
    }
  }, [email, password, login]);
  
  // Google login handler
  const handleGoogleLogin = useCallback(async () => {
    const timer = PerformanceMonitor.startTimer('google_login');
    
    setLoading(true);
    setError('');
    
    try {
      await signInWithGoogle();
      console.log('✅ Google login initiated');
    } catch (error: any) {
      console.error('❌ Google login failed:', error);
      setError(error.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
      timer();
    }
  }, [signInWithGoogle]);
  
  // Optimized password visibility toggle
  const togglePasswordVisibility = useCallback(() => {
    const timer = PerformanceMonitor.startTimer('toggle_password_visibility');
    setShowPassword(prev => !prev);
    timer();
  }, []);
  
  // Optimized input handlers
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);
  
  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Left Branding Panel - Fixed on desktop */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:bg-slate-900 dark:bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] dark:from-slate-800 dark:to-slate-900 p-12 text-slate-900 dark:text-white text-center lg:fixed lg:top-0 lg:left-0 lg:w-1/2 lg:h-full">
        <div className="bg-white/80 dark:bg-white/20 p-6 rounded-full shadow-lg backdrop-blur-sm">
            <DSALogo size="xl" className="text-slate-800 dark:text-white" />
        </div>
        <h1 className="mt-8 text-4xl font-bold tracking-tight">Master Your DSA Journey</h1>
        <p className="mt-4 text-lg max-w-sm opacity-90">
          Track your progress, get smart recommendations, and stay motivated on your path to success.
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="min-h-screen flex items-center justify-center p-6 sm:p-8 lg:min-h-0 lg:p-12 lg:ml-[50%] lg:w-1/2 lg:h-full lg:overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="text-center mb-8 lg:hidden">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/40 dark:to-blue-900/40 p-4 rounded-2xl border border-gray-300 dark:border-gray-700">
                <DSALogo className="text-green-600 dark:text-green-400" size="lg" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome Back
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Enter your email and password to continue your learning journey
            </p>
          </div>

          {/* Desktop-only Heading */}
          <div className="hidden lg:block text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Sign in to your account
            </h2>
          </div>

          {/* Google Login Button */}
          <div className="mb-4 sm:mb-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-4 sm:my-6">
            <hr className="flex-grow border-gray-300 dark:border-gray-600" />
            <span className="mx-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Or continue with email</span>
            <hr className="flex-grow border-gray-300 dark:border-gray-600" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg relative mb-4 text-sm flex items-center" role="alert">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={handleEmailChange}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
                  ) : (
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2.5 sm:py-3 px-4 text-sm sm:text-base rounded-lg transition-all duration-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-2 border-white border-t-transparent mr-2"></div>
                  <span className="text-sm sm:text-base">Signing in...</span>
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-4 sm:mt-6 text-center space-y-2 sm:space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-200"
              >
                Register
              </Link>
            </p>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-green-600 hover:text-green-500 dark:text-green-400 dark:hover:text-green-300 transition-colors duration-200 block"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}