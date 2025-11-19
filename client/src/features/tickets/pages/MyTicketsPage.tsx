import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketsStore } from '../store';
import { Ticket, AlertCircle, Archive } from 'lucide-react';
import { formatDate } from '@/lib/dateFormatter';
import { PageLoader } from '@/components/LoadingSpinner';

export default function MyTicketsPage() {
  const navigate = useNavigate();
  const { tickets, isLoading, error, fetchTickets } = useTicketsStore();
  const [user] = useState(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, showArchived]);

  // Role-based ticket filtering
  const myTickets = tickets.filter((ticket) => {
    if (!user) return false;

    // ADMIN: sees all tickets
    if (user.role === 'ADMIN') {
      return true;
    }

    // TECHNICIAN: sees tickets assigned to them OR created by them
    if (user.role === 'TECHNICIAN') {
      return (
        ticket.assignedToId === user.id ||
        ticket.createdById === user.id
      );
    }

    // USER: sees only tickets they created
    return ticket.createdById === user.id;
  });

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
    return <PageLoader message="Loading your tickets..." />;
  }

  if (error) {
    return <div className="p-8 text-red-600 dark:text-red-400 bg-gray-50 dark:bg-gray-900 min-h-screen">Error: {error}</div>;
  }

  const openTickets = displayTickets.filter((t) => t.status === 'open').length;
  const inProgressTickets = displayTickets.filter((t) => t.status === 'in_progress').length;
  const resolvedTickets = displayTickets.filter((t) => t.status === 'closed').length;
  const totalTickets = displayTickets.length;
  const archivedCount = archivedTickets.length;

  // Filter tickets based on selected status
  const filteredTickets = displayTickets.filter((ticket) => {
    if (filterStatus === 'all') return true;
    return ticket.status === filterStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

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

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-8 flex flex-col">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {user?.role === 'ADMIN' ? 'All Tickets' : user?.role === 'TECHNICIAN' ? 'Assigned Tickets' : 'My Tickets'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {user?.role === 'ADMIN'
                ? 'View and manage all support tickets'
                : user?.role === 'TECHNICIAN'
                ? 'View tickets assigned to you'
                : 'Track your support requests'}
            </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 flex-shrink-0">
          <div
            onClick={() => setFilterStatus('open')}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              filterStatus === 'open' ? 'ring-2 ring-blue-600 ring-offset-2 bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Open</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{openTickets}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            {filterStatus === 'open' && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active Filter</p>
              </div>
            )}
          </div>

          <div
            onClick={() => setFilterStatus('in_progress')}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              filterStatus === 'in_progress' ? 'ring-2 ring-purple-600 ring-offset-2 bg-purple-50 dark:bg-purple-900/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{inProgressTickets}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <Ticket className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            {filterStatus === 'in_progress' && (
              <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Active Filter</p>
              </div>
            )}
          </div>

          <div
            onClick={() => setFilterStatus('closed')}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              filterStatus === 'closed' ? 'ring-2 ring-green-600 ring-offset-2 bg-green-50 dark:bg-green-900/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{resolvedTickets}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Ticket className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            {filterStatus === 'closed' && (
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Active Filter</p>
              </div>
            )}
          </div>

          <div
            onClick={() => setFilterStatus('all')}
            className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              filterStatus === 'all' ? 'ring-2 ring-gray-600 ring-offset-2 bg-gray-50 dark:bg-gray-700/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalTickets}</p>
              </div>
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                <Ticket className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            {filterStatus === 'all' && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Showing All</p>
              </div>
            )}
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
          {!showArchived && user?.role !== 'ADMIN' && (
            <button
              onClick={() => navigate('/tickets/new')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              + New Ticket
            </button>
          )}

          {/* Active Filter Indicator */}
          {filterStatus !== 'all' && (
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Filtered by: <span className="font-semibold text-blue-700 dark:text-blue-300">
                  {filterStatus === 'open' ? 'Open Tickets' :
                   filterStatus === 'in_progress' ? 'In Progress Tickets' :
                   filterStatus === 'closed' ? 'Completed Tickets' : 'All Tickets'}
                </span>
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFilterStatus('all');
                }}
                className="ml-auto flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                title="Clear filter and show all tickets"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Tickets List */}
        <div className="flex-1">
          {myTickets.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {user?.role === 'ADMIN' ? 'No tickets in the system' : user?.role === 'TECHNICIAN' ? 'No tickets assigned yet' : 'No tickets yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {user?.role === 'ADMIN'
                ? 'No support tickets have been created yet'
                : user?.role === 'TECHNICIAN'
                ? 'You have no tickets assigned to you at the moment'
                : 'Create your first support ticket to get started'}
            </p>
            {user?.role !== 'ADMIN' && (
              <button
                onClick={() => navigate('/tickets/new')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Ticket
              </button>
            )}
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
              No {filterStatus === 'open' ? 'open' :
                  filterStatus === 'in_progress' ? 'in progress' :
                  filterStatus === 'closed' ? 'completed' : ''} tickets found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filterStatus === 'open'
                ? "You don't have any open tickets at the moment"
                : filterStatus === 'in_progress'
                ? "You don't have any tickets in progress"
                : filterStatus === 'closed'
                ? "You don't have any completed tickets yet"
                : "No tickets found"}
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFilterStatus('all');
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              View All Tickets
            </button>
          </div>
        ) : (
          <>
          <div className="space-y-4">
            {paginatedTickets.map((ticket) => (
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
                    <span>
                      {ticket.status === 'closed' ? (
                        <>
                          <span className="text-green-600 dark:text-green-400 font-medium">Closed by: </span>
                          {ticket.assignedTo ? (ticket.assignedTo.name || ticket.assignedTo.email) : 'Technician'}
                        </>
                      ) : (
                        <>
                          Assigned to: {
                            ticket.assignedTo
                              ? (ticket.assignedTo.name || ticket.assignedTo.email)
                              : <span className="text-orange-600 dark:text-orange-400 font-medium">Awaiting Assignment</span>
                          }
                        </>
                      )}
                    </span>
                    {ticket.createdAt && (
                      <span>Created: {formatDate(ticket.createdAt)}</span>
                    )}
                  </div>
                  {ticket.resolution && ticket.status === 'closed' && (
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Resolved</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredTickets.length > 0 && (
            <div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span>
                  Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold">{Math.min(endIndex, filteredTickets.length)}</span> of{' '}
                  <span className="font-semibold">{filteredTickets.length}</span> tickets
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 min-h-[44px] bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Previous
                </button>
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}