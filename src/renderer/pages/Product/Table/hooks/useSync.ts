import { useState, useCallback } from 'react';
import { productSyncAPI } from '../api/productSyncAPI';
import { showError, showSuccess } from '../../../../utils/notification';
import type { SyncResponse } from '../types/product.types';

export const useSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResponse['data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncFromInventory = useCallback(async (params?: {
    warehouseId?: string | number;
    fullSync?: boolean;
    incremental?: boolean;
  }) => {
    try {
      setIsSyncing(true);
      setError(null);

      const response = await productSyncAPI.syncFromInventory(params);

      if (response.status) {
        setSyncResult(response.data);
        showSuccess(
          `Sync completed: ${response.data.created} created, ${response.data.updated} updated, ${response.data.skipped} skipped`
        );
        
        if (response.data.errors.length > 0) {
          showError(`${response.data.errors.length} products failed to sync`);
        }
        
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      showError(`Sync failed: ${err.message}`);
      console.error('Sync error:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const resetSync = useCallback(() => {
    setSyncResult(null);
    setError(null);
  }, []);

  return {
    isSyncing,
    syncResult,
    error,
    syncFromInventory,
    resetSync
  };
};