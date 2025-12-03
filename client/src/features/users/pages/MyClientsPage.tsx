import React, { useState, useEffect } from 'react';
import { listUsers, deleteUser } from '../api';
import { getApiClient } from '@/features/assets/lib/apiClient';
import type { User } from '../types';
import { Users, Shield, UserCheck, Search, Trash2, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/dateFormatter';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

export default function MyClientsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useMinLoadingTime(isLoading, 2000);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [userTypeTab, setUserTypeTab] = useState<'all' | 'whatsapp' | 'regular'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchUsers(true); // Show loading on initial fetch

    // Poll for updates every 30 seconds instead of 3 seconds to reduce server load
    // Only poll when tab is visible to avoid unnecessary requests
    let pollInterval: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (!document.hidden && !pollInterval) {
        pollInterval = setInterval(() => {
          if (!document.hidden) {
            fetchUsers(false);
          }
        }, 30000); // Reduced from 3s to 30s
      }
    };

    const stopPolling = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    // Listen for user availability updates
    const handleUserUpdate = () => {
      fetchUsers(false);
    };

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling
    startPolling();

    // Cleanup on unmount
    return () => {
      stopPolling();
      window.removeEventListener('userUpdated', handleUserUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      if (showLoading) {
        toast.error('Failed to load users');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(userId);
    try {
      await getApiClient().patch(`/users/${userId}/role`, { role: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
      setDeleteConfirmId(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterRole, userTypeTab]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === '' || user.role === filterRole;

    const matchesUserType =
      userTypeTab === 'all' ||
      (userTypeTab === 'whatsapp' && user.isWhatsAppUser) ||
      (userTypeTab === 'regular' && !user.isWhatsAppUser);

    return matchesSearch && matchesRole && matchesUserType;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700';
      case 'TECHNICIAN':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
      case 'PEG_ADMIN':
        return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
      case 'USER':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600';
    }
  };

  const regularUsers = users.filter((u) => !u.isWhatsAppUser);
  const stats = {
    total: users.length,
    online: regularUsers.filter((u) => u.isAvailable).length,
    offline: regularUsers.filter((u) => !u.isAvailable).length,
    whatsapp: users.filter((u) => u.isWhatsAppUser).length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    technicians: users.filter((u) => u.role === 'TECHNICIAN').length,
    users: users.filter((u) => u.role === 'USER').length,
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading users..." />;
  }

  return (
    <div className="flex flex-col p-8">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Clients</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Manage users and their access levels</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-3xl font-bold dark:text-white mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Online</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.online}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Regular users</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 dark:bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Offline</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{stats.offline}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Regular users</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-600 dark:bg-red-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setUserTypeTab('whatsapp')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">WhatsApp</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{stats.whatsapp}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <MessageCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Admins</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">{stats.admins}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Technicians</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.technicians}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <UserCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Regular Users</p>
              <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">{stats.users}</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* User Type Tabs */}
      <div className="mb-6 flex gap-2 flex-shrink-0">
        <button
          onClick={() => setUserTypeTab('all')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            userTypeTab === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          All Users ({stats.total})
        </button>
        <button
          onClick={() => setUserTypeTab('whatsapp')}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            userTypeTab === 'whatsapp'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp Users ({stats.whatsapp})
        </button>
        <button
          onClick={() => setUserTypeTab('regular')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            userTypeTab === 'regular'
              ? 'bg-gray-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Regular Users ({stats.total - stats.whatsapp})
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex gap-4 flex-shrink-0">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="PEG_ADMIN">PEG Admin</option>
          <option value="TECHNICIAN">Technician</option>
          <option value="USER">User</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Change Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="relative flex-shrink-0">
                          {user.profilePicture ? (
                            <img
                              src={user.profilePicture}
                              alt={user.name || user.email}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {(user.name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Status indicator on avatar */}
                          {user.isWhatsAppUser ? (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                              <MessageCircle className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : (
                            <div
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                user.isAvailable ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || 'No Name'}
                            </div>
                            {user.isWhatsAppUser && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-full">
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isWhatsAppUser ? (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            WhatsApp Active
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              user.isAvailable ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          ></div>
                          <span className={`text-sm font-medium ${
                            user.isAvailable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {user.isAvailable ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isWhatsAppUser && user.phone ? (
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                            <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                            {user.phone}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">WhatsApp User</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={isUpdating === user.id}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700"
                      >
                        <option value="USER">User</option>
                        <option value="TECHNICIAN">Technician</option>
                        <option value="PEG_ADMIN">PEG Admin</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.id === currentUser.id ? (
                        <button
                          disabled
                          className="text-gray-400 dark:text-gray-600 cursor-not-allowed"
                          title="You cannot delete your own account"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {filteredUsers.length > 0 && (
          <div className="mt-6 flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-lg shadow border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span>
                Showing <span className="font-semibold">{startIndex + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(endIndex, filteredUsers.length)}</span> of{' '}
                <span className="font-semibold">{filteredUsers.length}</span> users
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 min-h-[44px] bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Previous
              </button>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 min-h-[44px] bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Next
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirmId)}
                disabled={isDeleting}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="sr-only">Deleting</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No users found</p>
        </div>
      )}
    </div>
  );
}
