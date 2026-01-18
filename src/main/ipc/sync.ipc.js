// src/main/ipcHandlers/syncHandlers.js
//@ts-check
const { ipcMain, BrowserWindow } = require("electron");
const SyncManager = require("../../services/inventory_sync/syncManager");
const SyncRetryService = require("../../services/inventory_sync/syncRetryService");
const SyncDataManager = require("../../services/inventory_sync/syncDataManager");
const inventoryDB = require("../../services/inventory_sync/inventoryDB");
const inventoryConfig = require("../../services/inventory_sync/inventoryConfig");
const { logger } = require("../../utils/logger");

class SyncHandlers {
  constructor() {
    console.log("✅ Sync IPC Handlers Initialized");
  }

  /**
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {object} payload
   */
  // @ts-ignore
  async handleRequest(event, { method, params = {} }) {
    try {
      console.log(`[SyncIPC] ${method}`, params);

      switch (method) {
        // 🔍 STATUS & INFO
        case "getStatus":
          return await this.getStatus();
        case "getDetailedStatus":
          return await this.getDetailedStatus();
        case "getSyncConfig":
          return await this.getSyncConfig();
        case "getFullConfig":
          return await this.getFullConfig();

        // 🔄 SYNC OPERATIONS
        case "manualSync":
          return await this.manualSync(params);
        case "syncProducts":
          return await this.syncProducts(params);
        case "syncStock":
          return await this.syncStock(params);
        case "updateStockFromSale":
          return await this.updateStockFromSale(params);
        case "stopSync":
          return await this.stopSync();
        case "startSync":
          return await this.startSync();

        // 📊 HISTORY & STATS
        case "getSyncHistory":
          return await this.getSyncHistory(params);
        case "getSyncStats":
          return await this.getSyncStats(params);
        case "getPendingSyncs":
          return await this.getPendingSyncs();
        case "getEntitySyncHistory":
          return await this.getEntitySyncHistory(params);

        // 🔌 CONNECTION & TESTING
        case "testConnection":
          return await this.testConnection();
        case "checkInventoryConnection":
          return await this.checkInventoryConnection();
        case "getInventoryInfo":
          return await this.getInventoryInfo();

        // ⚙️ CONFIGURATION
        case "updateSyncSetting":
          return await this.updateSyncSetting(params);
        case "setSyncEnabled":
          return await this.setSyncEnabled(params);
        case "setAutoUpdateOnSale":
          return await this.setAutoUpdateOnSale(params);
        case "setSyncInterval":
          return await this.setSyncInterval(params);
        case "initializeSettings":
          return await this.initializeSettings();

        // 🔁 RETRY MANAGEMENT
        case "forceRetry":
          return await this.forceRetry(params);
        case "resetFailedSyncs":
          return await this.resetFailedSyncs(params);
        case "retryPendingSyncs":
          return await this.retryPendingSyncs();
        case "cleanOldRecords":
          return await this.cleanOldRecords(params);

        // 📦 INVENTORY DATA
        case "getInventoryProducts":
          return await this.getInventoryProducts(params);
        case "getProductStock":
          return await this.getProductStock(params);
        case "updateProductStock":
          return await this.updateProductStock(params);
        case "bulkUpdateStock":
          return await this.bulkUpdateStock(params);
        case "getProductVariants":
          return await this.getProductVariants(params);
        case "getWarehouses":
          return await this.getWarehouses();

        // 🧹 MAINTENANCE
        case "cleanupSyncData":
          return await this.cleanupSyncData(params);

        default:
          return {
            success: false,
            message: `Unknown method: ${method}`,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("SyncHandler error:", error);
      return {
        success: false,
        // @ts-ignore
        message: error.message || "Internal error",
        // @ts-ignore
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      };
    }
  }

  // ============================================
  // 🔍 STATUS & INFO METHODS
  // ============================================

  async getStatus() {
    try {
      const status = await SyncManager.getSyncStatus();
      return {
        success: true,
        data: status,
        message: "Sync status retrieved",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get sync status: ${error.message}`,
      };
    }
  }

  async getDetailedStatus() {
    try {
      const config = await inventoryConfig.getFullConfig();
      const status = await SyncManager.getSyncStatus();
      const pendingSyncs = await SyncDataManager.getPendingSyncs();
      const recentStats = await SyncDataManager.getSyncStats("hour");

      return {
        success: true,
        data: {
          config,
          status,
          pendingSyncs: pendingSyncs.length,
          pendingDetails: pendingSyncs.slice(0, 10),
          recentStats,
          isRetryServiceRunning: SyncRetryService.isRunning,
        },
        message: "Detailed sync status retrieved",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get detailed status: ${error.message}`,
      };
    }
  }

  async getSyncConfig() {
    try {
      const config = await inventoryConfig.getSyncConfig();
      return {
        success: true,
        data: config,
        message: "Sync configuration retrieved",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get sync config: ${error.message}`,
      };
    }
  }

  async getFullConfig() {
    try {
      const config = await inventoryConfig.getFullConfig();
      return {
        success: true,
        data: config,
        message: "Full configuration retrieved",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get full config: ${error.message}`,
      };
    }
  }

  // ============================================
  // 🔄 SYNC OPERATIONS
  // ============================================

  /**
     * @param {{ userInfo?: null | undefined; options?: {} | undefined; }} params
     */
  async manualSync(params) {
    try {
      const { userInfo = null, options = {} } = params;
      const result = await SyncManager.manualSync(userInfo, options);

      // Notify all windows
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send("sync:manual_completed", result);
        }
      });

      return {
        success: result.success !== false,
        data: result,
        message: result.success
          ? "Manual sync completed successfully"
          : "Manual sync failed",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Manual sync failed: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ userInfo?: null | undefined; }} params
     */
  async syncProducts(params) {
    try {
      const { userInfo = null } = params;
      const result = await SyncManager.syncProductsFromInventory(userInfo);

      // Notify all windows
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send("sync:products_completed", result);
        }
      });

      return {
        success: result.success,
        data: result,
        message: result.success
          ? `Products sync completed: ${result.created} created, ${result.updated} updated, ${result.failed} failed`
          : "Products sync failed",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Products sync failed: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ productIds?: never[] | undefined; }} params
     */
  async syncStock(params) {
    try {
      // @ts-ignore
      const { productIds = [] } = params;
      const results = [];

      for (const productId of productIds) {
        try {
          const stock = await inventoryDB.getProductStock(productId);
          results.push({ productId, stock, success: true });
        } catch (error) {
          results.push({
            productId,
            success: false,
            // @ts-ignore
            error: error.message,
          });
        }
      }

      return {
        success: results.every((r) => r.success),
        data: { results },
        message: `Stock sync completed for ${results.length} products`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Stock sync failed: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ saleData: any; userInfo?: null | undefined; }} params
     */
  async updateStockFromSale(params) {
    try {
      const { saleData, userInfo = null } = params;

      if (!saleData) {
        return {
          success: false,
          message: "Sale data is required",
        };
      }

      const result = await SyncManager.updateInventoryStockFromSale(
        saleData,
        userInfo
      );

      return {
        success: result.success,
        data: result,
        message: result.success
          ? `Stock updated for ${result.summary?.successCount || 0} items`
          : "Stock update failed",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to update stock from sale: ${error.message}`,
      };
    }
  }

  async stopSync() {
    try {
      await SyncManager.stop();
      return {
        success: true,
        message: "Sync manager stopped",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to stop sync: ${error.message}`,
      };
    }
  }

  async startSync() {
    try {
      await SyncManager.start();
      return {
        success: true,
        message: "Sync manager started",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to start sync: ${error.message}`,
      };
    }
  }

  // ============================================
  // 📊 HISTORY & STATS
  // ============================================

  /**
     * @param {{ entityType?: null | undefined; entityId?: null | undefined; limit?: 50 | undefined; }} params
     */
  async getSyncHistory(params) {
    try {
      const { entityType = null, entityId = null, limit = 50 } = params;
      const history = await SyncManager.getDetailedSyncHistory(
        entityType,
        entityId,
        limit
      );

      return {
        success: true,
        data: history,
        message: `Retrieved ${history.length} sync records`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get sync history: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ timeRange?: "day" | undefined; }} params
     */
  async getSyncStats(params) {
    try {
      const { timeRange = "day" } = params;
      const stats = await SyncManager.getSyncStats(timeRange);

      return {
        success: true,
        data: stats,
        message: `Sync statistics for ${timeRange}`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get sync stats: ${error.message}`,
      };
    }
  }

  async getPendingSyncs() {
    try {
      const pendingSyncs = await SyncDataManager.getPendingSyncs();

      return {
        success: true,
        data: pendingSyncs,
        message: `Found ${pendingSyncs.length} pending syncs`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get pending syncs: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ entityType: any; entityId: any; limit?: 20 | undefined; }} params
     */
  async getEntitySyncHistory(params) {
    try {
      const { entityType, entityId, limit = 20 } = params;

      if (!entityType || !entityId) {
        return {
          success: false,
          message: "Entity type and ID are required",
        };
      }

      const history = await SyncDataManager.getSyncHistory(
        entityType,
        entityId,
        limit
      );

      return {
        success: true,
        data: history,
        message: `Retrieved ${history.length} records for ${entityType} ${entityId}`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get entity sync history: ${error.message}`,
      };
    }
  }

  // ============================================
  // 🔌 CONNECTION & TESTING
  // ============================================

  async testConnection() {
    try {
      const result = await SyncManager.testConnection();

      // Update connection status in settings
      await inventoryConfig.updateSetting(
        "inventory_connection_status",
        result.connected ? "connected" : "disconnected"
      );

      return {
        success: result.connected,
        data: result,
        message: result.connected
          ? "Connection test successful"
          : "Connection test failed",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  async checkInventoryConnection() {
    try {
      const result = await inventoryDB.checkConnection();

      return {
        success: result.connected,
        data: result,
        message: result.connected
          ? "Inventory database connected"
          : "Inventory database connection failed",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Inventory connection check failed: ${error.message}`,
      };
    }
  }

  async getInventoryInfo() {
    try {
      await inventoryDB.connect();
      const products = await inventoryDB.getAllProducts();
      const warehouses = await inventoryDB.getWarehouses();
      await inventoryDB.disconnect();

      return {
        success: true,
        data: {
          productCount: products.length,
          warehouseCount: warehouses.length,
          sampleProducts: products.slice(0, 5),
          warehouses: warehouses.slice(0, 5),
        },
        message: `Inventory info retrieved: ${products.length} products, ${warehouses.length} warehouses`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get inventory info: ${error.message}`,
      };
    }
  }

  // ============================================
  // ⚙️ CONFIGURATION
  // ============================================

  /**
     * @param {{ key: any; value: any; description: any; }} params
     */
  async updateSyncSetting(params) {
    try {
      const { key, value, description } = params;

      if (!key) {
        return {
          success: false,
          message: "Setting key is required",
        };
      }

      const setting = await inventoryConfig.updateSetting(
        key,
        value,
        description
      );

      // Notify all windows of config change
      BrowserWindow.getAllWindows().forEach((win) => {
        if (!win.isDestroyed()) {
          win.webContents.send("sync:config_updated", { key, value });
        }
      });

      return {
        success: true,
        data: setting,
        message: `Setting '${key}' updated successfully`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to update setting: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ enabled: any; }} params
     */
  async setSyncEnabled(params) {
    try {
      const { enabled } = params;
      await inventoryConfig.setSyncEnabled(enabled);

      // Start or stop sync manager
      if (enabled) {
        await SyncManager.start();
      } else {
        await SyncManager.stop();
      }

      return {
        success: true,
        message: `Sync ${enabled ? "enabled" : "disabled"}`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to set sync enabled: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ enabled: any; }} params
     */
  async setAutoUpdateOnSale(params) {
    try {
      const { enabled } = params;
      await inventoryConfig.setAutoUpdateOnSale(enabled);

      return {
        success: true,
        message: `Auto-update on sale ${enabled ? "enabled" : "disabled"}`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to set auto-update: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ intervalMs: any; }} params
     */
  async setSyncInterval(params) {
    try {
      const { intervalMs } = params;
      await inventoryConfig.setSyncInterval(intervalMs);

      // Restart sync manager with new interval
      await SyncManager.stop();
      await SyncManager.start();

      return {
        success: true,
        message: `Sync interval set to ${intervalMs}ms`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to set sync interval: ${error.message}`,
      };
    }
  }

  async initializeSettings() {
    try {
      await inventoryConfig.initializeDefaultSettings();
      return {
        success: true,
        message: "Default sync settings initialized",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to initialize settings: ${error.message}`,
      };
    }
  }

  // ============================================
  // 🔁 RETRY MANAGEMENT
  // ============================================

  /**
     * @param {{ syncId: any; }} params
     */
  async forceRetry(params) {
    try {
      const { syncId } = params;

      if (!syncId) {
        return {
          success: false,
          message: "Sync ID is required",
        };
      }

      const result = await SyncRetryService.forceRetry(syncId);

      return {
        success: result.success,
        data: result,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Force retry failed: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ entityType?: null | undefined; }} params
     */
  async resetFailedSyncs(params) {
    try {
      const { entityType = null } = params;
      const result = await SyncRetryService.resetAllFailedSyncs(entityType);

      return {
        success: true,
        data: result,
        message: entityType
          ? `Failed syncs reset for ${entityType}`
          : "All failed syncs reset",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to reset syncs: ${error.message}`,
      };
    }
  }

  async retryPendingSyncs() {
    try {
      await SyncRetryService.processPendingSyncs();

      return {
        success: true,
        message: "Pending syncs retry initiated",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to retry pending syncs: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ daysToKeep?: 30 | undefined; }} params
     */
  async cleanOldRecords(params) {
    try {
      const { daysToKeep = 30 } = params;
      const result = await SyncDataManager.cleanOldSyncRecords(daysToKeep);

      return {
        success: true,
        data: result,
        message: `Old sync records cleaned (keeping ${daysToKeep} days)`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to clean old records: ${error.message}`,
      };
    }
  }

  // ============================================
  // 📦 INVENTORY DATA
  // ============================================

  /**
     * @param {any} params
     */
  // @ts-ignore
  async getInventoryProducts(params) {
    try {
      await inventoryDB.connect();
      const products = await inventoryDB.getAllProducts();
      await inventoryDB.disconnect();

      return {
        success: true,
        data: products,
        message: `Retrieved ${products.length} products from inventory`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get inventory products: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ inventoryId: any; }} params
     */
  async getProductStock(params) {
    try {
      const { inventoryId } = params;

      if (!inventoryId) {
        return {
          success: false,
          message: "Inventory ID is required",
        };
      }

      await inventoryDB.connect();
      const stock = await inventoryDB.getProductStock(inventoryId);
      await inventoryDB.disconnect();

      return {
        success: true,
        data: { inventoryId, stock },
        message: `Stock for product ${inventoryId}: ${stock}`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get product stock: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ inventoryId: any; quantityChange: any; action?: "sale" | undefined; userId: any; }} params
     */
  async updateProductStock(params) {
    try {
      const { inventoryId, quantityChange, action = "sale", userId } = params;

      if (!inventoryId || quantityChange === undefined) {
        return {
          success: false,
          message: "Inventory ID and quantity change are required",
        };
      }

      await inventoryDB.connect();
      const result = await inventoryDB.updateProductStock(
        inventoryId,
        quantityChange,
        action,
        userId
      );
      await inventoryDB.disconnect();

      return {
        success: result.success,
        data: result,
        message: result.success
          ? `Stock updated: ${result.previousStock} → ${result.newStock}`
          : "Stock update failed",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to update product stock: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ updates: any; userId: any; }} params
     */
  async bulkUpdateStock(params) {
    try {
      const { updates, userId } = params;

      if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return {
          success: false,
          message: "Updates array is required and must not be empty",
        };
      }

      await inventoryDB.connect();
      const results = await inventoryDB.bulkUpdateStock(updates, userId);
      await inventoryDB.disconnect();

      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;

      return {
        success: failedCount === 0,
        data: { results, summary: { successCount, failedCount } },
        message: `Bulk update: ${successCount} success, ${failedCount} failed`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to bulk update stock: ${error.message}`,
      };
    }
  }

  /**
     * @param {{ productId: any; }} params
     */
  async getProductVariants(params) {
    try {
      const { productId } = params;

      if (!productId) {
        return {
          success: false,
          message: "Product ID is required",
        };
      }

      await inventoryDB.connect();
      const variants = await inventoryDB.getProductVariants(productId);
      await inventoryDB.disconnect();

      return {
        success: true,
        data: variants,
        message: `Retrieved ${variants.length} variants for product ${productId}`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get product variants: ${error.message}`,
      };
    }
  }

  async getWarehouses() {
    try {
      await inventoryDB.connect();
      const warehouses = await inventoryDB.getWarehouses();
      await inventoryDB.disconnect();

      return {
        success: true,
        data: warehouses,
        message: `Retrieved ${warehouses.length} warehouses`,
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Failed to get warehouses: ${error.message}`,
      };
    }
  }

  // ============================================
  // 🧹 MAINTENANCE
  // ============================================

  /**
     * @param {{ daysToKeep?: 30 | undefined; resetFailed?: false | undefined; }} params
     */
  async cleanupSyncData(params) {
    try {
      const { daysToKeep = 30, resetFailed = false } = params;
      const results = [];

      // Clean old records
      const cleanResult = await SyncDataManager.cleanOldSyncRecords(daysToKeep);
      results.push({ action: "cleanOldRecords", result: cleanResult });

      // Reset failed syncs if requested
      if (resetFailed) {
        const resetResult = await SyncRetryService.resetAllFailedSyncs();
        results.push({ action: "resetFailedSyncs", result: resetResult });
      }

      return {
        success: true,
        data: results,
        message: "Sync data cleanup completed",
      };
    } catch (error) {
      return {
        success: false,
        // @ts-ignore
        message: `Cleanup failed: ${error.message}`,
      };
    }
  }
}

// Initialize and register handlers
const syncHandlers = new SyncHandlers();

if (ipcMain) {
  ipcMain.handle("sync", (event, payload) =>
    syncHandlers.handleRequest(event, payload)
  );
}

function registerSyncHandlers() {
  console.log("✅ Sync IPC handlers registered");
}

module.exports = {
  SyncHandlers,
  syncHandlers,
  registerSyncHandlers,
};