import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Visual style variant of the badge
   * @default 'neutral'
   */
  variant?: BadgeVariant;
  /**
   * Size of the badge
   * @default 'md'
   */
  size?: BadgeSize;
  /**
   * Whether the badge has rounded corners (pill shape)
   * @default true
   */
  rounded?: boolean;
  /**
   * Optional dot indicator before text
   */
  dot?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Badge component for displaying status, labels, or counts
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" dot>Pending</Badge>
 * <Badge variant="danger" size="lg">Critical</Badge>
 * ```
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      size = 'md',
      rounded = true,
      dot = false,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'inline-flex items-center font-medium border transition-colors';

    // Variant styles with proper contrast for both light and dark modes
    const variantStyles: Record<BadgeVariant, string> = {
      success:
        'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 ' +
        'border-green-200 dark:border-green-700',

      warning:
        'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 ' +
        'border-yellow-200 dark:border-yellow-700',

      danger:
        'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 ' +
        'border-red-200 dark:border-red-700',

      info: '', // Will use inline styles for theme color

      purple:
        'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 ' +
        'border-purple-200 dark:border-purple-700',

      neutral:
        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 ' +
        'border-gray-200 dark:border-gray-600',
    };

    // Size styles
    const sizeStyles: Record<BadgeSize, string> = {
      sm: 'px-2 py-0.5 text-xs gap-1',
      md: 'px-2.5 py-0.5 text-xs gap-1.5',
      lg: 'px-3 py-1 text-sm gap-2',
    };

    // Rounded styles
    const roundedStyles = rounded ? 'rounded-full' : 'rounded';

    // Dot indicator size based on badge size
    const dotSize: Record<BadgeSize, string> = {
      sm: 'w-1.5 h-1.5',
      md: 'w-2 h-2',
      lg: 'w-2.5 h-2.5',
    };

    // Combine all styles
    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${roundedStyles} ${className}`.trim();

    // Theme-aware inline styles for 'info' variant
    const inlineStyles = variant === 'info'
      ? {
          backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
          color: 'var(--color-primary)',
          borderColor: 'rgba(var(--color-primary-rgb), 0.2)',
          ...style,
        }
      : style;

    return (
      <span ref={ref} className={combinedClassName} style={inlineStyles} {...props}>
        {dot && (
          <span
            className={`${dotSize[size]} rounded-full bg-current opacity-75`}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
