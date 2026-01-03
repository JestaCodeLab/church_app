import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

/**
 * Offline Banner Component
 *
 * Displays a fixed banner at the top of the page when internet connection is lost.
 * Automatically disappears when connection is restored.
 */
const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();

  // Only render when offline
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center gap-3">
          <WifiOff className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm sm:text-base font-medium">
            No internet connection. Please check your network and try again.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;
