import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether the card should have hover effect
   */
  hoverable?: boolean;
  /**
   * Whether the card is clickable/interactive
   */
  clickable?: boolean;
}

/**
 * Card container component with consistent styling
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <h2>Title</h2>
 *   </CardHeader>
 *   <CardBody>
 *     Content goes here
 *   </CardBody>
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ children, className = '', hoverable = false, clickable = false, ...props }, ref) => {
    const hoverStyles = hoverable ? 'hover:shadow-md transition-shadow duration-200' : '';
    const clickableStyles = clickable ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600' : '';

    return (
      <div
        ref={ref}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${hoverStyles} ${clickableStyles} ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Card header component - typically contains title and actions
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  /**
   * Whether to add extra padding
   */
  padded?: boolean;
}

/**
 * Card body component - main content area
 */
export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className = '', padded = true, ...props }, ref) => {
    const paddingStyles = padded ? 'p-6' : '';

    return (
      <div ref={ref} className={`${paddingStyles} ${className}`.trim()} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Card footer component - typically contains actions or additional info
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg ${className}`.trim()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  /**
   * Heading level (1-6)
   * @default 2
   */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Card title component - for consistent heading styles
 */
export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, className = '', as: Component = 'h2', ...props }, ref) => {
    return (
      <Component
        ref={ref as any}
        className={`text-xl font-semibold text-gray-900 dark:text-white ${className}`.trim()}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

/**
 * Card description component - for subtitle/description text
 */
export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-sm text-gray-600 dark:text-gray-400 ${className}`.trim()}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

export default Card;
