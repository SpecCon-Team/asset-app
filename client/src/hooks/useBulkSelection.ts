import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing bulk selection of items
 * Handles select all, select individual, and clear selection
 *
 * @example
 * const { selectedIds, handleSelectAll, handleSelectOne, clearSelection, selectedCount } =
 *   useBulkSelection(tickets.map(t => t.id));
 */
export function useBulkSelection<T extends string | number>(allIds: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  // Select or deselect a single item
  const handleSelectOne = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Select or deselect all items
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(allIds));
      } else {
        setSelectedIds(new Set());
      }
    },
    [allIds]
  );

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Check if a specific item is selected
  const isSelected = useCallback(
    (id: T) => {
      return selectedIds.has(id);
    },
    [selectedIds]
  );

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    return allIds.length > 0 && selectedIds.size === allIds.length;
  }, [allIds.length, selectedIds.size]);

  // Check if some (but not all) items are selected
  const isIndeterminate = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < allIds.length;
  }, [allIds.length, selectedIds.size]);

  // Get count of selected items
  const selectedCount = useMemo(() => {
    return selectedIds.size;
  }, [selectedIds.size]);

  // Get array of selected IDs
  const selectedArray = useMemo(() => {
    return Array.from(selectedIds);
  }, [selectedIds]);

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    handleSelectOne,
    handleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isIndeterminate,
  };
}

export default useBulkSelection;
