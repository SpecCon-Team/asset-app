import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, Users, Key, Calendar, RefreshCw } from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { showSuccess, showError, showConfirmation, showTextarea } from '@/lib/sweetalert';
import { formatDateTime } from '@/lib/dateFormatter';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

interface UserWith2FA {
  id: string;
  email: string;
  name: string | null;
  role: string;
  twoFactorEnabled: boolean;
  backupCodesRemaining: number;
  createdAt: string;
}

export default function TwoFactorManagementPage() {
  const [users, setUsers] = useState<UserWith2FA[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useMinLoadingTime(isLoading, 2000);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsersWithTwoFactor();
  }, []);

  const fetchUsersWithTwoFactor = async () => {
    try {
      setIsLoading(true);
      const apiClient = getApiClient();
      const response = await apiClient.get('/2fa/admin/users-with-2fa');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users with 2FA:', error);
      await showError('Error', 'Failed to load users with 2FA enabled');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset2FA = async (user: UserWith2FA) => {
    const result = await showConfirmation(
      'Reset 2FA?',
      `Are you sure you want to reset 2FA for ${user.name || user.email}? This will:\n\n• Disable their 2FA\n• Remove their backup codes\n• Allow them to login without 2FA\n• They can re-enable 2FA in their settings\n\nThis action will be logged in the audit trail.`,
      'Reset 2FA',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    // Ask for reason
    const { value: reason } = await showTextarea(
      'Reset Reason',
      'Please provide a reason for this 2FA reset (optional)',
      'e.g., User lost phone and backup codes',
      false
    );

    try {
      const apiClient = getApiClient();
      await apiClient.post('/2fa/admin/reset', {
        userId: user.id,
        reason: reason || 'No reason provided',
      });

      await showSuccess(
        'Success!',
        `2FA has been reset for ${user.name || user.email}. They can now login without 2FA.`,
        2000
      );

      // Refresh the list
      fetchUsersWithTwoFactor();
    } catch (error: any) {
      console.error('Failed to reset 2FA:', error);
      await showError(
        'Error',
        error.response?.data?.message || 'Failed to reset 2FA'
      );
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show full-page loader on initial load
  if (showLoading) {
    return <LoadingOverlay message="Loading 2FA management..." />;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold dark:text-white">2FA Management</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Manage two-factor authentication for users who are locked out
        </p>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg flex gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            Admin Access Required
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            Resetting 2FA for a user will disable their two-factor authentication and remove all
            backup codes. This action is logged in the audit trail. Only use this for users who
            have lost access to their authenticator app and backup codes.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">With 2FA Enabled</p>
              <p className="text-2xl font-bold dark:text-white">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Low Backup Codes</p>
              <p className="text-2xl font-bold dark:text-white">
                {users.filter((u) => u.backupCodesRemaining <= 3).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? 'No users found matching your search'
                  : 'No users have 2FA enabled'}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Backup Codes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Enabled Since
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {user.name || 'No name'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200'
                            : user.role === 'TECHNICIAN'
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Key
                          className={`w-4 h-4 ${
                            user.backupCodesRemaining <= 3
                              ? 'text-red-500 dark:text-red-400'
                              : user.backupCodesRemaining <= 5
                              ? 'text-yellow-500 dark:text-yellow-400'
                              : 'text-green-500 dark:text-green-400'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            user.backupCodesRemaining <= 3
                              ? 'text-red-600 dark:text-red-400'
                              : user.backupCodesRemaining <= 5
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {user.backupCodesRemaining} / 10
                        </span>
                        {user.backupCodesRemaining === 0 && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            (No codes left!)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(user.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleReset2FA(user)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset 2FA
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
          When to Reset 2FA
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
          <li>• User has lost their phone and cannot access their authenticator app</li>
          <li>• User has lost all backup codes and cannot login</li>
          <li>• User is locked out and needs immediate access</li>
        </ul>
        <p className="mt-3 text-sm text-blue-800 dark:text-blue-300">
          <strong>Note:</strong> After resetting, the user should immediately re-enable 2FA and
          save their new backup codes in a secure location.
        </p>
      </div>
    </div>
  );
}
