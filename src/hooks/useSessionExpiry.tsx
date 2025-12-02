import { useState, useEffect, useCallback, useRef } from 'react';

interface SessionExpiryConfig {
  warningTimeBeforeExpiry: number; // in milliseconds (default: 5 minutes)
  onWarning: () => void;
  onExpired: () => void;
}

interface SessionExpiryReturn {
  timeUntilExpiry: number; // in seconds
  isWarningActive: boolean;
  extendSession: () => Promise<void>;
}

/**
 * Hook to manage session expiry tracking and warnings
 * 
 * Features:
 * - Tracks JWT token expiration
 * - Triggers warning before expiry
 * - Handles auto-logout on expiration
 * - Provides session extension capability
 */
export const useSessionExpiry = (config: SessionExpiryConfig): SessionExpiryReturn => {
  const {
    warningTimeBeforeExpiry = 5 * 60 * 1000, // 5 minutes default
    onWarning,
    onExpired,
  } = config;

  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number>(0);
  const [isWarningActive, setIsWarningActive] = useState(false);
  const warningTriggeredRef = useRef(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Decode JWT token and extract expiration time
   */
  const getTokenExpiry = useCallback((): number | null => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      // JWT structure: header.payload.signature
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const decoded = JSON.parse(jsonPayload);
      return decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }, []);

  /**
   * Calculate time remaining until token expires
   */
  const calculateTimeRemaining = useCallback((): number => {
    const expiryTime = getTokenExpiry();
    if (!expiryTime) return 0;

    const now = Date.now();
    const remaining = expiryTime - now;
    return Math.max(0, Math.floor(remaining / 1000)); // Return in seconds
  }, [getTokenExpiry]);

  /**
   * Check if we should trigger warning
   */
  const checkAndTriggerWarning = useCallback(() => {
    const expiryTime = getTokenExpiry();
    if (!expiryTime) {
      setIsWarningActive(false);
      warningTriggeredRef.current = false;
      return;
    }

    const now = Date.now();
    const timeRemaining = expiryTime - now;

    // Update time until expiry
    setTimeUntilExpiry(Math.max(0, Math.floor(timeRemaining / 1000)));

    // Check if token has expired
    if (timeRemaining <= 0) {
      setIsWarningActive(false);
      clearInterval(checkIntervalRef.current!);
      onExpired();
      return;
    }

    // Check if we should show warning (5 minutes before expiry)
    if (timeRemaining <= warningTimeBeforeExpiry && !warningTriggeredRef.current) {
      setIsWarningActive(true);
      warningTriggeredRef.current = true;
      onWarning();
    }
  }, [getTokenExpiry, warningTimeBeforeExpiry, onWarning, onExpired]);

  /**
   * Extend session by refreshing token
   */
  const extendSession = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'}/auth/refresh`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data.data;

      // Update tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      // Reset warning state
      setIsWarningActive(false);
      warningTriggeredRef.current = false;

      // Restart checking
      checkAndTriggerWarning();
    } catch (error) {
      console.error('Failed to extend session:', error);
      throw error;
    }
  }, [checkAndTriggerWarning]);

  /**
   * Start monitoring session expiry
   */
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsWarningActive(false);
      return;
    }

    // Initial check
    checkAndTriggerWarning();

    // Check every 10 seconds
    checkIntervalRef.current = setInterval(() => {
      checkAndTriggerWarning();
    }, 10000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkAndTriggerWarning]);

  return {
    timeUntilExpiry,
    isWarningActive,
    extendSession,
  };
};

export default useSessionExpiry;