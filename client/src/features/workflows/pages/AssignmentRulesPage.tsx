import { useState, useEffect } from 'react';
import { Plus, Users, Play, Pause, Edit, Trash2, BarChart3 } from 'lucide-react';
import AssignmentRuleForm from '../components/AssignmentRuleForm';

interface AssignmentRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  conditions: any;
  assignmentType: string;
  targetUserId?: string;
  targetUserIds?: string[];
}

interface AssignmentStats {
  activeRules: number;
  availableTechnicians: number;
  technicianWorkload: Array<{
    id: string;
    name: string | null;
    email: string;
    activeTickets: number;
    isAvailable: boolean;
  }>;
}

export default function AssignmentRulesPage() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);

  useEffect(() => {
    fetchRules();
    fetchStats();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/workflows/assignment-rules', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Failed to fetch assignment rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/workflows/assignment-stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch assignment stats:', error);
    }
  };

  const toggleRule = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/workflows/assignment-rules/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const updated = await response.json();
      setRules(rules.map(r => r.id === id ? updated : r));
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const deleteRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    const { showDeleteConfirm, showSuccess, showError } = await import('@/lib/sweetalert');

    const result = await showDeleteConfirm(
      rule?.name || 'this assignment rule',
      'This assignment rule will be permanently deleted and cannot be recovered.'
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:4000/api/workflows/assignment-rules/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete rule');

      setRules(rules.filter(r => r.id !== id));
      fetchStats(); // Refresh stats after deletion
      showSuccess('Assignment rule deleted successfully');
    } catch (error) {
      console.error('Failed to delete rule:', error);
      showError('Failed to delete assignment rule. Please try again.');
    }
  };

  const handleSaveRule = async (data: any) => {
    const url = editingRule
      ? `http://localhost:4000/api/workflows/assignment-rules/${editingRule.id}`
      : 'http://localhost:4000/api/workflows/assignment-rules';

    const method = editingRule ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Failed to save assignment rule:', errorData);
      throw new Error(errorData.message || 'Failed to save assignment rule');
    }

    const saved = await response.json();

    if (editingRule) {
      setRules(rules.map(r => r.id === saved.id ? saved : r));
    } else {
      setRules([...rules, saved]);
    }

    setShowCreateModal(false);
    setEditingRule(null);
    fetchStats(); // Refresh stats after save
  };

  const getAssignmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      round_robin: 'Round Robin',
      least_busy: 'Least Busy',
      skill_based: 'Skill-Based',
      location_based: 'Location-Based',
      specific_user: 'Specific User',
    };
    return labels[type] || type;
  };

  const getAssignmentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      round_robin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      least_busy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      skill_based: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      location_based: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      specific_user: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    };
    return colors[type] || colors.least_busy;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="sr-only">Loading assignment rules</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Auto-Assignment Rules
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure intelligent ticket assignment strategies
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Rules</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.activeRules || 0}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Available Technicians</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.availableTechnicians || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Rules</p>
              <p className="text-2xl font-bold text-purple-600">
                {rules.length}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Technician Workload */}
      {stats && stats.technicianWorkload.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Technician Workload
          </h2>
          <div className="space-y-3">
            {stats.technicianWorkload.map((tech) => (
              <div key={tech.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {tech.name || tech.email}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      tech.isAvailable
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {tech.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((tech.activeTickets / 10) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {tech.activeTickets} tickets
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {rules.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assignment rules yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create rules to automatically assign tickets to technicians
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Rule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {rule.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rule.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Paused'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Priority: {rule.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAssignmentTypeColor(rule.assignmentType)}`}>
                        {getAssignmentTypeLabel(rule.assignmentType)}
                      </span>
                    </div>

                    {rule.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {rule.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      {rule.conditions && Object.keys(rule.conditions).length > 0 && (
                        <span>
                          <strong>Conditions:</strong> {Object.keys(rule.conditions).length}
                        </span>
                      )}
                      {rule.targetUserIds && rule.targetUserIds.length > 0 && (
                        <span>
                          <strong>Technicians:</strong> {rule.targetUserIds.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        rule.isActive
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={rule.isActive ? 'Pause rule' : 'Activate rule'}
                    >
                      {rule.isActive ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="Edit rule"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Delete rule"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Rule Form Modal */}
      {showCreateModal && (
        <AssignmentRuleForm
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}
