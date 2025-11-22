import React, { useState, useEffect } from 'react';
import { Shield, Check, Copy, Download, AlertTriangle, Smartphone } from 'lucide-react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showWarning, showCustom } from '@/lib/sweetalert';
import { LoadingOverlay, useMinLoadingTime } from '@/components/LoadingSpinner';

export default function TwoFactorSetupPage() {
  const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'complete'>('status');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const showLoading = useMinLoadingTime(isCheckingStatus, 2000);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [backupCodesRemaining, setBackupCodesRemaining] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const response = await getApiClient().get('/2fa/status');
      setTwoFactorEnabled(response.data.enabled);
      setBackupCodesRemaining(response.data.backupCodesRemaining);
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSetup = async () => {
    try {
      setIsLoading(true);
      const response = await getApiClient().post('/2fa/setup');
      setQrCode(response.data.qrCode);
      setSecret(response.data.secret);
      setBackupCodes(response.data.backupCodes);
      setStep('setup');
    } catch (error: any) {
      showError('Error', error.response?.data?.message || 'Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      showWarning('Invalid Code', 'Please enter a 6-digit code');
      return;
    }

    try {
      setIsLoading(true);
      await getApiClient().post('/2fa/verify-setup', { token: verificationCode });
      setStep('complete');
      setTwoFactorEnabled(true);
      showSuccess('Success!', '2FA has been enabled successfully');
    } catch (error: any) {
      showError('Verification Failed', error.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    const result = await showCustom({
      title: 'Disable 2FA?',
      text: 'Enter your 6-digit code to disable two-factor authentication',
      input: 'text',
      inputAttributes: {
        maxlength: '6',
        placeholder: '000000',
      },
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Disable 2FA',
      showLoaderOnConfirm: true,
      preConfirm: async (code: string) => {
        try {
          await getApiClient().post('/2fa/disable', { token: code });
          return true;
        } catch (error: any) {
          return error.response?.data?.message || 'Invalid code';
        }
      },
    });

    if (result.isConfirmed) {
      setTwoFactorEnabled(false);
      setStep('status');
      showSuccess('Disabled', '2FA has been disabled');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copied!', 'Copied to clipboard', 1500);
  };

  const downloadBackupCodes = () => {
    const text = `Two-Factor Authentication Backup Codes\n\nSave these codes in a safe place. Each code can only be used once.\n\n${backupCodes.join('\n')}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `2fa-backup-codes-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (showLoading) {
    return <LoadingOverlay message="Loading 2FA settings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Add an extra layer of security to your account
          </p>
        </div>

        {/* Status View */}
        {step === 'status' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            {twoFactorEnabled ? (
              <>
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                  2FA is Enabled
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                  Your account is protected with two-factor authentication
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Backup Codes Remaining:</strong> {backupCodesRemaining} / 10
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleDisable}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Disable 2FA
                  </button>
                  <button
                    onClick={() => navigate('/my-profile')}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
                  >
                    Back to Profile
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                  Secure Your Account
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                  Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                </p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-300">
                        <strong>Before you start:</strong> Make sure you have an authenticator app installed on your phone (Google Authenticator, Authy, Microsoft Authenticator, etc.)
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSetup}
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-5 h-5" />
                  {isLoading ? 'Setting up...' : 'Enable 2FA'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Setup View */}
        {step === 'setup' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Step 1: Scan QR Code
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Scan this QR code with your authenticator app
            </p>

            {/* QR Code */}
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-lg">
                <img src={qrCode} alt="2FA QR Code" className="w-64 h-64" />
              </div>
            </div>

            {/* Manual Entry */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Can't scan? Enter this code manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white dark:bg-gray-800 px-4 py-2 rounded text-sm font-mono">
                  {secret}
                </code>
                <button
                  onClick={() => copyToClipboard(secret)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setStep('verify')}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Next: Enter Verification Code
            </button>
          </div>
        )}

        {/* Verify View */}
        {step === 'verify' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Step 2: Verify Code
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Enter the 6-digit code from your authenticator app
            </p>

            <input
              type="text"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 border dark:border-gray-700 rounded-lg text-center text-2xl font-mono tracking-widest bg-white dark:bg-gray-900 text-gray-900 dark:text-white mb-6"
              autoFocus
            />

            <div className="flex gap-4">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        )}

        {/* Complete View */}
        {step === 'complete' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
              2FA Enabled Successfully!
            </h2>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold mb-2">
                    Save Your Backup Codes
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    Store these codes in a safe place. You can use them to access your account if you lose your phone.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 px-3 py-2 rounded text-center font-mono text-sm"
                  >
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={downloadBackupCodes}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Codes
              </button>
              <button
                onClick={() => navigate('/my-profile')}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
