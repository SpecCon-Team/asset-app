import React, { useState, useEffect } from 'react';
import {
  Plane, MapPin, Calendar, Plus, X, Edit2, Trash2, Search,
  DollarSign, FileText, Clock, Map as MapIcon, Download,
  Filter, ChevronDown, ChevronUp, Briefcase, Users, Heart,
  TrendingUp, Globe, Hotel, Car, Camera, Sparkles, Cross
} from 'lucide-react';
import Swal from 'sweetalert2';
import { getApiClient } from '@/features/assets/lib/apiClient';

interface Trip {
  id: string;
  destination: string;
  country: string;
  startDate: string;
  endDate: string;
  category: 'business' | 'personal' | 'family' | 'adventure' | 'honeymoon' | 'medical';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  budget: number;
  spent: number;
  notes: string;
  itinerary: ItineraryItem[];
}

interface ItineraryItem {
  id: string;
  day: number;
  title: string;
  description: string;
  time?: string;
  location?: string;
}

const categoryConfig = {
  business: { icon: Briefcase, color: '#3B82F6', label: 'Business' },
  personal: { icon: Heart, color: '#EC4899', label: 'Personal' },
  family: { icon: Users, color: '#10B981', label: 'Family' },
  adventure: { icon: Camera, color: '#F59E0B', label: 'Adventure' },
  honeymoon: { icon: Sparkles, color: '#DB2777', label: 'Honeymoon' },
  medical: { icon: Cross, color: '#DC2626', label: 'Medical' },
};

const statusConfig = {
  upcoming: { color: '#3B82F6', label: 'Upcoming' },
  ongoing: { color: '#10B981', label: 'Ongoing' },
  completed: { color: '#6B7280', label: 'Completed' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
};

const countries = [
  // Africa
  { name: 'South Africa', continent: 'Africa' },
  { name: 'Egypt', continent: 'Africa' },
  { name: 'Morocco', continent: 'Africa' },
  { name: 'Kenya', continent: 'Africa' },
  { name: 'Tanzania', continent: 'Africa' },
  { name: 'Zimbabwe', continent: 'Africa' },
  { name: 'Botswana', continent: 'Africa' },
  { name: 'Namibia', continent: 'Africa' },
  { name: 'Mauritius', continent: 'Africa' },
  { name: 'Seychelles', continent: 'Africa' },
  { name: 'Ghana', continent: 'Africa' },
  { name: 'Nigeria', continent: 'Africa' },
  { name: 'Ethiopia', continent: 'Africa' },
  { name: 'Rwanda', continent: 'Africa' },
  { name: 'Uganda', continent: 'Africa' },

  // Europe
  { name: 'United Kingdom', continent: 'Europe' },
  { name: 'France', continent: 'Europe' },
  { name: 'Germany', continent: 'Europe' },
  { name: 'Italy', continent: 'Europe' },
  { name: 'Spain', continent: 'Europe' },
  { name: 'Portugal', continent: 'Europe' },
  { name: 'Greece', continent: 'Europe' },
  { name: 'Netherlands', continent: 'Europe' },
  { name: 'Belgium', continent: 'Europe' },
  { name: 'Switzerland', continent: 'Europe' },
  { name: 'Austria', continent: 'Europe' },
  { name: 'Sweden', continent: 'Europe' },
  { name: 'Norway', continent: 'Europe' },
  { name: 'Denmark', continent: 'Europe' },
  { name: 'Finland', continent: 'Europe' },
  { name: 'Iceland', continent: 'Europe' },
  { name: 'Ireland', continent: 'Europe' },
  { name: 'Poland', continent: 'Europe' },
  { name: 'Czech Republic', continent: 'Europe' },
  { name: 'Croatia', continent: 'Europe' },
  { name: 'Turkey', continent: 'Europe' },

  // Asia
  { name: 'UAE', continent: 'Asia' },
  { name: 'Thailand', continent: 'Asia' },
  { name: 'Singapore', continent: 'Asia' },
  { name: 'Japan', continent: 'Asia' },
  { name: 'China', continent: 'Asia' },
  { name: 'South Korea', continent: 'Asia' },
  { name: 'Indonesia', continent: 'Asia' },
  { name: 'Malaysia', continent: 'Asia' },
  { name: 'Vietnam', continent: 'Asia' },
  { name: 'Philippines', continent: 'Asia' },
  { name: 'India', continent: 'Asia' },
  { name: 'Sri Lanka', continent: 'Asia' },
  { name: 'Maldives', continent: 'Asia' },
  { name: 'Qatar', continent: 'Asia' },
  { name: 'Saudi Arabia', continent: 'Asia' },
  { name: 'Israel', continent: 'Asia' },
  { name: 'Jordan', continent: 'Asia' },
  { name: 'Oman', continent: 'Asia' },

  // Americas
  { name: 'USA', continent: 'Americas' },
  { name: 'Canada', continent: 'Americas' },
  { name: 'Mexico', continent: 'Americas' },
  { name: 'Brazil', continent: 'Americas' },
  { name: 'Argentina', continent: 'Americas' },
  { name: 'Chile', continent: 'Americas' },
  { name: 'Peru', continent: 'Americas' },
  { name: 'Colombia', continent: 'Americas' },
  { name: 'Costa Rica', continent: 'Americas' },
  { name: 'Jamaica', continent: 'Americas' },
  { name: 'Bahamas', continent: 'Americas' },
  { name: 'Barbados', continent: 'Americas' },

  // Oceania
  { name: 'Australia', continent: 'Oceania' },
  { name: 'New Zealand', continent: 'Oceania' },
  { name: 'Fiji', continent: 'Oceania' },
];

export default function TravelPlanPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStats, setShowStats] = useState(true);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    destination: '',
    country: '',
    startDate: '',
    endDate: '',
    category: 'personal' as Trip['category'],
    status: 'upcoming' as Trip['status'],
    budget: '',
    spent: '',
    notes: '',
  });

  // Load trips from API
  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const api = getApiClient();
      const response = await api.get('/travel');
      setTrips(response.data);
    } catch (error) {
      console.error('Error loading trips:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load trips',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || trip.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || trip.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: trips.length,
    upcoming: trips.filter(t => t.status === 'upcoming').length,
    ongoing: trips.filter(t => t.status === 'ongoing').length,
    completed: trips.filter(t => t.status === 'completed').length,
    cancelled: trips.filter(t => t.status === 'cancelled').length,
    totalBudget: trips.reduce((sum, t) => sum + t.budget, 0),
    totalSpent: trips.reduce((sum, t) => sum + t.spent, 0),
  };

  const handleAddTrip = () => {
    setEditingTrip(null);
    setFormData({
      destination: '',
      country: '',
      startDate: '',
      endDate: '',
      category: 'personal',
      status: 'upcoming',
      budget: '',
      spent: '',
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);

    // Format dates to YYYY-MM-DD for date inputs
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setFormData({
      destination: trip.destination,
      country: trip.country,
      startDate: formatDate(trip.startDate),
      endDate: formatDate(trip.endDate),
      category: trip.category,
      status: trip.status,
      budget: trip.budget.toString(),
      spent: trip.spent.toString(),
      notes: trip.notes,
    });
    setShowAddModal(true);
  };

  const handleDeleteTrip = async (tripId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this trip?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete!',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      try {
        const api = getApiClient();
        await api.delete(`/travel/${tripId}`);
        setTrips(trips.filter(t => t.id !== tripId));
        Swal.fire({
          title: 'Deleted!',
          text: 'Trip has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error('Error deleting trip:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete trip',
          icon: 'error',
          confirmButtonColor: '#3b82f6',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.destination || !formData.startDate || !formData.endDate) {
      Swal.fire({
        title: 'Missing Fields',
        text: 'Please fill in all required fields',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
      return;
    }

    try {
      const api = getApiClient();
      const tripData = {
        destination: formData.destination,
        country: formData.country,
        startDate: formData.startDate,
        endDate: formData.endDate,
        category: formData.category,
        status: formData.status,
        budget: parseFloat(formData.budget) || 0,
        spent: parseFloat(formData.spent) || 0,
        notes: formData.notes,
        itinerary: editingTrip?.itinerary || [],
      };

      if (editingTrip) {
        const response = await api.put(`/travel/${editingTrip.id}`, tripData);
        setTrips(trips.map(t => t.id === editingTrip.id ? response.data : t));
        Swal.fire({
          title: 'Updated!',
          text: 'Trip updated successfully',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        const response = await api.post('/travel', tripData);
        setTrips([...trips, response.data]);
        Swal.fire({
          title: 'Added!',
          text: 'Trip added successfully',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setShowAddModal(false);
    } catch (error) {
      console.error('Error saving trip:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to save trip',
        icon: 'error',
        confirmButtonColor: '#3b82f6',
      });
    }
  };

  const exportToPDF = (trip: Trip) => {
    Swal.fire({
      title: 'Export Trip',
      text: 'PDF export functionality coming soon!',
      icon: 'info',
      confirmButtonColor: '#3b82f6',
    });
  };

  const getDaysDifference = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return diff + 1;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Plane className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Travel Planner</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Manage your trips and itineraries
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Stats
            </button>
            <button
              onClick={handleAddTrip}
              className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Trip
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
          >
            <option value="all">All Categories</option>
            <option value="business">💼 Business</option>
            <option value="personal">💖 Personal</option>
            <option value="family">👨‍👩‍👧 Family</option>
            <option value="adventure">📸 Adventure</option>
            <option value="honeymoon">✨ Honeymoon</option>
            <option value="medical">🏥 Medical</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs opacity-90">Total Trips</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
            <div className="text-xs opacity-90">Upcoming</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <Plane className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-bold">{stats.ongoing}</div>
            <div className="text-xs opacity-90">Ongoing</div>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <MapPin className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-xs opacity-90">Completed</div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <X className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-bold">{stats.cancelled}</div>
            <div className="text-xs opacity-90">Cancelled</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-bold">R{(stats.totalBudget / 1000).toFixed(0)}k</div>
            <div className="text-xs opacity-90">Total Budget</div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <div className="text-2xl font-bold">R{(stats.totalSpent / 1000).toFixed(0)}k</div>
            <div className="text-xs opacity-90">Total Spent</div>
          </div>
        </div>
      )}

      {/* Trips Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-5 h-5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      ) : filteredTrips.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="max-w-md mx-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 shadow-lg border-2 border-dashed border-blue-300 dark:border-gray-600">
            <div className="bg-white dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
              <Plane className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'No Trips Found'
                : 'Start Your Journey'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters or search criteria'
                : 'Plan your next adventure and keep track of all your travels in one place'}
            </p>
            {!(searchQuery || filterCategory !== 'all' || filterStatus !== 'all') && (
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Track Destinations</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Manage Budgets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span>Plan Itineraries</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span>Save Memories</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.map((trip) => {
            const CategoryIcon = categoryConfig[trip.category].icon;
            const days = getDaysDifference(trip.startDate, trip.endDate);
            const budgetProgress = trip.budget > 0 ? (trip.spent / trip.budget) * 100 : 0;

            return (
              <div
                key={trip.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all border-2 overflow-hidden"
                style={{ borderColor: categoryConfig[trip.category].color }}
              >
                {/* Card Header */}
                <div
                  className="p-4 text-white"
                  style={{ background: `linear-gradient(135deg, ${categoryConfig[trip.category].color} 0%, ${categoryConfig[trip.category].color}dd 100%)` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="w-5 h-5" />
                      <span className="text-xs font-medium px-2 py-0.5 bg-white/20 rounded-full">
                        {categoryConfig[trip.category].label}
                      </span>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: statusConfig[trip.status].color }}
                    >
                      {statusConfig[trip.status].label}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{trip.destination}</h3>
                  <p className="text-sm opacity-90 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {trip.country}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>{days} {days === 1 ? 'day' : 'days'}</span>
                    </div>

                    {/* Budget Progress */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Budget: R{trip.budget.toLocaleString()}</span>
                        <span>Spent: R{trip.spent.toLocaleString()}</span>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(budgetProgress, 100)}%`,
                              backgroundColor: budgetProgress > 100 ? '#EF4444' : budgetProgress > 80 ? '#F59E0B' : '#10B981',
                            }}
                          />
                        </div>
                        <div className="text-right mt-1">
                          <span className={`text-xs font-semibold ${
                            budgetProgress > 100 ? 'text-red-600' :
                            budgetProgress > 80 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {budgetProgress.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {trip.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {trip.notes}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTrip(trip);
                        setShowDetailsModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditTrip(trip)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Trip Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingTrip ? 'Edit Trip' : 'Add New Trip'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Destination *
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a country...</option>

                    <optgroup label="🌍 Africa">
                      {countries.filter(c => c.continent === 'Africa').map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>

                    <optgroup label="🌍 Europe">
                      {countries.filter(c => c.continent === 'Europe').map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>

                    <optgroup label="🌏 Asia">
                      {countries.filter(c => c.continent === 'Asia').map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>

                    <optgroup label="🌎 Americas">
                      {countries.filter(c => c.continent === 'Americas').map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>

                    <optgroup label="🌏 Oceania">
                      {countries.filter(c => c.continent === 'Oceania').map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Trip['category'] })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="business">💼 Business</option>
                    <option value="personal">💖 Personal</option>
                    <option value="family">👨‍👩‍👧 Family</option>
                    <option value="adventure">📸 Adventure</option>
                    <option value="honeymoon">✨ Honeymoon</option>
                    <option value="medical">🏥 Medical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Trip['status'] })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="upcoming">📅 Upcoming</option>
                    <option value="ongoing">✈️ Ongoing</option>
                    <option value="completed">✅ Completed</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Budget (R)
                  </label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                    step="100"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Spent (R)
                  </label>
                  <input
                    type="number"
                    value={formData.spent}
                    onChange={(e) => setFormData({ ...formData, spent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    min="0"
                    step="100"
                    placeholder="0"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Add notes about your trip..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTrip ? 'Update Trip' : 'Add Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Trip Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div
              className="flex items-center justify-between p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${categoryConfig[selectedTrip.category].color} 0%, ${categoryConfig[selectedTrip.category].color}dd 100%)` }}
            >
              <div>
                <h3 className="text-2xl font-bold">{selectedTrip.destination}</h3>
                <p className="opacity-90">{selectedTrip.country}</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Trip Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">Duration</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {getDaysDifference(selectedTrip.startDate, selectedTrip.endDate)} days
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">Budget</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    R{selectedTrip.budget.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-2" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">Spent</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    R{selectedTrip.spent.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <Briefcase className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
                  <div className="text-xs text-gray-500 dark:text-gray-400">Category</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {categoryConfig[selectedTrip.category].label}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedTrip.notes && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Notes
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    {selectedTrip.notes}
                  </p>
                </div>
              )}

              {/* Itinerary */}
              {selectedTrip.itinerary.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapIcon className="w-5 h-5" />
                    Itinerary
                  </h4>
                  <div className="space-y-4">
                    {selectedTrip.itinerary.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400">
                          {item.day}
                        </div>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-gray-900 dark:text-white">{item.title}</h5>
                            {item.time && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.time}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          {item.location && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="w-3 h-3" />
                              {item.location}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => exportToPDF(selectedTrip)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditTrip(selectedTrip);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Trip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
