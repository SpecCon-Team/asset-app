import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label text for the input
   */
  label?: string;
  /**
   * Error message to display below input
   */
  error?: string;
  /**
   * Success message to display below input
   */
  success?: string;
  /**
   * Helper text to display below input
   */
  helperText?: string;
  /**
   * Whether the input is required
   */
  required?: boolean;
  /**
   * Icon to display on the left side of input
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display on the right side of input
   */
  rightIcon?: React.ReactNode;
  /**
   * Container className
   */
  containerClassName?: string;
}

/**
 * Input component with label, error states, and helper text
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error="Invalid email address"
 *   required
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      success,
      helperText,
      required,
      leftIcon,
      rightIcon,
      className = '',
      containerClassName = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;
    const hasError = !!error;
    const hasSuccess = !!success;

    // Base input styles
    const baseInputStyles =
      'w-full rounded-lg border transition-colors ' +
      'bg-white dark:bg-gray-800 ' +
      'text-gray-900 dark:text-gray-100 ' +
      'placeholder:text-gray-400 dark:placeholder:text-gray-500 ' +
      'focus:outline-none focus:ring-2 focus:ring-offset-0 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900';

    // State-specific styles
    const stateStyles = hasError
      ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500'
      : hasSuccess
      ? 'border-green-300 dark:border-green-700 focus:border-green-500 focus:ring-green-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';

    // Padding adjustments for icons
    const paddingStyles = leftIcon && rightIcon
      ? 'pl-10 pr-10'
      : leftIcon
      ? 'pl-10 pr-4'
      : rightIcon
      ? 'pl-4 pr-10'
      : 'px-4';

    const combinedInputClassName = `${baseInputStyles} ${stateStyles} ${paddingStyles} py-2 ${className}`.trim();

    return (
      <div className={`w-full ${containerClassName}`.trim()}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={combinedInputClassName}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${inputId}-error`
                : success
                ? `${inputId}-success`
                : helperText
                ? `${inputId}-helper`
                : undefined
            }
            {...props}
          />

          {/* Right Icon or Status Icon */}
          {(rightIcon || hasError || hasSuccess) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {hasError ? (
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" aria-hidden="true" />
              ) : hasSuccess ? (
                <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" aria-hidden="true" />
              ) : (
                <span className="text-gray-400 dark:text-gray-500">{rightIcon}</span>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && !error && (
          <p
            id={`${inputId}-success`}
            className="mt-1.5 text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {success}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && !success && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
