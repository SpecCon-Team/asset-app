import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { Ticket, AlertCircle, Archive } from 'lucide-react';

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const { tickets, isLoading, error, fetchTickets } = useTicketsStore();
  const [userEmail] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email;
    }
    return '';
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const myTickets = tickets.filter(
    (ticket) => ticket.createdBy?.email === userEmail
  );

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Separate active and archived tickets
  const activeTickets = myTickets.filter((ticket) => {
    if (!ticket.createdAt) return true;
    const ticketDate = new Date(ticket.createdAt);
    return ticketDate >= thirtyDaysAgo;
  });

  const archivedTickets = myTickets.filter((ticket) => {
    if (!ticket.createdAt) return false;
    const ticketDate = new Date(ticket.createdAt);
    return ticketDate < thirtyDaysAgo;
  });

  // Use active or archived tickets based on toggle
  const displayTickets = showArchived ? archivedTickets : activeTickets;

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

  const openTickets = displayTickets.filter((t) => t.status === 'open').length;
  const resolvedTickets = displayTickets.filter((t) => t.status === 'closed').length;
  const totalTickets = displayTickets.length;
  const archivedCount = archivedTickets.length;

  // Filter tickets based on selected status
  const filteredTickets = displayTickets.filter((ticket) => {
    if (filterStatus === 'all') return true;
    return ticket.status === filterStatus;
  });

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
    <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8 h-full flex flex-col">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tickets</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Track your support requests</p>
          </div>
          {archivedCount > 0 && (
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setFilterStatus('all');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showArchived
                  ? 'bg-gray-600 text-white border-gray-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Archive className="w-5 h-5" />
              <span>
                {showArchived ? 'View Active Tickets' : `View Archived (${archivedCount})`}
              </span>
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 flex-shrink-0">
          <div
            onClick={() => setFilterStatus('open')}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg ${
              filterStatus === 'open' ? 'ring-2 ring-blue-600 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open Tickets</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{openTickets}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('closed')}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg ${
              filterStatus === 'closed' ? 'ring-2 ring-green-600 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Resolved</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{resolvedTickets}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Ticket className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('all')}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg ${
              filterStatus === 'all' ? 'ring-2 ring-gray-600 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalTickets}</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Ticket className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Archive Notice Banner */}
        {showArchived && (
          <div className="mb-6 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg p-4 flex items-center gap-3 flex-shrink-0">
            <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Viewing Archived Tickets</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">Showing tickets older than 30 days</p>
            </div>
          </div>
        )}

        {/* New Ticket Button */}
        <div className="mb-6 flex justify-between items-center flex-shrink-0">
          {!showArchived && (
            <button
              onClick={() => navigate('/tickets/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + New Ticket
            </button>
          )}

          {/* Active Filter Indicator */}
          {filterStatus !== 'all' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Showing: <span className="font-semibold">{filterStatus === 'open' ? 'Open Tickets' : 'Resolved Tickets'}</span>
              </span>
              <button
                onClick={() => setFilterStatus('all')}
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto">
          {myTickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tickets yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first support ticket to get started</p>
            <button
              onClick={() => navigate('/tickets/new')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Ticket
            </button>
          </div>
        ) : displayTickets.length === 0 && showArchived ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Archive className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No archived tickets</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have any tickets older than 30 days</p>
            <button
              onClick={() => setShowArchived(false)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              View Active Tickets
            </button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {filterStatus === 'open' ? 'open' : 'resolved'} tickets found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filterStatus === 'open'
                ? "You don't have any open tickets at the moment"
                : "You don't have any resolved tickets yet"}
            </p>
            <button
              onClick={() => setFilterStatus('all')}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              View All Tickets
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ticket.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ticket #{ticket.number || ticket.id}
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

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {ticket.description || 'No description'}
                </p>

                <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="space-x-4">
                    <span>Assigned to: {ticket.assignedTo?.email || 'Unassigned'}</span>
                    {ticket.createdAt && (
                      <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                  {ticket.resolution && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
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
    </div>
  );
}