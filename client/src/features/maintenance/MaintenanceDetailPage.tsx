import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Calendar,
  User,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  History,
  AlertTriangle,
} from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { formatDate } from '@/lib/dateFormatter';
import { showSuccess, showError, showConfirm } from '@/lib/sweetalert';
import toast from 'react-hot-toast';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

interface MaintenanceSchedule {
  id: string;
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
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  history: MaintenanceHistory[];
  createdAt: string;
}

interface MaintenanceHistory {
  id: string;
  completedAt: string;
  completedBy: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  notes?: string;
  actualDuration?: number;
  actualCost?: number;
  partsReplaced?: string;
  issues?: string;
}

export default function MaintenanceDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<MaintenanceSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const showLoading = useMinLoadingTime(loading, 2000);

  useEffect(() => {
    if (id) {
      fetchSchedule();
    }
  }, [id]);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const apiClient = getApiClient();
      const response = await apiClient.get(`/maintenance/${id}`);
      setSchedule(response.data);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast.error('Failed to load maintenance schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    const result = await showConfirm(
      'Complete Maintenance?',
      'Mark this maintenance task as completed?',
      'Yes, complete it',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      const apiClient = getApiClient();
      await apiClient.post(`/maintenance/${id}/complete`, {
        status: 'completed',
        notes: '',
      });

      await showSuccess('Success!', 'Maintenance task completed successfully');
      fetchSchedule();
    } catch (error) {
      console.error('Failed to complete maintenance:', error);
      await showError('Error', 'Failed to complete maintenance task');
    }
  };

  const handleDelete = async () => {
    const result = await showConfirm(
      'Delete Schedule?',
      'Are you sure you want to delete this maintenance schedule? This action cannot be undone.',
      'Yes, delete it',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    try {
      const apiClient = getApiClient();
      await apiClient.delete(`/maintenance/${id}`);

      await showSuccess('Deleted!', 'Maintenance schedule deleted successfully');
      navigate('/maintenance');
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
      return { text: `Overdue by ${Math.abs(diffDays)} days`, color: 'text-red-600 dark:text-red-400', icon: AlertTriangle };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-600 dark:text-orange-400', icon: Clock };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: 'text-orange-600 dark:text-orange-400', icon: Clock };
    } else {
      return { text: `Due in ${diffDays} days`, color: 'text-green-600 dark:text-green-400', icon: CheckCircle };
    }
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading maintenance schedule" />;
  }

  if (!schedule) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Wrench className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Schedule Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The maintenance schedule you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/maintenance')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Maintenance
        </button>
      </div>
    );
  }

  const dueStatus = getDueDateStatus(schedule.nextDueDate);
  const StatusIcon = dueStatus.icon;

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/maintenance')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Maintenance
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Wrench className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              {schedule.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Maintenance schedule for {schedule.asset.name}
            </p>
          </div>

          <div className="flex gap-2">
            {schedule.isActive && (
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                Complete
              </button>
            )}
            <button
              onClick={() => navigate(`/maintenance/${id}/edit`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Schedule Information</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Asset</label>
                <div className="mt-1">
                  <div className="text-gray-900 dark:text-white font-medium">{schedule.asset.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {schedule.asset.asset_code} • {schedule.asset.asset_type}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Schedule Type</label>
                <div className="mt-1 text-gray-900 dark:text-white capitalize">
                  {schedule.scheduleType}
                  {schedule.frequency && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      ({schedule.frequency})
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Priority</label>
                <div className="mt-1">
                  <span className={`inline-flex px-3 py-1 text-xs rounded-full ${getPriorityColor(schedule.priority)}`}>
                    {schedule.priority}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex px-3 py-1 text-xs rounded-full ${
                    schedule.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Next Due Date</label>
                <div className="mt-1 flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 ${dueStatus.color}`} />
                  <div>
                    <div className="text-gray-900 dark:text-white">{formatDate(schedule.nextDueDate)}</div>
                    <div className={`text-xs ${dueStatus.color}`}>{dueStatus.text}</div>
                  </div>
                </div>
              </div>

              {schedule.lastCompletedDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Completed</label>
                  <div className="mt-1 text-gray-900 dark:text-white">
                    {formatDate(schedule.lastCompletedDate)}
                  </div>
                </div>
              )}

              {schedule.estimatedDuration && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Duration</label>
                  <div className="mt-1 text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {schedule.estimatedDuration} minutes
                  </div>
                </div>
              )}

              {schedule.cost && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Cost</label>
                  <div className="mt-1 text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    R{schedule.cost.toFixed(2)}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To</label>
                <div className="mt-1 text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {schedule.assignedTo?.name || schedule.assignedTo?.email || 'Unassigned'}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created By</label>
                <div className="mt-1 text-gray-900 dark:text-white">
                  {schedule.createdBy.name || schedule.createdBy.email}
                </div>
              </div>
            </div>

            {schedule.description && (
              <div className="mt-6 pt-6 border-t dark:border-gray-700">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</label>
                <div className="mt-2 text-gray-900 dark:text-white whitespace-pre-wrap">
                  {schedule.description}
                </div>
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-6 h-6" />
              Maintenance History ({schedule.history.length})
            </h2>

            {schedule.history.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No maintenance history yet
              </div>
            ) : (
              <div className="space-y-4">
                {schedule.history.map((entry) => (
                  <div
                    key={entry.id}
                    className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            entry.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : entry.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {entry.status}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(entry.completedAt)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          Completed by {entry.completedBy.name || entry.completedBy.email}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {entry.actualDuration && (
                          <div className="text-gray-600 dark:text-gray-400">
                            Duration: {entry.actualDuration} min
                          </div>
                        )}
                        {entry.actualCost && (
                          <div className="text-gray-600 dark:text-gray-400">
                            Cost: R{entry.actualCost.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>

                    {entry.notes && (
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <strong>Notes:</strong> {entry.notes}
                      </div>
                    )}

                    {entry.issues && (
                      <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                        <strong>Issues:</strong> {entry.issues}
                      </div>
                    )}

                    {entry.partsReplaced && (
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <strong>Parts Replaced:</strong> {entry.partsReplaced}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h3>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Completions</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {schedule.history.filter(h => h.status === 'completed').length}
                </div>
              </div>

              {schedule.history.length > 0 && (
                <>
                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      R{schedule.history.reduce((sum, h) => sum + (h.actualCost || 0), 0).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Time</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {schedule.history.reduce((sum, h) => sum + (h.actualDuration || 0), 0)} min
                    </div>
                  </div>
                </>
              )}

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Created</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {formatDate(schedule.createdAt)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Next Maintenance</h3>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {formatDate(schedule.nextDueDate)}
            </div>
            <div className={`text-sm ${dueStatus.color}`}>{dueStatus.text}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
