import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface SLAStats {
  total: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  responseBreaches: number;
  resolutionBreaches: number;
  complianceRate: string;
}

export default function SLAWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/workflows/sla-stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error: any) {
      // Silently handle network errors (server not running)
      if (error?.message?.includes('Failed to fetch') || error?.code === 'ERR_NETWORK') {
        // Don't log to console to prevent spam
        return;
      }
      console.error('Failed to fetch SLA stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <span className="sr-only">Loading SLA stats</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const complianceRate = parseFloat(stats.complianceRate);
  const getComplianceColor = () => {
    if (complianceRate >= 95) return 'text-green-600';
    if (complianceRate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              SLA Performance
            </h3>
          </div>
          <button
            onClick={() => navigate('/sla-policies')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View Details →
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Compliance Rate - Large */}
          <div className="col-span-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Compliance Rate
                </p>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-bold ${getComplianceColor()}`}>
                    {stats.complianceRate}%
                  </p>
                  <TrendingUp className={`w-5 h-5 ${getComplianceColor()}`} />
                </div>
              </div>
              <CheckCircle className={`w-12 h-12 ${getComplianceColor()} opacity-20`} />
            </div>
          </div>

          {/* On Track */}
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.onTrack}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">On Track</p>
          </div>

          {/* At Risk */}
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.atRisk}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">At Risk</p>
          </div>

          {/* Breached */}
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.breached}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Breached</p>
          </div>

          {/* Total */}
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.total}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Tickets</p>
          </div>
        </div>

        {/* Breach Breakdown */}
        {(stats.responseBreaches > 0 || stats.resolutionBreaches > 0) && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">
              Breach Breakdown
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-red-700 dark:text-red-400">Response:</span>
                <span className="font-semibold text-red-900 dark:text-red-300">{stats.responseBreaches}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700 dark:text-red-400">Resolution:</span>
                <span className="font-semibold text-red-900 dark:text-red-300">{stats.resolutionBreaches}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
