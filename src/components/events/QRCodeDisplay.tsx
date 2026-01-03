import React, { useState } from 'react';
import { QrCode, Download, RotateCw, Copy, Printer, CheckCircle } from 'lucide-react';
import { showToast } from '../../utils/toasts';

interface QRCodeDisplayProps {
  qrCodeUrl: string;
  eventTitle: string;
  eventId: string;
  qrData: string;
  qrUrl: string;
  onRegenerate?: () => void;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  qrCodeUrl,
  eventTitle,
  eventId,
  qrData,
    qrUrl,
  onRegenerate
}) => {
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventTitle.replace(/\s+/g, '-')}-QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast.success('QR code downloaded successfully');
    } catch (error) {
      showToast.error('Failed to download QR code');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${eventTitle}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 20px;
                font-family: system-ui, -apple-system, sans-serif;
              }
              h1 {
                font-size: 24px;
                margin-bottom: 10px;
                text-align: center;
              }
              p {
                font-size: 14px;
                color: #666;
                margin-bottom: 30px;
                text-align: center;
              }
              img {
                max-width: 400px;
                width: 100%;
                height: auto;
              }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <h1>${eventTitle}</h1>
            <p>Scan this QR code to check in to the event</p>
            <img src="${qrCodeUrl}" alt="Event QR Code" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      showToast.success('Check-in link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showToast.error('Failed to copy link');
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    
    setRegenerating(true);
    try {
      await onRegenerate();
      showToast.success('QR code regenerated successfully');
    } catch (error) {
      showToast.error('Failed to regenerate QR code');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
          <QrCode className="w-5 h-5 mr-2" />
          Event QR Code
        </h3>
      </div>

      {/* QR Code Image */}
      <div className="flex justify-center mb-6">
        <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
          <img
            src={qrCodeUrl}
            alt="Event QR Code"
            className="w-64 h-64 object-contain"
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
          Attendees can scan this QR code to check in to the event
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Download
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print
        </button>

        {/* <button
          onClick={handleShare}
          className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Link
        </button> */}

        {onRegenerate && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCw className={`w-4 h-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
        )}
      </div>

      {/* Check-in URL */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Check-in URL
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            readOnly
            value={`${qrUrl}`}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400"
          />
          <button
            onClick={handleCopyUrl}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Copy URL"
          >
            {copied ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;