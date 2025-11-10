import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { Ticket, AlertCircle } from 'lucide-react';

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const { tickets, isLoading, error, fetchTickets } = useTicketsStore();
  const [userEmail] = useState(() => localStorage.getItem('userEmail') || 'kagisos@specon.co.za');

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const myTickets = tickets.filter(
    (ticket) => ticket.created_by === userEmail || ticket.assigned_to === userEmail
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  const openTickets = myTickets.filter((t) => t.status === 'open').length;
  const resolvedTickets = myTickets.filter((t) => t.status === 'closed').length;
  const totalTickets = myTickets.length;

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-600 mt-2">Track your support requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Open Tickets</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{openTickets}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Resolved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{resolvedTickets}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Ticket className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalTickets}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <Ticket className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* New Ticket Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/tickets/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + New Ticket
          </button>
        </div>

        {/* Tickets List */}
        {myTickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-6">Create your first support ticket to get started</p>
            <button
              onClick={() => navigate('/tickets/new')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>
                    <p className="text-sm text-gray-500">
                      Ticket #{ticket.ticket_number || ticket.id}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(ticket.status || '')}`}>
                      {ticket.status?.replace('_', ' ')}
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority || '')}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {ticket.description || 'No description'}
                </p>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="space-x-4">
                    <span>Assigned to: {ticket.assigned_to || 'Unassigned'}</span>
                    {ticket.created_at && (
                      <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    )}
                  </div>
                  {ticket.resolution && (
                    <div className="flex items-center gap-1 text-green-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Resolved</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}