import React, { useState } from 'react';
import { Trash2, Edit, Check, X, Archive, Download, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkOperationsProps {
  selectedItems: string[];
  onClearSelection: () => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkUpdate?: (ids: string[], updates: any) => Promise<void>;
  onBulkExport?: (ids: string[]) => void;
  onBulkArchive?: (ids: string[]) => Promise<void>;
  entityType: 'assets' | 'inventory' | 'tickets';
}

export default function BulkOperations({
  selectedItems,
  onClearSelection,
  onBulkDelete,
  onBulkUpdate,
  onBulkExport,
  onBulkArchive,
  entityType,
}: BulkOperationsProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedItems.length} ${entityType}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await onBulkDelete(selectedItems);
      toast.success(`Successfully deleted ${selectedItems.length} ${entityType}`);
      onClearSelection();
    } catch (error) {
      toast.error(`Failed to delete ${entityType}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (!onBulkUpdate) return;

    setIsProcessing(true);
    try {
      await onBulkUpdate(selectedItems, { status });
      toast.success(`Successfully updated ${selectedItems.length} ${entityType}`);
      onClearSelection();
      setShowStatusMenu(false);
    } catch (error) {
      toast.error(`Failed to update ${entityType}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkArchive = async () => {
    if (!onBulkArchive) return;

    const confirmed = window.confirm(
      `Are you sure you want to archive ${selectedItems.length} ${entityType}?`
    );

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      await onBulkArchive(selectedItems);
      toast.success(`Successfully archived ${selectedItems.length} ${entityType}`);
      onClearSelection();
    } catch (error) {
      toast.error(`Failed to archive ${entityType}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = () => {
    if (!onBulkExport) return;

    try {
      onBulkExport(selectedItems);
      toast.success(`Exported ${selectedItems.length} ${entityType}`);
    } catch (error) {
      toast.error('Failed to export');
    }
  };

  if (selectedItems.length === 0) return null;

  const statusOptions = {
    assets: ['available', 'in_use', 'maintenance', 'retired'],
    inventory: ['in_stock', 'low_stock', 'out_of_stock'],
    tickets: ['open', 'in_progress', 'resolved', 'closed'],
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedItems.length} selected
            </span>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <div className="flex items-center gap-2">
            {onBulkUpdate && (
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Edit className="w-4 h-4" />
                  Update Status
                </button>

                {showStatusMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
                    {statusOptions[entityType].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleBulkStatusUpdate(status)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {onBulkExport && (
              <button
                onClick={handleBulkExport}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            )}

            {onBulkArchive && (
              <button
                onClick={handleBulkArchive}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            )}

            {onBulkDelete && (
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <button
            onClick={onClearSelection}
            disabled={isProcessing}
            className="inline-flex items-center justify-center p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear selection"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
