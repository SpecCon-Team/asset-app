import React from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Label text for the select
   */
  label?: string;
  /**
   * Error message to display below select
   */
  error?: string;
  /**
   * Helper text to display below select
   */
  helperText?: string;
  /**
   * Options for the select dropdown
   */
  options?: SelectOption[];
  /**
   * Placeholder option text
   */
  placeholder?: string;
  /**
   * Container className
   */
  containerClassName?: string;
}

/**
 * Select component with label and error states
 *
 * @example
 * ```tsx
 * <Select
 *   label="Status"
 *   placeholder="Select status..."
 *   options={[
 *     { value: 'open', label: 'Open' },
 *     { value: 'closed', label: 'Closed' }
 *   ]}
 *   error="Please select a status"
 * />
 * ```
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder,
      required,
      className = '',
      containerClassName = '',
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).substring(7)}`;
    const hasError = !!error;

    // Base select styles
    const baseSelectStyles =
      'w-full rounded-lg border transition-colors appearance-none ' +
      'bg-white dark:bg-gray-800 ' +
      'text-gray-900 dark:text-gray-100 ' +
      'focus:outline-none focus:ring-2 focus:ring-offset-0 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900 ' +
      'cursor-pointer';

    // State-specific styles
    const stateStyles = hasError
      ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500';

    const combinedSelectClassName = `${baseSelectStyles} ${stateStyles} pl-4 pr-10 py-2 ${className}`.trim();

    return (
      <div className={`w-full ${containerClassName}`.trim()}>
        {/* Label */}
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
          </label>
        )}

        {/* Select Container */}
        <div className="relative">
          {/* Select */}
          <select
            ref={ref}
            id={selectId}
            className={combinedSelectClassName}
            aria-invalid={hasError ? 'true' : 'false'}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
            {children}
          </select>

          {/* Chevron Icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {hasError ? (
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${selectId}-error`}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
