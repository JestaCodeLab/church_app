import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, LogOut, RefreshCw } from 'lucide-react';
import '../../index.css';

interface SessionExpiryModalProps {
  isOpen: boolean;
  timeRemaining: number; // in seconds
  onStayLoggedIn: () => void;
  onSignOut: () => void;
  loading?: boolean;
}

const SessionExpiryModal: React.FC<SessionExpiryModalProps> = ({
  isOpen,
  timeRemaining,
  onStayLoggedIn,
  onSignOut,
  loading = false,
}) => {
  const [countdown, setCountdown] = useState(timeRemaining);

  useEffect(() => {
    setCountdown(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine urgency level for styling
  const getUrgencyClass = () => {
    if (countdown < 60) return 'text-red-600 dark:text-red-400'; // Less than 1 minute
    if (countdown < 180) return 'text-orange-600 dark:text-orange-400'; // Less than 3 minutes
    return 'text-yellow-600 dark:text-yellow-400'; // 3-5 minutes
  };

  const getProgressPercentage = () => {
    const maxTime = 5 * 60; // 5 minutes in seconds
    return (countdown / maxTime) * 100;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm z-[9998] transition-opacity" />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="modal-fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border-2 border-yellow-500 dark:border-blue-600 overflow-hidden animate-pulse-slow">
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-blue-600 dark:to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white bg-opacity-20 p-4 rounded-full">
                <AlertTriangle className="w-10 h-10" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center">Session Expiring Soon</h2>
            <p className="text-center text-yellow-100 mt-2 text-sm">
              Your session is about to expire due to inactivity
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Countdown Timer */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Clock className={`w-8 h-8 mr-3 ${getUrgencyClass()}`} />
                <div className={`text-6xl font-bold ${getUrgencyClass()}`}>
                  {formatTime(countdown)}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Time remaining until automatic logout
              </p>

              {/* Progress Bar */}
              <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ease-linear ${
                    countdown < 60
                      ? 'bg-red-500'
                      : countdown < 180
                      ? 'bg-orange-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${getProgressPercentage()}%` }}
                />
              </div>
            </div>

            

            {/* Action Buttons */}
            <div className="flex justify-center gap-2">
              <button
                onClick={onStayLoggedIn}
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Extending Session...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Stay Logged In
                  </>
                )}
              </button>

              <button
                onClick={onSignOut}
                disabled={loading}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </button>
            </div>

            {/* Auto-logout notice */}
            {countdown < 60 && (
              <div className="mt-4 text-center">
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold animate-pulse">
                  ⚠️ You will be automatically logged out in {countdown} seconds
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionExpiryModal;