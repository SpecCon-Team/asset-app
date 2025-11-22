import React from 'react';
import { Plus, Ticket, Package, Users, MapPin, TrendingUp, FileText, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { showInfo } from '@/lib/sweetalert';

const quickActions = [
  {
    id: 'create-ticket',
    label: 'New Ticket',
    icon: Ticket,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600',
    path: '/tickets',
    action: 'create',
  },
  {
    id: 'add-asset',
    label: 'Add Asset',
    icon: Package,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600',
    path: '/assets',
    action: 'create',
  },
  {
    id: 'add-user',
    label: 'Add User',
    icon: Users,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600',
    path: '/users',
    action: 'create',
  },
  {
    id: 'plan-travel',
    label: 'Plan Travel',
    icon: MapPin,
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600',
    path: '/travel',
    action: 'create',
  },
  {
    id: 'view-analytics',
    label: 'Analytics',
    icon: TrendingUp,
    color: 'bg-pink-500',
    hoverColor: 'hover:bg-pink-600',
    path: '/analytics',
    action: 'view',
  },
  {
    id: 'audit-logs',
    label: 'Audit Logs',
    icon: FileText,
    color: 'bg-indigo-500',
    hoverColor: 'hover:bg-indigo-600',
    path: '/audit-logs',
    action: 'view',
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  const handleAction = async (action: typeof quickActions[0]) => {
    if (action.action === 'create') {
      const result = await showInfo(
        `Navigate to ${action.label} page to create new item`,
        action.label
      );
      if (result.isConfirmed) {
        navigate(action.path);
      }
    } else {
      navigate(action.path);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Quick Actions
        </h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={`${action.color} ${action.hoverColor} text-white p-4 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg flex flex-col items-center justify-center gap-2 min-h-[100px]`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium text-center">{action.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Click any action to quickly access common tasks
      </div>
    </div>
  );
}
