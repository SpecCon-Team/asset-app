import React, { useState, useEffect } from 'react';
import {
  Clock,
  Package,
  User,
  MapPin,
  Wrench,
  Archive,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  userId?: string;
  userName?: string;
  description?: string;
  createdAt: string;
}

interface AssetTimelineProps {
  assetId: string;
}

export default function AssetTimeline({ assetId }: AssetTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchTimeline();
  }, [assetId, filter]);

  const fetchTimeline = async () => {
    try {
      setIsLoading(true);
      const apiClient = getApiClient();
      const params = filter !== 'all' ? { action: filter } : {};
      const response = await apiClient.get(`/assets/${assetId}/history`, { params });
      setEvents(response.data.history || []);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'ASSIGNMENT':
        return <User className="w-5 h-5 text-blue-500" />;
      case 'LOCATION_CHANGE':
        return <MapPin className="w-5 h-5 text-purple-500" />;
      case 'MAINTENANCE':
        return <Wrench className="w-5 h-5 text-orange-500" />;
      case 'CHECKOUT':
        return <Package className="w-5 h-5 text-indigo-500" />;
      case 'CHECKIN':
        return <Archive className="w-5 h-5 text-teal-500" />;
      case 'UPDATE':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventColor = (action: string) => {
    switch (action) {
      case 'STATUS_CHANGE':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'ASSIGNMENT':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'LOCATION_CHANGE':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'MAINTENANCE':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'CHECKOUT':
        return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
      case 'CHECKIN':
        return 'border-teal-500 bg-teal-50 dark:bg-teal-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatEventDescription = (event: TimelineEvent) => {
    if (event.description) {
      return event.description;
    }

    if (event.field && event.oldValue && event.newValue) {
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-600 dark:text-gray-400">
            {event.field.replace('_', ' ')}:
          </span>
          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">
            {event.oldValue}
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-sm">
            {event.newValue}
          </span>
        </div>
      );
    }

    return event.action.replace('_', ' ').toLowerCase();
  };

  const filterOptions = [
    { value: 'all', label: 'All Events' },
    { value: 'STATUS_CHANGE', label: 'Status Changes' },
    { value: 'ASSIGNMENT', label: 'Assignments' },
    { value: 'LOCATION_CHANGE', label: 'Location Changes' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'CHECKOUT', label: 'Checkouts' },
    { value: 'CHECKIN', label: 'Check-ins' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No timeline events found</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

          {/* Timeline Events */}
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div
                  className={`relative flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getEventColor(
                    event.action
                  )} z-10`}
                >
                  {getEventIcon(event.action)}
                </div>

                {/* Event Card */}
                <div className="flex-1 pb-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {event.action.replace('_', ' ')}
                      </h4>
                      <time className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(event.createdAt), 'MMM d, yyyy HH:mm')}
                      </time>
                    </div>

                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                      {formatEventDescription(event)}
                    </div>

                    {event.userName && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <User className="w-3 h-3" />
                        <span>by {event.userName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
