import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, QrCode, Package, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError } from '@/lib/sweetalert';
import { QRCodeSVG } from 'qrcode.react';

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
  const [searchParams] = useSearchParams();
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedAsset, setScannedAsset] = useState<ScannedAsset | null>(null);

  // Auto-fill QR code from URL parameter if present (when scanned from phone)
  useEffect(() => {
    const qrParam = searchParams.get('qr');
    if (qrParam) {
      console.log('📱 QR code detected from URL:', qrParam);
      setQrInput(qrParam);
      handleAutoScan(qrParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleAutoScan = async (qrData: string) => {
    if (!qrData.trim()) return;

    try {
      setScanning(true);
      console.log('🔍 Attempting to scan QR code:', qrData.trim());
      
      const apiClient = getApiClient();
      const response = await apiClient.post('/checkout/qr/scan', {
        qrCode: qrData.trim()
      });

      console.log('✅ QR code scanned successfully:', response.data);
      console.log('📦 Asset data:', response.data.asset);
      
      // Ensure we have the asset data
      if (response.data && response.data.asset) {
        setScannedAsset(response.data.asset);
        await showSuccess('Success!', 'QR code scanned successfully', 1500);
      } else {
        console.error('❌ No asset data in response:', response.data);
        await showError('Error', 'Asset data not found in response');
        setScannedAsset(null);
      }
    } catch (error: any) {
      console.error('❌ Failed to scan QR code:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        error: error.response?.data?.error
      });
      
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        await showError(
          'Authentication Required', 
          'Please log in to scan QR codes. The QR code data has been saved - log in and try again.',
          3000
        );
        // Keep the QR code in the input field so user can try again after logging in
      } else if (error.response?.status === 404) {
        await showError(
          'QR Code Not Found', 
          'This QR code is not registered in the system. Please generate a valid QR code for an asset.',
          3000
        );
      } else {
        await showError(
          'Error', 
          error.response?.data?.message || error.response?.data?.error || 'Failed to scan QR code. Please try again.',
          3000
        );
      }
      setScannedAsset(null);
    } finally {
      setScanning(false);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      await showError('Error', 'Please enter a QR code');
      return;
    }

    await handleAutoScan(qrInput.trim());
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
          Scan QR codes with your phone camera or enter manually
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        {/* Phone Scanner Instructions */}
        {!scannedAsset && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg shadow p-8 mb-6 border border-purple-200 dark:border-purple-800">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-purple-600 dark:bg-purple-500 rounded-full flex items-center justify-center">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Scan QR Code with Your Phone
                </h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  The easiest way to scan QR codes is using your phone's camera. When you scan an asset QR code, 
                  it will automatically open this web app and process the scan!
                </p>
                
                {/* QR Code Display Box */}
                <div className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-purple-300 dark:border-purple-700 shadow-lg">
                  <div className="text-center mb-4">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Test QR Code
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Scan this QR code with your phone camera to test
                    </p>
                  </div>
                  <div className="flex justify-center p-4 bg-white dark:bg-gray-900 rounded-lg">
                    <div className="bg-white p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-inner">
                      <QRCodeSVG
                        value={`${window.location.origin}${window.location.pathname}#/checkout/scan?qr=ASSET:TEST001:test-asset-id`}
                        size={200}
                        level="H"
                        includeMargin={true}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-800 dark:text-red-300 font-semibold mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Test QR Code - For Demonstration Only
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 mb-3">
                      This test QR code will open this page when scanned, but it will show an error because it's not a real asset in the database.
                    </p>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-red-300 dark:border-red-700">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
                        ✅ To test with a real asset:
                      </p>
                      <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                        <li>Go to <span className="font-mono text-purple-600 dark:text-purple-400">/checkout/qr/generate</span></li>
                        <li>Select a real asset from your database</li>
                        <li>Click "Generate QR Code"</li>
                        <li>Scan that QR code with your phone</li>
                        <li>It will automatically show the asset details!</li>
                      </ol>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Open your phone's camera app</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Use the built-in camera app (not a third-party scanner)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Point at the QR code</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Position the QR code in the camera viewfinder</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Tap the notification</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">When your phone detects the QR code, tap the notification to open the web app</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Automatic processing</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">The web app will automatically detect and process the QR code!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Entry Section */}
        {!scannedAsset && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Or Enter QR Code Manually
            </h2>
            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter QR Code Data
                </label>
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  placeholder="ASSET:CODE:ID or paste QR code data..."
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
                    <QrCode className="w-5 h-5" />
                    Scan QR Code
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Loading State */}
        {scanning && !scannedAsset && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-6">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Scanning QR code...</p>
            </div>
          </div>
        )}

        {/* Scanned Asset Details */}
        {scannedAsset && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-fade-in mb-6 border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Asset Found!</h2>
            </div>

            <div className="flex gap-4 mb-6">
              {scannedAsset.image_url ? (
                <img
                  src={scannedAsset.image_url}
                  alt={scannedAsset.name || 'Asset'}
                  className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                  <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {scannedAsset.name || 'Unknown Asset'}
                </h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Code: {scannedAsset.asset_code || 'N/A'}</span>
                  </p>
                  <p>Type: {scannedAsset.asset_type || 'N/A'}</p>
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
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                <p>Asset ID: {scannedAsset.id}</p>
                <p>Status: {scannedAsset.checkoutStatus}</p>
              </div>
            )}

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
            <Smartphone className="w-5 h-5" />
            How QR Codes Work
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li className="flex items-start gap-2">
              <span className="font-semibold">1.</span>
              <span>QR codes contain a URL that points to this scanner page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span>When you scan with your phone camera, it detects the URL</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span>Your phone opens the web app automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <span>The QR code data is extracted and processed automatically</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">5.</span>
              <span>Or manually enter/paste the QR code data in the input field above</span>
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
