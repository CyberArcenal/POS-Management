import React from 'react';
import { useSync } from '../hooks/useSync';

interface SyncButtonProps {
  onSyncComplete?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const SyncButton: React.FC<SyncButtonProps> = ({
  onSyncComplete,
  variant = 'primary',
  size = 'md'
}) => {
  const { isSyncing, syncFromInventory, error } = useSync();

  const handleClick = async () => {
    try {
      await syncFromInventory();
      onSyncComplete?.();
    } catch (error) {
      // Error already handled by useSync hook
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700'
  };

  return (
    <button
      onClick={handleClick}
      disabled={isSyncing}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
      `}
    >
      {isSyncing ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Syncing...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync from Inventory
        </>
      )}
    </button>
  );
};

export default SyncButton;