import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { showError, showSuccess } from '@/lib/sweetalert';
import { getApiBaseUrl } from '@/lib/apiConfig';

interface SLAPolicyFormProps {
  policy?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function SLAPolicyForm({ policy, onSave, onCancel }: SLAPolicyFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: policy?.name || '',
    description: policy?.description || '',
    priority: policy?.priority || 'medium',
    responseTime: policy?.responseTime || 60,
    resolutionTime: policy?.resolutionTime || 240,
    businessHoursOnly: policy?.businessHoursOnly ?? true,
    escalationEnabled: policy?.escalationEnabled ?? false,
    escalationUserId: policy?.escalationUserId || '',
    notifyBeforeMinutes: policy?.notifyBeforeMinutes || 30,
    isActive: policy?.isActive ?? true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      // Handle both array response and object with users property
      const usersArray = Array.isArray(data) ? data : (data.users || []);
      setUsers(usersArray.filter((u: any) => u.role === 'ADMIN' || u.role === 'TECHNICIAN'));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      showSuccess(
        policy ? 'SLA policy updated successfully' : 'SLA policy created successfully',
        'Success!'
      );
    } catch (error) {
      console.error('Failed to save SLA policy:', error);
      showError('Failed to save SLA policy. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeDisplay = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    }
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    return hours > 0 ? `${days}d ${hours}h` : `${days} days`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {policy ? 'Edit SLA Policy' : 'Create SLA Policy'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Policy Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Critical Ticket SLA"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={3}
                  placeholder="Describe the SLA policy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority *
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {/* Time Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Time Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Response Time (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.responseTime}
                    onChange={(e) => setFormData({ ...formData, responseTime: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 60"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Preview: {formatTimeDisplay(formData.responseTime)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Resolution Time (minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.resolutionTime}
                    onChange={(e) => setFormData({ ...formData, resolutionTime: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 240"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Preview: {formatTimeDisplay(formData.resolutionTime)}
                  </p>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.businessHoursOnly}
                      onChange={(e) => setFormData({ ...formData, businessHoursOnly: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Business Hours Only
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  If enabled, SLA timers only count during business hours (9 AM - 5 PM, Monday - Friday)
                </p>
              </div>
            </div>

            {/* Escalation Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Escalation Settings
              </h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.escalationEnabled}
                      onChange={(e) => setFormData({ ...formData, escalationEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable Escalation
                    </span>
                  </label>
                </div>

                {formData.escalationEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Escalate To *
                      </label>
                      <select
                        required={formData.escalationEnabled}
                        value={formData.escalationUserId}
                        onChange={(e) => setFormData({ ...formData, escalationUserId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select user...</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.fullName} ({user.email}) - {user.role}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Notify Before (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.notifyBeforeMinutes}
                        onChange={(e) => setFormData({ ...formData, notifyBeforeMinutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., 30"
                      />
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Send warning notification {formatTimeDisplay(formData.notifyBeforeMinutes)} before breach
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Active
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="sr-only">Saving</span>
                </>
              ) : (
                policy ? 'Update Policy' : 'Create Policy'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
