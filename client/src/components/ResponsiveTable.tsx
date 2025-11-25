import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  mobileLabel?: string; // Custom label for mobile card view
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  getItemId: (item: T) => string;
  emptyMessage?: string;
}

export default function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  actions,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemId,
  emptyMessage = 'No data available',
}: ResponsiveTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onSelectionChange) return;

    if (e.target.checked) {
      onSelectionChange(data.map(getItemId));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (itemId: string) => {
    if (!onSelectionChange) return;

    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  const toggleRowExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedRows(newExpanded);
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection]);

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === data.length && data.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(String(column.key))}
                      className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    >
                      {column.label}
                      {sortColumn === column.key &&
                        (sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        ))}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedData.map((item) => {
              const itemId = getItemId(item);
              return (
                <tr
                  key={itemId}
                  onClick={() => onRowClick?.(item)}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
                  } transition-colors`}
                >
                  {selectable && (
                    <td
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(itemId)}
                        onChange={() => handleSelectItem(itemId)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100"
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td
                      className="px-4 py-4 text-right text-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions(item)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedData.map((item) => {
          const itemId = getItemId(item);
          const isExpanded = expandedRows.has(itemId);

          return (
            <div
              key={itemId}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Card Header */}
              <div
                className="p-4 flex items-start gap-3"
                onClick={() => onRowClick?.(item)}
              >
                {selectable && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(itemId)}
                      onChange={() => handleSelectItem(itemId)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* Show first 2 columns in header */}
                  {columns.slice(0, 2).map((column) => (
                    <div key={String(column.key)} className="mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                        {column.mobileLabel || column.label}
                      </p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {column.render ? column.render(item) : item[column.key]}
                      </p>
                    </div>
                  ))}

                  {/* Expandable section for remaining columns */}
                  {isExpanded && columns.length > 2 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      {columns.slice(2).map((column) => (
                        <div key={String(column.key)} className="flex justify-between items-start gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {column.mobileLabel || column.label}:
                          </span>
                          <span className="text-sm text-gray-900 dark:text-white text-right">
                            {column.render ? column.render(item) : item[column.key]}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 flex flex-col gap-2">
                  {columns.length > 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleRowExpansion(itemId);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  {actions && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {actions(item)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
