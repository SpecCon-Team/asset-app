import { useState, useEffect } from 'react';
import { Workflow, Play, Pause, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkflowStats {
  total: number;
  active: number;
  paused: number;
  recentExecutions: number;
}

export default function WorkflowStatsWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<WorkflowStats>({
    total: 0,
    active: 0,
    paused: 0,
    recentExecutions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/workflows/templates', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.status === 403) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const workflows = await response.json();

      // Ensure workflows is an array before using filter
      if (Array.isArray(workflows)) {
        setStats({
          total: workflows.length,
          active: workflows.filter((w: any) => w.isActive).length,
          paused: workflows.filter((w: any) => !w.isActive).length,
          recentExecutions: 0, // This would need a separate API endpoint
        });
      } else {
        console.error('API returned non-array data:', workflows);
        setStats({
          total: 0,
          active: 0,
          paused: 0,
          recentExecutions: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch workflow stats:', error);
      // Keep default empty stats on error
      setStats({
        total: 0,
        active: 0,
        paused: 0,
        recentExecutions: 0,
      });
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
          <span className="sr-only">Loading workflow stats</span>
        </div>
      </div>
    );
  }

  // Don't render widget if user doesn't have access
  if (accessDenied) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Automation
            </h3>
          </div>
          <button
            onClick={() => navigate('/workflows')}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Manage →
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Total Workflows */}
          <div className="col-span-2 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Workflows
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.total}
                </p>
              </div>
              <Activity className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>

          {/* Active */}
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.active}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
          </div>

          {/* Paused */}
          <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Pause className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {stats.paused}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Paused</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => navigate('/workflows')}
            className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Workflows
          </button>
          <button
            onClick={() => navigate('/sla-policies')}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            SLA
          </button>
          <button
            onClick={() => navigate('/assignment-rules')}
            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Rules
          </button>
        </div>
      </div>
    </div>
  );
}
