import React, { ReactNode } from 'react';
import { Church } from 'lucide-react';
import AuthFooter from './AuthFooter';
import ThemeToggle from '../ui/ThemeToggle';
import AppLogo from '../ui/AppLogo';
import { useMerchant } from '../../context/MerchantContext';
import { useNavigate } from 'react-router';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showHeader?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  icon,
  showHeader = true,
  maxWidth = 'md' 
}) => {
  const navigate = useNavigate();
  const { merchant, loading: merchantLoading, isMainDomain } = useMerchant();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  // Use merchant branding if on subdomain, otherwise use provided title
  const displayTitle = merchant?.name || title || process.env.REACT_APP_PROJECT_NAME || "The Church HQ";
  const displaySubtitle = merchant?.branding?.tagline || subtitle || "Your Church, Organized and Connected";
  const displayLogo = merchant?.branding?.logo;

  // SHOW LOADING SCREEN WHILE FETCHING MERCHANT DATA ON SUBDOMAIN
  if (merchantLoading && !isMainDomain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      <div className={`${maxWidthClasses[maxWidth]} w-full`}>
        {/* Logo/Brand */}
        { showHeader && (
          <div className="text-center mb-8 cursor-pointer" onClick={()=>navigate('/')}>
            <AppLogo size="md" showLoading={merchantLoading} />
            
            <h1 className="text-3xl font-bold dark:text-white">
              {displayTitle}
            </h1>
            
            <p className="text-base text-gray-600 dark:text-gray-400 mt-1 font-medium transition-colors duration-300">
              {displaySubtitle}
            </p>
          </div>
        )}

        {/* Content */}
        {children}

        {/* Footer */}
        <AuthFooter />
      </div>
    </div>
  );
};

export default AuthLayout;