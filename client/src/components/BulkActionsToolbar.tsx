import React, { useState } from 'react';
import { Button } from './ui/Button';
import {
  CheckSquare,
  XSquare,
  UserPlus,
  Flag,
  Download,
  Trash2,
  AlertCircle,
  X
} from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkAssign: () => void;
  onBulkStatusChange: () => void;
  onBulkPriorityChange: () => void;
  onBulkClose: () => void;
  onBulkExport: () => void;
  onBulkDelete?: () => void;
}

/**
 * BulkActionsToolbar Component
 *
 * Displays a toolbar with bulk action buttons when items are selected.
 * Animates in from the bottom with a smooth slide-up effect.
 *
 * @example
 * <BulkActionsToolbar
 *   selectedCount={5}
 *   onClearSelection={() => clearSelection()}
 *   onBulkAssign={() => handleBulkAssign()}
 *   onBulkStatusChange={() => handleBulkStatusChange()}
 *   onBulkPriorityChange={() => handleBulkPriorityChange()}
 *   onBulkClose={() => handleBulkClose()}
 *   onBulkExport={() => handleBulkExport()}
 * />
 */
export function BulkActionsToolbar({
  selectedCount,
  onClearSelection,
  onBulkAssign,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkClose,
  onBulkExport,
  onBulkDelete,
}: BulkActionsToolbarProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (selectedCount === 0 || !isVisible) {
    return null;
  }

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClearSelection();
      setIsVisible(true);
    }, 300);
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 px-6 py-4 hover-lift">
        <div className="flex items-center gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-2 pr-4 border-r border-gray-300 dark:border-gray-600">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Assign */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkAssign}
              leftIcon={<UserPlus className="w-4 h-4" />}
              title="Assign selected items"
            >
              Assign
            </Button>

            {/* Status */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkStatusChange}
              leftIcon={<AlertCircle className="w-4 h-4" />}
              title="Change status"
            >
              Status
            </Button>

            {/* Priority */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkPriorityChange}
              leftIcon={<Flag className="w-4 h-4" />}
              title="Change priority"
            >
              Priority
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkClose}
              leftIcon={<XSquare className="w-4 h-4" />}
              title="Close selected items"
            >
              Close
            </Button>

            {/* Export */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkExport}
              leftIcon={<Download className="w-4 h-4" />}
              title="Export selected items"
            >
              Export
            </Button>

            {/* Delete (if allowed) */}
            {onBulkDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkDelete}
                leftIcon={<Trash2 className="w-4 h-4" />}
                title="Delete selected items"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Delete
              </Button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="ml-2 pl-4 border-l border-gray-300 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkActionsToolbar;
