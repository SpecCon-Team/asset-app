import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export default function WhatsAppSetup() {
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const showLoading = useMinLoadingTime(isChecking, 2000);

  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  const checkWhatsAppStatus = async () => {
    setIsChecking(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/whatsapp/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsConnected(response.data.configured);
    } catch (error: any) {
      console.error('Failed to check WhatsApp status:', error);
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleTestMessage = async () => {
    if (!testPhoneNumber) {
      toast.error('Please enter a phone number to test');
      return;
    }

    setIsTesting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/whatsapp/test`,
        { phoneNumber: testPhoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Test message sent successfully! Check your WhatsApp.');
        setIsConnected(true);
      } else {
        toast.error(response.data.error || 'Failed to send test message');
      }
    } catch (error: any) {
      console.error('Failed to send test message:', error);
      toast.error(error.response?.data?.error || 'Failed to send test message');
    } finally {
      setIsTesting(false);
    }
  };

  // Show full-page loader while checking WhatsApp status
  if (showLoading) {
    return <LoadingOverlay message="Checking WhatsApp status..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">WhatsApp Setup</h1>
        <p className="text-gray-600">Configure WhatsApp Business API for notifications</p>
      </div>

      {/* Status Card */}
      <div className={`border rounded-lg p-6 ${isConnected ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700' : 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700'}`}>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">WhatsApp Connected</h3>
                <p className="text-sm text-green-700 dark:text-green-300">Your WhatsApp Business account is active</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">WhatsApp Not Connected</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Configure your WhatsApp Business API to enable notifications</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Configuration Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
        <h2 className="text-xl font-semibold mb-6 dark:text-white">WhatsApp Business API Configuration</h2>

        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Current Configuration</h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Phone Number ID:</strong> {isConnected ? '852483691285659' : 'Not configured'}</p>
              <p><strong>Business Account ID:</strong> {isConnected ? '1554902325693975' : 'Not configured'}</p>
              <p><strong>Status:</strong> {isChecking ? 'Checking...' : isConnected ? '✅ Connected' : '❌ Not Connected'}</p>
            </div>
          </div>

          <div className="border-t dark:border-gray-700 pt-6">
            <h3 className="font-semibold mb-4 dark:text-white">Test WhatsApp Connection</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Send a test message to verify your WhatsApp Business API is working correctly.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                  Test Phone Number
                </label>
                <input
                  type="tel"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="+27712919486"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Include country code (e.g., +27 for South Africa)
                </p>
              </div>

              <button
                onClick={handleTestMessage}
                disabled={isTesting || !testPhoneNumber}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                {isTesting ? 'Sending...' : 'Send Test Message'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      {isConnected && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-6 dark:text-white">Notification Settings</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <div>
                <p className="font-medium dark:text-white">New Ticket Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Send WhatsApp message when a new ticket is created</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <div>
                <p className="font-medium dark:text-white">Ticket Assignment Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notify users when they're assigned to a ticket</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <div>
                <p className="font-medium dark:text-white">Comment Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Alert users when someone comments on their ticket</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5" />
              <div>
                <p className="font-medium dark:text-white">Status Change Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Notify when ticket status changes</p>
              </div>
            </label>
          </div>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 italic">
            Note: These notification settings will be functional once WhatsApp integration is fully configured in your backend.
          </p>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>Create a WhatsApp Business account at business.whatsapp.com</li>
          <li>Get your API credentials from the WhatsApp Business dashboard</li>
          <li>Enter your phone number and API key above</li>
          <li>Configure webhook URL for receiving messages (optional)</li>
          <li>Test the connection by sending a test message</li>
          <li>Enable notification types you want to use</li>
        </ol>
      </div>
    </div>
  );
}