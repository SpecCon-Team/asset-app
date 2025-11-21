import { useState, useEffect } from 'react';
import { Plus, Clock, AlertTriangle, CheckCircle, Edit, Trash2 } from 'lucide-react';
import SLAPolicyForm from '../components/SLAPolicyForm';

interface SLAPolicy {
  id: string;
  name: string;
  description?: string;
  priority: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  businessHoursOnly: boolean;
  escalationEnabled: boolean;
  escalationUserId?: string;
  notifyBeforeMinutes: number;
  isActive: boolean;
}

interface SLAStats {
  total: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  responseBreaches: number;
  resolutionBreaches: number;
  complianceRate: string;
}

export default function SLAPoliciesPage() {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SLAPolicy | null>(null);

  useEffect(() => {
    fetchPolicies();
    fetchStats();
  }, []);

  const fetchPolicies = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/workflows/sla-policies', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setPolicies(data);
    } catch (error) {
      console.error('Failed to fetch SLA policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/workflows/sla-stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch SLA stats:', error);
    }
  };

  const deletePolicy = async (id: string) => {
    const policy = policies.find(p => p.id === id);
    const { showDeleteConfirm, showSuccess, showError } = await import('@/lib/sweetalert');

    const result = await showDeleteConfirm(
      policy?.name || 'this SLA policy',
      'This SLA policy will be permanently deleted and cannot be recovered.'
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:4000/api/workflows/sla-policies/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete policy');

      setPolicies(policies.filter(p => p.id !== id));
      showSuccess('SLA policy deleted successfully');
    } catch (error) {
      console.error('Failed to delete SLA policy:', error);
      showError('Failed to delete SLA policy. Please try again.');
    }
  };

  const handleSavePolicy = async (data: any) => {
    const url = editingPolicy
      ? `http://localhost:4000/api/workflows/sla-policies/${editingPolicy.id}`
      : 'http://localhost:4000/api/workflows/sla-policies';

    const method = editingPolicy ? 'PUT' : 'POST';

    // Map form fields to API expected fields
    const payload = {
      name: data.name,
      description: data.description,
      priority: data.priority,
      responseTimeMinutes: data.responseTime,
      resolutionTimeMinutes: data.resolutionTime,
      businessHoursOnly: data.businessHoursOnly,
      escalationEnabled: data.escalationEnabled,
      escalationUserId: data.escalationUserId || null,
      notifyBeforeMinutes: data.notifyBeforeMinutes,
      isActive: data.isActive,
    };

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to save SLA policy:', errorData);
      throw new Error(errorData.message || 'Failed to save SLA policy');
    }

    const saved = await response.json();

    if (editingPolicy) {
      setPolicies(policies.map(p => p.id === saved.id ? saved : p));
    } else {
      setPolicies([...policies, saved]);
    }

    setShowCreateModal(false);
    setEditingPolicy(null);
    fetchStats(); // Refresh stats after save
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="sr-only">Loading SLA policies</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            SLA Policies
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage Service Level Agreement policies and track compliance
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Policy
        </button>
      </div>

      {/* SLA Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Compliance Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.complianceRate}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">On Track</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.onTrack}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">At Risk</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.atRisk}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Breached</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.breached}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      )}

      {/* Policies List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {policies.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No SLA policies yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create SLA policies to track response and resolution times
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Policy
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resolution Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Business Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Escalation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {policy.name}
                        </div>
                        {policy.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {policy.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getPriorityColor(policy.priority)}`}>
                        {policy.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatTime(policy.responseTimeMinutes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatTime(policy.resolutionTimeMinutes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        policy.businessHoursOnly
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {policy.businessHoursOnly ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        policy.escalationEnabled
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {policy.escalationEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        policy.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingPolicy(policy);
                            setShowCreateModal(true);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Edit policy"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePolicy(policy.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Delete policy"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SLA Policy Form Modal */}
      {showCreateModal && (
        <SLAPolicyForm
          policy={editingPolicy ? {
            ...editingPolicy,
            responseTime: editingPolicy.responseTimeMinutes,
            resolutionTime: editingPolicy.resolutionTimeMinutes,
          } : null}
          onSave={handleSavePolicy}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingPolicy(null);
          }}
        />
      )}
    </div>
  );
}
