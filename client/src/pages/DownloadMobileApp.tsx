import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Apple, PlayCircle, Tablet, QrCode } from 'lucide-react';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

export default function DownloadMobileApp() {
  const [isLoading, setIsLoading] = useState(true);
  const showLoading = useMinLoadingTime(isLoading, 2000);

  useEffect(() => {
    // Simulate initial load
    setIsLoading(false);
  }, []);

  if (showLoading) {
    return <LoadingOverlay message="Loading mobile app info..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6">
            <Smartphone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Download Our Mobile App
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Manage your assets and tickets on the go. Available for iOS and Android devices.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* iOS App */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
                <Apple className="w-10 h-10 text-white dark:text-gray-900" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">iOS App</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">For iPhone and iPad</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                iOS 14.0 or later
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Version 1.0.0
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Size: 45 MB
              </li>
            </ul>
            <button className="w-full px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors font-semibold">
              <Download className="w-5 h-5" />
              Download on App Store
            </button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              Coming soon to the App Store
            </p>
          </div>

          {/* Android App */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center">
                <PlayCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Android App</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">For Android devices</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Android 8.0 or later
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Version 1.0.0
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Size: 42 MB
              </li>
            </ul>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:from-green-600 hover:to-blue-600 flex items-center justify-center gap-2 transition-colors font-semibold">
              <Download className="w-5 h-5" />
              Get it on Google Play
            </button>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              Coming soon to Google Play
            </p>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">Scan to Download</h2>
              <p className="text-blue-100 mb-4">
                Use your phone's camera to scan the QR code and download the app directly.
              </p>
              <div className="flex items-center gap-3">
                <QrCode className="w-5 h-5" />
                <span className="text-sm">Works with both iOS and Android</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="w-40 h-40 bg-gray-200 flex items-center justify-center rounded">
                <QrCode className="w-20 h-20 text-gray-400" />
              </div>
              <p className="text-xs text-gray-600 text-center mt-2">QR Code</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Mobile App Features
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Scan Assets</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Quickly scan QR codes to view and update asset information
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Tablet className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Manage Tickets</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create, update, and track tickets from anywhere
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Offline Mode</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access your data even without internet connection
              </p>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            System Requirements
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Apple className="w-5 h-5" />
                iOS Requirements
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• iOS 14.0 or later</li>
                <li>• iPhone, iPad, or iPod touch</li>
                <li>• 100 MB free storage space</li>
                <li>• Internet connection recommended</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Android Requirements
              </h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• Android 8.0 (Oreo) or later</li>
                <li>• Any Android device</li>
                <li>• 100 MB free storage space</li>
                <li>• Internet connection recommended</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
