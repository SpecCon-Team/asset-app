import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
      // Call backend API for registration
      const response = await fetch('http://localhost:4000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }

      const data = await response.json();

      // Registration successful, now log in
      const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!loginResponse.ok) {
        throw new Error('Registration successful but login failed. Please login manually.');
      }

      const loginData = await loginResponse.json();

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(loginData.user));
      localStorage.setItem('token', loginData.token);

      // Navigate based on role
      if (loginData.user.role === 'ADMIN' || loginData.user.role === 'TECHNICIAN') {
        navigate('/');
      } else {
        navigate('/my/tickets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-blue-600 rounded-full items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">AT</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join AssetTrack Pro today</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="John Doe"
                className={`w-full px-4 py-3 border ${touched.name && !name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {touched.name && !name && (
                <p className="mt-1 text-xs text-red-600">This field is required</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 border ${touched.email && !email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
              {touched.email && !email && (
                <p className="mt-1 text-xs text-red-600">This field is required</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                  className={`w-full px-4 py-3 pr-12 border ${touched.password && !password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              {touched.password && !password && (
                <p className="mt-1 text-xs text-red-600">This field is required</p>
              )}

              {/* Password Requirements Card */}
              {showPasswordTooltip && (
                <div className="mt-3 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                  <ul className="space-y-1">
                    {(() => {
                      const reqs = getPasswordRequirements(password);
                      return (
                        <>
                          <li className={`text-xs flex items-center gap-2 ${reqs.minLength ? 'text-green-600' : 'text-gray-600'}`}>
                            <span>{reqs.minLength ? '✓' : '○'}</span> At least 12 characters
                          </li>
                          <li className={`text-xs flex items-center gap-2 ${reqs.lowerCase ? 'text-green-600' : 'text-gray-600'}`}>
                            <span>{reqs.lowerCase ? '✓' : '○'}</span> Lower case letters (a-z)
                          </li>
                          <li className={`text-xs flex items-center gap-2 ${reqs.upperCase ? 'text-green-600' : 'text-gray-600'}`}>
                            <span>{reqs.upperCase ? '✓' : '○'}</span> Upper case letters (A-Z)
                          </li>
                          <li className={`text-xs flex items-center gap-2 ${reqs.number ? 'text-green-600' : 'text-gray-600'}`}>
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="••••••••••••"
                  className={`w-full px-4 py-3 pr-12 border ${touched.confirmPassword && !confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              {touched.confirmPassword && !confirmPassword && (
                <p className="mt-1 text-xs text-red-600">This field is required</p>
              )}
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms of Use
                </a>
                {' '}and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
