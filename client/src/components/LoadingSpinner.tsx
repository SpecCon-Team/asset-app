import React, { useState, useEffect, useRef } from 'react';
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
 * @param message - Optional loading message for screen readers only
 * @param className - Additional CSS classes
 */
export function LoadingSpinner({ size = 'md', message = 'Loading', className = '' }: LoadingSpinnerProps) {
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
 * Shows with smooth animations - clean minimal design
 */
export function LoadingOverlay({ message = 'Loading' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 flex items-center justify-center z-50 bg-gray-50 dark:bg-gray-900 animate-fade-in"
    >
      {/* Animated circles loader */}
      <div className="relative w-20 h-20 animate-scale-in">
        <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-900"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 border-r-purple-600 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-purple-500 border-r-blue-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Custom hook to enforce minimum loading time
 * Usage: const loading = useMinLoadingTime(isLoading, 2000);
 */
export function useMinLoadingTime(isLoading: boolean, minDuration: number = 2000): boolean {
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartTimeRef = useRef<number | null>(null);
  const hasLoadedOnceRef = useRef(false);

  useEffect(() => {
    if (isLoading && !loadingStartTimeRef.current) {
      // Started loading - record the time
      loadingStartTimeRef.current = Date.now();
      setShowLoading(true);
      hasLoadedOnceRef.current = true;
    } else if (!isLoading && loadingStartTimeRef.current && hasLoadedOnceRef.current) {
      // Loading finished - check if minimum time has passed
      const elapsed = Date.now() - loadingStartTimeRef.current;
      const remaining = minDuration - elapsed;

      if (remaining > 0) {
        // Wait for remaining time before hiding loader
        const timer = setTimeout(() => {
          setShowLoading(false);
          loadingStartTimeRef.current = null;
        }, remaining);
        return () => {
          clearTimeout(timer);
          // Clean up on unmount
          loadingStartTimeRef.current = null;
        };
      } else {
        // Minimum time already passed
        setShowLoading(false);
        loadingStartTimeRef.current = null;
      }
    }
  }, [isLoading, minDuration]);

  return showLoading;
}

/**
 * Full page loading component with animated dots - no text, just animation
 */
export function PageLoader({ message = 'Loading' }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
    >
      <div className="flex items-center justify-center gap-3">
        <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-5 h-5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Inline loading state for buttons with smooth animation - no text
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
      <span className="sr-only">Loading</span>
    </span>
  );
}

/**
 * Skeleton loader with shimmer animation - no text
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
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * List skeleton loader with staggered animation - no text
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
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default LoadingSpinner;
