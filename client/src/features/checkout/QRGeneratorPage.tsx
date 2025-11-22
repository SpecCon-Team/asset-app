import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Download, Package, CheckCircle } from 'lucide-react';
import { getApiClient } from '../assets/lib/apiClient';
import { showSuccess, showError } from '@/lib/sweetalert';

interface Asset {
  id: string;
  name: string;
  asset_code: string;
  asset_type: string;
}

interface QRCodeData {
  id: string;
  qrCode: string;
  qrCodeUrl: string;
  asset: {
    name: string;
    asset_code: string;
  };
  generatedAt: string;
  scanCount: number;
}

export default function QRGeneratorPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [generatedQR, setGeneratedQR] = useState<QRCodeData | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const apiClient = getApiClient();
      const response = await apiClient.get('/assets');
      const assetsList = Array.isArray(response.data) ? response.data : (response.data.assets || []);
      setAssets(assetsList);
    } catch (error) {
      console.error('Failed to fetch assets:', error);
      await showError('Error', 'Failed to load assets');
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) {
      await showError('Error', 'Please select an asset');
      return;
    }

    try {
      setLoading(true);
      const apiClient = getApiClient();
      const response = await apiClient.post('/checkout/qr/generate', {
        assetId: selectedAssetId
      });

      setGeneratedQR(response.data.qrCode);
      await showSuccess('Success!', 'QR code generated successfully', 1500);
    } catch (error: any) {
      console.error('Failed to generate QR code:', error);
      await showError('Error', error.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!generatedQR) return;

    const link = document.createElement('a');
    link.href = generatedQR.qrCodeUrl;
    link.download = `QR_${generatedQR.asset.asset_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showSuccess('Downloaded!', 'QR code image downloaded', 1500);
  };

  const handlePrint = () => {
    if (!generatedQR) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${generatedQR.asset.asset_code}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                font-family: Arial, sans-serif;
                padding: 20px;
              }
              .qr-container {
                text-align: center;
                page-break-inside: avoid;
              }
              img {
                max-width: 300px;
                height: auto;
                border: 2px solid #000;
                padding: 10px;
                background: white;
              }
              h2 {
                margin: 20px 0 10px;
                font-size: 24px;
              }
              p {
                margin: 5px 0;
                font-size: 16px;
                color: #666;
              }
              .code {
                font-family: 'Courier New', monospace;
                font-weight: bold;
                font-size: 18px;
                margin-top: 10px;
              }
              @media print {
                body {
                  print-color-adjust: exact;
                  -webkit-print-color-adjust: exact;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <img src="${generatedQR.qrCodeUrl}" alt="QR Code" />
              <h2>${generatedQR.asset.name}</h2>
              <p class="code">${generatedQR.asset.asset_code}</p>
              <p>Scan to view asset details or checkout</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleReset = () => {
    setSelectedAssetId('');
    setGeneratedQR(null);
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
          QR Code Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Generate QR codes for quick asset scanning and checkout
        </p>
      </div>

      <div className="max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Select Asset
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asset <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                  className="w-full px-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select an asset</option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.asset_code}) - {asset.asset_type}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || !selectedAssetId}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5" />
                    Generate QR Code
                  </>
                )}
              </button>
            </form>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2">
                How QR Codes Work
              </h3>
              <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-300">
                <li>• Each asset gets a unique QR code</li>
                <li>• QR codes contain asset identification data</li>
                <li>• Scan to quickly view asset details</li>
                <li>• Use for fast checkout operations</li>
                <li>• Print and attach to physical assets</li>
              </ul>
            </div>
          </div>

          {/* Generated QR Code Display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {generatedQR ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    QR Code Generated!
                  </h2>
                </div>

                {/* QR Code Image */}
                <div className="flex justify-center p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
                  <img
                    src={generatedQR.qrCodeUrl}
                    alt="QR Code"
                    className="w-64 h-64 border-4 border-white dark:border-gray-700 rounded-lg shadow-lg"
                  />
                </div>

                {/* Asset Info */}
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Asset Name</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {generatedQR.asset.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Asset Code</p>
                    <p className="text-gray-900 dark:text-white font-mono">
                      {generatedQR.asset.asset_code}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">QR Code Data</p>
                    <p className="text-xs text-gray-900 dark:text-white font-mono break-all bg-gray-100 dark:bg-gray-900 p-2 rounded">
                      {generatedQR.qrCode}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Generated</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(generatedQR.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Scans</p>
                    <p className="text-gray-900 dark:text-white">{generatedQR.scanCount}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download QR Code
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Package className="w-5 h-5" />
                    Print QR Code
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Generate Another
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <QrCode className="w-24 h-24 text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">No QR code generated yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Select an asset and click "Generate QR Code" to create
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Batch Generation Info */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-400 mb-2 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Bulk QR Code Generation
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            Need to generate QR codes for multiple assets at once? Contact your administrator
            to enable bulk generation or use the API endpoint for batch operations.
          </p>
        </div>
      </div>
    </div>
  );
}
