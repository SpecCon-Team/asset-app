import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  Shield,
  Smartphone,
  HelpCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiClient } from '@/features/assets/lib/apiClient';

interface UserProfileDropdownProps {
  user: any;
}

export default function UserProfileDropdown({ user }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [currentUser, setCurrentUser] = useState(user);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navigate = useNavigate();

  // Update state when user prop changes
  useEffect(() => {
    setCurrentUser(user);
    setIsAvailable(user?.isAvailable ?? true);
  }, [user]);

  // Listen for user updates from localStorage
  useEffect(() => {
    const handleUserUpdate = () => {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const updatedUser = JSON.parse(userStr);
        setCurrentUser(updatedUser);
        setIsAvailable(updatedUser?.isAvailable ?? true);
      }
    };

    window.addEventListener('userUpdated', handleUserUpdate);
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation handler
  useEffect(() => {
    if (!isOpen) {
      setFocusedIndex(-1);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Total number of menu items (5 menu items + 1 logout button = 6 total)
      const totalItems = 6;

      if (e.key === 'Escape') {
        setIsOpen(false);
        // Return focus to the trigger button
        const button = dropdownRef.current?.querySelector('button') as HTMLButtonElement;
        button?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < totalItems - 1 ? prev + 1 : prev;
          menuItemRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : 0;
          menuItemRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
        menuItemRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastIndex = totalItems - 1;
        setFocusedIndex(lastIndex);
        menuItemRefs.current[lastIndex]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleAvailabilityToggle = async () => {
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);

    try {
      await getApiClient().patch(`/users/${currentUser.id}/availability`, {
        isAvailable: newAvailability,
      });

      // Update localStorage with new availability status
      const updatedUser = { ...currentUser, isAvailable: newAvailability };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('userUpdated'));

      toast.success(newAvailability ? 'You are now available' : 'You are now offline');
    } catch (error) {
      console.error('Failed to update availability:', error);
      // Revert on error
      setIsAvailable(!newAvailability);
      toast.error('Failed to update availability status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('You have logged out successfully.');
    navigate('/login');
    setIsOpen(false);
  };

  // Get user initials
  const getInitials = () => {
    if (currentUser.name) {
      return currentUser.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return currentUser.email?.slice(0, 2).toUpperCase() || 'U';
  };

  // Get display name
  const getDisplayName = () => {
    return currentUser.name || currentUser.email || 'User';
  };

  // Get role label
  const getRoleLabel = () => {
    return currentUser.role
      ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1).toLowerCase()
      : 'User';
  };

  const menuItems = [
    {
      icon: User,
      label: 'My profile',
      onClick: () => {
        setIsOpen(false);
        navigate('/my-profile');
      }
    },
    {
      icon: Settings,
      label: 'General settings',
      onClick: () => {
        setIsOpen(false);
        navigate('/settings');
      }
    },
    {
      icon: Shield,
      label: 'Two-Factor Authentication',
      onClick: () => {
        setIsOpen(false);
        navigate('/2fa-setup');
      }
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={`User menu for ${getDisplayName()}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="user-profile-dropdown"
      >
        <div className="relative">
          {currentUser.profilePicture ? (
            <img
              src={currentUser.profilePicture}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{getInitials()}</span>
            </div>
          )}
          {/* Online status indicator */}
          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
            isAvailable ? 'bg-green-500' : 'bg-gray-400'
          }`}></div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="user-profile-dropdown"
          role="menu"
          aria-label="User profile menu"
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                {currentUser.profilePicture ? (
                  <img
                    src={currentUser.profilePicture}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white font-semibold">{getInitials()}</span>
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                  isAvailable ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{getDisplayName()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email || ''}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{getRoleLabel()}</p>
              </div>
            </div>
          </div>

          {/* Available Toggle */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  isAvailable ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isAvailable ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <span className="text-sm text-gray-700 dark:text-gray-300" id="availability-label">Available</span>
              </div>
              <button
                onClick={handleAvailabilityToggle}
                role="switch"
                aria-checked={isAvailable}
                aria-labelledby="availability-label"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                  isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAvailable ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  ref={(el) => (menuItemRefs.current[index] = el)}
                  onClick={item.onClick}
                  role="menuitem"
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-label={item.label}
                >
                  <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
            <button
              ref={(el) => (menuItemRefs.current[menuItems.length] = el)}
              onClick={handleLogout}
              role="menuitem"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
