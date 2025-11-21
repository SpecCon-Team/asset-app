import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Edit, Activity } from 'lucide-react';
import WorkflowForm from '../components/WorkflowForm';
import { showDeleteConfirm, showSuccess, showError } from '@/lib/sweetalert';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  entityType: string;
  trigger: string;
  isActive: boolean;
  priority: number;
  conditions?: any[];
  actions: any[];
  createdAt: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
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

      const data = await response.json();

      // Ensure data is an array
      if (Array.isArray(data)) {
        setWorkflows(data);
      } else {
        console.error('API returned non-array data:', data);
        setWorkflows([]);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:4000/api/workflows/templates/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const updated = await response.json();
      setWorkflows(workflows.map(w => w.id === id ? updated : w));
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
    }
  };

  const deleteWorkflow = async (id: string) => {
    const workflow = workflows.find(w => w.id === id);
    const result = await showDeleteConfirm(
      workflow?.name || 'this workflow',
      'This workflow will be permanently deleted and cannot be recovered.'
    );

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`http://localhost:4000/api/workflows/templates/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      setWorkflows(workflows.filter(w => w.id !== id));
      showSuccess('Workflow deleted successfully');
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      showError('Failed to delete workflow. Please try again.');
    }
  };

  const handleSaveWorkflow = async (data: any) => {
    const url = editingWorkflow
      ? `http://localhost:4000/api/workflows/templates/${editingWorkflow.id}`
      : 'http://localhost:4000/api/workflows/templates';

    const method = editingWorkflow ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to save workflow');

    const saved = await response.json();

    if (editingWorkflow) {
      setWorkflows(workflows.map(w => w.id === saved.id ? saved : w));
    } else {
      setWorkflows([...workflows, saved]);
    }

    setShowCreateModal(false);
    setEditingWorkflow(null);
  };

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      created: 'Created',
      status_changed: 'Status Changed',
      assigned: 'Assigned',
      priority_changed: 'Priority Changed',
      updated: 'Updated',
    };
    return labels[trigger] || trigger;
  };

  const getEntityTypeLabel = (type: string) => {
    return type === 'ticket' ? 'Ticket' : 'Asset';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-4 h-4 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="sr-only">Loading workflows</span>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You don't have permission to access workflow automation features.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Only administrators can view and manage workflows. Please contact your system administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workflow Automation
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Automate actions when certain events occur
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Workflows</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {workflows.length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {workflows.filter(w => w.isActive).length}
              </p>
            </div>
            <Play className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paused</p>
              <p className="text-2xl font-bold text-gray-600">
                {workflows.filter(w => !w.isActive).length}
              </p>
            </div>
            <Pause className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ticket Workflows</p>
              <p className="text-2xl font-bold text-purple-600">
                {workflows.filter(w => w.entityType === 'ticket').length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {workflows.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No workflows yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first workflow to start automating tasks
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {workflow.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          workflow.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {workflow.isActive ? 'Active' : 'Paused'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Priority: {workflow.priority}
                      </span>
                    </div>

                    {workflow.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {workflow.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        <strong>Type:</strong> {getEntityTypeLabel(workflow.entityType)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        <strong>Trigger:</strong> {getTriggerLabel(workflow.trigger)}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        <strong>Conditions:</strong> {workflow.conditions?.length || 0}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        <strong>Actions:</strong> {workflow.actions?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleWorkflow(workflow.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        workflow.isActive
                          ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={workflow.isActive ? 'Pause workflow' : 'Activate workflow'}
                    >
                      {workflow.isActive ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setEditingWorkflow(workflow);
                        setShowCreateModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                      title="Edit workflow"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => deleteWorkflow(workflow.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      title="Delete workflow"
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

      {/* Workflow Form Modal */}
      {showCreateModal && (
        <WorkflowForm
          workflow={editingWorkflow}
          onSave={handleSaveWorkflow}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingWorkflow(null);
          }}
        />
      )}
    </div>
  );
}
