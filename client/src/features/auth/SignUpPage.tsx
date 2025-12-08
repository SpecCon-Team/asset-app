import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Info } from 'lucide-react';
import { ButtonLoader } from '@/components/LoadingSpinner';
import { getApiBaseUrl } from '@/lib/apiConfig';
import AnimatedBackground from '@/components/AnimatedBackground';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailExists, setEmailExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);

  const validatePassword = (pwd: string) => {
    const hasMinLength = pwd.length >= 12;
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return hasMinLength && hasLowerCase && hasUpperCase && hasNumber;
  };

  const getPasswordRequirements = (pwd: string) => {
    return {
      minLength: pwd.length >= 12,
      lowerCase: /[a-z]/.test(pwd),
      upperCase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
    };
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched({ ...touched, [field]: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    // Validate password requirements
    if (!validatePassword(password)) {
      setError('Password does not meet all requirements');
      setIsLoading(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate terms agreement
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Use and Privacy Policy');
      setIsLoading(false);
      return;
    }

    try {
      // Call backend API for registration with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${getApiBaseUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        // Check if email already exists (HTTP 409)
        if (response.status === 409 || data.message === 'Email already in use') {
          setEmailExists(true);
          setError('This email is already registered.');
          setIsLoading(false);
          return;
        }
        throw new Error(data.message || 'Registration failed');
      }

      // Show success message
      toast.success(data.message || 'Registration successful! Please check your email for verification code.');

      // Redirect to OTP verification page
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setEmailExists(false);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Request timed out. Please check your internet connection and try again.');
      } else {
        setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen relative overflow-y-auto">
      <AnimatedBackground />
      <div className="min-h-full flex items-center justify-center p-3 sm:p-4 py-8 sm:py-12 relative z-10">
        <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-6 sm:mb-8">
          <div
            className="inline-flex w-12 h-12 sm:w-16 sm:h-16 rounded-full items-center justify-center mb-3 sm:mb-4"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <span className="text-white font-bold text-lg sm:text-2xl">AT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">Create Your Account</h1>
          <p className="text-white/90 mt-1 sm:mt-2 text-sm sm:text-base">Join AssetTrack Pro today</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl p-4 sm:p-6 lg:p-8 border border-white/20">
          {error && (
            <div className={`mb-4 p-4 rounded-lg text-sm ${
              emailExists
                ? 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 text-orange-700 dark:text-orange-300'
                : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
            }`}>
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-1">{error}</p>
                  {emailExists && (
                    <div className="mt-2">
                      <p className="mb-2 text-sm">This email is already associated with an account. Please sign in instead or use a different email address.</p>
                      <Link
                        to="/login"
                        className="inline-block w-full px-4 py-2 text-white rounded-lg text-center font-medium transition-opacity hover:opacity-90"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        Go to Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="John Doe"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border ${touched.name && !name ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
              />
              {touched.name && !name && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">This field is required</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailExists(false);
                  setError('');
                }}
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border ${touched.email && !email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
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
                  onFocus={() => setShowPasswordTooltip(true)}
                  onBlur={() => {
                    handleBlur('password');
                    setShowPasswordTooltip(false);
                  }}
                  placeholder="•••••••••••••"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border ${touched.password && !password ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailExists(false);
                  setError('');
                }}
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 border ${touched.email && !email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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
                  onFocus={() => setShowPasswordTooltip(true)}
                  onBlur={() => {
                    handleBlur('password');
                    setShowPasswordTooltip(false);
                  }}
                  placeholder="••••••••••••"
                  className={`w-full px-4 py-3 pr-12 border ${touched.password && !password ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
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

              {/* Password Requirements Card */}
              {showPasswordTooltip && (
                <div className="mt-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Password Requirements:</p>
                  <ul className="space-y-1">
                    {(() => {
                      const reqs = getPasswordRequirements(password);
                      return (
                        <>
                          <li className={`text-xs flex items-center gap-2 ${reqs.minLength ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            <span>{reqs.minLength ? '✓' : '○'}</span> At least 12 characters
                          </li>
                          <li className={`text-xs flex items-center gap-2 ${reqs.lowerCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            <span>{reqs.lowerCase ? '✓' : '○'}</span> Lower case letters (a-z)
                          </li>
                          <li className={`text-xs flex items-center gap-2 ${reqs.upperCase ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            <span>{reqs.upperCase ? '✓' : '○'}</span> Upper case letters (A-Z)
                          </li>
                          <li className={`text-xs flex items-center gap-2 ${reqs.number ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            <span>{reqs.number ? '✓' : '○'}</span> Numbers (0-9)
                          </li>
                        </>
                      );
                    })()}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  onPaste={(e) => {
                    e.preventDefault();
                    toast.error('Please type your password confirmation manually');
                  }}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  placeholder="••••••••••"
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 border ${touched.confirmPassword && !confirmPassword ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
              {touched.confirmPassword && !confirmPassword && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">This field is required</p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 border-gray-300 dark:border-gray-600 rounded"
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                I agree to the{' '}
                <a
                  href="#"
                  className="font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Terms of Use
                </a>
                {' '}and{' '}
                <a
                  href="#"
                  className="font-medium transition-opacity hover:opacity-80"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 text-white py-2.5 sm:py-3 rounded-lg font-medium disabled:bg-gray-400 transition-opacity hover:opacity-90 text-sm sm:text-base min-h-[44px]"
              style={{ backgroundColor: isLoading ? undefined : 'var(--color-primary)' }}
            >
              {isLoading ? <><ButtonLoader /> Creating account...</> : 'Sign up'}
            </button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium transition-opacity hover:opacity-80"
                style={{ color: 'var(--color-primary)' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
