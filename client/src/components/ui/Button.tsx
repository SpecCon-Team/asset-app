import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant of the button
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Size of the button
   * @default 'md'
   */
  size?: ButtonSize;
  /**
   * Whether the button is in a loading state
   * Shows a spinner and disables interaction
   */
  isLoading?: boolean;
  /**
   * Whether the button takes full width of its container
   */
  fullWidth?: boolean;
  /**
   * Icon to display before the button text
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to display after the button text
   */
  rightIcon?: React.ReactNode;
}

/**
 * Button component with multiple variants and sizes
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * <Button variant="danger" isLoading>
 *   Deleting...
 * </Button>
 *
 * <Button variant="ghost" leftIcon={<Plus />}>
 *   Add Item
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles - always applied
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ' +
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ' +
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
      'active:scale-95 hover:shadow-md transform hover:-translate-y-0.5 ';

    // Variant styles
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'text-white shadow-sm ' +
        'focus-visible:ring-2 ' +
        'theme-primary-button',

      secondary:
        'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-900 shadow-sm ' +
        'dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 dark:text-gray-100 ' +
        'focus-visible:ring-gray-500',

      danger:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm ' +
        'dark:bg-red-500 dark:hover:bg-red-600 dark:active:bg-red-700 ' +
        'focus-visible:ring-red-500',

      success:
        'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm ' +
        'dark:bg-green-500 dark:hover:bg-green-600 dark:active:bg-green-700 ' +
        'focus-visible:ring-green-500',

      ghost:
        'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 ' +
        'active:bg-gray-100 dark:active:bg-gray-700 text-gray-700 dark:text-gray-300 ' +
        'focus-visible:ring-gray-500',
    };

    // Size styles
    const sizeStyles: Record<ButtonSize, string> = {
      xs: 'px-2.5 py-1 text-xs gap-1',
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    // Width styles
    const widthStyles = fullWidth ? 'w-full' : '';

    // Icon sizes based on button size
    const iconSizeClass: Record<ButtonSize, string> = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    // Combine all styles
    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyles} ${className}`.trim();

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={combinedClassName}
        {...props}
      >
        {isLoading && (
          <Loader2 className={`${iconSizeClass[size]} animate-spin`} aria-hidden="true" />
        )}
        {!isLoading && leftIcon && (
          <span className={iconSizeClass[size]} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className={iconSizeClass[size]} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
