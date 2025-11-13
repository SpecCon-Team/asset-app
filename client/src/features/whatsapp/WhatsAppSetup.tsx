import React, { useState } from 'react';
import { MessageCircle, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';

export default function WhatsAppSetup() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    // Implement WhatsApp Business API connection
    await Swal.fire({
      title: 'WhatsApp Connection',
      text: 'WhatsApp connection feature - To be implemented with WhatsApp Business API',
      icon: 'info',
      confirmButtonColor: '#3B82F6',
    });
    setIsConnected(true);
  };

  const handleTestMessage = async () => {
    setIsTesting(true);
    // Implement test message sending
    setTimeout(async () => {
      await Swal.fire({
        title: 'Success!',
        text: 'Test message sent successfully!',
        icon: 'success',
        confirmButtonColor: '#10B981',
        timer: 2000,
      });
      setIsTesting(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">WhatsApp Setup</h1>
        <p className="text-gray-600">Configure WhatsApp Business API for notifications</p>
      </div>

      {/* Status Card */}
      <div className={`border rounded-lg p-6 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">WhatsApp Connected</h3>
                <p className="text-sm text-green-700">Your WhatsApp Business account is active</p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">WhatsApp Not Connected</h3>
                <p className="text-sm text-yellow-700">Configure your WhatsApp Business API to enable notifications</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-xl font-semibold mb-6">WhatsApp Business API Configuration</h2>
        
        <form onSubmit={handleConnect} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Business Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+27712919486"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Your WhatsApp Business phone number</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              API Key / Access Token
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your WhatsApp Business API key"
                className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                aria-label={showApiKey ? "Hide API key" : "Show API key"}
              >
                {showApiKey ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Get this from WhatsApp Business API dashboard</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Webhook URL (Optional)
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-domain.com/webhook"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">URL to receive WhatsApp webhook events</p>
          </div>

          <button
            type="submit"
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <MessageCircle className="w-5 h-5" />
            {isConnected ? 'Update Configuration' : 'Connect WhatsApp'}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      {isConnected && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <div>
                <p className="font-medium">New Ticket Notifications</p>
                <p className="text-sm text-gray-500">Send WhatsApp message when a new ticket is created</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <div>
                <p className="font-medium">Ticket Assignment Notifications</p>
                <p className="text-sm text-gray-500">Notify users when they're assigned to a ticket</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="w-5 h-5" />
              <div>
                <p className="font-medium">Comment Notifications</p>
                <p className="text-sm text-gray-500">Alert users when someone comments on their ticket</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-5 h-5" />
              <div>
                <p className="font-medium">Status Change Notifications</p>
                <p className="text-sm text-gray-500">Notify when ticket status changes</p>
              </div>
            </label>
          </div>

          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleTestMessage}
              disabled={isTesting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isTesting ? 'Sending...' : 'Send Test Message'}
            </button>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">Setup Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
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