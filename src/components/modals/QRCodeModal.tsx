import React, { useEffect, useRef } from 'react';
import { X, Download, Copy, Loader } from 'lucide-react';
import { showToast } from '../../utils/toasts';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCodeData: {
        title: string;
        qrImage: string; // Base64 or URL
        link: string;
    } | null;
    isLoading?: boolean;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({
    isOpen,
    onClose,
    qrCodeData,
    isLoading = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    if (!isOpen || !qrCodeData) return null;

    const handleDownload = () => {
        if (!canvasRef.current) return;

        const link = document.createElement('a');
        link.href = canvasRef.current.toDataURL('image/png');
        link.download = `${qrCodeData.title}-qr-${Date.now()}.png`;
        link.click();
        showToast.success('QR code downloaded!');
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(qrCodeData.link);
        showToast.success('Link copied to clipboard!');
    };

    const handleCopyQR = () => {
        if (!canvasRef.current) return;

        canvasRef.current.toBlob((blob) => {
            if (!blob) return;

            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]);
            showToast.success('QR code copied to clipboard!');
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {qrCodeData.title} QR Code
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader className="w-8 h-8 animate-spin text-primary-600" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* QR Code Image */}
                                <div className="flex justify-center">
                                    <img
                                        ref={canvasRef as any}
                                        src={qrCodeData.qrImage}
                                        alt={`${qrCodeData.title} QR Code`}
                                        className="w-full max-w-xs h-auto border-4 border-gray-200 dark:border-gray-700 rounded-lg"
                                    />
                                </div>

                                {/* Link Display */}
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Link:</p>
                                    <div className="flex items-center gap-2 break-all text-sm text-gray-900 dark:text-gray-100 font-mono">
                                        <span className="flex-1 truncate">{qrCodeData.link}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={handleCopyLink}
                                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>Copy Link</span>
                                    </button>

                                    <button
                                        onClick={handleCopyQR}
                                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors font-medium text-sm"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span>Copy QR</span>
                                    </button>
                                </div>

                                {/* Download Button */}
                                <button
                                    onClick={handleDownload}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                                >
                                    <Download className="w-5 h-5" />
                                    <span>Download QR Code</span>
                                </button>

                                {/* Info Text */}
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    Share the link or QR code with your partners. They can scan to register or make payments.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default QRCodeModal;
