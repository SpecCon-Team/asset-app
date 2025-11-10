import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';

export default function TicketsListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const { tickets, isLoading, error, fetchTickets } = useTicketsStore();

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

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
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
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
          <p className="text-3xl font-bold mt-2">{tickets.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Open</h3>
          <p className="text-3xl font-bold mt-2 text-blue-600">
            {tickets.filter((t) => t.status === 'open').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
          <p className="text-3xl font-bold mt-2 text-purple-600">
            {tickets.filter((t) => t.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
          <p className="text-3xl font-bold mt-2 text-red-600">
            {tickets.filter((t) => t.priority === 'high' || t.priority === 'critical').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
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
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow text-center">
          <p className="text-gray-500">No tickets found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {ticket.ticket_number || ticket.id}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.assigned_to || 'Unassigned'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : '-'}
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
  );
}