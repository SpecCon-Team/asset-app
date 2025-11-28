import React, { useState, useEffect } from 'react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { showError } from '@/lib/sweetalert';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface OverviewData {
  overview: {
    totalAssets: number;
    totalTickets: number;
    totalUsers: number;
    totalDocuments: number;
  };
  distribution: {
    assetsByType: Array<{ asset_type: string; _count: number }>;
    ticketsByStatus: Array<{ status: string; _count: number }>;
    ticketsByPriority: Array<{ priority: string; _count: number }>;
  };
}

const AdvancedAnalyticsPage: React.FC = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [assetAnalytics, setAssetAnalytics] = useState<any>(null);
  const [ticketAnalytics, setTicketAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load on mount

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const api = getApiClient();
      const [overviewRes, assetsRes, ticketsRes] = await Promise.all([
        api.get('/analytics/overview', { params: dateRange }),
        api.get('/analytics/assets'),
        api.get('/analytics/tickets', { params: dateRange })
      ]);

      setOverview(overviewRes.data);
      setAssetAnalytics(assetsRes.data);
      setTicketAnalytics(ticketsRes.data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      showError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      // Ticket statuses
      open: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      in_progress: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      'in-progress': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      closed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',

      // Asset statuses
      available: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      assigned: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      maintenance: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      repair: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      retired: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      disposed: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',

      // General statuses
      active: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      inactive: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      pending: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      completed: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      medium: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      high: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      critical: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      urgent: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
    };
    return colors[priority.toLowerCase()] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading analytics data..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comprehensive system insights and metrics</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Loading...' : 'Apply'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Assets</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overview.overview.totalAssets}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overview.overview.totalTickets}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-8 h-8 text-green-600 dark:text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overview.overview.totalUsers}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Documents</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{overview.overview.totalDocuments}</p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <svg className="w-8 h-8 text-orange-600 dark:text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Asset Analytics */}
      {assetAnalytics && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Asset Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(assetAnalytics.totalValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Depreciation</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(assetAnalytics.depreciation?.total_depreciation || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Book Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(assetAnalytics.depreciation?.total_value || 0)}
              </p>
            </div>
          </div>

          {assetAnalytics.byStatus && assetAnalytics.byStatus.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Assets by Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {assetAnalytics.byStatus.map((item: any) => (
                  <div key={item.status} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{item._count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket Analytics */}
      {ticketAnalytics && overview && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ticket Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">By Status</h3>
              <div className="space-y-2">
                {overview.distribution.ticketsByStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{item._count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">By Priority</h3>
              <div className="space-y-2">
                {overview.distribution.ticketsByPriority.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{item._count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {ticketAnalytics.avgResolutionTime !== undefined && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Resolution Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {ticketAnalytics.avgResolutionTime.toFixed(2)} hours
              </p>
            </div>
          )}
        </div>
      )}

      {/* Asset Types Distribution */}
      {overview && overview.distribution.assetsByType.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Asset Types Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {overview.distribution.assetsByType.map((item) => (
              <div key={item.asset_type} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border dark:border-blue-700 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.asset_type}</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{item._count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Data</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={`${getApiBaseUrl()}/analytics/export?type=assets&format=csv`}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Export Assets (CSV)
          </a>
          <a
            href={`${getApiBaseUrl()}/analytics/export?type=tickets&format=csv`}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Export Tickets (CSV)
          </a>
          <a
            href={`${getApiBaseUrl()}/analytics/export?type=audit&format=csv`}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            Export Audit Logs (CSV)
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalyticsPage;
