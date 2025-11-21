import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

/**
 * Modern loading spinner with gradient and animation
 *
 * @param size - Size of the spinner: 'sm' (16px), 'md' (24px), 'lg' (32px)
 * @param message - Optional loading message to display
 * @param className - Additional CSS classes
 */
export function LoadingSpinner({ size = 'md', message = 'Loading...', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex items-center justify-center ${className}`}
    >
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={`${sizeClasses[size]} rounded-full border-2 border-blue-200 dark:border-blue-900`}></div>
        {/* Inner spinning gradient */}
        <div className={`${sizeClasses[size]} absolute top-0 left-0 rounded-full border-2 border-transparent border-t-blue-600 border-r-blue-500 animate-spin`}></div>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Full page loading overlay with modern design
 */
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 bg-gradient-to-br from-black/60 to-black/40 flex items-center justify-center z-50 backdrop-blur-md"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 transform animate-scale-in">
        <div className="flex flex-col items-center gap-6">
          {/* Animated circles loader */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-purple-600 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 border-r-blue-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-gray-900 dark:text-gray-100 font-semibold text-lg">{message}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Please wait...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full page loading component with animated dots
 */
export function PageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="text-center">
        {/* Pulsing dots loader */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium text-lg">{message}</p>
        <div className="mt-2 flex items-center justify-center gap-1">
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></span>
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></span>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading state for buttons with smooth animation
 */
export function ButtonLoader() {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="inline-flex items-center"
    >
      <svg
        className="animate-spin h-4 w-4 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </span>
  );
}

/**
 * Skeleton loader with shimmer animation
 */
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent"></div>
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

/**
 * List skeleton loader with staggered animation
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <SkeletonLoader className="w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-3/4" />
            <SkeletonLoader className="h-3 w-1/2" />
          </div>
          <SkeletonLoader className="w-20 h-8 rounded" />
        </div>
      ))}
      <span className="sr-only">Loading list items...</span>
    </div>
  );
}

export default LoadingSpinner;
