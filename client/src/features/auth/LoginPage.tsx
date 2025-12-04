import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleBlur = (field: keyof typeof touched) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
    });

    try {
      // Call backend API for authentication using the api client
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;

      // Check if 2FA is required
      if (data.requiresTwoFactor) {
        setRequires2FA(true);
        setUserId(data.userId);
        toast.success('Password accepted. Please enter your 2FA code.');
        return;
      }

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      // Show success toast
      toast.success('Login successful!');

      // Navigate based on role
      if (data.user.role === 'PEG') {
        navigate('/peg-admin-dashboard');
      } else if (data.user.role === 'ADMIN' || data.user.role === 'TECHNICIAN') {
        navigate('/');
      } else {
        navigate('/my-tickets');
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      const status = err.response?.status;

      if (status === 429) {
        toast.error('Too many login attempts. Please wait 15 minutes before trying again.', {
          duration: 5000
        });
        setError('Too many requests. Please try again later.');
      } else if (status === 403 && errorData?.emailVerified === false) {
        toast.error(errorData.message || 'Please verify your email before logging in');
        navigate('/verify-otp', { state: { email: errorData.email || email } });
      } else {
        setError(errorData?.message || err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/verify-2fa-login', { userId, token: twoFactorCode });
      const data = response.data;

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);

      // Show success toast
      toast.success('Login successful!');

      // Navigate based on role
      if (data.user.role === 'PEG') {
        navigate('/peg-admin-dashboard');
      } else if (data.user.role === 'ADMIN' || data.user.role === 'TECHNICIAN') {
        navigate('/');
      } else {
        navigate('/my-tickets');
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.message || err.message || '2FA verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex w-16 h-16 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span className="text-white font-bold text-2xl">AT</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to AssetTrack Pro</h1>
          {/* <p className="text-gray-600 mt-2">Sign in to continue</p> */}
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {requires2FA ? (
            // 2FA Verification Form
            <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter the 6-digit code from your authenticator app or an 8-character backup code
                </p>
              </div>

              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  id="twoFactorCode"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9A-Fa-f]/g, '').toUpperCase())}
                  placeholder="000000 or backup code"
                  maxLength={8}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-2xl font-mono tracking-widest focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRequires2FA(false);
                    setTwoFactorCode('');
                    setError('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || (twoFactorCode.length !== 6 && twoFactorCode.length !== 8)}
                  className="flex-1 text-white py-3 rounded-lg font-medium disabled:bg-gray-400 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: isLoading || (twoFactorCode.length !== 6 && twoFactorCode.length !== 8) ? undefined : 'var(--color-primary)' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
            </form>
          ) : (
            // Regular Login Form
            <>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 border ${touched.email && !email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                  />
                  {touched.email && !email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">This field is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur('password')}
                      placeholder="••••••••••••"
                      className={`w-full px-4 py-3 pr-12 border ${touched.password && !password ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:border-transparent`}
                      style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  {touched.password && !password && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">This field is required</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white py-3 rounded-lg font-medium disabled:bg-gray-400 transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: isLoading ? undefined : 'var(--color-primary)' }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center space-y-3">
                <Link
                  to="/forgot-password"
                  className="text-sm block transition-opacity hover:opacity-80"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Forgot password?
                </Link>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium transition-opacity hover:opacity-80"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
