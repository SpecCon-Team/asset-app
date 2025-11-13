import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { listUsers } from '@/features/users/api';
import type { User } from '@/features/users/types';
import { getApiClient } from '@/features/assets/lib/apiClient';
import Swal from 'sweetalert2';

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

  const { tickets, isLoading, error, fetchTickets } = useTicketsStore();

  // Redirect non-admin users to My Tickets
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN' && user.role !== 'TECHNICIAN') {
        navigate('/my/tickets');
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
    return <div className="p-8">Loading tickets...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      await Swal.fire({
        title: 'No Tickets Selected',
        text: 'Please select at least one ticket',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    if (!bulkStatus && !bulkPriority && !bulkAssignee) {
      await Swal.fire({
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

      await Swal.fire({
        title: 'Success!',
        text: `Successfully updated ${selectedTickets.size} ticket(s)!`,
        icon: 'success',
        confirmButtonColor: '#10B981',
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedTickets(new Set());
      setShowBulkActions(false);
      setBulkStatus('');
      setBulkPriority('');
      setBulkAssignee('');
      fetchTickets({ status: statusFilter, priority: priorityFilter });
    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: 'Failed to update tickets',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
      console.error('Bulk update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTickets.size === 0) {
      await Swal.fire({
        title: 'No Tickets Selected',
        text: 'Please select at least one ticket',
        icon: 'warning',
        confirmButtonColor: '#3B82F6',
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Tickets?',
      text: `Are you sure you want to delete ${selectedTickets.size} ticket(s)? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete them',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);
    try {
      await getApiClient().delete('/tickets/bulk', {
        data: {
          ticketIds: Array.from(selectedTickets),
        },
      });

      await Swal.fire({
        title: 'Deleted!',
        text: `Successfully deleted ${selectedTickets.size} ticket(s)!`,
        icon: 'success',
        confirmButtonColor: '#10B981',
        timer: 2000,
        showConfirmButton: false,
      });
      setSelectedTickets(new Set());
      setShowBulkActions(false);
      fetchTickets({ status: statusFilter, priority: priorityFilter });
    } catch (error) {
      await Swal.fire({
        title: 'Error',
        text: 'Failed to delete tickets',
        icon: 'error',
        confirmButtonColor: '#EF4444',
      });
      console.error('Bulk delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col p-8">
      <div className="mb-6 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Ticket Management</h1>
          <p className="text-gray-600">Manage and track support tickets</p>
        </div>
        <button
          onClick={() => navigate('/tickets/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span> New Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8 flex-shrink-0">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
          <p className="text-3xl font-bold mt-2">{filteredTickets.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Open</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {filteredTickets.filter((t) => t.status === 'open').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-3xl font-bold mt-2 text-purple-600">
            {filteredTickets.filter((t) => t.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">
            {filteredTickets.filter((t) => t.priority === 'high' || t.priority === 'critical').length}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex-shrink-0">
        <input
          type="text"
          placeholder="Search tickets by title, number, or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Filters and Bulk Actions */}
      <div className="mb-6 flex gap-4 items-center flex-wrap flex-shrink-0">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>

        {(statusFilter || priorityFilter || assigneeFilter || searchQuery) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Clear Filters
          </button>
        )}

        {selectedTickets.size > 0 && (
          <button
            onClick={() => setShowBulkActions(!showBulkActions)}
            className="ml-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Bulk Actions ({selectedTickets.size})
          </button>
        )}
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedTickets.size > 0 && (
        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4 flex-shrink-0">
          <h3 className="font-semibold mb-3">Update {selectedTickets.size} selected ticket(s)</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
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
          <div className="flex justify-end border-t border-purple-200 pt-4">
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
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <p className="text-gray-500">No tickets found</p>
            {(statusFilter || priorityFilter || assigneeFilter || searchQuery) && (
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow h-full overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 sticky top-0 z-[1]">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTickets.size === filteredTickets.length && filteredTickets.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
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
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTickets.has(ticket.id!)}
                      onChange={() => handleSelectTicket(ticket.id!)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {ticket.number || ticket.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.title}</td>
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
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}
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
        )}
      </div>
    </div>
  );
}