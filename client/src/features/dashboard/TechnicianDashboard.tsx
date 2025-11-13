import React, { useMemo, useEffect } from 'react';
import { useTicketsStore } from '@/features/tickets/store';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

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

  const stats = useMemo(() => {
    const openTickets = myTickets.filter(t => t.status === 'open');
    const inProgressTickets = myTickets.filter(t => t.status === 'in_progress');
    const resolvedTickets = myTickets.filter(t => t.status === 'resolved');
    const highPriorityTickets = myTickets.filter(t => t.priority === 'high' || t.priority === 'critical');

    return [
      {
        title: 'My Open Tickets',
        value: openTickets.length,
        detail: 'Waiting to start',
        color: 'bg-blue-500',
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
        title: 'Resolved Today',
        value: resolvedTickets.filter(t => {
          const today = new Date().toDateString();
          return new Date(t.updatedAt).toDateString() === today;
        }).length,
        detail: `${resolvedTickets.length} total resolved`,
        color: 'bg-green-500',
        icon: CheckCircle,
        action: () => navigate('/my-tasks?status=resolved'),
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
  }, [myTickets, navigate]);

  // Recent tickets for quick access
  const recentTickets = useMemo(() => {
    return myTickets
      .filter(t => t.status !== 'resolved' && t.status !== 'closed')
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {currentUser.name || 'Technician'}!</h1>
        <p className="text-blue-100">Here's your workload overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              onClick={stat.action}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{stat.detail}</p>
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
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              View All →
            </button>
          </div>
        </div>

        <div className="p-6">
          {recentTickets.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">All caught up! 🎉</h3>
              <p className="text-gray-600 dark:text-gray-400">You have no active tickets assigned to you.</p>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{ticket.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{ticket.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        Created {new Date(ticket.createdAt).toLocaleDateString()}
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
            onClick={() => navigate('/my/assets')}
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
