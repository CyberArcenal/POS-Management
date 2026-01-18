// index.js - ADD THESE IPC HANDLERS
function registerSyncIpcHandlers() {
  // Get sync status
  ipcMain.handle('inventory:get-sync-status', async () => {
    return await SyncManager.getSyncStatus();
  });

  // Test connection
  ipcMain.handle('inventory:test-connection', async () => {
    return await SyncManager.testConnection();
  });

  // Manual sync
  ipcMain.handle('inventory:sync-now', async (event, userInfo, options = {}) => {
    return await SyncManager.manualSync(userInfo, options);
  });

  // Update inventory stock after sale
  ipcMain.handle('inventory:update-stock-after-sale', async (event, saleData, userInfo) => {
    return await SyncManager.updateInventoryStockFromSale(saleData, userInfo);
  });

  // Update sync settings
  ipcMain.handle('inventory:update-settings', async (event, settings) => {
    if (settings.enabled !== undefined) {
      await inventoryConfig.setSyncEnabled(settings.enabled);
    }
    if (settings.autoUpdateOnSale !== undefined) {
      await inventoryConfig.setAutoUpdateOnSale(settings.autoUpdateOnSale);
    }
    if (settings.interval !== undefined) {
      await inventoryConfig.setSyncInterval(settings.interval);
    }
    
    // Restart sync manager with new settings
    await SyncManager.stop();
    await SyncManager.start();
    
    return { success: true };
  });

  // Get full sync configuration
  ipcMain.handle('inventory:get-full-config', async () => {
    return await inventoryConfig.getFullConfig();
  });

  // NEW: Get sync history
  ipcMain.handle('inventory:get-sync-history', async (event, entityType = null, entityId = null, limit = 50) => {
    return await SyncManager.getDetailedSyncHistory(entityType, entityId, limit);
  });

  // NEW: Get sync statistics
  ipcMain.handle('inventory:get-sync-stats', async (event, timeRange = 'day') => {
    return await SyncManager.getSyncStats(timeRange);
  });

  // NEW: Force retry failed sync
  ipcMain.handle('inventory:force-retry-sync', async (event, syncId) => {
    return await syncRetryService.forceRetry(syncId);
  });

  // NEW: Reset all failed syncs
  ipcMain.handle('inventory:reset-failed-syncs', async (event, entityType = null) => {
    return await syncRetryService.resetAllFailedSyncs(entityType);
  });

  // NEW: Clean old sync records
  ipcMain.handle('inventory:clean-old-sync-records', async (event, daysToKeep = 30) => {
    return await syncDataManager.cleanOldSyncRecords(daysToKeep);
  });
}

module.exports = registerSyncIpcHandlers;