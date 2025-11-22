import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/lib/sweetalert';

interface WorkflowFormProps {
  workflow?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function WorkflowForm({ workflow, onSave, onCancel }: WorkflowFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: workflow?.name || '',
    description: workflow?.description || '',
    entityType: workflow?.entityType || 'ticket',
    trigger: workflow?.trigger || 'created',
    priority: workflow?.priority || 0,
    isActive: workflow?.isActive ?? true,
    conditions: workflow?.conditions || [],
    actions: workflow?.actions || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      showSuccess(
        workflow ? 'Workflow updated successfully' : 'Workflow created successfully',
        'Success!'
      );
    } catch (error) {
      console.error('Failed to save workflow:', error);
      showError('Failed to save workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { field: '', operator: 'equals', value: '' },
      ],
    });
  };

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_: any, i: number) => i !== index),
    });
  };

  const updateCondition = (index: number, key: string, value: any) => {
    const updated = [...formData.conditions];
    updated[index] = { ...updated[index], [key]: value };
    setFormData({ ...formData, conditions: updated });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [...formData.actions, { type: 'add_comment', params: {} }],
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_: any, i: number) => i !== index),
    });
  };

  const updateAction = (index: number, key: string, value: any) => {
    const updated = [...formData.actions];
    updated[index] = { ...updated[index], [key]: value };
    setFormData({ ...formData, actions: updated });
  };

  const updateActionParam = (index: number, param: string, value: any) => {
    const updated = [...formData.actions];
    updated[index] = {
      ...updated[index],
      params: { ...updated[index].params, [param]: value },
    };
    setFormData({ ...formData, actions: updated });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {workflow ? 'Edit Workflow' : 'Create Workflow'}
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
                  Workflow Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Auto-escalate critical tickets"
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
                  placeholder="Describe what this workflow does..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Entity Type *
                  </label>
                  <select
                    required
                    value={formData.entityType}
                    onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="ticket">Ticket</option>
                    <option value="asset">Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Trigger *
                  </label>
                  <select
                    required
                    value={formData.trigger}
                    onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="created">Created</option>
                    <option value="status_changed">Status Changed</option>
                    <option value="assigned">Assigned</option>
                    <option value="priority_changed">Priority Changed</option>
                    <option value="updated">Updated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0-1000 (higher runs first)"
                  />
                </div>

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

            {/* Conditions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Conditions
                </h3>
                <button
                  type="button"
                  onClick={addCondition}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Condition
                </button>
              </div>

              {formData.conditions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No conditions - workflow will always execute
                </p>
              ) : (
                <div className="space-y-3">
                  {formData.conditions.map((condition: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-750 rounded-lg">
                      <input
                        type="text"
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                        placeholder="Field (e.g., priority)"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <select
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="equals">Equals</option>
                        <option value="not_equals">Not Equals</option>
                        <option value="contains">Contains</option>
                        <option value="not_contains">Not Contains</option>
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="in">In</option>
                        <option value="not_in">Not In</option>
                      </select>
                      <input
                        type="text"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Value (e.g., critical)"
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeCondition(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Actions *
                </h3>
                <button
                  type="button"
                  onClick={addAction}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Action
                </button>
              </div>

              {formData.actions.length === 0 ? (
                <p className="text-sm text-red-600 dark:text-red-400 text-center py-4">
                  At least one action is required
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.actions.map((action: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-750 rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, 'type', e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        >
                          <option value="assign">Assign to User</option>
                          <option value="change_status">Change Status</option>
                          <option value="change_priority">Change Priority</option>
                          <option value="add_comment">Add Comment</option>
                          <option value="send_notification">Send Notification</option>
                          <option value="send_whatsapp">Send WhatsApp</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Action-specific parameters */}
                      {action.type === 'assign' && (
                        <input
                          type="text"
                          value={action.params.userId || ''}
                          onChange={(e) => updateActionParam(index, 'userId', e.target.value)}
                          placeholder="User ID"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      )}

                      {action.type === 'change_status' && (
                        <input
                          type="text"
                          value={action.params.status || ''}
                          onChange={(e) => updateActionParam(index, 'status', e.target.value)}
                          placeholder="Status (e.g., in_progress)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      )}

                      {action.type === 'change_priority' && (
                        <input
                          type="text"
                          value={action.params.priority || ''}
                          onChange={(e) => updateActionParam(index, 'priority', e.target.value)}
                          placeholder="Priority (e.g., critical)"
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        />
                      )}

                      {action.type === 'add_comment' && (
                        <textarea
                          value={action.params.comment || ''}
                          onChange={(e) => updateActionParam(index, 'comment', e.target.value)}
                          placeholder="Comment text..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          rows={2}
                        />
                      )}

                      {(action.type === 'send_notification' || action.type === 'send_whatsapp') && (
                        <>
                          <textarea
                            value={action.params.message || ''}
                            onChange={(e) => updateActionParam(index, 'message', e.target.value)}
                            placeholder="Message text..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            rows={2}
                          />
                          <input
                            type="text"
                            value={(action.params.recipients || []).join(', ')}
                            onChange={(e) => updateActionParam(index, 'recipients', e.target.value.split(',').map((s: string) => s.trim()))}
                            placeholder="Recipient User IDs (comma-separated)"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
              disabled={loading || formData.actions.length === 0}
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
                workflow ? 'Update Workflow' : 'Create Workflow'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
