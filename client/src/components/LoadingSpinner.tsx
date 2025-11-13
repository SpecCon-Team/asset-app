import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

/**
 * Accessible loading spinner component with proper ARIA attributes
 *
 * @param size - Size of the spinner: 'sm' (16px), 'md' (24px), 'lg' (32px)
 * @param message - Optional loading message to display
 * @param className - Additional CSS classes
 */
export function LoadingSpinner({ size = 'md', message = 'Loading...', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex items-center justify-center ${className}`}
    >
      <div className={`${sizeClasses[size]} border-blue-600 border-t-transparent rounded-full animate-spin`} />
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Full page loading overlay with backdrop
 */
export function LoadingOverlay({ message = 'Loading...' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-900 dark:text-gray-100 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Inline loading state for buttons
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
          strokeWidth="4"
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
 * Skeleton loader for content placeholders
 */
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    >
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

/**
 * List skeleton loader - for loading lists of items
 */
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <SkeletonLoader className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-3/4" />
            <SkeletonLoader className="h-3 w-1/2" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading list items...</span>
    </div>
  );
}

export default LoadingSpinner;
