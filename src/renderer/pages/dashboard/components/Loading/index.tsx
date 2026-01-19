import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'chart' | 'table' | 'list';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/3"></div>
          </div>
        );
      
      case 'chart':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
        );
      
      case 'table':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-300 dark:bg-gray-700 rounded mb-3"></div>
            ))}
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`${type === 'card' || type === 'chart' || type === 'table' ? 'space-y-6' : ''}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center animate-scale-in">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-gray-200 border-t-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-blue-600/20 animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{message}</h3>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch your data</p>
        </div>
      </div>
    </div>
  );
};