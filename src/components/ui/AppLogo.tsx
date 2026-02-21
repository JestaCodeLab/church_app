import React from 'react';
import { useMerchant } from '../../context/MerchantContext';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

const AppLogo: React.FC<AppLogoProps> = ({ 
  size = 'md', 
  showLoading = false,
  className = '',
  onClick 
}) => {
  const { merchant, loading: merchantLoading } = useMerchant();

  const sizeClasses = {
    sm: { container: 'w-12 h-12', logo: 'h-14' },
    md: { container: 'w-16 h-16', logo: 'h-20' },
    lg: { container: 'w-20 h-20', logo: 'h-24' },
    xl: { container: 'w-24 h-24', logo: 'h-28' },
  };

  const displayLogo = merchant?.branding?.logo;
  const displayTitle = merchant?.name || process.env.REACT_APP_PROJECT_NAME || "The Church HQ";

  // Loading state
  if (showLoading && merchantLoading) {
    return (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size].container} mb-4 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Show merchant logo if available
  if (displayLogo) {
    return (
      <div className={`mb-0 ${className}`} onClick={onClick}>
        <img 
          src={displayLogo} 
          alt={displayTitle}
          className={`${sizeClasses[size].logo} w-auto mx-auto object-contain`}
        />
      </div>
    );
  }

  // Default app logo
  return (
    <div 
      className={`inline-flex items-center justify-center ${sizeClasses[size].container} bg-gradient-to-br from-green-500 via-green-500 to-green-600 rounded-[20px] mb-4 shadow-lg dark:shadow-green-500/20 transition-all duration-300 ${className}`}
      onClick={onClick}
    >
      <img 
        src={'/images/logo-only.png'} 
        alt={'logo'}
        className={`${sizeClasses[size].logo} w-auto mx-auto object-contain`}
      />
    </div>
  );
};

export default AppLogo;
