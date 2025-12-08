import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface MerchantBranding {
  logo: string | null;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
}

interface Merchant {
  id: string;
  name: string;
  subdomain: string;
  branding: MerchantBranding;
}

interface MerchantContextType {
  merchant: Merchant | null;
  loading: boolean;
  subdomain: string | null;
  isMainDomain: boolean;
}

const MerchantContext = createContext<MerchantContextType | null>(null);

export const MerchantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isMainDomain, setIsMainDomain] = useState(true);

  useEffect(() => {
    const detectSubdomainAndFetchMerchant = async () => {
      try {
        // Extract subdomain from current URL
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        
        console.log('🌐 Hostname:', hostname);
        console.log('🌐 Parts:', parts);
        
        let detectedSubdomain: string | null = null;
        
        // Development: faith.localhost
        if (parts.length >= 2 && parts[parts.length - 1] === 'localhost') {
          if (parts.length === 2 && parts[0] !== 'localhost') {
            detectedSubdomain = parts[0];
          }
        }
        // Production: faith.thechurchhq.com
        else if (parts.length >= 3) {
          detectedSubdomain = parts[0];
        }
        
        console.log('🌐 Detected subdomain:', detectedSubdomain);
        
        setSubdomain(detectedSubdomain);
        setIsMainDomain(!detectedSubdomain);
        
        // If we have a subdomain, fetch merchant data
        if (detectedSubdomain) {
          console.log('🌐 Fetching merchant data for:', detectedSubdomain);
          
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/merchants/by-subdomain/${detectedSubdomain}`
          );
          
          if (response.data.success) {
            console.log('🌐 Merchant data loaded:', response.data.data.merchant);
            setMerchant(response.data.data.merchant);
            
            // ✅ Apply merchant colors to CSS variables
            const root = document.documentElement;
            root.style.setProperty('--primary-color', response.data.data.merchant.branding.primaryColor);
            root.style.setProperty('--secondary-color', response.data.data.merchant.branding.secondaryColor);
          }
        } else {
          console.log('🌐 Main domain - no merchant branding');
        }
        
      } catch (error) {
        console.error('🌐 Error fetching merchant:', error);
        // Don't fail the app if merchant fetch fails
      } finally {
        setLoading(false);
      }
    };

    detectSubdomainAndFetchMerchant();
  }, []);

  const value: MerchantContextType = {
    merchant,
    loading,
    subdomain,
    isMainDomain,
  };

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchant = (): MerchantContextType => {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error('useMerchant must be used within a MerchantProvider');
  }
  return context;
};

export default MerchantContext;