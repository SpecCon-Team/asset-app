import React, { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle, CheckCircle } from 'lucide-react';
import {
  isPushNotificationSupported,
  getNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
  savePushSubscription,
  deletePushSubscription,
  showLocalNotification,
} from '@/lib/pushNotifications';
import toast from 'react-hot-toast';

// VAPID public key - This should be generated on your backend
// For now using a placeholder - replace with actual VAPID key from your backend
const VAPID_PUBLIC_KEY = 'BMxzS8VxcHQGEyZ_N0YGUwF9rvBa8j_qSqF1R3aw8xYLrKQvLpEyMqJ4zVXN5WKyX8_CZxR0tQGP9Hf0VQC3wE4';

export default function PushNotificationSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const supported = isPushNotificationSupported();
    setIsSupported(supported);

    if (supported) {
      const currentPermission = getNotificationPermission();
      setPermission(currentPermission);

      const subscription = await getCurrentPushSubscription();
      setIsSubscribed(!!subscription);
    }
  };

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error('Please login to enable notifications');
        return;
      }

      const user = JSON.parse(userStr);

      // Subscribe to push notifications
      const subscription = await subscribeToPushNotifications(VAPID_PUBLIC_KEY);

      if (!subscription) {
        toast.error('Please allow notifications in your browser settings');
        return;
      }

      // Save subscription to backend
      await savePushSubscription(subscription, user.id);

      setIsSubscribed(true);
      setPermission('granted');

      toast.success('Browser notifications enabled successfully!');

      // Show a test notification
      await showLocalNotification('Notifications Enabled!', {
        body: 'You will now receive real-time updates even when the tab is closed.',
        tag: 'welcome',
        requireInteraction: false,
      });
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      toast.error('Failed to enable notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsLoading(true);
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return;
      }

      const user = JSON.parse(userStr);

      // Unsubscribe from push notifications
      await unsubscribeFromPushNotifications();

      // Delete subscription from backend
      await deletePushSubscription(user.id);

      setIsSubscribed(false);

      toast.success('Browser notifications disabled successfully');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      toast.error('Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      await showLocalNotification('Test Notification', {
        body: 'This is a test notification from Asset Management System',
        tag: 'test',
        requireInteraction: false,
        data: {
          url: '/'
        }
      });
      toast.success('Test notification sent!');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
              Browser Notifications Not Supported
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BellOff className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
              Notifications Blocked
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mb-3">
              You have blocked notifications for this site. To enable them, you need to:
            </p>
            <ol className="text-sm text-red-700 dark:text-red-400 list-decimal list-inside space-y-1">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" in the permissions list</li>
              <li>Change the setting to "Allow"</li>
              <li>Refresh this page</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`border rounded-lg p-4 ${
        isSubscribed
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-start gap-3">
          {isSubscribed ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          ) : (
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className={`font-semibold mb-1 ${
              isSubscribed
                ? 'text-green-800 dark:text-green-300'
                : 'text-gray-800 dark:text-gray-300'
            }`}>
              {isSubscribed ? 'Browser Notifications Enabled' : 'Browser Notifications'}
            </h3>
            <p className={`text-sm ${
              isSubscribed
                ? 'text-green-700 dark:text-green-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isSubscribed
                ? 'You will receive real-time notifications even when this tab is closed.'
                : 'Enable browser notifications to receive real-time updates about tickets, assets, and comments.'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {!isSubscribed ? (
          <button
            onClick={handleEnableNotifications}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Bell className="w-5 h-5" />
            {isLoading ? 'Enabling...' : 'Enable Browser Notifications'}
          </button>
        ) : (
          <>
            <button
              onClick={handleTestNotification}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Bell className="w-5 h-5" />
              Send Test Notification
            </button>
            <button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BellOff className="w-5 h-5" />
              {isLoading ? 'Disabling...' : 'Disable Notifications'}
            </button>
          </>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
              How Browser Notifications Work
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>Receive instant alerts when someone comments on your tickets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>Get notified about ticket status changes and assignments</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>Works even when the browser tab is closed or minimized</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                <span>Click on notifications to be taken directly to the relevant page</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
