import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Camera, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError } from '@/lib/sweetalert';

interface ScannedAsset {
  id: string;
  name: string;
  asset_code: string;
  asset_type: string;
  checkoutStatus: string;
  currentHolderId?: string;
  image_url?: string;
}

export default function QRScannerPage() {
  const navigate = useNavigate();
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<ScannedAsset | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      await showError('Error', 'Please enter a QR code');
      return;
    }

    try {
      setScanning(true);
      const apiClient = getApiClient();
      const response = await apiClient.post('/checkout/qr/scan', {
        qrCode: qrInput.trim()
      });

      setScannedAsset(response.data.asset);
      await showSuccess('Success!', 'QR code scanned successfully', 1500);
    } catch (error: any) {
      console.error('Failed to scan QR code:', error);
      await showError('Error', error.response?.data?.message || 'Failed to scan QR code');
      setScannedAsset(null);
    } finally {
      setScanning(false);
    }
  };

  const handleCheckout = () => {
    if (scannedAsset) {
      navigate('/checkout/new', { state: { assetId: scannedAsset.id } });
    }
  };

  const handleViewAsset = () => {
    if (scannedAsset) {
      navigate(`/assets/${scannedAsset.id}`);
    }
  };

  const handleReset = () => {
    setQrInput('');
    setScannedAsset(null);
  };

  return (
    <div className="flex flex-col p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/checkout')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Checkouts
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <QrCode className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          QR Code Scanner
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Scan asset QR codes for quick checkout or information
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        {/* Scanner Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-6">
          <div className="flex justify-center mb-6">
            <div className="w-48 h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center">
              <QrCode className="w-32 h-32 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter QR Code Data
              </label>
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="ASSET:CODE:ID or scan QR code..."
                className="w-full px-4 py-3 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 text-center text-lg font-mono"
                autoFocus
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                Format: ASSET:ASSET_CODE:ASSET_ID
              </p>
            </div>

            <button
              type="submit"
              disabled={scanning || !qrInput.trim()}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 text-lg"
            >
              {scanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  Scan QR Code
                </>
              )}
            </button>
          </form>
        </div>

        {/* Scanned Asset Details */}
        {scannedAsset && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Asset Found!</h2>
            </div>

            <div className="flex gap-4 mb-6">
              {scannedAsset.image_url && (
                <img
                  src={scannedAsset.image_url}
                  alt={scannedAsset.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {scannedAsset.name}
                </h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Code: {scannedAsset.asset_code}</span>
                  </p>
                  <p>Type: {scannedAsset.asset_type}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {scannedAsset.checkoutStatus === 'available' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Available
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Checked Out
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {scannedAsset.checkoutStatus === 'available' ? (
                <button
                  onClick={handleCheckout}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Check Out This Asset
                </button>
              ) : (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    This asset is currently checked out
                  </p>
                </div>
              )}

              <button
                onClick={handleViewAsset}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                View Asset Details
              </button>

              <button
                onClick={handleReset}
                className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                Scan Another Code
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-3 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            How to Use QR Scanner
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <span>Find the QR code sticker on the asset</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span>Use a QR code scanner app to scan the code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span>Copy the QR code data and paste it in the input field above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <span>Click "Scan QR Code" to view asset details</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">5.</span>
              <span>Proceed to checkout if the asset is available</span>
            </li>
          </ul>
        </div>

        {/* Generate QR Codes Link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/checkout/qr/generate')}
            className="text-purple-600 dark:text-purple-400 hover:underline text-sm font-medium"
          >
            Need to generate QR codes for your assets? Click here
          </button>
        </div>
      </div>
    </div>
  );
}
