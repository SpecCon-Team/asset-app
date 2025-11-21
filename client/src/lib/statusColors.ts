/**
 * Centralized status and priority color utilities
 * Use these instead of duplicating color logic across components
 */

export interface ColorScheme {
  bg: string;
  text: string;
  border?: string;
  hover?: string;
}

/**
 * Get color scheme for ticket/asset status
 */
export function getStatusColor(status: string): ColorScheme {
  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case 'open':
    case 'active':
    case 'available':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
      };

    case 'in_progress':
    case 'in progress':
    case 'assigned':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
      };

    case 'closed':
    case 'completed':
    case 'resolved':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800',
      };

    case 'pending':
    case 'on_hold':
    case 'on hold':
    case 'in_maintenance':
    case 'in maintenance':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-800 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
      };

    case 'cancelled':
    case 'retired':
    case 'disposed':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
      };

    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-800 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-600',
      };
  }
}

/**
 * Get color scheme for priority levels
 */
export function getPriorityColor(priority: string): ColorScheme {
  const priorityLower = priority.toLowerCase();

  switch (priorityLower) {
    case 'low':
      return {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
      };

    case 'medium':
    case 'normal':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-300 dark:border-blue-700',
      };

    case 'high':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-300 dark:border-orange-700',
      };

    case 'urgent':
    case 'critical':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-300 dark:border-red-700',
      };

    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
      };
  }
}

/**
 * Get badge classes for status
 */
export function getStatusBadgeClasses(status: string): string {
  const colors = getStatusColor(status);
  return `px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`;
}

/**
 * Get badge classes for priority
 */
export function getPriorityBadgeClasses(priority: string): string {
  const colors = getPriorityColor(priority);
  return `px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`;
}

/**
 * Get hex color for charts (for Recharts, Chart.js, etc.)
 */
export function getStatusHexColor(status: string): string {
  const statusLower = status.toLowerCase();

  switch (statusLower) {
    case 'open':
    case 'active':
    case 'available':
      return '#3B82F6'; // blue-500

    case 'in_progress':
    case 'in progress':
    case 'assigned':
      return '#F59E0B'; // yellow-500

    case 'closed':
    case 'completed':
    case 'resolved':
      return '#10B981'; // green-500

    case 'pending':
    case 'on_hold':
    case 'on hold':
      return '#F97316'; // orange-500

    case 'cancelled':
    case 'retired':
      return '#EF4444'; // red-500

    default:
      return '#6B7280'; // gray-500
  }
}

/**
 * Get hex color for priority (for charts)
 */
export function getPriorityHexColor(priority: string): string {
  const priorityLower = priority.toLowerCase();

  switch (priorityLower) {
    case 'low':
      return '#6B7280'; // gray-500

    case 'medium':
    case 'normal':
      return '#3B82F6'; // blue-500

    case 'high':
      return '#F97316'; // orange-500

    case 'urgent':
    case 'critical':
      return '#EF4444'; // red-500

    default:
      return '#6B7280'; // gray-500
  }
}
