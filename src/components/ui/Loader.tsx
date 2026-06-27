import React from 'react';
import { Loader as LucideLoader } from 'lucide-react';

type LoaderVariant =
  | 'full-page'
  | 'spinner'
  | 'inline'
  | 'skeleton-dashboard'
  | 'skeleton-list'
  | 'skeleton-table'
  | 'skeleton-cards';

type LoaderSize = 'sm' | 'md' | 'lg';

interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  message?: string;
  icon?: React.ReactNode;
  className?: string;
  count?: number;
}

const Loader: React.FC<LoaderProps> = ({
  variant = 'skeleton-list',
  size = 'md',
  message,
  icon,
  className = '',
  count = 3
}) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinnerSize = sizeMap[size];

  // Full page loader with spinner overlay
  if (variant === 'full-page') {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className={`${spinnerSize} mx-auto mb-4`}>
            {icon || (
              <LucideLoader className={`${spinnerSize} text-primary-600 dark:text-primary-400 animate-spin`} />
            )}
          </div>
          {message && (
            <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
          )}
        </div>
      </div>
    );
  }

  // Spinner loader (simple spinning icon)
  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className={`${spinnerSize} mb-4`}>
          {icon || (
            <LucideLoader className={`${spinnerSize} text-primary-600 dark:text-primary-400 animate-spin`} />
          )}
        </div>
        {message && (
          <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
        )}
      </div>
    );
  }

  // Inline loader (buttons, small sections)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {icon || (
          <LucideLoader className={`${spinnerSize} text-primary-600 dark:text-primary-400 animate-spin`} />
        )}
        {message && (
          <span className="text-gray-600 dark:text-gray-400 text-sm">{message}</span>
        )}
      </div>
    );
  }

  // Dashboard skeleton (stats cards + content sections)
  if (variant === 'skeleton-dashboard') {
    return (
      <div className={`space-y-8 ${className}`}>
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse flex-shrink-0" />
              </div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content section skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // List skeleton (individual rows)
  if (variant === 'skeleton-list') {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex gap-4"
          >
            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table skeleton
  if (variant === 'skeleton-table') {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Table header skeleton */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-t-lg p-4 flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 dark:bg-gray-600 rounded flex-1 animate-pulse" />
          ))}
        </div>

        {/* Table rows skeleton */}
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 flex gap-4"
          >
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Card grid skeleton
  if (variant === 'skeleton-cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4"
          >
            <div className="flex gap-4">
              <div className="h-14 w-14 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5 animate-pulse" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default Loader;
