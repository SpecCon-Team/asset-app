import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { listUsers } from '@/features/users/api';
import type { User } from '@/features/users/types';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { showThemedAlert, showSuccess, showError, showConfirmation } from '@/lib/swal-config';
import { formatDate } from '@/lib/dateFormatter';
import { PageLoader } from '@/components/LoadingSpinner';
import { exportToCSV, TICKET_EXPORT_COLUMNS, generateFilename, downloadCSVTemplate, TICKET_IMPORT_TEMPLATE_COLUMNS } from '@/lib/exportUtils';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { CSVImportModal } from '@/components';

export default function TicketsListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  
  // Bulk actions state
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkPriority, setBulkPriority] = useState('');
  const [bulkAssignee, setBulkAssignee] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { tickets, isLoading, error, fetchTickets } = useTicketsStore();

  // Redirect non-admin users to My Tickets
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN' && user.role !== 'TECHNICIAN') {
        navigate('/my-tickets');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersData = await listUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTickets({ status: statusFilter, priority: priorityFilter });
  }, [statusFilter, priorityFilter, fetchTickets]);

  if (isLoading) {
    return <PageLoader message="Loading tickets..." />;
  }

  if (error) {
    return <div className="p-8 text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-900 min-h-screen">Error: {error}</div>;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      searchQuery === '' ||
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAssignee = 
      assigneeFilter === '' ||
      (assigneeFilter === 'unassigned' && !ticket.assignedToId) ||
      ticket.assignedToId === assigneeFilter;

    return matchesSearch && matchesAssignee;
  });

  const clearFilters = () => {
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setSearchQuery('');
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(filteredTickets.map(t => t.id!));
      setSelectedTickets(allIds);
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleSelectTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId);
    } else {
      newSelected.add(ticketId);
    }
    setSelectedTickets(newSelected);
  };

  const handleBulkUpdate = async () => {
    if (selectedTickets.size === 0) {
      await showThemedAlert({
        title: 'No Tickets Selected',
        text: 'Please select at least one ticket',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    if (!bulkStatus && !bulkPriority && !bulkAssignee) {
      await showThemedAlert({
        title: 'No Updates Selected',
        text: 'Please select at least one field to update',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updates: any = {};
      if (bulkStatus) updates.status = bulkStatus;
      if (bulkPriority) updates.priority = bulkPriority;
      if (bulkAssignee) updates.assignedToId = bulkAssignee === 'unassign' ? null : bulkAssignee;

      await getApiClient().patch('/tickets/bulk', {
        ticketIds: Array.from(selectedTickets),
        updates,
      });

      await showSuccess('Success!', `Successfully updated ${selectedTickets.size} ticket(s)!`, 2000);
      setSelectedTickets(new Set());
      setShowBulkActions(false);
      setBulkStatus('');
      setBulkPriority('');
      setBulkAssignee('');
      fetchTickets({ status: statusFilter, priority: priorityFilter });
    } catch (error) {
      await showError('Error', 'Failed to update tickets');
      console.error('Bulk update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.size === 0) {
      await showThemedAlert({
        title: 'No Tickets Selected',
        text: 'Please select at least one ticket',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    const result = await showConfirmation(
      'Delete Tickets?',
      `Are you sure you want to delete ${selectedTickets.size} ticket(s)? This action cannot be undone.`,
      'Yes, delete them',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      await getApiClient().delete('/tickets/bulk', {
        data: {
          ticketIds: Array.from(selectedTickets),
        },
      });

      await showSuccess('Deleted!', `Successfully deleted ${selectedTickets.size} ticket(s)!`, 2000);
      setSelectedTickets(new Set());
      setShowBulkActions(false);
      fetchTickets({ status: statusFilter, priority: priorityFilter });
    } catch (error) {
      await showError('Error', 'Failed to delete tickets');
      console.error('Bulk delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const dataToExport = filteredTickets.length > 0 ? filteredTickets : tickets;
      const filename = generateFilename('tickets_export', 'csv');
      exportToCSV(dataToExport, TICKET_EXPORT_COLUMNS, filename);
      toast.success(`Exported ${dataToExport.length} tickets to CSV`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export tickets');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const filename = 'ticket_import_template.csv';
      downloadCSVTemplate(TICKET_IMPORT_TEMPLATE_COLUMNS, filename);
      toast.success('Import template downloaded successfully');
    } catch (error) {
      console.error('Template download failed:', error);
      toast.error('Failed to download template');
    }
  };

  const handleImportCSV = async (file: File) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user || !user.id) {
      throw new Error('User not found. Please login again.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('createdById', user.id);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch('http://localhost:4000/api/tickets/import-csv', {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import CSV');
    }

    const result = await response.json();

    // Refresh tickets list after import
    await fetchTickets({ status: statusFilter, priority: priorityFilter });

    return result;
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col p-3 sm:p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="mb-4 sm:mb-6 flex-shrink-0">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Ticket Management</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage and track support tickets</p>
        </div>

        {/* Action Buttons - Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:flex lg:flex-wrap gap-2 sm:gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-3 sm:px-4 py-2 min-h-[44px] bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
            title="Download CSV template for bulk import"
          >
            <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Template</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 sm:px-4 py-2 min-h-[44px] bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
            title="Import tickets from CSV"
          >
            <Upload className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Import CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={tickets.length === 0}
            className="px-3 sm:px-4 py-2 min-h-[44px] bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
            title="Export tickets to CSV"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>
          <button
            onClick={() => navigate('/tickets/new')}
            className="px-3 sm:px-4 py-2 min-h-[44px] bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors text-sm sm:text-base"
          >
            <span>+</span> <span className="truncate">New Ticket</span>
          </button>
        </div>
      </div>

      {/* Stats Cards - Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-gray-900 dark:text-white">{filteredTickets.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Open</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-blue-600 dark:text-blue-400">
            {filteredTickets.filter((t) => t.status === 'open').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-purple-600 dark:text-purple-400">
            {filteredTickets.filter((t) => t.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg shadow-sm">
          <h3 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">High Priority</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2 text-red-600 dark:text-red-400">
            {filteredTickets.filter((t) => t.priority === 'high' || t.priority === 'critical').length}
          </p>
        </div>
      </div>

      {/* Search Bar - Responsive */}
      <div className="mb-4 sm:mb-6 flex-shrink-0" role="search">
        <input
          type="search"
          placeholder="Search tickets by title, number, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white text-sm sm:text-base min-h-[44px]"
          aria-label="Search tickets by title, ticket number, or description"
        />
      </div>

      {/* Filters and Bulk Actions - Responsive */}
      <div className="mb-4 sm:mb-6 flex gap-2 sm:gap-4 items-center flex-wrap flex-shrink-0">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[44px] px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base flex-1 sm:flex-initial min-w-[120px]"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="min-h-[44px] px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base flex-1 sm:flex-initial min-w-[120px]"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="min-h-[44px] px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-200 text-sm sm:text-base flex-1 sm:flex-initial min-w-[120px]"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>

        {/* Clear Filters button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            clearFilters();
          }}
          disabled={!statusFilter && !priorityFilter && !assigneeFilter && !searchQuery}
          className="min-h-[44px] px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
        >
          Clear
          {(statusFilter || priorityFilter || assigneeFilter || searchQuery) && (
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full font-semibold">
              {[statusFilter, priorityFilter, assigneeFilter, searchQuery].filter(Boolean).length}
            </span>
          )}
        </button>

        {selectedTickets.size > 0 && (
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="ml-auto px-3 sm:px-4 py-2 min-h-[44px] bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm sm:text-base whitespace-nowrap"
          >
            Bulk Actions ({selectedTickets.size})
          </button>
        )}
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedTickets.size > 0 && (
        <div className="mb-6 bg-purple-50 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-700 rounded-lg p-4 flex-shrink-0">
          <h3 className="font-semibold mb-3 dark:text-white">Update {selectedTickets.size} selected ticket(s)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Status (no change)</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={bulkPriority}
              onChange={(e) => setBulkPriority(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Priority (no change)</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <select
              value={bulkAssignee}
              onChange={(e) => setBulkAssignee(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Assignee (no change)</option>
              <option value="unassign">Unassign</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>

            <button
              onClick={handleBulkUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
            >
              {isUpdating ? 'Updating...' : 'Apply Changes'}
            </button>
          </div>
          <div className="flex justify-end border-t border-purple-200 dark:border-purple-700 pt-4">
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {isDeleting ? 'Deleting...' : `Delete Selected (${selectedTickets.size})`}
            </button>
          </div>
        </div>
      )}

      {/* Tickets Table */}
      <div className="flex-1 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-lg shadow text-center">
            <p className="text-gray-500 dark:text-gray-400">No tickets found</p>
            {(statusFilter || priorityFilter || assigneeFilter || searchQuery) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearFilters();
                }}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 overflow-auto h-full pb-4">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTickets.has(ticket.id!)}
                        onChange={() => handleSelectTicket(ticket.id!)}
                        className="w-5 h-5 mt-1"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {ticket.number || ticket.id}
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {ticket.title}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(ticket.status || '')}`}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Priority:</span>
                      <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority || '')}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Assigned To:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-300">
                        {ticket.assignedTo?.name || ticket.assignedTo?.email || 'Unassigned'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-300">
                        {formatDate(ticket.createdAt)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium min-h-[44px]"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow h-full overflow-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 dark:from-gray-700 dark:via-gray-700 dark:to-gray-700 sticky top-0 z-[1]">
              <tr>
                <th className="px-6 py-3 text-left">
                  <label className="flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTickets.size === filteredTickets.length && filteredTickets.length > 0}
                      onChange={handleSelectAll}
                      className="w-5 h-5 cursor-pointer"
                      aria-label="Select all tickets"
                    />
                  </label>
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Ticket #</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <label className="flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTickets.has(ticket.id!)}
                        onChange={() => handleSelectTicket(ticket.id!)}
                        className="w-5 h-5 cursor-pointer"
                        aria-label={`Select ticket ${ticket.number || ticket.id}`}
                      />
                    </label>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {ticket.number || ticket.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-gray-300">{ticket.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(ticket.status || '')}`}>
                      {ticket.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority || '')}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ticket.assignedTo?.name || ticket.assignedTo?.email || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(ticket.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </>
        )}
      </div>

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportCSV}
        title="Import Tickets from CSV"
        entityType="tickets"
      />
    </div>
  );
}