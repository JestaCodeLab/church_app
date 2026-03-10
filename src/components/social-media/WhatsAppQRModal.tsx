import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import { getSecureItem } from '../../utils/encryption';
import { messagingAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface WhatsAppQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
  branchId?: string;
}

type ConnectionStatus = 'connecting' | 'scanning' | 'connected' | 'error' | 'timeout';

const WhatsAppQRModal: React.FC<WhatsAppQRModalProps> = ({ isOpen, onClose, onConnected, branchId }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Use refs for callbacks to avoid re-triggering useEffect on every render
  const onConnectedRef = useRef(onConnected);
  const onCloseRef = useRef(onClose);
  onConnectedRef.current = onConnected;
  onCloseRef.current = onClose;

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const startConnection = useCallback(async () => {
    cleanup();
    setStatus('connecting');
    setQrCode(null);
    setErrorMessage('');

    try {
      const token = await getSecureItem('accessToken');
      if (!token) {
        setStatus('error');
        setErrorMessage('Authentication required. Please log in again.');
        return;
      }

      if (!branchId) {
        setStatus('error');
        setErrorMessage('Please select a branch first.');
        return;
      }

      // Start streaming QR codes (the stream endpoint handles initialization)
      const streamUrl = `${messagingAPI.whatsapp.getQRStreamUrl()}?token=${token}&branchId=${branchId}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.addEventListener('qr', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setQrCode(data.qr);
        setStatus('scanning');
      });

      es.addEventListener('connected', () => {
        setStatus('connected');
        toast.success('WhatsApp connected successfully!');
        setTimeout(() => {
          onConnectedRef.current();
          onCloseRef.current();
        }, 1500);
      });

      es.addEventListener('timeout', () => {
        setStatus('timeout');
        cleanup();
      });

      // Listen for server-sent error events (renamed to wa_error to avoid EventSource conflict)
      es.addEventListener('wa_error', (e: MessageEvent) => {
        if (e.data) {
          try {
            const data = JSON.parse(e.data);
            setErrorMessage(data.message || 'Connection failed');
          } catch {
            setErrorMessage('Connection failed');
          }
        } else {
          setErrorMessage('Connection failed');
        }
        setStatus('error');
        cleanup();
      });

      // Handle EventSource connection-level errors (network issues, server down)
      // Only close if the connection is fully dead (CLOSED state)
      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          setStatus((prev) => {
            if (prev === 'connecting' || prev === 'scanning') {
              setErrorMessage('Connection lost. Please try again.');
              return 'error';
            }
            return prev;
          });
          cleanup();
        }
        // If readyState is CONNECTING, EventSource is auto-reconnecting — let it
      };
    } catch (error) {
      setStatus('error');
      setErrorMessage('Failed to start connection');
    }
  }, [cleanup, branchId]);

  useEffect(() => {
    if (isOpen) {
      startConnection();
    } else {
      cleanup();
      setStatus('connecting');
      setQrCode(null);
      setErrorMessage('');
    }

    return cleanup;
  }, [isOpen, startConnection, cleanup]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <img src="/images/whatsapp-logo.webp" alt="WhatsApp" className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Connect WhatsApp
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          {/* Connecting */}
          {status === 'connecting' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-10 h-10 animate-spin text-green-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Generating QR code...
              </p>
            </div>
          )}

          {/* QR Code */}
          {status === 'scanning' && qrCode && (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-3 rounded-xl">
                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Scan this QR code with WhatsApp
                </p>
                <ol className="text-xs text-gray-500 dark:text-gray-400 text-left space-y-1">
                  <li>1. Open WhatsApp on your phone</li>
                  <li>2. Tap <span className="font-medium">Settings</span> &gt; <span className="font-medium">Linked Devices</span></li>
                  <li>3. Tap <span className="font-medium">Link a Device</span></li>
                  <li>4. Point your phone at this QR code</li>
                </ol>
              </div>
            </div>
          )}

          {/* Connected */}
          {status === 'connected' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                WhatsApp connected successfully!
              </p>
            </div>
          )}

          {/* Timeout */}
          {status === 'timeout' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="w-12 h-12 text-yellow-500" />
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                QR code expired. Please try again.
              </p>
              <button
                onClick={startConnection}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {errorMessage || 'Something went wrong'}
              </p>
              <button
                onClick={startConnection}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppQRModal;
