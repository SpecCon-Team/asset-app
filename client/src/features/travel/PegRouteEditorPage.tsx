import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Save, ArrowLeft, Plus, Trash2, GripVertical, Check, CheckCircle2, Filter, X, Navigation } from 'lucide-react';
import { showSuccess, showError } from '@/lib/sweetalert';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';
import { getCurrentUserRole } from '@/features/auth/hooks';

// South African Provinces
const provinces = [
  { id: 'WC', name: 'Western Cape', color: '#FF9800' },
  { id: 'EC', name: 'Eastern Cape', color: '#8D6E63' },
  { id: 'NC', name: 'Northern Cape', color: '#42A5F5' },
  { id: 'FS', name: 'Free State', color: '#FFC107' },
  { id: 'KZN', name: 'KwaZulu-Natal', color: '#616161' },
  { id: 'NW', name: 'North West', color: '#9E9E9E' },
  { id: 'GP', name: 'Gauteng', color: '#64B5F6' },
  { id: 'MP', name: 'Mpumalanga', color: '#3F51B5' },
  { id: 'LP', name: 'Limpopo', color: '#8BC34A' },
];

interface PEGClient {
  id: string;
  name: string;
  location: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  provinceId: string;
  clientCode?: string;
}

interface RouteStop {
  id?: string; // Route stop ID (for existing stops)
  clientId: string;
  client: PEGClient;
  visitDate: string; // YYYY-MM-DD
  visitTime: string; // HH:mm
  duration: number; // minutes
  travelTime?: number; // Travel time to next client in minutes
  notes: string;
  order: number;
  status?: string; // 'planned', 'visited', 'cancelled'
  completedAt?: string; // ISO timestamp when marked as completed
}

export default function PegRouteEditorPage() {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId?: string }>();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<PEGClient[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const showLoading = useMinLoadingTime(loading, 2000);
  const userRole = getCurrentUserRole();
  const isPegUser = userRole === 'PEG';

  useEffect(() => {
    if (tripId) {
      // Load existing route
      loadExistingRoute(tripId);
    } else {
      // Create new route from selected clients
      const clientIds = searchParams.get('clients')?.split(',') || [];
      if (clientIds.length === 0) {
        showError('No Clients', 'No clients selected. Please go back and select clients.');
        navigate('/travel-plan/peg-route-creator');
        return;
      }
      loadClients(clientIds);
    }
  }, [tripId, searchParams, navigate]);

  const loadExistingRoute = async (tripId: string) => {
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.get(`/travel/${tripId}/route`);
      const trip = response.data;
      
      if (!trip || !trip.routeStops) {
        showError('Route Not Found', 'The travel plan route could not be found.');
        navigate('/travel-plan');
        return;
      }

      // Extract clients and route stops from the trip
      const routeStopsData: RouteStop[] = trip.routeStops.map((stop: any) => ({
        id: stop.id,
        clientId: stop.clientId,
        client: stop.client,
        visitDate: new Date(stop.visitDate).toISOString().split('T')[0],
        visitTime: stop.visitTime || '09:00',
        duration: stop.duration || 60,
        travelTime: stop.travelTime || 0,
        notes: stop.notes || '',
        order: stop.order,
        status: stop.status || 'planned',
        completedAt: stop.status === 'visited' && stop.updatedAt ? new Date(stop.updatedAt).toISOString() : undefined,
      }));

      setRouteStops(routeStopsData);
      setClients(routeStopsData.map(stop => stop.client));
    } catch (error) {
      console.error('Error loading route:', error);
      showError('Error', 'Failed to load travel plan route');
      navigate('/travel-plan');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async (clientIds: string[]) => {
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.get('/peg');
      const allClients = response.data;
      
      // Filter to only selected clients
      const selectedClients = allClients.filter((c: PEGClient) => clientIds.includes(c.id));
      setClients(selectedClients);

      // Initialize route stops with default values
      const stops: RouteStop[] = selectedClients.map((client: PEGClient, index: number) => {
        // Default to today's date
        const today = new Date();
        const defaultDate = today.toISOString().split('T')[0];
        
        // Default time: 9:00 AM for first, increment by 2 hours
        const defaultHour = 9 + (index * 2);
        const defaultTime = `${String(defaultHour).padStart(2, '0')}:00`;

        return {
          clientId: client.id,
          client,
          visitDate: defaultDate,
          visitTime: defaultTime,
          duration: 60, // 1 hour default
          travelTime: 0, // Default travel time
          notes: '',
          order: index + 1,
          status: 'planned',
        };
      });

      setRouteStops(stops);
    } catch (error) {
      console.error('Error loading clients:', error);
      showError('Error', 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const updateStop = (index: number, field: keyof RouteStop, value: any) => {
    setRouteStops(prev => prev.map((stop, i) => 
      i === index ? { ...stop, [field]: value } : stop
    ));
  };

  const toggleCompletion = async (index: number) => {
    const stop = routeStops[index];
    const newStatus = stop.status === 'visited' ? 'planned' : 'visited';
    const completedAt = newStatus === 'visited' ? new Date().toISOString() : undefined;
    
    // Update local state immediately for better UX
    updateStop(index, 'status', newStatus);
    if (completedAt) {
      updateStop(index, 'completedAt', completedAt);
    } else {
      updateStop(index, 'completedAt', undefined);
    }
    
    // Auto-save if we have a tripId (existing route)
    if (tripId && stop.id) {
      try {
        const api = getApiClient();
        await api.put(`/travel/route-stops/${stop.id}`, {
          status: newStatus,
        });
        showSuccess('Updated!', `Delivery marked as ${newStatus === 'visited' ? 'completed' : 'pending'}`, 1500);
      } catch (error: any) {
        // Revert on error
        updateStop(index, 'status', stop.status);
        updateStop(index, 'completedAt', stop.completedAt);
        console.error('Error updating status:', error);
        showError('Error', 'Failed to update delivery status');
      }
    }
  };

  const filteredRouteStops = routeStops.filter(stop => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'completed') return stop.status === 'visited';
    if (statusFilter === 'pending') return stop.status !== 'visited';
    return true;
  });

  const allCompleted = routeStops.length > 0 && routeStops.every(stop => stop.status === 'visited');

  const removeStop = (index: number) => {
    setRouteStops(prev => {
      const newStops = prev.filter((_, i) => i !== index);
      // Reorder remaining stops
      return newStops.map((stop, i) => ({ ...stop, order: i + 1 }));
    });
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === routeStops.length - 1)
    ) {
      return;
    }

    setRouteStops(prev => {
      const newStops = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newStops[index], newStops[targetIndex]] = [newStops[targetIndex], newStops[index]];
      // Update order numbers
      return newStops.map((stop, i) => ({ ...stop, order: i + 1 }));
    });
  };

  const handleSave = async () => {
    if (routeStops.length === 0) {
      showError('No Stops', 'Please add at least one client to the route');
      return;
    }

    // Validate all stops have dates and times
    for (const stop of routeStops) {
      if (!stop.visitDate || !stop.visitTime) {
        showError('Missing Information', 'Please fill in date and time for all stops');
        return;
      }
    }

    try {
      setSaving(true);
      const api = getApiClient();

      // Find earliest and latest dates
      const dates = routeStops.map(s => new Date(`${s.visitDate}T${s.visitTime}`));
      const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
      const endDate = new Date(Math.max(...dates.map(d => d.getTime())));

      if (tripId) {
        // Update existing route stops
        for (const stop of routeStops) {
        if (stop.id) {
          // Update existing route stop
          await api.put(`/travel/route-stops/${stop.id}`, {
            visitDate: new Date(`${stop.visitDate}T${stop.visitTime}`).toISOString(),
            visitTime: stop.visitTime,
            duration: stop.duration,
            travelTime: stop.travelTime || 0,
            notes: stop.notes,
            order: stop.order,
            status: stop.status || 'planned',
          });
        }
        }
        
        // Update trip dates
        await api.put(`/travel/${tripId}`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        showSuccess('Updated!', 'Travel plan route updated successfully', 2000);
        navigate('/travel-plan');
      } else {
        // Create new trip
        const tripData = {
          destination: `PEG Route - ${routeStops.length} clients`,
          country: 'South Africa',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          category: 'business',
          status: 'upcoming',
          budget: 0,
          spent: 0,
          notes: `Route visiting ${routeStops.length} PEG clients`,
          routeStops: routeStops.map(stop => ({
            clientId: stop.clientId,
            visitDate: new Date(`${stop.visitDate}T${stop.visitTime}`).toISOString(),
            visitTime: stop.visitTime,
            duration: stop.duration,
            travelTime: stop.travelTime || 0,
            notes: stop.notes,
            order: stop.order,
            status: stop.status || 'planned',
          })),
        };

        const response = await api.post('/travel/peg-route', tripData);
        showSuccess('Route Created!', 'Your PEG client route has been created successfully');
        navigate('/travel-plan');
      }
    } catch (error: any) {
      console.error('Error saving route:', error);
      showError('Error', error.response?.data?.error || 'Failed to save route');
    } finally {
      setSaving(false);
    }
  };

  const getProvinceName = (provinceId: string) => {
    return provinces.find(p => p.id === provinceId)?.name || provinceId;
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading route editor..." />;
  }

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <button
          onClick={() => navigate(tripId ? '/travel-plan' : '/travel-plan/peg-route-creator')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Client Selection
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isPegUser ? 'View Route Schedule' : 'Edit Route Schedule'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isPegUser ? 'View delivery schedule and mark completions' : 'Set dates and times for each client visit'}
        </p>
      </div>

      {/* Route Completion Banner */}
      {allCompleted && routeStops.length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Route Completed! 🎉</h3>
                <p className="text-sm text-green-100">
                  All {routeStops.length} deliveries have been completed successfully
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/travel-plan')}
              className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              Back to Travel Plan
            </button>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      {routeStops.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({routeStops.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Completed ({routeStops.filter(s => s.status === 'visited').length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Pending ({routeStops.filter(s => s.status !== 'visited').length})
            </button>
          </div>
        </div>
      )}

      {/* Completion Statistics */}
      {routeStops.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Stops</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {routeStops.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {routeStops.filter(s => s.status === 'visited').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {routeStops.filter(s => s.status !== 'visited').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Progress</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-1">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${(routeStops.filter(s => s.status === 'visited').length / routeStops.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {Math.round((routeStops.filter(s => s.status === 'visited').length / routeStops.length) * 100)}% Complete
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Route Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {routeStops.length} client{routeStops.length !== 1 ? 's' : ''} in route
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              {routeStops.map(s => s.client.name).join(' → ')}
            </p>
          </div>
          {!isPegUser && (
            <button
              onClick={handleSave}
              disabled={saving || routeStops.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Route'}
            </button>
          )}
        </div>
      </div>

      {/* Route Stops Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Province
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Travel Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredRouteStops.map((stop) => {
                // Find the original index for updates
                const originalIndex = routeStops.findIndex(s => s.clientId === stop.clientId && s.order === stop.order);
                const province = provinces.find(p => p.id === stop.client.provinceId);
                const isCompleted = stop.status === 'visited';
                return (
                  <tr 
                    key={stop.clientId} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isCompleted ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {stop.order}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {stop.client.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {stop.client.location}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {province && (
                        <span
                          className="px-2 py-1 text-xs font-medium text-white rounded whitespace-nowrap inline-block"
                          style={{ backgroundColor: province.color }}
                          title={province.name}
                        >
                          {province.name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="date"
                          value={stop.visitDate}
                          onChange={(e) => updateStop(originalIndex, 'visitDate', e.target.value)}
                          disabled={isPegUser}
                          className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="time"
                          value={stop.visitTime}
                          onChange={(e) => updateStop(originalIndex, 'visitTime', e.target.value)}
                          disabled={isPegUser}
                          className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={stop.duration}
                        onChange={(e) => updateStop(originalIndex, 'duration', parseInt(e.target.value))}
                        disabled={isPegUser}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value={30}>30 min</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <Navigation className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={stop.travelTime || 0}
                          onChange={(e) => updateStop(originalIndex, 'travelTime', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          disabled={isPegUser}
                          className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                          min
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={stop.notes}
                        onChange={(e) => updateStop(originalIndex, 'notes', e.target.value)}
                        placeholder="Notes..."
                        disabled={isPegUser}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                            isCompleted
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Completed
                            </>
                          ) : (
                            'Pending'
                          )}
                        </span>
                        {isCompleted && stop.completedAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(stop.completedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleCompletion(originalIndex)}
                          className={`p-2 rounded-lg transition-all ${
                            isCompleted
                              ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                          }`}
                          title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Check className="w-5 h-5" />
                          )}
                        </button>
                        {!isPegUser && (
                          <>
                            <button
                              onClick={() => moveStop(originalIndex, 'up')}
                              disabled={originalIndex === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveStop(originalIndex, 'down')}
                              disabled={originalIndex === routeStops.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                              title="Move down"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => removeStop(originalIndex)}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {routeStops.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No clients in route</p>
        </div>
      )}

      {routeStops.length > 0 && filteredRouteStops.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No {statusFilter === 'completed' ? 'completed' : 'pending'} deliveries found
          </p>
          <button
            onClick={() => setStatusFilter('all')}
            className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Show all deliveries
          </button>
        </div>
      )}
    </div>
  );
}

