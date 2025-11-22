import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '@/lib/sweetalert';

interface AssignmentRuleFormProps {
  rule?: any;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function AssignmentRuleForm({ rule, onSave, onCancel }: AssignmentRuleFormProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    assignmentType: rule?.assignmentType || 'round_robin',
    priority: rule?.priority || 0,
    isActive: rule?.isActive ?? true,
    conditions: rule?.conditions || [],
    targetUsers: rule?.targetUsers || [],
    requiredSkills: rule?.requiredSkills || [],
    location: rule?.location || '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();

      // Handle both array response and object with users property
      const usersArray = Array.isArray(data) ? data : (data.users || []);
      setUsers(usersArray.filter((u: any) => u.role === 'TECHNICIAN'));
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
        rule ? 'Assignment rule updated successfully' : 'Assignment rule created successfully',
        'Success!'
      );
    } catch (error) {
      console.error('Failed to save assignment rule:', error);
      showError('Failed to save assignment rule. Please try again.');
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

  const toggleUser = (userId: string) => {
    const updated = formData.targetUsers.includes(userId)
      ? formData.targetUsers.filter((id: string) => id !== userId)
      : [...formData.targetUsers, userId];
    setFormData({ ...formData, targetUsers: updated });
  };

  const addSkill = () => {
    setFormData({
      ...formData,
      requiredSkills: [...formData.requiredSkills, ''],
    });
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      requiredSkills: formData.requiredSkills.filter((_: any, i: number) => i !== index),
    });
  };

  const updateSkill = (index: number, value: string) => {
    const updated = [...formData.requiredSkills];
    updated[index] = value;
    setFormData({ ...formData, requiredSkills: updated });
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

  const requiresSkills = formData.assignmentType === 'skill_based';
  const requiresLocation = formData.assignmentType === 'location_based';
  const requiresUsers = formData.assignmentType === 'specific_user' || formData.assignmentType === 'round_robin';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {rule ? 'Edit Assignment Rule' : 'Create Assignment Rule'}
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
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Distribute tickets evenly"
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
                  placeholder="Describe what this rule does..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Assignment Type *
                  </label>
                  <select
                    required
                    value={formData.assignmentType}
                    onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="round_robin">Round Robin</option>
                    <option value="least_busy">Least Busy</option>
                    <option value="skill_based">Skill-Based</option>
                    <option value="location_based">Location-Based</option>
                    <option value="specific_user">Specific User</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {getAssignmentTypeLabel(formData.assignmentType)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="0-1000 (higher runs first)"
                  />
                </div>
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
                  No conditions - rule will apply to all tickets
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

            {/* Assignment Type Specific Fields */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Assignment Configuration
              </h3>

              {requiresUsers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Technicians *
                  </label>
                  {users.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No technicians available
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                      {users.map((user) => (
                        <label key={user.id} className="flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={formData.targetUsers.includes(user.id)}
                            onChange={() => toggleUser(user.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {user.fullName} ({user.email})
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  {requiresUsers && formData.targetUsers.length === 0 && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                      Please select at least one technician
                    </p>
                  )}
                </div>
              )}

              {requiresSkills && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Required Skills *
                    </label>
                    <button
                      type="button"
                      onClick={addSkill}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3" />
                      Add Skill
                    </button>
                  </div>
                  {formData.requiredSkills.length === 0 ? (
                    <p className="text-sm text-red-600 dark:text-red-400 text-center py-4">
                      At least one skill is required for skill-based assignment
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formData.requiredSkills.map((skill: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={skill}
                            onChange={(e) => updateSkill(index, e.target.value)}
                            placeholder="e.g., Network, Hardware, Software"
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {requiresLocation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    required={requiresLocation}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Johannesburg, Cape Town"
                  />
                </div>
              )}

              {!requiresUsers && !requiresSkills && !requiresLocation && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {formData.assignmentType === 'least_busy'
                    ? 'Automatically assigns to the technician with the fewest open tickets'
                    : 'No additional configuration needed for this assignment type'}
                </p>
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
              disabled={loading || (requiresUsers && formData.targetUsers.length === 0) || (requiresSkills && formData.requiredSkills.length === 0)}
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
                rule ? 'Update Rule' : 'Create Rule'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
