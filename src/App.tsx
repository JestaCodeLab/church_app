import React, { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import AnimatedRoutes from './components/auth/AnimatedRoutes';
import { LanguageProvider } from './context/LanguageContext';
import {MerchantProvider, useMerchant} from './context/MerchantContext';



const App = () => {
  const { merchant, isMainDomain } = useMerchant();

  // Update document title based on subdomain
  useEffect(() => {
    if (merchant) {
      // On church subdomain: "Faith Church - The Church HQ"
      document.title = `${merchant.name} - The Church HQ`;
    } else if (isMainDomain) {
      // On main domain: "The Church HQ - Church Management Platform"
      document.title = 'The Church HQ - Church Management Platform';
    }
  }, [merchant, isMainDomain]);

  // Update favicon based on merchant logo (optional)
  useEffect(() => {
    if (merchant?.branding?.logo) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = merchant.branding.logo;
      }
    }
  }, [merchant]);

  return (
    <MerchantProvider>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              // Default options
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              // Success
              success: {
                duration: 4000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              // Error
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <AnimatedRoutes />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
    </MerchantProvider>

         
  );
}

export default App;
