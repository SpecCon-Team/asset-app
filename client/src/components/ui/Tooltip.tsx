import React, { useState, useRef, useEffect } from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /**
   * Content to display in the tooltip
   */
  content: React.ReactNode;
  /**
   * Element that triggers the tooltip
   */
  children: React.ReactElement;
  /**
   * Position of the tooltip relative to the trigger
   * @default 'top'
   */
  position?: TooltipPosition;
  /**
   * Delay before showing tooltip in milliseconds
   * @default 200
   */
  delay?: number;
  /**
   * Additional CSS classes for the tooltip
   */
  className?: string;
}

/**
 * Accessible tooltip component
 *
 * @example
 * ```tsx
 * <Tooltip content="Delete this item">
 *   <button>
 *     <Trash2 />
 *   </button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).substring(7)}`);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Position styles
  const positionStyles: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow styles
  const arrowStyles: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700',
  };

  // Clone child element and add event handlers
  const trigger = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      children.props.onBlur?.(e);
    },
    'aria-describedby': isVisible ? tooltipId.current : undefined,
  });

  return (
    <div className="relative inline-block">
      {trigger}
      {isVisible && (
        <div
          id={tooltipId.current}
          role="tooltip"
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap ${positionStyles[position]} ${className}`.trim()}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 border-transparent ${arrowStyles[position]}`.trim()}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = 'Tooltip';

export default Tooltip;
