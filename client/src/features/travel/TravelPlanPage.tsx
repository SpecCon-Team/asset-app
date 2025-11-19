import React from 'react';
import { Plane, MapPin, Calendar } from 'lucide-react';

export default function TravelPlanPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Plane className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Travel Plan</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Manage your travel plans and itineraries</p>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center py-12">
          <Plane className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Travel Plan
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This is your Travel Plan page. Content coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
