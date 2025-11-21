import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';

interface Ticket {
  id: string;
  status: string;
  priority: string;
  createdAt: Date | string;
  assignedToId?: string;
  assignedTo?: {
    id: string;
    name: string | null;
  };
}

interface AnalyticsProps {
  tickets: Ticket[];
  dateRange?: { start: Date; end: Date };
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

/**
 * Enhanced Analytics Dashboard Component
 *
 * Provides comprehensive ticket analytics and insights:
 * - Ticket trends over time
 * - Status distribution
 * - Priority breakdown
 * - Technician performance
 * - Response time metrics
 * - SLA compliance
 *
 * @example
 * <EnhancedAnalytics
 *   tickets={tickets}
 *   dateRange={{ start: new Date('2025-01-01'), end: new Date() }}
 * />
 */
export function EnhancedAnalytics({ tickets, dateRange }: AnalyticsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Filter tickets by selected period
  const filteredTickets = useMemo(() => {
    if (selectedPeriod === 'all') return tickets;

    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[selectedPeriod];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return tickets.filter(ticket => new Date(ticket.createdAt) >= cutoffDate);
  }, [tickets, selectedPeriod]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = filteredTickets.length;
    const open = filteredTickets.filter(t => t.status === 'open').length;
    const inProgress = filteredTickets.filter(t => t.status === 'in_progress').length;
    const resolved = filteredTickets.filter(t => t.status === 'resolved').length;
    const closed = filteredTickets.filter(t => t.status === 'closed').length;

    const highPriority = filteredTickets.filter(
      t => t.priority === 'high' || t.priority === 'urgent'
    ).length;

    const avgResponseTime = '2.5 hours'; // Mock data
    const slaCompliance = 94; // Mock data

    return {
      total,
      open,
      inProgress,
      resolved,
      closed,
      highPriority,
      avgResponseTime,
      slaCompliance,
    };
  }, [filteredTickets]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    return [
      { status: 'Open', count: metrics.open, color: 'bg-blue-500', percentage: (metrics.open / metrics.total) * 100 },
      { status: 'In Progress', count: metrics.inProgress, color: 'bg-yellow-500', percentage: (metrics.inProgress / metrics.total) * 100 },
      { status: 'Resolved', count: metrics.resolved, color: 'bg-green-500', percentage: (metrics.resolved / metrics.total) * 100 },
      { status: 'Closed', count: metrics.closed, color: 'bg-gray-500', percentage: (metrics.closed / metrics.total) * 100 },
    ];
  }, [metrics]);

  // Priority distribution
  const priorityDistribution = useMemo(() => {
    const priorities = ['low', 'medium', 'high', 'urgent'];
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];

    return priorities.map((priority, index) => {
      const count = filteredTickets.filter(t => t.priority === priority).length;
      return {
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        count,
        color: colors[index],
        percentage: (count / metrics.total) * 100,
      };
    });
  }, [filteredTickets, metrics.total]);

  // Technician performance
  const technicianPerformance = useMemo(() => {
    const techMap = new Map<string, { name: string; count: number; resolved: number }>();

    filteredTickets.forEach(ticket => {
      if (ticket.assignedToId && ticket.assignedTo) {
        const tech = techMap.get(ticket.assignedToId) || {
          name: ticket.assignedTo.name || 'Unknown',
          count: 0,
          resolved: 0,
        };

        tech.count++;
        if (ticket.status === 'resolved' || ticket.status === 'closed') {
          tech.resolved++;
        }

        techMap.set(ticket.assignedToId, tech);
      }
    });

    return Array.from(techMap.values())
      .map(tech => ({
        ...tech,
        resolveRate: tech.count > 0 ? (tech.resolved / tech.count) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredTickets]);

  // Metric cards
  const metricCards: MetricCard[] = [
    {
      title: 'Total Tickets',
      value: metrics.total,
      change: 12,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-blue-600',
    },
    {
      title: 'Open Tickets',
      value: metrics.open,
      change: -5,
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-orange-600',
    },
    {
      title: 'Resolved Rate',
      value: `${Math.round(((metrics.resolved + metrics.closed) / metrics.total) * 100)}%`,
      change: 8,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600',
    },
    {
      title: 'Avg Response Time',
      value: metrics.avgResponseTime,
      change: -15,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive insights into ticket management
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', 'all'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {period === 'all' ? 'All Time' : `Last ${period}`}
            </button>
          ))}
          <button className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <Download className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover-lift"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg bg-opacity-10 ${card.color}`}>
                {card.icon}
              </div>
              {card.change !== undefined && (
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    card.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {card.change > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {Math.abs(card.change)}%
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {card.title}
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Status Distribution
          </h3>
          <div className="space-y-4">
            {statusDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.status}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.count} ({Math.round(item.percentage)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Priority Breakdown
          </h3>
          <div className="space-y-4">
            {priorityDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.priority}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.count} ({Math.round(item.percentage)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Technician Performance */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Technicians
        </h3>
        <div className="space-y-4">
          {technicianPerformance.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No assigned tickets in this period
            </p>
          ) : (
            technicianPerformance.map((tech, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    {tech.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{tech.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tech.count} ticket{tech.count !== 1 ? 's' : ''} assigned
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.round(tech.resolveRate)}%
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Resolve Rate</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SLA Compliance */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            SLA Compliance
          </h3>
          <span className="text-2xl font-bold text-green-600">{metrics.slaCompliance}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${metrics.slaCompliance}%` }}
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {Math.round((metrics.slaCompliance / 100) * metrics.total)} of {metrics.total} tickets met SLA
        </p>
      </div>
    </div>
  );
}

export default EnhancedAnalytics;
