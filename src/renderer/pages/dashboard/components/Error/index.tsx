import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff, Database, Server } from 'lucide-react';

interface ErrorStateProps {
  type?: 'network' | 'server' | 'data' | 'generic';
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  type = 'generic', 
  message, 
  onRetry 
}) => {
  const errorConfig = {
    network: {
      icon: WifiOff,
      title: 'Connection Error',
      defaultMessage: 'Unable to connect to the server. Please check your internet connection.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    server: {
      icon: Server,
      title: 'Server Error',
      defaultMessage: 'The server encountered an error. Please try again later.',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    data: {
      icon: Database,
      title: 'Data Error',
      defaultMessage: 'There was an error loading the data. The data might be corrupted.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    generic: {
      icon: AlertTriangle,
      title: 'Something Went Wrong',
      defaultMessage: 'An unexpected error occurred. Please try again.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    },
  };

  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <div className={`${config.bgColor} border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center animate-fade-in`}>
      <div className="flex flex-col items-center">
        <div className={`p-4 rounded-full ${config.bgColor} mb-4`}>
          <Icon className={`h-12 w-12 ${config.color}`} />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {config.title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {message || config.defaultMessage}
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium animate-bounce-subtle"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Retry</span>
          </button>
        )}
        
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>If the problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  message: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}> = ({ title, message, icon: Icon, action }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center animate-fade-in">
      <div className="flex flex-col items-center">
        {Icon ? (
          <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-900 mb-6">
            <Icon className="h-12 w-12 text-gray-400" />
          </div>
        ) : (
          <div className="relative mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-700"></div>
            </div>
          </div>
        )}
        
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
          {message}
        </p>
        
        {action}
      </div>
    </div>
  );
};