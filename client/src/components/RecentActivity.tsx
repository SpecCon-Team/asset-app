import React, { useState, useEffect } from 'react';
import { Clock, Ticket, Package, Users, MapPin, CheckCircle, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'ticket' | 'asset' | 'user' | 'travel' | 'system';
  action: string;
  description: string;
  user: string;
  timestamp: Date;
  icon: any;
  color: string;
}

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<'all' | Activity['type']>('all');

  useEffect(() => {
    // Sample activities - in production, this would come from an API
    const sampleActivities: Activity[] = [
      {
        id: '1',
        type: 'ticket',
        action: 'created',
        description: 'New ticket #1234 - Printer not working',
        user: 'John Smith',
        timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        icon: Ticket,
        color: 'text-blue-600 dark:text-blue-400',
      },
      {
        id: '2',
        type: 'asset',
        action: 'updated',
        description: 'Updated Dell Laptop #AS-001 specifications',
        user: 'Sarah Johnson',
        timestamp: new Date(Date.now() - 15 * 60000), // 15 minutes ago
        icon: Package,
        color: 'text-green-600 dark:text-green-400',
      },
      {
        id: '3',
        type: 'ticket',
        action: 'resolved',
        description: 'Resolved ticket #1230 - Network connectivity issue',
        user: 'Mike Brown',
        timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
      },
      {
        id: '4',
        type: 'user',
        action: 'created',
        description: 'New user Emma Davis added to the system',
        user: 'Admin',
        timestamp: new Date(Date.now() - 45 * 60000), // 45 minutes ago
        icon: Users,
        color: 'text-purple-600 dark:text-purple-400',
      },
      {
        id: '5',
        type: 'travel',
        action: 'created',
        description: 'New trip to Cape Town planned for Dec 2025',
        user: 'John Smith',
        timestamp: new Date(Date.now() - 60 * 60000), // 1 hour ago
        icon: MapPin,
        color: 'text-orange-600 dark:text-orange-400',
      },
      {
        id: '6',
        type: 'asset',
        action: 'created',
        description: 'Added new HP Printer #AS-055',
        user: 'Tech Team',
        timestamp: new Date(Date.now() - 90 * 60000), // 1.5 hours ago
        icon: Package,
        color: 'text-green-600 dark:text-green-400',
      },
      {
        id: '7',
        type: 'ticket',
        action: 'assigned',
        description: 'Ticket #1232 assigned to Sarah Johnson',
        user: 'Admin',
        timestamp: new Date(Date.now() - 120 * 60000), // 2 hours ago
        icon: Ticket,
        color: 'text-blue-600 dark:text-blue-400',
      },
      {
        id: '8',
        type: 'system',
        action: 'backup',
        description: 'Daily system backup completed successfully',
        user: 'System',
        timestamp: new Date(Date.now() - 180 * 60000), // 3 hours ago
        icon: Info,
        color: 'text-gray-600 dark:text-gray-400',
      },
    ];

    setActivities(sampleActivities);
  }, []);

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter);

  const getActivityBadge = (action: string) => {
    const badges: Record<string, string> = {
      created: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      updated: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      resolved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      deleted: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      assigned: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      backup: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    };

    return badges[action] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Recent Activity
        </h3>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('ticket')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'ticket'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Tickets
          </button>
          <button
            onClick={() => setFilter('asset')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === 'asset'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Assets
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No activities found</p>
          </div>
        ) : (
          filteredActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div
                key={activity.id}
                className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center ${activity.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActivityBadge(activity.action)}`}>
                        {activity.action}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        by {activity.user}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View All Link */}
      <div className="mt-4 text-center">
        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
          View All Activity →
        </button>
      </div>
    </div>
  );
}
