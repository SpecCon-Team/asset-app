import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, TrendingUp, MapPin } from 'lucide-react';
import api from '../../lib/api';
import { LoadingOverlay } from '../../components/LoadingSpinner';

interface DashboardStats {
  totalClients: number;
  recentClients: number;
  clientsByProvince: Array<{ provinceId: string; count: number }>;
}

const provinces = [
  { id: 'WC', name: 'Western Cape', color: '#3B82F6' },
  { id: 'EC', name: 'Eastern Cape', color: '#10B981' },
  { id: 'NC', name: 'Northern Cape', color: '#F59E0B' },
  { id: 'FS', name: 'Free State', color: '#EF4444' },
  { id: 'KZN', name: 'KwaZulu-Natal', color: '#8B5CF6' },
  { id: 'NW', name: 'North West', color: '#EC4899' },
  { id: 'GP', name: 'Gauteng', color: '#06B6D4' },
  { id: 'MP', name: 'Mpumalanga', color: '#84CC16' },
  { id: 'LP', name: 'Limpopo', color: '#F97316' },
];

export default function PEGAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/peg-admin/dashboard');
      console.log('Dashboard stats response:', response.data);
      setStats(response.data);
    } catch (error: any) {
      console.error('Error loading dashboard stats:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      // Set empty stats on error so UI doesn't break
      setStats({
        totalClients: 0,
        recentClients: 0,
        clientsByProvince: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading dashboard..." />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          PEG Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of all PEG clients and activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats?.totalClients || 0}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Clients</p>
        </div>

        {/* Recent Clients */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats?.recentClients || 0}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">New This Week</p>
        </div>

        {/* Provinces */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {stats?.clientsByProvince?.length || 0}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Active Provinces</p>
        </div>
      </div>

      {/* Clients by Province */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Clients by Province
        </h2>
        {stats && stats.totalClients === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No clients found. Start by adding clients in the "My PEG" section.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {provinces.map(province => {
              const provinceData = stats?.clientsByProvince?.find(p => p.provinceId === province.id);
              const count = provinceData?.count || 0;
              const percentage = stats?.totalClients ? (count / stats.totalClients) * 100 : 0;

              return (
                <div key={province.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {province.name}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {count} clients
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: province.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/my-peg')}
            className="flex items-center gap-3 p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                Manage Clients
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                View and edit all PEG clients
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/support')}
            className="flex items-center gap-3 p-4 border-2 border-green-200 dark:border-green-800 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="text-left">
              <div className="font-medium text-gray-900 dark:text-white">
                Support Tickets
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Create tickets for clients
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
