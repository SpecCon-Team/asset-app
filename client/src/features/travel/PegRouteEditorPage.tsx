import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Save, ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { showSuccess, showError } from '@/lib/sweetalert';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

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
  notes: string;
  order: number;
}

export default function PegRouteEditorPage() {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId?: string }>();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<PEGClient[]>([]);
  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const showLoading = useMinLoadingTime(loading, 2000);

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
        notes: stop.notes || '',
        order: stop.order,
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
          notes: '',
          order: index + 1,
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
              notes: stop.notes,
              order: stop.order,
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
            notes: stop.notes,
            order: stop.order,
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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(tripId ? '/travel-plan' : '/travel-plan/peg-route-creator')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Client Selection
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Edit Route Schedule
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Set dates and times for each client visit
        </p>
      </div>

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
          <button
            onClick={handleSave}
            disabled={saving || routeStops.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Route'}
          </button>
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
                  Notes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {routeStops.map((stop, index) => {
                const province = provinces.find(p => p.id === stop.client.provinceId);
                return (
                  <tr key={stop.clientId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                          className="px-2 py-1 text-xs font-medium text-white rounded"
                          style={{ backgroundColor: province.color }}
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
                          onChange={(e) => updateStop(index, 'visitDate', e.target.value)}
                          className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="time"
                          value={stop.visitTime}
                          onChange={(e) => updateStop(index, 'visitTime', e.target.value)}
                          className="pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={stop.duration}
                        onChange={(e) => updateStop(index, 'duration', parseInt(e.target.value))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
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
                      <input
                        type="text"
                        value={stop.notes}
                        onChange={(e) => updateStop(index, 'notes', e.target.value)}
                        placeholder="Notes..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => moveStop(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveStop(index, 'down')}
                          disabled={index === routeStops.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeStop(index)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
    </div>
  );
}

