/**
 * Theme utility functions for applying dynamic theme colors
 */

/**
 * Get the primary color class that respects the theme
 * Use this instead of hardcoded bg-blue-600, text-blue-600, etc.
 */
export const getThemeClasses = () => {
  return {
    // Backgrounds
    bgPrimary: 'bg-[var(--color-primary)]',
    bgPrimaryDark: 'bg-[var(--color-primary-dark)]',
    bgPrimaryLight: 'bg-[var(--color-primary-light)]',

    // Text
    textPrimary: 'text-[var(--color-primary)]',
    textPrimaryDark: 'text-[var(--color-primary-dark)]',
    textPrimaryLight: 'text-[var(--color-primary-light)]',

    // Borders
    borderPrimary: 'border-[var(--color-primary)]',
    borderPrimaryDark: 'border-[var(--color-primary-dark)]',
    borderPrimaryLight: 'border-[var(--color-primary-light)]',

    // Ring (focus states)
    ringPrimary: 'ring-[var(--color-primary)]',
    ringPrimaryDark: 'ring-[var(--color-primary-dark)]',
    ringPrimaryLight: 'ring-[var(--color-primary-light)]',
  };
};

/**
 * Get inline style with theme color
 * Use this for elements that need dynamic background colors
 */
export const getThemeStyle = (property: 'backgroundColor' | 'color' | 'borderColor') => {
  return {
    [property]: 'var(--color-primary)',
  };
};

/**
 * Get gradient style with theme colors
 */
export const getThemeGradient = () => {
  return {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
  };
};
