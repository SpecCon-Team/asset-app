import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Package, Ticket, Home, FolderOpen, ClipboardList, Settings, LogOut, User } from 'lucide-react';

export default function AppLayout() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get logged in user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    } else {
      // If no user, redirect to login
      navigate('/login');
    }
  }, [navigate]);

  const sidebarLinks = [
    { to: '/', label: 'Admin Dashboard', icon: Home, exact: true, roles: ['ADMIN'] },
    { to: '/assets', label: 'Manage Assets', icon: Package, roles: ['ADMIN', 'TECHNICIAN'] },
    { to: '/tickets', label: 'Technician Portal', icon: Ticket, roles: ['ADMIN', 'TECHNICIAN'] },
    { to: '/my/tickets', label: 'My Tickets', icon: ClipboardList, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
    { to: '/my/assets', label: 'My Assets', icon: FolderOpen, roles: ['USER', 'ADMIN', 'TECHNICIAN'] },
    { to: '/whatsapp-setup', label: 'WhatsApp Setup', icon: Settings, roles: ['ADMIN'] },
  ];

  // Filter links based on user role
  const visibleLinks = sidebarLinks.filter(link => 
    !link.roles || link.roles.includes(currentUser?.role)
  );

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Display user name and role
  const getUserDisplay = () => {
    if (!currentUser) return { name: 'Guest', role: 'N/A' };
    
    if (currentUser.role === 'ADMIN') {
      return { name: 'Opiwe', role: 'Admin' };
    } else {
      return { name: 'Kagisos Sepato', role: 'User' };
    }
  };

  const userDisplay = getUserDisplay();

  if (!currentUser) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">AT</span>
            </div>
            <span className="text-xl font-bold text-gray-900">AssetTrack Pro</span>
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
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Section at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentUser.role === 'ADMIN' ? 'bg-purple-200' : 'bg-gray-200'
            }`}>
              <User className={`w-4 h-4 ${
                currentUser.role === 'ADMIN' ? 'text-purple-600' : 'text-gray-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{userDisplay.name}</p>
              <p className={`text-xs truncate ${
                currentUser.role === 'ADMIN' ? 'text-purple-600 font-semibold' : 'text-gray-500'
              }`}>
                {userDisplay.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}