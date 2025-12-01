import React, { useState } from 'react';
import {
  Plus,
  Package,
  Ticket,
  FileText,
  Scan,
  Download,
  Upload,
  Settings,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  roles?: string[];
}

interface QuickActionsMenuProps {
  userRole?: string;
}

export default function QuickActionsMenu({ userRole = 'USER' }: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'new-asset',
      label: 'New Asset',
      icon: <Package className="w-5 h-5" />,
      action: () => {
        navigate('/assets/new');
        setIsOpen(false);
      },
      color: 'bg-blue-500 hover:bg-blue-600',
      roles: ['ADMIN'],
    },
    {
      id: 'new-ticket',
      label: 'New Ticket',
      icon: <Ticket className="w-5 h-5" />,
      action: () => {
        navigate('/tickets/new');
        setIsOpen(false);
      },
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      id: 'new-inventory',
      label: 'New Inventory Item',
      icon: <FileText className="w-5 h-5" />,
      action: () => {
        navigate('/inventory/new');
        setIsOpen(false);
      },
      color: 'bg-purple-500 hover:bg-purple-600',
      roles: ['ADMIN', 'TECHNICIAN'],
    },
    {
      id: 'scan-qr',
      label: 'Scan QR Code',
      icon: <Scan className="w-5 h-5" />,
      action: () => {
        navigate('/checkout/scan');
        setIsOpen(false);
      },
      color: 'bg-indigo-500 hover:bg-indigo-600',
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: <Download className="w-5 h-5" />,
      action: () => {
        navigate('/reports/export');
        setIsOpen(false);
      },
      color: 'bg-orange-500 hover:bg-orange-600',
      roles: ['ADMIN'],
    },
    {
      id: 'import-data',
      label: 'Import Data',
      icon: <Upload className="w-5 h-5" />,
      action: () => {
        navigate('/import');
        setIsOpen(false);
      },
      color: 'bg-pink-500 hover:bg-pink-600',
      roles: ['ADMIN'],
    },
  ];

  const filteredActions = quickActions.filter(
    (action) => !action.roles || action.roles.includes(userRole)
  );

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600 rotate-45'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        aria-label="Quick actions menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Quick Actions Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Actions Grid */}
          <div className="fixed bottom-24 right-8 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-80">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 px-2">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {filteredActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 transform hover:scale-105 hover:shadow-lg animate-in fade-in slide-in-from-bottom-2`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    {action.icon}
                    <span className="text-sm font-medium text-center">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Keyboard Shortcut Hint */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    Ctrl
                  </kbd>{' '}
                  +{' '}
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                    K
                  </kbd>{' '}
                  for global search
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
