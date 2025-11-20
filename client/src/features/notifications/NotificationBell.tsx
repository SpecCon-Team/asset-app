import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationsStore } from './store';
import { useCurrentUser } from '@/features/auth/hooks';
import { useNavigate } from 'react-router-dom';
import { formatDateTime, formatDate } from '@/lib/dateFormatter';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSpeedTestModal, setShowSpeedTestModal] = useState(false);
  const [selectedSpeedTest, setSelectedSpeedTest] = useState<any>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead, deleteNotification, dismissAllNotifications } = useNotificationsStore();

  useEffect(() => {
    // Only fetch notifications if user is logged in and has a valid ID
    if (!currentUser?.id) {
      return;
    }

    // Initial fetch
    fetchNotifications(currentUser.id);
    fetchUnreadCount(currentUser.id);

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      if (currentUser?.id) {
        fetchNotifications(currentUser.id);
        fetchUnreadCount(currentUser.id);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser?.id, fetchNotifications, fetchUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

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
      if (e.key === 'Escape') {
        setIsOpen(false);
        // Return focus to the trigger button
        const button = dropdownRef.current?.querySelector('button[aria-haspopup="true"]') as HTMLButtonElement;
        button?.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev < notifications.length - 1 ? prev + 1 : prev;
          notificationRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((prev) => {
          const next = prev > 0 ? prev - 1 : 0;
          notificationRefs.current[next]?.focus();
          return next;
        });
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
        notificationRefs.current[0]?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        const lastIndex = notifications.length - 1;
        setFocusedIndex(lastIndex);
        notificationRefs.current[lastIndex]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, notifications.length]);

  const handleNotificationClick = async (notification: any) => {
    // Mark as read asynchronously (fire-and-forget for better UX)
    if (!notification.read) {
      markAsRead(notification.id).catch(err => {
        console.error('Failed to mark notification as read:', err);
      });
    }

    // Check if it's a speed test notification
    if (notification.title.includes('Network Speed Test')) {
      // Parse speed test data from message
      const message = notification.message;
      const downloadMatch = message.match(/Download: ([\d.]+) Mbps/);
      const uploadMatch = message.match(/Upload: ([\d.]+) Mbps/);
      const pingMatch = message.match(/Ping: ([\d.]+) ms/);
      const qualityMatch = notification.title.match(/Network Speed Test - (.+)/);
      const technicianMatch = message.match(/^(.+) completed a speed test/);
      const timeMatch = message.match(/Test completed at (.+)$/m);

      setSelectedSpeedTest({
        technician: technicianMatch ? technicianMatch[1] : 'Unknown',
        download: downloadMatch ? parseFloat(downloadMatch[1]) : 0,
        upload: uploadMatch ? parseFloat(uploadMatch[1]) : 0,
        ping: pingMatch ? parseInt(pingMatch[1]) : 0,
        quality: qualityMatch ? qualityMatch[1] : 'Unknown',
        timestamp: timeMatch ? timeMatch[1] : formatDateTime(notification.createdAt),
      });
      setShowSpeedTestModal(true);
      setIsOpen(false);
      return;
    }

    // Close dropdown immediately for instant feedback
    setIsOpen(false);

    // Navigate to related resource
    if (notification.ticketId) {
      // Use ticketNumber if available, otherwise fall back to ticketId
      const ticketIdentifier = (notification as any).ticketNumber || notification.ticketId;
      navigate(`/tickets/${ticketIdentifier}`);
    } else if (notification.assetId) {
      // Use assetCode if available, otherwise fall back to assetId
      const assetIdentifier = (notification as any).assetCode || notification.assetId;
      navigate(`/assets/${assetIdentifier}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (currentUser?.id) {
      await markAllAsRead(currentUser.id);
    }
  };

  const handleDismissAll = async () => {
    if (currentUser?.id) {
      await dismissAllNotifications(currentUser.id);
    }
  };

  const getNotificationIcon = (type: string, title: string) => {
    // Check title for more specific icons
    if (title.includes('Network Speed Test')) return '📶';
    if (title.includes('New ticket created')) return '🆕';
    if (title.includes('User replied')) return '💭';

    switch (type) {
      case 'system':
        return '⚙️';
      case 'comment':
        return '💬';
      case 'ticket_status':
        return '🎫';
      case 'ticket_assigned':
        return '👤';
      case 'asset_assigned':
        return '📦';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return formatDate(date);
  };

  // Don't render notification bell if user is not logged in
  if (!currentUser) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Icon */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-controls="notifications-dropdown"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              role="status"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div
            id="notifications-dropdown"
            role="menu"
            aria-label="Notifications menu"
            className="fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto mt-2 sm:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[9999] max-h-[80vh] sm:max-h-[600px] flex flex-col"
          >
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                    title="Mark all as read"
                    aria-label="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Mark all read</span>
                    <span className="sm:hidden">Read all</span>
                  </button>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleDismissAll}
                  className="w-full px-3 sm:px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm sm:text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  title="Dismiss all notifications"
                  aria-label="Dismiss all notifications"
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  Dismiss All
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      ref={(el) => (notificationRefs.current[index] = el)}
                      role="menuitem"
                      tabIndex={0}
                      className={`p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNotificationClick(notification);
                        }
                      }}
                      aria-label={`${notification.title}${!notification.read ? ', unread' : ''}`}
                    >
                      <div className="flex gap-3">
                        {/* Sender Avatar or Icon */}
                        <div className="flex-shrink-0">
                          {notification.sender ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              {notification.sender.profilePicture ? (
                                <img
                                  src={notification.sender.profilePicture}
                                  alt={notification.sender.name || notification.sender.email}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-lg">
                                  {(notification.sender.name || notification.sender.email).charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-2xl">
                              {getNotificationIcon(notification.type, notification.title)}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {notification.title}
                              </p>
                              {notification.sender && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  from {notification.sender.name || notification.sender.email}
                                </p>
                              )}
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {formatTimeAgo(notification.createdAt)}
                          </p>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg transition-colors"
                          title="Delete notification"
                          aria-label={`Delete notification: ${notification.title}`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Speed Test Report Modal - Full Screen Overlay */}
      {showSpeedTestModal && selectedSpeedTest && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] overflow-y-auto p-4"
          onClick={() => setShowSpeedTestModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full my-8 relative"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', overflow: 'auto' }}
          >
            {/* Close Button - Top Right Corner */}
            <button
              onClick={() => setShowSpeedTestModal(false)}
              className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-700 bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all hover:scale-110"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </button>

            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start pr-12">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">📶</span>
                    <h2 className="text-2xl font-bold">Network Speed Test Report</h2>
                  </div>
                  <p className="text-blue-100">Technician: {selectedSpeedTest.technician}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Connection Quality Badge */}
              <div className="mb-6 text-center">
                <div className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${
                  selectedSpeedTest.quality === 'Excellent' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                  selectedSpeedTest.quality === 'Good' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300' :
                  selectedSpeedTest.quality === 'Fair' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                  'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                }`}>
                  {selectedSpeedTest.quality} Connection
                </div>
              </div>

              {/* Speed Metrics */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Ping */}
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/30 rounded-lg border-2 border-green-200 dark:border-green-700">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">PING</div>
                  <div className="text-4xl font-bold text-green-700 dark:text-green-300 mb-1">
                    {selectedSpeedTest.ping}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">milliseconds</div>
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                    {selectedSpeedTest.ping < 30 ? 'Excellent' :
                     selectedSpeedTest.ping < 50 ? 'Good' :
                     selectedSpeedTest.ping < 100 ? 'Fair' : 'Poor'}
                  </div>
                </div>

                {/* Download */}
                <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">DOWNLOAD</div>
                  <div className="text-4xl font-bold text-blue-700 dark:text-blue-300 mb-1">
                    {selectedSpeedTest.download}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Mbps</div>
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                    {selectedSpeedTest.download > 100 ? 'Excellent' :
                     selectedSpeedTest.download > 25 ? 'Good' :
                     selectedSpeedTest.download > 10 ? 'Fair' : 'Poor'}
                  </div>
                </div>

                {/* Upload */}
                <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/30 rounded-lg border-2 border-purple-200 dark:border-purple-700">
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">UPLOAD</div>
                  <div className="text-4xl font-bold text-purple-700 dark:text-purple-300 mb-1">
                    {selectedSpeedTest.upload}
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Mbps</div>
                  <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                    {selectedSpeedTest.upload > 50 ? 'Excellent' :
                     selectedSpeedTest.upload > 10 ? 'Good' :
                     selectedSpeedTest.upload > 5 ? 'Fair' : 'Poor'}
                  </div>
                </div>
              </div>

              {/* Test Details */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Test Date:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{selectedSpeedTest.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tested By:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">{selectedSpeedTest.technician}</span>
                  </div>
                </div>
              </div>

              {/* Performance Indicators */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-300 mb-2">Performance Analysis</h3>
                <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                    <span>
                      {selectedSpeedTest.ping < 50 && selectedSpeedTest.download > 25 && selectedSpeedTest.upload > 10
                        ? 'Connection is suitable for video calls, streaming, and cloud applications'
                        : selectedSpeedTest.download < 10
                        ? 'Connection may experience issues with heavy tasks'
                        : 'Connection is adequate for general browsing and light tasks'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></span>
                    <span>
                      Latency: {selectedSpeedTest.ping < 30 ? 'Perfect for real-time applications' :
                                selectedSpeedTest.ping < 100 ? 'Acceptable for most uses' :
                                'May cause delays in interactive applications'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-lg flex justify-end">
              <button
                onClick={() => setShowSpeedTestModal(false)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
