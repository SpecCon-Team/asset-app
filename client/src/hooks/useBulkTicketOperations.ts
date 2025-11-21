import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Swal from 'sweetalert2';

interface BulkUpdateData {
  ticketIds: string[];
  updates: {
    status?: string;
    priority?: string;
    assignedToId?: string | null;
  };
}

interface BulkCloseData {
  ticketIds: string[];
  resolution?: string;
}

interface BulkExportData {
  ticketIds: string[];
  format: 'json' | 'csv';
}

interface BulkDeleteData {
  ticketIds: string[];
}

/**
 * Custom hook for bulk ticket operations
 *
 * Provides mutations for:
 * - Bulk update (status, priority, assignment)
 * - Bulk close
 * - Bulk export (JSON/CSV)
 * - Bulk delete (admin only)
 *
 * All operations include:
 * - Loading states
 * - Success/error notifications
 * - Automatic cache invalidation
 * - Audit trail logging
 *
 * @example
 * const { bulkUpdate, bulkClose, bulkExport, bulkDelete } = useBulkTicketOperations();
 *
 * // Update multiple tickets
 * await bulkUpdate.mutateAsync({
 *   ticketIds: ['id1', 'id2'],
 *   updates: { status: 'closed' }
 * });
 */
export function useBulkTicketOperations() {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);

  // Bulk update mutation
  const bulkUpdate = useMutation({
    mutationFn: async (data: BulkUpdateData) => {
      const response = await axios.patch('/api/tickets/bulk', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });

      const updateType = variables.updates.status
        ? 'status'
        : variables.updates.priority
        ? 'priority'
        : 'assignment';

      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Successfully updated ${variables.ticketIds.length} ticket(s)`,
        timer: 3000,
        showConfirmButton: false,
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update tickets',
      });
    },
  });

  // Bulk close mutation
  const bulkClose = useMutation({
    mutationFn: async (data: BulkCloseData) => {
      const response = await axios.post('/api/tickets/bulk/close', data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });

      Swal.fire({
        icon: 'success',
        title: 'Tickets Closed',
        text: `Successfully closed ${variables.ticketIds.length} ticket(s)`,
        timer: 3000,
        showConfirmButton: false,
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Close Failed',
        text: error.response?.data?.message || 'Failed to close tickets',
      });
    },
  });

  // Bulk export function (not a mutation since it downloads)
  const bulkExport = async (data: BulkExportData) => {
    try {
      setIsExporting(true);

      const response = await axios.post('/api/tickets/bulk/export', data, {
        responseType: data.format === 'csv' ? 'blob' : 'json',
      });

      if (data.format === 'csv') {
        // Download CSV file
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tickets-export-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.fire({
          icon: 'success',
          title: 'Export Complete',
          text: `Exported ${data.ticketIds.length} ticket(s) to CSV`,
          timer: 3000,
          showConfirmButton: false,
        });
      } else {
        // Download JSON file
        const jsonStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tickets-export-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.fire({
          icon: 'success',
          title: 'Export Complete',
          text: `Exported ${response.data.count} ticket(s) to JSON`,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: error.response?.data?.message || 'Failed to export tickets',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Bulk delete mutation
  const bulkDelete = useMutation({
    mutationFn: async (data: BulkDeleteData) => {
      const response = await axios.delete('/api/tickets/bulk', { data });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });

      Swal.fire({
        icon: 'success',
        title: 'Tickets Deleted',
        text: `Successfully deleted ${variables.ticketIds.length} ticket(s)`,
        timer: 3000,
        showConfirmButton: false,
      });
    },
    onError: (error: any) => {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.response?.data?.message || 'Failed to delete tickets',
      });
    },
  });

  return {
    bulkUpdate,
    bulkClose,
    bulkExport,
    bulkDelete,
    isExporting,
  };
}

export default useBulkTicketOperations;
