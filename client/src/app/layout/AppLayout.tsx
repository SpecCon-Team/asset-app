import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Package, Ticket, Home, FolderOpen, ClipboardList, Settings, Users, CheckSquare } from 'lucide-react';
import NotificationBell from '@/features/notifications/NotificationBell';
import UserProfileDropdown from './UserProfileDropdown';

export default function AppLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get logged in user from localStorage
    const loadUser = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      } else {
        // If no user, redirect to login
        navigate('/login');
      }
    };

    loadUser();

    // Listen for user updates
    const handleUserUpdate = () => {
      loadUser();
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, [navigate]);

  const sidebarLinks = [
    { to: '/', label: 'Dashboard', icon: Home, exact: true, roles: ['ADMIN', 'TECHNICIAN', 'USER'] },
    { to: '/assets', label: 'Manage Assets', icon: Package, roles: ['ADMIN'] },
    { to: '/tickets', label: 'Technician Portal', icon: Ticket, roles: ['ADMIN', 'TECHNICIAN'] },
    { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare, roles: ['TECHNICIAN', 'ADMIN'] },
    { to: '/my-clients', label: 'My Clients', icon: Users, roles: ['ADMIN'] },
    { to: '/my/tickets', label: 'My Tickets', icon: ClipboardList, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
    { to: '/my/assets', label: 'My Assets', icon: FolderOpen, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
    { to: '/whatsapp-setup', label: 'WhatsApp Setup', icon: Settings, roles: ['ADMIN'] },
  ];

  // Filter links based on user role
  const visibleLinks = sidebarLinks.filter(link =>
    !link.roles || link.roles.includes(currentUser?.role)
  );

  if (!currentUser) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">AT</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">AssetTrack Pro</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header with Notifications and User Profile */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end items-center gap-4 sticky top-0 z-[50]">
          <NotificationBell />
          <UserProfileDropdown user={currentUser} />
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
}