import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, QrCode, Camera, Package, CheckCircle, AlertCircle, X, Maximize2 } from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError } from '@/lib/sweetalert';
import { Html5Qrcode } from 'html5-qrcode';

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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('Ready');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Auto-fill QR code from URL parameter if present (when scanned from phone)
  useEffect(() => {
    const qrParam = searchParams.get('qr');
    if (qrParam) {
      setQrInput(qrParam);
      handleAutoScan(qrParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleAutoScan = async (qrData: string) => {
    if (!qrData.trim()) return;

    try {
      setScanning(true);
      const apiClient = getApiClient();
      const response = await apiClient.post('/checkout/qr/scan', {
        qrCode: qrData.trim()
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

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) {
      await showError('Error', 'Please enter a QR code');
      return;
    }

    await handleAutoScan(qrInput.trim());
  };

  // Initialize scanner when camera becomes active and element is available
  useEffect(() => {
    if (!cameraActive) return;

    const initScanner = async () => {
      try {
        // Wait for DOM element to be available
        let element = document.getElementById('qr-reader');
        let attempts = 0;
        while (!element && attempts < 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          element = document.getElementById('qr-reader');
          attempts++;
        }

        if (!element) {
          throw new Error('Scanner container not found. Please try again.');
        }

        const scanner = new Html5Qrcode('qr-reader', {
          verbose: true // Enable verbose logging for debugging
        });

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' }, // Use back camera on mobile
          {
            fps: 30, // Increased to 30 for better real-time detection
            qrbox: function(viewfinderWidth, viewfinderHeight) {
              // Use 60% of the smaller dimension for better detection (not too large, not too small)
              const minEdgePercentage = 0.6;
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
              // Ensure minimum size of 200px and maximum of 300px for optimal detection
              const finalSize = Math.max(200, Math.min(300, qrboxSize));
              console.log('📐 QR Box size:', finalSize, 'from viewfinder:', viewfinderWidth, 'x', viewfinderHeight);
              return {
                width: finalSize,
                height: finalSize
              };
            },
            aspectRatio: 1.0,
            disableFlip: false,
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          },
          (decodedText, decodedResult) => {
            // Successfully scanned
            console.log('✅ QR Code detected:', decodedText);
            console.log('📊 Decoded result:', decodedResult);
            setScanStatus('QR Code Detected!');
            
            // Stop camera immediately after successful scan
            stopCameraScanner();
            
            // Extract QR data if it's a URL (works for both localhost and production)
            let qrData = decodedText;
            
            // Check if it's a URL with QR parameter (works for both http://localhost and https://production)
            if (decodedText.includes('/checkout/scan?qr=') || decodedText.includes('?qr=')) {
              try {
                // Handle both absolute URLs and relative URLs
                let url: URL;
                if (decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
                  url = new URL(decodedText);
                } else {
                  // Relative URL - construct full URL
                  url = new URL(decodedText, window.location.origin);
                }
                const qrParam = url.searchParams.get('qr');
                if (qrParam) {
                  qrData = qrParam;
                }
              } catch (error) {
                // If URL parsing fails, try manual extraction
                const match = decodedText.match(/[?&]qr=([^&]+)/);
                if (match && match[1]) {
                  qrData = decodeURIComponent(match[1]);
                }
              }
            } else if (decodedText.startsWith('ASSET:')) {
              // Direct QR data format
              qrData = decodedText;
            } else {
              // If it doesn't match expected formats, try using it as-is
              // Maybe it's a different QR code format or direct asset data
              qrData = decodedText;
              console.log('⚠️ QR code format not recognized, using as-is:', decodedText);
            }

            console.log('📦 Processing QR data:', qrData);
            setQrInput(qrData);
            handleAutoScan(qrData);
          },
          (errorMessage) => {
            // Log scanning errors for debugging (but don't show to user)
            // These are normal while scanning - only log occasionally to avoid spam
            if (Math.random() < 0.01) { // Log 1% of errors to avoid console spam
              console.debug('🔍 Scanning (this is normal):', errorMessage.substring(0, 50));
            }
          }
        );
        
        console.log('✅ Camera scanner started successfully');
        setScanStatus('Scanning... Point camera at QR code');
      } catch (error: any) {
        console.error('Camera error:', error);
        setCameraError(error.message || 'Failed to access camera');
        setCameraActive(false);
        
        if (error.message?.includes('Permission denied') || error.message?.includes('NotAllowedError')) {
          showError('Camera Permission', 'Please allow camera access to scan QR codes');
        } else if (error.message?.includes('NotFoundError') || error.message?.includes('No camera')) {
          showError('No Camera', 'No camera found on this device');
        } else {
          showError('Camera Error', 'Failed to start camera. Please try again or use manual entry.');
        }
      }
    };

    initScanner();

    // Cleanup on unmount or when cameraActive changes
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive]);

  const startCameraScanner = () => {
    setCameraError(null);
    setScanStatus('Initializing camera...');
    setCameraActive(true);
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setCameraError(null);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

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
    stopCameraScanner();
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
          Scan asset QR codes with your camera or enter manually
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        {/* Camera Scanner Section */}
        {!scannedAsset && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Camera Scanner
              </h2>
              {cameraActive && (
                <button
                  onClick={stopCameraScanner}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Stop Camera
                </button>
              )}
            </div>

            {!cameraActive ? (
              <div className="text-center py-8">
                <div className="w-48 h-48 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Camera className="w-32 h-32 text-purple-600 dark:text-purple-400" />
                </div>
                <button
                  onClick={startCameraScanner}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-lg mx-auto"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera Scanner
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Point your camera at a QR code to scan automatically
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                  <div
                    ref={scannerContainerRef}
                    id="qr-reader"
                    className="w-full h-full"
                  />
                </div>
                {cameraError && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-400">{cameraError}</p>
                  </div>
                )}
                {!cameraError && (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Position the QR code within the frame to scan automatically
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-purple-600 dark:text-purple-400">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span>{scanStatus}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Make sure the QR code is well-lit and fully visible in the frame
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual Entry Section */}
        {!scannedAsset && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
              <span>Click "Start Camera Scanner" to activate your device camera</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">2.</span>
              <span>Point your camera at the QR code on the asset</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">3.</span>
              <span>The QR code will be scanned automatically when detected</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold">4.</span>
              <span>Or manually enter/paste the QR code data in the input field</span>
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
