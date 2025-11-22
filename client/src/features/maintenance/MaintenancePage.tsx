import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Filter,
  Search,
} from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { formatDate } from '@/lib/dateFormatter';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import toast from 'react-hot-toast';

interface MaintenanceSchedule {
  id: string;
  assetId: string;
  title: string;
  description?: string;
  scheduleType: string;
  frequency?: string;
  nextDueDate: string;
  lastCompletedDate?: string;
  isActive: boolean;
  priority: string;
  estimatedDuration?: number;
  cost?: number;
  asset: {
    id: string;
    name: string;
    asset_code: string;
    asset_type: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    history: number;
  };
}

interface Stats {
  totalSchedules: number;
  activeSchedules: number;
  overdueSchedules: number;
  completedLast30Days: number;
  totalCostLast30Days: number;
}

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [view, setView] = useState<'all' | 'upcoming' | 'overdue'>('all');

  useEffect(() => {
    fetchSchedules();
    fetchStats();
  }, [statusFilter, priorityFilter, view]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();

      let url = '/maintenance';
      if (view === 'upcoming') {
        url = '/maintenance/upcoming?days=30';
      } else if (view === 'overdue') {
        url = '/maintenance/overdue';
      }

      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);

      const response = await apiClient.get(`${url}?${params.toString()}`);
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch maintenance schedules:', error);
      toast.error('Failed to load maintenance schedules');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/maintenance/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleComplete = async (scheduleId: string) => {
    const result = await showConfirm(
      'Complete Maintenance?',
      'Mark this maintenance task as completed?',
      'Yes, complete it',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      const apiClient = getApiClient();
      await apiClient.post(`/maintenance/${scheduleId}/complete`, {
        status: 'completed',
        notes: '',
      });

      await showSuccess('Success!', 'Maintenance task completed successfully');
      fetchSchedules();
      fetchStats();
    } catch (error) {
      console.error('Failed to complete maintenance:', error);
      await showError('Error', 'Failed to complete maintenance task');
    }
  };

  const handleDelete = async (scheduleId: string) => {
    const result = await showConfirm(
      'Delete Schedule?',
      'Are you sure you want to delete this maintenance schedule?',
      'Yes, delete it',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      const apiClient = getApiClient();
      await apiClient.delete(`/maintenance/${scheduleId}`);

      await showSuccess('Deleted!', 'Maintenance schedule deleted successfully');
      fetchSchedules();
      fetchStats();
    } catch (error) {
      console.error('Failed to delete maintenance schedule:', error);
      await showError('Error', 'Failed to delete maintenance schedule');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getDueDateStatus = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', color: 'text-red-600 dark:text-red-400', icon: AlertTriangle };
    } else if (diffDays <= 7) {
      return { text: 'Due soon', color: 'text-orange-600 dark:text-orange-400', icon: Clock };
    } else {
      return { text: 'Scheduled', color: 'text-green-600 dark:text-green-400', icon: CheckCircle };
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      schedule.title.toLowerCase().includes(query) ||
      schedule.asset.name.toLowerCase().includes(query) ||
      schedule.asset.asset_code.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Wrench className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              Maintenance Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Schedule and track asset maintenance tasks
            </p>
          </div>
          <button
            onClick={() => navigate('/maintenance/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Schedule Maintenance
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Schedules
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {stats.totalSchedules}
                </p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                  {stats.activeSchedules}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overdue</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">
                  {stats.overdueSchedules}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Completed (30d)
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                  {stats.completedLast30Days}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cost (30d)</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                  ${stats.totalCostLast30Days.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All Schedules
        </button>
        <button
          onClick={() => setView('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Upcoming (30 days)
        </button>
        <button
          onClick={() => setView('overdue')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            view === 'overdue'
              ? 'bg-red-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Overdue
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search schedules..."
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedules List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {loading ? (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <span className="sr-only">Loading maintenance schedules</span>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No maintenance schedules found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Get started by creating your first maintenance schedule
            </p>
            <button
              onClick={() => navigate('/maintenance/new')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Schedule Maintenance
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Next Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSchedules.map((schedule) => {
                  const dueStatus = getDueDateStatus(schedule.nextDueDate);
                  const StatusIcon = dueStatus.icon;

                  return (
                    <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {schedule.asset.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {schedule.asset.asset_code}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {schedule.title}
                        </div>
                        {schedule.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {schedule.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white capitalize">
                          {schedule.scheduleType}
                        </div>
                        {schedule.frequency && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {schedule.frequency}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(schedule.priority)}`}>
                          {schedule.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`w-4 h-4 ${dueStatus.color}`} />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDate(schedule.nextDueDate)}
                            </div>
                            <div className={`text-xs ${dueStatus.color}`}>
                              {dueStatus.text}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {schedule.assignedTo?.name || schedule.assignedTo?.email || 'Unassigned'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-full ${
                          schedule.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/maintenance/${schedule.id}`)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            View
                          </button>
                          {schedule.isActive && (
                            <button
                              onClick={() => handleComplete(schedule.id)}
                              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
