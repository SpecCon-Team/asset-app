import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { ButtonLoader } from '@/components/LoadingSpinner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [emailNotFound, setEmailNotFound] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setEmailNotFound(false);

    try {
      const response = await getApiClient().post('/auth/forgot-password', { email });

      setIsEmailSent(true);
      toast.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset email. Please try again.';

      // Check if email was not found (404 status)
      if (error.response?.status === 404) {
        setEmailNotFound(true);
        setError(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="inline-flex w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Check Your Email
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent password reset instructions to <strong className="text-gray-900 dark:text-white">{email}</strong>
            </p>

            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              <button
                onClick={() => setIsEmailSent(false)}
                className="w-full text-white py-3 rounded-lg font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Try Another Email
              </button>

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm transition-opacity hover:opacity-80"
                style={{ color: 'var(--color-primary)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Enter your email and we'll send you instructions to reset your password
          </p>
        </div>

        {/* Forgot Password Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {error && emailNotFound && (
            <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg">
              <p className="text-orange-700 dark:text-orange-300 text-sm font-medium mb-3">
                {error}
              </p>
              <p className="text-orange-600 dark:text-orange-400 text-sm mb-4">
                Don't have an account yet?
              </p>
              <Link
                to="/sign-up"
                className="block w-full text-center px-4 py-2 text-white rounded-lg font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                Create New Account
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                    setEmailNotFound(false);
                  }}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full flex items-center justify-center gap-2 text-white py-3 rounded-lg font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ backgroundColor: (isLoading || !email) ? undefined : 'var(--color-primary)' }}
            >
              {isLoading ? <><ButtonLoader /> Sending...</> : 'Send Reset Instructions'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
