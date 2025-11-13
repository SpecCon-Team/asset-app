import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Package, Ticket, Home, FolderOpen, ClipboardList, Settings, Users, CheckSquare, Menu, X } from 'lucide-react';
import NotificationBell from '@/features/notifications/NotificationBell';
import UserProfileDropdown from './UserProfileDropdown';

export default function AppLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Get logged in user from localStorage and apply their theme
    const loadUser = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);

        // Apply user's theme preference
        applyUserTheme(user.id);
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

  // Apply user-specific theme
  const applyUserTheme = (userId: string) => {
    try {
      const userSettingsKey = `appSettings_${userId}`;
      const savedSettings = localStorage.getItem(userSettingsKey);

      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        const theme = settings.theme || 'light';

        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else if (theme === 'auto') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (isDark) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } else {
        // Default to light theme if no settings
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to apply user theme:', error);
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
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
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
          fixed lg:relative inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">AT</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">AssetTrack Pro</span>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
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
                  `flex items-center gap-3 px-4 py-3 lg:py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
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
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 flex justify-between items-center gap-4 sticky top-0 z-[50]">
          {/* Hamburger menu button for mobile */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Right side: Notifications and User Profile */}
          <div className="flex items-center gap-4 ml-auto">
            <NotificationBell />
            <UserProfileDropdown user={currentUser} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </div>
      </main>
    </div>
  );
}