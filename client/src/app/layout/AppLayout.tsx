import React, { useEffect, useState, useRef } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Package, Ticket, Home, FolderOpen, ClipboardList, Settings, Users, CheckSquare, Menu, X, Keyboard, Search, Shield, Lock, ChevronLeft, ChevronRight, Bell, HelpCircle, Download, ShieldCheck, UserCog } from 'lucide-react';
import NotificationBell from '@/features/notifications/NotificationBell';
import UserProfileDropdown from './UserProfileDropdown';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from '@/components/KeyboardShortcutsModal';
import GlobalSearch from '@/components/GlobalSearch';
import AIChatWidget from '@/components/AIChatWidget';

export default function AppLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Listen for Ctrl+K to open global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Grouped navigation structure
  const navigationGroups = [
    {
      label: 'Main',
      links: [
        { to: '/', label: 'Dashboard', icon: Home, exact: true, roles: ['ADMIN', 'TECHNICIAN', 'USER'] },
      ]
    },
    {
      label: 'Management',
      links: [
        { to: '/assets', label: 'All Assets', icon: Package, roles: ['ADMIN'] },
        { to: '/tickets', label: 'All Tickets', icon: Ticket, roles: ['ADMIN', 'TECHNICIAN'] },
        { to: '/my-clients', label: 'User Management', icon: Users, roles: ['ADMIN'] },
      ]
    },
    {
      label: 'My Work',
      links: [
        { to: '/my-tasks', label: 'My Tasks', icon: CheckSquare, roles: ['TECHNICIAN', 'ADMIN'] },
        { to: '/my-tickets', label: 'My Tickets', icon: ClipboardList, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
        { to: '/my-assets', label: 'My Assets', icon: FolderOpen, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
      ]
    },
    {
      label: 'Security & Privacy',
      links: [
        { to: '/audit-logs', label: 'Audit Logs', icon: Shield, roles: ['ADMIN'] },
        { to: '/2fa-management', label: '2FA Management', icon: ShieldCheck, roles: ['ADMIN'] },
        { to: '/privacy', label: 'Privacy & Data', icon: UserCog, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
      ]
    },
    {
      label: 'Configuration',
      links: [
        { to: '/whatsapp-setup', label: 'WhatsApp Setup', icon: Settings, roles: ['ADMIN'] },
      ]
    },
    {
      label: 'Resources',
      links: [
        { to: '/help', label: 'Help & Resources', icon: HelpCircle, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
        { to: '/download-mobile-app', label: 'Mobile App', icon: Download, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
      ]
    }
  ];

  // Filter groups and links based on user role
  const visibleGroups = navigationGroups.map(group => ({
    ...group,
    links: group.links.filter(link => !link.roles || link.roles.includes(currentUser?.role))
  })).filter(group => group.links.length > 0);

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

      {/* Enhanced Sidebar with Auto Collapse/Expand */}
      <aside
        ref={sidebarRef}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`
          bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900
          border-r border-gray-200 dark:border-gray-700
          flex flex-col
          inset-y-0 left-0 z-50
          transition-all duration-300 ease-in-out

          ${/* Mobile (< 768px): Slide-in overlay sidebar */ ''}
          fixed w-64 -translate-x-full
          ${mobileMenuOpen ? 'translate-x-0' : ''}

          ${/* Tablet (768px - 1024px): Fixed narrow sidebar */ ''}
          md:translate-x-0 md:w-20

          ${/* Desktop (>= 1024px): Hover to expand */ ''}
          lg:relative
          ${sidebarHovered ? 'lg:w-64' : 'lg:w-20'}

          ${/* Shadow only on mobile */ ''}
          shadow-xl md:shadow-none
        `}
      >
        {/* Logo/Brand */}
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3">
          <Link
            to="/"
            className={`flex items-center transition-all duration-300 flex-1 min-w-0
              ${/* Mobile: Always show full logo when menu is open */ ''}
              ${mobileMenuOpen ? 'gap-3' : ''}
              ${/* Tablet/Desktop: Center when collapsed, show full when hovered */ ''}
              md:justify-center md:w-full
              ${sidebarHovered ? 'lg:justify-start lg:w-auto lg:gap-3' : ''}
            `}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform flex-shrink-0">
              <span className="text-white font-bold text-lg">AT</span>
            </div>
            {/* Show title on mobile when menu open, or desktop when hovered */}
            <span className={`font-bold bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent transition-all duration-300 truncate
              text-lg sm:text-xl
              ${mobileMenuOpen ? 'inline md:hidden' : 'hidden'}
              ${sidebarHovered ? 'lg:inline' : 'lg:hidden'}
            `}>
              AssetTrack Pro
            </span>
          </Link>

          {/* Close button for mobile only */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Navigation Links - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 md:px-3 py-3 md:py-4 space-y-4 md:space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {visibleGroups.map((group, groupIndex) => {
            // Show group headers on mobile when menu open, or desktop when hovered
            const showGroupHeader = mobileMenuOpen || sidebarHovered;

            return (
              <div key={groupIndex} className="space-y-1">
                {showGroupHeader && (
                  <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 whitespace-nowrap">
                    {group.label}
                  </h3>
                )}
                {group.links.map((link) => {
                  const Icon = link.icon;
                  // Collapsed: when sidebar not hovered on desktop/tablet, but not on mobile with menu open
                  const isCollapsed = !sidebarHovered && !mobileMenuOpen;

                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.exact}
                      className={({ isActive }) =>
                        `flex items-center ${isCollapsed ? 'justify-center md:justify-center' : 'gap-3'}
                        px-3 py-2.5 md:py-3 rounded-lg text-sm font-medium
                        transition-all duration-200 group relative
                        min-h-[44px]
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-300 shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                        }
                        ${!isCollapsed ? 'hover:translate-x-1' : ''}`
                      }
                      title={isCollapsed ? link.label : undefined}
                      onClick={() => {
                        // Close mobile menu when clicking a link on mobile
                        if (window.innerWidth < 768) {
                          setMobileMenuOpen(false);
                        }
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
                          )}
                          <Icon
                            className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} flex-shrink-0
                            ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}
                            transition-colors`}
                          />
                          {/* Show label on mobile when menu open, or desktop when hovered */}
                          {!isCollapsed && (
                            <span className="truncate">{link.label}</span>
                          )}
                          {/* Show tooltip on tablet/desktop when collapsed (not on mobile) */}
                          {isCollapsed && (
                            <div className="hidden md:block absolute left-full ml-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-lg pointer-events-none">
                              {link.label}
                              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
                            </div>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Header with Notifications and User Profile */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 py-3 md:py-4 flex justify-between items-center gap-2 sm:gap-4 sticky top-0 z-[50]">
          {/* Hamburger menu button for mobile/tablet */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Right side: Notifications and User Profile */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 ml-auto">
            <button
              onClick={() => setGlobalSearchOpen(true)}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center text-gray-700 dark:text-gray-300 flex-shrink-0"
              title="Global Search (Ctrl+K)"
              aria-label="Open global search"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShortcutsModalOpen(true)}
              className="hidden sm:flex p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors items-center justify-center text-gray-700 dark:text-gray-300 flex-shrink-0"
              title="Keyboard Shortcuts (Press ?)"
              aria-label="Show keyboard shortcuts"
            >
              <Keyboard className="w-5 h-5" />
            </button>
            <NotificationBell />
            <UserProfileDropdown user={currentUser} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </div>
      </main>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      {/* AI Chat Widget */}
      <AIChatWidget />
    </div>
  );
}