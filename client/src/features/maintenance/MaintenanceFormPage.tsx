import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Wrench } from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError } from '@/lib/sweetalert';
import toast from 'react-hot-toast';

interface Asset {
  id: string;
  name: string;
  asset_code: string;
  asset_type: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function MaintenanceFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    assetId: '',
    title: '',
    description: '',
    scheduleType: 'one-time',
    frequency: '',
    nextDueDate: '',
    priority: 'medium',
    estimatedDuration: '',
    cost: '',
    assignedToId: '',
    isActive: true,
  });

  useEffect(() => {
    fetchAssets();
    fetchUsers();
    if (isEditMode) {
      fetchSchedule();
    }
  }, [isEditMode, id]);

  const fetchAssets = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/assets?limit=-1');
      const assetsArray = Array.isArray(response.data) ? response.data : (response.data.data || []);
      setAssets(assetsArray);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/users');
      const usersArray = Array.isArray(response.data) ? response.data : (response.data.users || []);
      setUsers(usersArray.filter((u: any) => u.role === 'TECHNICIAN' || u.role === 'ADMIN'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchSchedule = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get(`/maintenance/${id}`);
      const schedule = response.data;

      setFormData({
        assetId: schedule.assetId,
        title: schedule.title,
        description: schedule.description || '',
        scheduleType: schedule.scheduleType,
        frequency: schedule.frequency || '',
        nextDueDate: schedule.nextDueDate ? new Date(schedule.nextDueDate).toISOString().split('T')[0] : '',
        priority: schedule.priority,
        estimatedDuration: schedule.estimatedDuration?.toString() || '',
        cost: schedule.cost?.toString() || '',
        assignedToId: schedule.assignedToId || '',
        isActive: schedule.isActive,
      });
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast.error('Failed to load maintenance schedule');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const apiClient = getApiClient();
      const data = {
        ...formData,
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        assignedToId: formData.assignedToId || null,
      };

      if (isEditMode) {
        await apiClient.put(`/maintenance/${id}`, data);
        await showSuccess('Success!', 'Maintenance schedule updated successfully');
      } else {
        await apiClient.post('/maintenance', data);
        await showSuccess('Success!', 'Maintenance schedule created successfully');
      }

      navigate('/maintenance');
    } catch (error: any) {
      console.error('Failed to save maintenance schedule:', error);
      await showError('Error', error.response?.data?.error || 'Failed to save maintenance schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/maintenance')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Maintenance
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Wrench className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          {isEditMode ? 'Edit Maintenance Schedule' : 'Schedule New Maintenance'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          {isEditMode ? 'Update maintenance schedule details' : 'Create a new maintenance schedule for an asset'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset Selection */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Asset <span className="text-red-500">*</span>
            </label>
            <select
              name="assetId"
              value={formData.assetId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an asset</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} ({asset.asset_code}) - {asset.asset_type}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maintenance Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Quarterly Inspection"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Detailed maintenance description..."
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Schedule Type <span className="text-red-500">*</span>
            </label>
            <select
              name="scheduleType"
              value={formData.scheduleType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="one-time">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          {/* Frequency (only for recurring) */}
          {formData.scheduleType === 'recurring' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frequency <span className="text-red-500">*</span>
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required={formData.scheduleType === 'recurring'}
                className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          {/* Next Due Date */}
          <div className={formData.scheduleType === 'one-time' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {formData.scheduleType === 'one-time' ? 'Due Date' : 'Next Due Date'} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="nextDueDate"
              value={formData.nextDueDate}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Duration (minutes)
            </label>
            <input
              type="number"
              name="estimatedDuration"
              value={formData.estimatedDuration}
              onChange={handleChange}
              min="0"
              placeholder="e.g., 60"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estimated Cost (R)
            </label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="e.g., 150.00"
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assign To
            </label>
            <select
              name="assignedToId"
              value={formData.assignedToId}
              onChange={handleChange}
              className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status */}
          {isEditMode && (
            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Schedule
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Inactive schedules won't trigger reminders or appear in upcoming tasks
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                {isEditMode ? 'Update Schedule' : 'Create Schedule'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
