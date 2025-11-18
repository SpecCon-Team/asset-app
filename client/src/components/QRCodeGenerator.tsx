import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import toast from 'react-hot-toast';

interface QRCodeGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  assetCode: string;
  assetName: string;
  assetId: string;
}

export default function QRCodeGenerator({
  isOpen,
  onClose,
  assetCode,
  assetName,
  assetId,
}: QRCodeGeneratorProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate URL that points to asset details
  const assetUrl = `${window.location.origin}/assets/${assetId}`;

  const handleDownloadPNG = () => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) return;

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size (larger for better quality)
      const size = 512;
      canvas.width = size;
      canvas.height = size;

      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, size, size);

        // Draw QR code
        ctx.drawImage(img, 0, 0, size, size);

        // Convert to PNG and download
        canvas.toBlob((blob) => {
          if (blob) {
            const link = document.createElement('a');
            link.download = `QR_${assetCode}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            toast.success('QR Code downloaded!');
          }
        }, 'image/png');

        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleDownloadSVG = () => {
    try {
      const svg = qrRef.current?.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.download = `QR_${assetCode}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('QR Code SVG downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handlePrint = () => {
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to print');
        return;
      }

      const svg = qrRef.current?.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${assetCode}</title>
            <style>
              body {
                margin: 0;
                padding: 20px;
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              .qr-container {
                text-align: center;
                page-break-inside: avoid;
              }
              .qr-code {
                margin: 20px auto;
                width: 300px;
                height: 300px;
              }
              h1 {
                font-size: 24px;
                margin-bottom: 10px;
              }
              p {
                font-size: 16px;
                color: #666;
                margin: 5px 0;
              }
              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h1>${assetName}</h1>
              <p><strong>Asset Code:</strong> ${assetCode}</p>
              <div class="qr-code">${svgData}</div>
              <p style="font-size: 12px; margin-top: 20px;">Scan to view asset details</p>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);

      toast.success('Opening print dialog...');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print QR code');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asset QR Code" size="md">
      <div className="space-y-6">
        {/* QR Code Display */}
        <div ref={qrRef} className="flex flex-col items-center">
          <div className="bg-white p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700">
            <QRCodeSVG
              value={assetUrl}
              size={256}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: '',
                height: 0,
                width: 0,
                excavate: true,
              }}
            />
          </div>

          {/* Asset Info */}
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {assetName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Code:</span> {assetCode}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Scan to view asset details
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDownloadPNG}
            className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handleDownloadSVG}
            className="flex-1 px-4 py-2.5 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download SVG</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 px-4 py-2.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to use:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Download PNG for digital use or printing</li>
            <li>Download SVG for scalable vector graphics</li>
            <li>Print directly to attach to physical asset</li>
            <li>Scan with any QR code scanner app</li>
            <li>Link opens asset details page automatically</li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
