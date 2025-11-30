import React, { ReactNode } from 'react';
import { Church } from 'lucide-react';
import AuthFooter from './AuthFooter';
import ThemeToggle from '../ui/ThemeToggle';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ 
  children, 
  title, 
  subtitle, 
  icon,
  maxWidth = 'md' 
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className={`${maxWidthClasses[maxWidth]} w-full`}>
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 rounded-full mb-4 shadow-lg dark:shadow-primary-500/20 transition-all duration-300">
            {icon || <Church className="w-8 h-8 text-white" />}
          </div>
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-primary-800 to-gray-900 dark:from-gray-100 dark:via-primary-400 dark:to-gray-100 bg-clip-text text-transparent transition-all duration-300">
            {title}
          </h1>
          
          <p className="text-base text-gray-600 dark:text-gray-400 mt-1 font-medium transition-colors duration-300">
            {subtitle}
          </p>
        </div>

        {/* Content */}
        {children}

        {/* Footer */}
        <AuthFooter />
      </div>
    </div>
  );
};

export default AuthLayout;