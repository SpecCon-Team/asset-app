import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  /**
   * Icon component to display (from lucide-react)
   */
  icon?: LucideIcon;
  /**
   * Main title text
   */
  title: string;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Optional action button or element
   */
  action?: React.ReactNode;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * EmptyState component for displaying empty lists, search results, etc.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Inbox}
 *   title="No tickets found"
 *   description="Create your first ticket to get started"
 *   action={<Button>Create Ticket</Button>}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`.trim()}
      role="status"
      aria-label={title}
    >
      {Icon && (
        <div className="mb-4">
          <Icon
            className="w-16 h-16 text-gray-300 dark:text-gray-600"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">{description}</p>
      )}

      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

export default EmptyState;
