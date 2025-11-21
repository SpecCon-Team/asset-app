import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Save,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Clock,
  ChevronDown,
  Star,
  Trash2,
} from 'lucide-react';
import { Button } from './ui/Button';

interface SearchFilter {
  field: string;
  operator: string;
  value: string;
}

interface SavedFilter {
  id: string;
  name: string;
  filters: SearchFilter[];
  createdAt: Date;
  isFavorite: boolean;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilter[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Advanced Search & Filters Component
 *
 * Powerful search interface with:
 * - Multi-criteria filtering
 * - Boolean operators (AND)
 * - Date range filtering
 * - Saved filter presets
 * - Full-text search
 * - Quick filters
 *
 * @example
 * const [isOpen, setIsOpen] = useState(false);
 *
 * <AdvancedSearch
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSearch={(filters) => applyFilters(filters)}
 * />
 */
export function AdvancedSearch({ onSearch, isOpen, onClose }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilter[]>([
    { field: 'title', operator: 'contains', value: '' },
  ]);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    const saved = localStorage.getItem('savedFilters');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  // Available fields for filtering
  const fields = [
    { value: 'title', label: 'Title' },
    { value: 'description', label: 'Description' },
    { value: 'number', label: 'Ticket Number' },
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'assignedTo', label: 'Assigned To' },
    { value: 'createdBy', label: 'Created By' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
  ];

  // Operators based on field type
  const getOperators = (field: string) => {
    if (field === 'createdAt' || field === 'updatedAt') {
      return [
        { value: 'after', label: 'After' },
        { value: 'before', label: 'Before' },
        { value: 'between', label: 'Between' },
      ];
    }
    if (field === 'status' || field === 'priority' || field === 'assignedTo' || field === 'createdBy') {
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'not_equals', label: 'Not Equals' },
      ];
    }
    return [
      { value: 'contains', label: 'Contains' },
      { value: 'not_contains', label: 'Does Not Contain' },
      { value: 'equals', label: 'Equals' },
      { value: 'starts_with', label: 'Starts With' },
      { value: 'ends_with', label: 'Ends With' },
    ];
  };

  // Add new filter row
  const addFilter = () => {
    setFilters([...filters, { field: 'title', operator: 'contains', value: '' }]);
  };

  // Remove filter row
  const removeFilter = (index: number) => {
    if (filters.length > 1) {
      setFilters(filters.filter((_, i) => i !== index));
    }
  };

  // Update filter
  const updateFilter = (index: number, updates: Partial<SearchFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };

    // Reset operator when field changes
    if (updates.field) {
      const operators = getOperators(updates.field);
      newFilters[index].operator = operators[0].value;
    }

    setFilters(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters([{ field: 'title', operator: 'contains', value: '' }]);
  };

  // Apply filters
  const handleSearch = () => {
    const validFilters = filters.filter(f => f.value.trim() !== '');
    onSearch(validFilters);
    onClose();
  };

  // Save current filter
  const saveFilter = () => {
    if (!filterName.trim()) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: filters.filter(f => f.value.trim() !== ''),
      createdAt: new Date(),
      isFavorite: false,
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));

    setFilterName('');
    setShowSaveDialog(false);
  };

  // Load saved filter
  const loadFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
  };

  // Delete saved filter
  const deleteFilter = (id: string) => {
    const updated = savedFilters.filter(f => f.id !== id);
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
  };

  // Toggle favorite
  const toggleFavorite = (id: string) => {
    const updated = savedFilters.map(f =>
      f.id === id ? { ...f, isFavorite: !f.isFavorite } : f
    );
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
  };

  // Quick filter presets
  const quickFilters = [
    {
      name: 'My Open Tickets',
      filters: [
        { field: 'status', operator: 'equals', value: 'open' },
        { field: 'assignedTo', operator: 'equals', value: 'me' },
      ],
    },
    {
      name: 'High Priority',
      filters: [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'status', operator: 'not_equals', value: 'closed' },
      ],
    },
    {
      name: 'Unassigned',
      filters: [
        { field: 'assignedTo', operator: 'equals', value: 'null' },
        { field: 'status', operator: 'not_equals', value: 'closed' },
      ],
    },
    {
      name: 'Last 7 Days',
      filters: [
        { field: 'createdAt', operator: 'after', value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      ],
    },
  ];

  const activeFiltersCount = useMemo(() => {
    return filters.filter(f => f.value.trim() !== '').length;
  }, [filters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Panel */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl animate-scale-in max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Advanced Search
            </h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Filters */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Quick Filters
            </h3>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => setFilters(preset.filters)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Saved Filters
              </h3>
              <div className="space-y-2">
                {savedFilters.map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <button
                      onClick={() => loadFilter(saved)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          saved.isFavorite
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-400'
                        }`}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {saved.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({saved.filters.length} filter{saved.filters.length !== 1 ? 's' : ''})
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(saved.id)}
                        className="p-1 text-gray-400 hover:text-yellow-500 transition-colors"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFilter(saved.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Builder */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Build Custom Filter
              </h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-3">
              {filters.map((filter, index) => (
                <div key={index} className="flex items-start gap-2">
                  {/* Field */}
                  <select
                    value={filter.field}
                    onChange={(e) => updateFilter(index, { field: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {fields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  {/* Operator */}
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, { operator: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    {getOperators(filter.field).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value */}
                  <input
                    type={
                      filter.field === 'createdAt' || filter.field === 'updatedAt'
                        ? 'date'
                        : 'text'
                    }
                    value={filter.value}
                    onChange={(e) => updateFilter(index, { value: e.target.value })}
                    placeholder="Enter value..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Remove button */}
                  <button
                    onClick={() => removeFilter(index)}
                    disabled={filters.length === 1}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {/* Add Filter Button */}
              <button
                onClick={addFilter}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors text-sm font-medium"
              >
                + Add Filter (AND)
              </button>
            </div>
          </div>

          {/* Save Filter Dialog */}
          {showSaveDialog && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Save Filter
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  placeholder="Filter name..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyDown={(e) => e.key === 'Enter' && saveFilter()}
                />
                <Button variant="primary" onClick={saveFilter} size="sm">
                  Save
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSaveDialog(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Filter
          </button>

          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSearch}
              leftIcon={<Search className="w-4 h-4" />}
              disabled={activeFiltersCount === 0}
            >
              Search ({activeFiltersCount})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdvancedSearch;
