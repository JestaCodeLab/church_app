import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

/**
 * Offline Banner Component
 *
 * Displays a fixed banner at the top of the page when internet connection is lost (red).
 * Shows green banner when connection is restored and slides away automatically.
 * Automatically disappears when connection is restored.
 */
const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();
  const [isVisible, setIsVisible] = useState(!isOnline);
  const [shouldRender, setShouldRender] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      // Going offline - show red banner
      setIsVisible(true);
      setShouldRender(true);
    } else if (isOnline && shouldRender) {
      // Going online - show green banner and slide away
      setIsVisible(true);
      // Slide away after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setShouldRender(false), 300); // Wait for animation to complete
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const isOffline = !isOnline;
  const bgColor = isOffline ? 'bg-red-600' : 'bg-green-600';
  const icon = isOffline ? (
    <WifiOff className="h-5 w-5 flex-shrink-0 animate-pulse" />
  ) : (
    <Wifi className="h-5 w-5 flex-shrink-0 animate-pulse" />
  );
  const message = isOffline 
    ? 'No internet connection. Please check your network and try again.'
    : 'Connection restored! You are back online.';

  return (
    <div
      className={`
        fixed top-0 left-0 right-0 z-50 
        ${bgColor} text-white
        transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-center gap-3">
          {icon}
          <p className="text-sm sm:text-base font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineBanner;
