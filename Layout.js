import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Ticket,
  Wrench,
  MessageCircle,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin';

  const navigation = [
    // Regular user navigation
    ...(!isAdmin ? [
      {
        name: 'My Assets',
        icon: Package,
        href: createPageUrl('MyAssets'),
        show: true,
      },
      {
        name: 'My Tickets',
        icon: Ticket,
        href: createPageUrl('MyTickets'),
        show: true,
      }
    ] : []),
    
    // Admin navigation
    ...(isAdmin ? [
      {
        name: 'Admin Dashboard',
        icon: LayoutDashboard,
        href: createPageUrl('AdminDashboard'),
        show: true,
      },
      {
        name: 'Manage Assets',
        icon: Package,
        href: createPageUrl('Assets'),
        show: true,
      },
      {
        name: 'Technician Portal',
        icon: Wrench,
        href: createPageUrl('TechnicianPortal'),
        show: true,
      },
      {
        name: 'My Tickets',
        icon: Ticket,
        href: createPageUrl('MyTickets'),
        show: true,
      },
      {
        name: 'WhatsApp Setup',
        icon: MessageCircle,
        href: createPageUrl('WhatsAppGuide'),
        show: true,
      }
    ] : []),
  ].filter(item => item.show);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-50 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              AssetTrack Pro
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.href.split('?')[0].split('/').pop();
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isAdmin ? 'bg-purple-100' : 'bg-blue-100'
              }`}>
                <User className={`w-4 h-4 ${isAdmin ? 'text-purple-600' : 'text-blue-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className={`text-xs capitalize ${
                  isAdmin ? 'text-purple-600 font-medium' : 'text-gray-500'
                }`}>
                  {user?.role}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="ml-4 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            AssetTrack Pro
          </h1>
        </header>

        {/* Page content */}
        <main>{children}</main>
      </div>
    </div>
  );
}