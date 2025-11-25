import React, { useState } from 'react';
import { Filter, X, Calendar, DollarSign, Tag, MapPin, User } from 'lucide-react';

export interface FilterConfig {
  dateRange?: {
    from: string;
    to: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  tags?: string[];
  location?: string;
  assignedTo?: string;
  category?: string;
  status?: string[];
  priority?: string[];
  customFilters?: Record<string, any>;
}

interface AdvancedFilterProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterConfig) => void;
  onReset: () => void;
  filterOptions: {
    categories?: string[];
    locations?: string[];
    users?: Array<{ id: string; name: string }>;
    tags?: string[];
    statuses?: string[];
    priorities?: string[];
  };
  entityType: 'assets' | 'inventory' | 'tickets';
}

export default function AdvancedFilter({
  isOpen,
  onClose,
  onApply,
  onReset,
  filterOptions,
  entityType,
}: AdvancedFilterProps) {
  const [filters, setFilters] = useState<FilterConfig>({});

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    onReset();
    onClose();
  };

  const updateFilter = (key: keyof FilterConfig, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'status' | 'priority' | 'tags', value: string) => {
    setFilters((prev) => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((v) => v !== value)
        : [...currentArray, value];
      return { ...prev, [key]: newArray };
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Filter Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Advanced Filters
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">From</label>
                <input
                  type="date"
                  value={filters.dateRange?.from || ''}
                  onChange={(e) =>
                    updateFilter('dateRange', {
                      ...filters.dateRange,
                      from: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400">To</label>
                <input
                  type="date"
                  value={filters.dateRange?.to || ''}
                  onChange={(e) =>
                    updateFilter('dateRange', {
                      ...filters.dateRange,
                      to: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Price Range Filter (for assets/inventory) */}
          {(entityType === 'assets' || entityType === 'inventory') && (
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <DollarSign className="w-4 h-4" />
                Price Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Min</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.priceRange?.min || ''}
                    onChange={(e) =>
                      updateFilter('priceRange', {
                        ...filters.priceRange,
                        min: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400">Max</label>
                  <input
                    type="number"
                    placeholder="10000"
                    value={filters.priceRange?.max || ''}
                    onChange={(e) =>
                      updateFilter('priceRange', {
                        ...filters.priceRange,
                        max: Number(e.target.value),
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          {filterOptions.categories && filterOptions.categories.length > 0 && (
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Tag className="w-4 h-4" />
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => updateFilter('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Categories</option>
                {filterOptions.categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location Filter */}
          {filterOptions.locations && filterOptions.locations.length > 0 && (
            <div className="mb-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <select
                value={filters.location || ''}
                onChange={(e) => updateFilter('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Locations</option>
                {filterOptions.locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          {filterOptions.statuses && filterOptions.statuses.length > 0 && (
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Status
              </label>
              <div className="space-y-2">
                {filterOptions.statuses.map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.status || []).includes(status)}
                      onChange={() => toggleArrayFilter('status', status)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {status.replace('_', ' ').toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Priority Filter (for tickets) */}
          {entityType === 'tickets' &&
            filterOptions.priorities &&
            filterOptions.priorities.length > 0 && (
              <div className="mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Priority
                </label>
                <div className="space-y-2">
                  {filterOptions.priorities.map((priority) => (
                    <label
                      key={priority}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={(filters.priority || []).includes(priority)}
                        onChange={() => toggleArrayFilter('priority', priority)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {priority.toUpperCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

          {/* Assigned To Filter (for tickets) */}
          {entityType === 'tickets' &&
            filterOptions.users &&
            filterOptions.users.length > 0 && (
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="w-4 h-4" />
                  Assigned To
                </label>
                <select
                  value={filters.assignedTo || ''}
                  onChange={(e) => updateFilter('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Users</option>
                  {filterOptions.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
