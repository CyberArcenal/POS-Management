//@ts-check

const { ipcMain } = require("electron");
const { log } = require("../utils/logger");
const SyncManager = require("../services/inventory_sync/syncManager"); // NEW IMPORT
const saleCompletionHandler = require("../services/inventory_sync/saleCompletionHandler");
const inventoryConfig = require("../services/inventory_sync/inventoryConfig");
const syncRetryService = require("../services/inventory_sync/syncRetryService");
const syncDataManager = require("../services/inventory_sync/syncDataManager");

function registerIpcHandlers(){
  require("./ipc/activation.ipc.");
  require("./ipc/system_config.ipc");
  require("./ipc/product/index");
  require("./ipc/audit_trail/index.ipc");
  require("./ipc/inventory_transactions/index.ipc");
  require("./ipc/sales/index.ipc");
  require("./ipc/sales_item/index.ipc");
  require("./ipc/user/index");
  require("./ipc/sync.ipc");
  require("./ipc/user_activity.ipc");
  require("./ipc/price_history.ipc");
  require("./ipc/dashboard/index");
  require("./ipc/customers/index.ipc");
  require("./ipc/loyalty/index.ipc");
}

/**
 * Register sync-related IPC handlers
 */
function registerSyncIpcHandlers() {


  log("INFO", "Registering sync IPC handlers...");

  // Get sync status
  ipcMain.handle("inventory:get-sync-status", async () => {
    return await SyncManager.getSyncStatus();
  });

  // Test connection
  ipcMain.handle("inventory:test-connection", async () => {
    return await SyncManager.testConnection();
  });

  // Manual sync
  ipcMain.handle(
    "inventory:sync-now",
    async (event, userInfo, options = {}) => {
      return await SyncManager.manualSync(userInfo, options);
    },
  );

  // Update inventory stock after sale
  ipcMain.handle(
    "inventory:update-stock-after-sale",
    async (event, saleData, userInfo) => {
      return await saleCompletionHandler.handleSaleCompletion(
        saleData,
        userInfo,
      );
    },
  );

  // Update sync settings
  ipcMain.handle("inventory:update-settings", async (event, settings) => {
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
  ipcMain.handle("inventory:get-full-config", async () => {
    return await inventoryConfig.getFullConfig();
  });

  // Get sync history
  ipcMain.handle(
    "inventory:get-sync-history",
    async (event, entityType = null, entityId = null, limit = 50) => {
      return await SyncManager.getDetailedSyncHistory(
        entityType,
        entityId,
        limit,
      );
    },
  );

  // Get sync statistics
  ipcMain.handle(
    "inventory:get-sync-stats",
    async (event, timeRange = "day") => {
      return await SyncManager.getSyncStats(timeRange);
    },
  );

  // Force retry failed sync
  ipcMain.handle("inventory:force-retry-sync", async (event, syncId) => {
    return await syncRetryService.forceRetry(syncId);
  });

  // Reset all failed syncs
  ipcMain.handle(
    "inventory:reset-failed-syncs",
    async (event, entityType = null) => {
      return await syncRetryService.resetAllFailedSyncs(entityType);
    },
  );

  // Clean old sync records
  ipcMain.handle(
    "inventory:clean-old-sync-records",
    async (event, daysToKeep = 30) => {
      return await syncDataManager.cleanOldSyncRecords(daysToKeep);
    },
  );

  log("SUCCESS", "Sync IPC handlers registered");
}


module.exports = {registerIpcHandlers, registerSyncIpcHandlers};