import React, { useState, useEffect } from 'react';
import { Download, Trash2, Shield, AlertTriangle, FileText, Database, Clock } from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import Swal from 'sweetalert2';
import LoadingSpinner from '@/components/LoadingSpinner';

interface RetentionSummary {
  accountCreated: string;
  accountAgeDays: number;
  dataCategories: any;
  recommendations: any;
}

export default function PrivacyDashboard() {
  const [retentionSummary, setRetentionSummary] = useState<RetentionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchRetentionSummary();
  }, []);

  const fetchRetentionSummary = async () => {
    try {
      const response = await getApiClient().get('/gdpr/retention-summary');
      setRetentionSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch retention summary:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load privacy data',
        icon: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);

      const response = await getApiClient().get('/gdpr/export', {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-export-${Date.now()}.json`;
      link.click();
      window.URL.revokeObjectURL(url);

      Swal.fire({
        title: 'Success!',
        text: 'Your data has been exported successfully',
        icon: 'success',
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to export your data',
        icon: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewPrivacyReport = async () => {
    try {
      const response = await getApiClient().get('/gdpr/privacy-report');
      const report = response.data;

      Swal.fire({
        title: 'Privacy Report',
        html: `
          <div class="text-left">
            <h3 class="font-semibold mb-2">Data Processing</h3>
            <p class="text-sm mb-2"><strong>Purposes:</strong></p>
            <ul class="text-sm list-disc pl-5 mb-4">
              ${report.dataProcessing.purposes.map((p: string) => `<li>${p}</li>`).join('')}
            </ul>

            <p class="text-sm mb-2"><strong>Legal Basis:</strong> ${report.dataProcessing.legalBasis}</p>
            <p class="text-sm mb-4"><strong>Retention:</strong> ${report.dataProcessing.dataRetention}</p>

            <h3 class="font-semibold mb-2">Your Rights</h3>
            <ul class="text-sm list-disc pl-5 mb-4">
              <li>${report.yourRights.rightToAccess}</li>
              <li>${report.yourRights.rightToRectification}</li>
              <li>${report.yourRights.rightToErasure}</li>
              <li>${report.yourRights.rightToDataPortability}</li>
            </ul>

            <h3 class="font-semibold mb-2">Security</h3>
            <ul class="text-sm list-disc pl-5">
              <li>${report.security.encryption}</li>
              <li>Two-Factor Auth: ${report.security.twoFactorAuth}</li>
              <li>Access Control: ${report.security.accessControl}</li>
            </ul>
          </div>
        `,
        width: '600px',
        confirmButtonText: 'Close',
      });
    } catch (error) {
      console.error('Privacy report error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to generate privacy report',
        icon: 'error',
      });
    }
  };

  const handleAnonymizeAccount = async () => {
    const result = await Swal.fire({
      title: 'Anonymize Your Account?',
      html: `
        <div class="text-left mb-4">
          <p class="mb-2"><strong>This action will:</strong></p>
          <ul class="list-disc pl-5 text-sm mb-4">
            <li>Remove your email, name, phone, and profile picture</li>
            <li>Replace them with anonymized values</li>
            <li>Disable your account for login</li>
            <li>Keep your tickets and comments for business records</li>
          </ul>
          <p class="text-red-600 font-semibold">⚠️ This action cannot be undone!</p>
        </div>
      `,
      input: 'password',
      inputLabel: 'Enter your password to confirm',
      inputPlaceholder: 'Password',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Anonymize My Account',
      cancelButtonText: 'Cancel',
      preConfirm: async (password) => {
        if (!password) {
          Swal.showValidationMessage('Password is required');
          return false;
        }

        try {
          await getApiClient().post('/gdpr/anonymize', {
            password,
            confirmation: 'I understand this action cannot be undone',
          });
          return true;
        } catch (error: any) {
          Swal.showValidationMessage(error.response?.data?.message || 'Failed to anonymize account');
          return false;
        }
      },
    });

    if (result.isConfirmed) {
      Swal.fire({
        title: 'Account Anonymized',
        text: 'Your account has been anonymized. You will be logged out now.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
      }).then(() => {
        // Log out user
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login';
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-5 h-5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-5 h-5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <span className="sr-only">Loading privacy dashboard</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy & Data Management
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your personal data, privacy settings, and exercise your GDPR rights
        </p>
      </div>

      {/* Account Summary */}
      {retentionSummary && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Data Summary
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Account Age</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {retentionSummary.accountAgeDays} days
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Tickets Created</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {retentionSummary.dataCategories?.activityData?.ticketsCreated || 0}
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <Database className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Assets Owned</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {retentionSummary.dataCategories?.assetData?.assetsOwned || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Export Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Export Your Data
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Download a complete copy of your personal data in JSON format. This includes your profile,
            tickets, comments, and activity history.
          </p>
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="sr-only">Exporting</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Export Data (JSON)</span>
              </>
            )}
          </button>
        </div>

        {/* Privacy Report */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Privacy Report
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            View detailed information about how your data is processed, stored, and protected.
            Learn about your privacy rights.
          </p>
          <button
            onClick={handleViewPrivacyReport}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            <span>View Privacy Report</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-300">
            Danger Zone
          </h3>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-red-900 dark:text-red-300 mb-2">
            Anonymize Your Account
          </h4>
          <p className="text-sm text-red-800 dark:text-red-400 mb-4">
            This will remove all your personal information (name, email, phone) and replace them with
            anonymized values. Your tickets and comments will remain for business records, but will
            show as "Deleted User". This action is permanent and cannot be undone.
          </p>
          <button
            onClick={handleAnonymizeAccount}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            <span>Anonymize My Account</span>
          </button>
        </div>

        <div className="bg-red-100 dark:bg-red-900/40 rounded-lg p-4 mt-4">
          <p className="text-xs text-red-800 dark:text-red-300">
            <strong>Note:</strong> Account anonymization complies with GDPR Article 17 (Right to Erasure).
            Your activity records are retained for legal and business purposes but cannot be linked back to you.
          </p>
        </div>
      </div>

      {/* GDPR Information */}
      <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          Your Privacy Rights Under GDPR
        </h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
            <span><strong>Right to Access:</strong> You can export your data anytime</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
            <span><strong>Right to Rectification:</strong> You can update your profile information</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
            <span><strong>Right to Erasure:</strong> You can request account anonymization</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
            <span><strong>Right to Data Portability:</strong> Download your data in a machine-readable format</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
            <span><strong>Right to Object:</strong> Contact your administrator to object to data processing</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
