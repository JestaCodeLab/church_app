import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface NetworkContextType {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextType | null>(null);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOffline);
      window.removeEventListener('offline', handleOnline);
    };
  }, []);

  // Update global network status for axios integration
  useEffect(() => {
    // Import dynamically to avoid circular dependency
    import('../services/api').then(module => {
      module.updateNetworkStatus(isOnline);
    });
  }, [isOnline]);

  const value: NetworkContextType = {
    isOnline,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export default NetworkContext;
