import React, { useMemo, useEffect } from 'react';
import { useTicketsStore } from '@/features/tickets/store';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle, Clock, AlertCircle, TrendingUp, Inbox } from 'lucide-react';
import { formatDate } from '@/lib/dateFormatter';

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const { tickets, fetchTickets } = useTicketsStore();

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter tickets assigned to current technician
  const myTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.assignedToId === currentUser.id);
  }, [tickets, currentUser.id]);

  // Count unassigned tickets (available to claim)
  const unassignedTickets = useMemo(() => {
    return tickets.filter(ticket => ticket.assignedToId === null || ticket.assignedToId === undefined);
  }, [tickets]);

  const stats = useMemo(() => {
    const openTickets = myTickets.filter(t => t.status === 'open');
    const inProgressTickets = myTickets.filter(t => t.status === 'in_progress');
    const closedTickets = myTickets.filter(t => t.status === 'closed');
    const highPriorityTickets = myTickets.filter(t => t.priority === 'high' || t.priority === 'critical');

    return [
      {
        title: 'Unassigned Tickets',
        value: unassignedTickets.length,
        detail: 'Available to claim',
        color: 'bg-purple-500',
        icon: Inbox,
        action: () => navigate('/tickets'),
      },
      {
        title: 'My Open Tickets',
        value: openTickets.length,
        detail: 'Waiting to start',
        color: 'theme-primary',
        icon: ClipboardList,
        action: () => navigate('/my-tasks?status=open'),
      },
      {
        title: 'In Progress',
        value: inProgressTickets.length,
        detail: 'Currently working on',
        color: 'bg-yellow-500',
        icon: Clock,
        action: () => navigate('/my-tasks?status=in_progress'),
      },
      {
        title: 'Completed Today',
        value: closedTickets.filter(t => {
          const today = new Date().toDateString();
          return new Date(t.updatedAt || t.createdAt).toDateString() === today;
        }).length,
        detail: `${closedTickets.length} total completed`,
        color: 'bg-green-500',
        icon: CheckCircle,
        action: () => navigate('/my-tasks?status=closed'),
      },
      {
        title: 'High Priority',
        value: highPriorityTickets.length,
        detail: 'Needs attention',
        color: 'bg-red-500',
        icon: AlertCircle,
        action: () => navigate('/my-tasks?priority=high'),
      },
    ];
  }, [myTickets, unassignedTickets, navigate]);

  // Recent tickets for quick access
  const recentTickets = useMemo(() => {
    return myTickets
      .filter(t => t.status !== 'closed')
      .sort((a, b) => {
        // Sort by priority first, then by date
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;

        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [myTickets]);

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
        return 'theme-status-open'; // Will use theme color
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'closed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'open') {
      return {
        backgroundColor: 'rgba(var(--color-primary-rgb), 0.1)',
        color: 'var(--color-primary)',
      };
    }
    return undefined;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div
        className="rounded-lg shadow-lg p-6 text-white"
        style={{
          background: 'linear-gradient(to right, var(--color-primary), var(--color-primary-dark))',
        }}
      >
        <h1 className="text-3xl font-bold mb-2">Welcome back, {currentUser.name || 'Technician'}!</h1>
        <p className="text-white/90">Here's your workload overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={stat.action}
              className="bg-white dark:bg-gradient-to-br dark:from-gray-700 dark:to-gray-750 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md dark:shadow-xl p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-lg ${stat.color === 'theme-primary' ? '' : stat.color}`}
                  style={stat.color === 'theme-primary' ? { backgroundColor: 'var(--color-primary)' } : undefined}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">{stat.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Tickets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Active Tickets</h2>
            <button
              onClick={() => navigate('/my-tasks')}
              className="text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: 'var(--color-primary)' }}
            >
              View All →
            </button>
          </div>
        </div>

        <div className="p-6">
          {recentTickets.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-16 h-16 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No active tickets assigned</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {unassignedTickets.length > 0
                  ? `There are ${unassignedTickets.length} unassigned ticket${unassignedTickets.length === 1 ? '' : 's'} waiting to be claimed.`
                  : 'All tickets are currently assigned or completed.'}
              </p>
              {unassignedTickets.length > 0 && (
                <button
                  onClick={() => navigate('/tickets')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Unassigned Tickets
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">#{ticket.number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}
                          style={getStatusStyle(ticket.status)}
                        >
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{ticket.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Created {formatDate(ticket.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/my-tasks')}
            className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
          >
            <ClipboardList className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">View My Tasks</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">See all assigned tickets</p>
          </button>

          <button
            onClick={() => navigate('/tickets')}
            className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
          >
            <AlertCircle className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">All Tickets</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Browse all tickets</p>
          </button>

          <button
            onClick={() => navigate('/my-assets')}
            className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
          >
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mb-2" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">My Assets</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">View assigned assets</p>
          </button>
        </div>
      </div>
    </div>
  );
}
