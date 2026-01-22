import React, { useState } from 'react';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (selectedCount === 0) return null;

  const handleBulkDelete = () => {
    if (!showConfirm) {
      setShowConfirm(true);
    } else {
      onBulkDelete();
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <div className="text-white">
          <span className="font-semibold">{selectedCount}</span> user{selectedCount !== 1 ? 's' : ''} selected
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onBulkActivate}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Activate Selected
          </button>
          
          <button
            onClick={onBulkDeactivate}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            Deactivate Selected
          </button>
          
          <button
            onClick={handleBulkDelete}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showConfirm
                ? 'bg-red-700 hover:bg-red-800 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {showConfirm ? 'Confirm Delete' : 'Delete Selected'}
          </button>
          
          {showConfirm && (
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};