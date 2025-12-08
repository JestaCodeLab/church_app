import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import AnimatedRoutes from './components/auth/AnimatedRoutes';
import { LanguageProvider } from './context/LanguageContext';
import {MerchantProvider} from './context/MerchantContext';

const App = () => {
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
