import React, { useState, useEffect } from 'react';
import { useSync } from '../hooks/useSync';
import { productSyncAPI } from '../api/productSyncAPI';

interface SyncButtonProps {
  onSyncComplete?: (result: any) => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showWarehouseSelect?: boolean;
}

const SyncButton: React.FC<SyncButtonProps> = ({
  onSyncComplete,
  variant = 'primary',
  size = 'md',
  showWarehouseSelect = false
}) => {
  const { isSyncing, syncFromInventory, error } = useSync();
  const [warehouses, setWarehouses] = useState<Array<{ id: string | number; name: string }>>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | number>('');
  const [syncType, setSyncType] = useState<'full' | 'incremental'>('full');
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    if (showWarehouseSelect) {
      loadWarehouses();
    }
  }, [showWarehouseSelect]);

  const loadWarehouses = async () => {
    try {
      const response = await productSyncAPI.getAvailableWarehouses();
      if (response.status) {
        setWarehouses(response.data.warehouses);
        if (response.data.currentWarehouse) {
          setSelectedWarehouse(response.data.currentWarehouse.id);
        }
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  const handleSync = async () => {
    try {
      const params: any = {
        fullSync: syncType === 'full',
        incremental: syncType === 'incremental'
      };
      
      if (selectedWarehouse) {
        params.warehouseId = selectedWarehouse;
      }

      const result = await syncFromInventory(params);
      onSyncComplete?.(result);
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
    <div className="relative">
      <div className="flex items-center gap-2">
        {showWarehouseSelect && warehouses.length > 0 && (
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
            disabled={isSyncing}
          >
            <option value="">Select Warehouse</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name}
              </option>
            ))}
          </select>
        )}
        
        <button
          onClick={() => showWarehouseSelect ? handleSync() : setShowOptions(!showOptions)}
          disabled={isSyncing || (showWarehouseSelect && !selectedWarehouse)}
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
              {showWarehouseSelect ? 'Sync Selected Warehouse' : 'Sync from Inventory'}
            </>
          )}
        </button>
      </div>

      {showOptions && !showWarehouseSelect && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
          <div className="p-3">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Sync Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSyncType('full')}
                  className={`flex-1 px-3 py-2 text-sm rounded ${syncType === 'full' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  Full Sync
                </button>
                <button
                  onClick={() => setSyncType('incremental')}
                  className={`flex-1 px-3 py-2 text-sm rounded ${syncType === 'incremental' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  Incremental
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                handleSync();
                setShowOptions(false);
              }}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Start {syncType === 'full' ? 'Full' : 'Incremental'} Sync
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncButton;