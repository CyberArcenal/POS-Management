// syncAPI.ts - SIMILAR STRUCTURE TO activation.ts
export interface SyncStatusData {
  enabled: boolean;
  isSyncing: boolean;
  lastSync: string | null;
  pendingSyncs: number;
  connectionStatus: string;
  recentStats: {
    total: number;
    success: number;
    failed: number;
    partial: number;
    pending: number;
  };
  lastSyncTime: string | null;
}

export interface SyncConfigData {
  enabled: boolean;
  autoUpdateOnSale: boolean;
  syncInterval: number;
  lastSync: string | null;
  allSettings: Record<string, any>;
}

export interface SyncResultData {
  success: boolean;
  created?: number;
  updated?: number;
  failed?: number;
  total?: number;
  failedItems?: Array<{
    product: string;
    error: string;
  }>;
  error?: string;
}

export interface SyncRecordData {
  id: number;
  entityType: string;
  entityId: string;
  syncType: string;
  syncDirection: string;
  status: string;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  startedAt: string | null;
  completedAt: string | null;
  lastSyncedAt: string | null;
  payload: any;
  errorMessage: string | null;
  retryCount: number;
  nextRetryAt: string | null;
  performedById: string | null;
  performedByUsername: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncStatsData {
  timeRange: string;
  startDate: string;
  stats: Array<{
    total: string;
    success: string;
    failed: string;
    partial: string;
    pending: string;
    syncDirection: string;
    entityType: string;
  }>;
  summary: {
    total: number;
    success: number;
    failed: number;
    partial: number;
    pending: number;
  };
}

export interface InventoryProductData {
  inventory_id: number;
  name: string;
  sku: string;
  price: number;
  description: string | null;
  barcode: string | null;
  cost_price: number;
  min_stock: number;
  category_name: string | null;
  supplier_name: string | null;
  is_active: boolean;
  track_quantity: boolean;
  allow_backorder: boolean;
  total_stock: number;
}

export interface InventoryWarehouseData {
  id: number;
  name: string;
  type: string;
  location: string | null;
  is_active: boolean;
}

export interface ConnectionTestResult {
  connected: boolean;
  message: string;
}

export interface StockUpdateResult {
  success: boolean;
  newStock: number;
  previousStock: number;
  warehouseId: number;
}

export interface BulkUpdateResult {
  success: boolean;
  inventoryId: number;
  quantityChange: number;
  action: string;
  productName: string;
  saleId?: any;
  itemId?: any;
  error?: string;
}

export interface SyncStatusResponse {
  status: boolean;
  message: string;
  data: SyncStatusData;
}

export interface SyncConfigResponse {
  status: boolean;
  message: string;
  data: SyncConfigData;
}

export interface SyncResultResponse {
  status: boolean;
  message: string;
  data: SyncResultData;
}

export interface SyncHistoryResponse {
  status: boolean;
  message: string;
  data: SyncRecordData[];
}

export interface SyncStatsResponse {
  status: boolean;
  message: string;
  data: SyncStatsData;
}

export interface InventoryProductsResponse {
  status: boolean;
  message: string;
  data: InventoryProductData[];
}

export interface ConnectionTestResponse {
  status: boolean;
  message: string;
  data: ConnectionTestResult;
}

export interface StockUpdateResponse {
  status: boolean;
  message: string;
  data: StockUpdateResult;
}

export interface BulkUpdateResponse {
  status: boolean;
  message: string;
  data: {
    results: BulkUpdateResult[];
    summary: {
      successCount: number;
      failedCount: number;
    };
  };
}

export interface WarehouseResponse {
  status: boolean;
  message: string;
  data: InventoryWarehouseData[];
}

export interface PendingSyncsResponse {
  status: boolean;
  message: string;
  data: SyncRecordData[];
}

export interface EntitySyncHistoryResponse {
  status: boolean;
  message: string;
  data: SyncRecordData[];
}

export interface SyncPayload {
  method: string;
  params?: Record<string, any>;
}

interface SyncEventData {
  type: 'manual_completed' | 'products_completed' | 'config_updated';
  data: any;
}

class SyncAPI {
  // 🔍 Status & Info Methods
  async getStatus(): Promise<SyncStatusResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getStatus",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get sync status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sync status");
    }
  }

  async getDetailedStatus(): Promise<SyncStatusResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getDetailedStatus",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get detailed sync status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get detailed sync status");
    }
  }

  async getSyncConfig(): Promise<SyncConfigResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getSyncConfig",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get sync config");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sync config");
    }
  }

  async getFullConfig(): Promise<SyncConfigResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getFullConfig",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get full config");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get full config");
    }
  }

  // 🔄 Sync Operations
  async manualSync(userInfo: any = null, options: any = {}): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "manualSync",
        params: { userInfo, options },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Manual sync failed");
    } catch (error: any) {
      throw new Error(error.message || "Manual sync failed");
    }
  }

  async syncProducts(userInfo: any = null): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "syncProducts",
        params: { userInfo },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Products sync failed");
    } catch (error: any) {
      throw new Error(error.message || "Products sync failed");
    }
  }

  async syncStock(productIds: number[] = []): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "syncStock",
        params: { productIds },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Stock sync failed");
    } catch (error: any) {
      throw new Error(error.message || "Stock sync failed");
    }
  }

  async updateStockFromSale(saleData: any, userInfo: any = null): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "updateStockFromSale",
        params: { saleData, userInfo },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to update stock from sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update stock from sale");
    }
  }

  async stopSync(): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "stopSync",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to stop sync");
    } catch (error: any) {
      throw new Error(error.message || "Failed to stop sync");
    }
  }

  async startSync(): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "startSync",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to start sync");
    } catch (error: any) {
      throw new Error(error.message || "Failed to start sync");
    }
  }

  // 📊 History & Stats
  async getSyncHistory(entityType: string | null = null, entityId: string | null = null, limit: number = 50): Promise<SyncHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getSyncHistory",
        params: { entityType, entityId, limit },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get sync history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sync history");
    }
  }

  async getSyncStats(timeRange: string = "day"): Promise<SyncStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getSyncStats",
        params: { timeRange },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get sync stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get sync stats");
    }
  }

  async getPendingSyncs(): Promise<PendingSyncsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getPendingSyncs",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get pending syncs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get pending syncs");
    }
  }

  async getEntitySyncHistory(entityType: string, entityId: string, limit: number = 20): Promise<EntitySyncHistoryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getEntitySyncHistory",
        params: { entityType, entityId, limit },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get entity sync history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get entity sync history");
    }
  }

  // 🔌 Connection & Testing
  async testConnection(): Promise<ConnectionTestResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "testConnection",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Connection test failed");
    } catch (error: any) {
      throw new Error(error.message || "Connection test failed");
    }
  }

  async checkInventoryConnection(): Promise<ConnectionTestResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "checkInventoryConnection",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Inventory connection check failed");
    } catch (error: any) {
      throw new Error(error.message || "Inventory connection check failed");
    }
  }

  async getInventoryInfo(): Promise<{
    status: boolean;
    message: string;
    data: {
      productCount: number;
      warehouseCount: number;
      sampleProducts: InventoryProductData[];
      warehouses: InventoryWarehouseData[];
    };
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getInventoryInfo",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get inventory info");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get inventory info");
    }
  }

  // ⚙️ Configuration
  async updateSyncSetting(key: string, value: any, description?: string): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "updateSyncSetting",
        params: { key, value, description },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to update sync setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update sync setting");
    }
  }

  async setSyncEnabled(enabled: boolean): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "setSyncEnabled",
        params: { enabled },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to set sync enabled");
    } catch (error: any) {
      throw new Error(error.message || "Failed to set sync enabled");
    }
  }

  async setAutoUpdateOnSale(enabled: boolean): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "setAutoUpdateOnSale",
        params: { enabled },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to set auto-update on sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to set auto-update on sale");
    }
  }

  async setSyncInterval(intervalMs: number): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "setSyncInterval",
        params: { intervalMs },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to set sync interval");
    } catch (error: any) {
      throw new Error(error.message || "Failed to set sync interval");
    }
  }

  async initializeSettings(): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "initializeSettings",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to initialize settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to initialize settings");
    }
  }

  // 🔁 Retry Management
  async forceRetry(syncId: number): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "forceRetry",
        params: { syncId },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Force retry failed");
    } catch (error: any) {
      throw new Error(error.message || "Force retry failed");
    }
  }

  async resetFailedSyncs(entityType?: string): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "resetFailedSyncs",
        params: { entityType },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to reset failed syncs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to reset failed syncs");
    }
  }

  async retryPendingSyncs(): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "retryPendingSyncs",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to retry pending syncs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to retry pending syncs");
    }
  }

  async cleanOldRecords(daysToKeep: number = 30): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "cleanOldRecords",
        params: { daysToKeep },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to clean old records");
    } catch (error: any) {
      throw new Error(error.message || "Failed to clean old records");
    }
  }

  // 📦 Inventory Data
  async getInventoryProducts(): Promise<InventoryProductsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getInventoryProducts",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get inventory products");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get inventory products");
    }
  }

  async getProductStock(inventoryId: number): Promise<{
    status: boolean;
    message: string;
    data: {
      inventoryId: number;
      stock: number;
    };
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getProductStock",
        params: { inventoryId },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get product stock");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get product stock");
    }
  }

  async updateProductStock(inventoryId: number, quantityChange: number, action: string = "sale", userId?: string): Promise<StockUpdateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "updateProductStock",
        params: { inventoryId, quantityChange, action, userId },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to update product stock");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update product stock");
    }
  }

  async bulkUpdateStock(updates: Array<{
    inventoryId: number;
    quantityChange: number;
    action: string;
    productName?: string;
    saleId?: any;
    itemId?: any;
  }>, userId?: string): Promise<BulkUpdateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "bulkUpdateStock",
        params: { updates, userId },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update stock");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update stock");
    }
  }

  async getProductVariants(productId: number): Promise<{
    status: boolean;
    message: string;
    data: any[];
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getProductVariants",
        params: { productId },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get product variants");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get product variants");
    }
  }

  async getWarehouses(): Promise<WarehouseResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "getWarehouses",
        params: {},
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to get warehouses");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get warehouses");
    }
  }

  // 🧹 Maintenance
  async cleanupSyncData(daysToKeep: number = 30, resetFailed: boolean = false): Promise<SyncResultResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.sync) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.sync({
        method: "cleanupSyncData",
        params: { daysToKeep, resetFailed },
      });

      if (response.success) {
        return response;
      }
      throw new Error(response.message || "Failed to cleanup sync data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to cleanup sync data");
    }
  }

  // Utility Methods
  async checkIfSyncEnabled(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.data.enabled;
    } catch (error) {
      console.error("Error checking if sync is enabled:", error);
      return false;
    }
  }

  async isSyncing(): Promise<boolean> {
    try {
      const status = await this.getStatus();
      return status.data.isSyncing;
    } catch (error) {
      console.error("Error checking if sync is in progress:", error);
      return false;
    }
  }

  async getLastSyncTime(): Promise<Date | null> {
    try {
      const status = await this.getStatus();
      return status.data.lastSync ? new Date(status.data.lastSync) : null;
    } catch (error) {
      console.error("Error getting last sync time:", error);
      return null;
    }
  }

  async getPendingSyncsCount(): Promise<number> {
    try {
      const status = await this.getStatus();
      return status.data.pendingSyncs;
    } catch (error) {
      console.error("Error getting pending syncs count:", error);
      return 0;
    }
  }

  async getSyncSuccessRate(): Promise<number> {
    try {
      const stats = await this.getSyncStats('day');
      const summary = stats.data.summary;
      if (summary.total === 0) return 100;
      return Math.round((summary.success / summary.total) * 100);
    } catch (error) {
      console.error("Error getting sync success rate:", error);
      return 0;
    }
  }

  async testAndEnableSync(): Promise<boolean> {
    try {
      const connection = await this.testConnection();
      if (connection.data.connected) {
        await this.setSyncEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error testing and enabling sync:", error);
      return false;
    }
  }

  async syncAndWait(operation: 'manual' | 'products' | 'stock' = 'manual', params: any = {}): Promise<SyncResultData> {
    try {
      let result: SyncResultResponse;

      switch (operation) {
        case 'manual':
          result = await this.manualSync(params.userInfo, params.options);
          break;
        case 'products':
          result = await this.syncProducts(params.userInfo);
          break;
        case 'stock':
          result = await this.syncStock(params.productIds);
          break;
        default:
          throw new Error("Invalid operation type");
      }

      // Wait for sync to complete if it's in progress
      if (result.data.success) {
        const maxWaitTime = 60000; // 1 minute
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
          const status = await this.getStatus();
          if (!status.data.isSyncing) {
            return result.data;
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
        
        console.warn("Sync operation timeout");
      }

      return result.data;
    } catch (error: any) {
      console.error("Sync operation failed:", error);
      return {
        success: false,
        error: error.message || "Sync operation failed"
      };
    }
  }

  async getRecentFailedSyncs(limit: number = 10): Promise<SyncRecordData[]> {
    try {
      const history = await this.getSyncHistory(null, null, limit);
      return history.data.filter(record => 
        record.status === 'failed' || record.status === 'partial'
      );
    } catch (error) {
      console.error("Error getting recent failed syncs:", error);
      return [];
    }
  }

  async retryAllFailed(): Promise<boolean> {
    try {
      await this.resetFailedSyncs();
      await this.retryPendingSyncs();
      return true;
    } catch (error) {
      console.error("Error retrying all failed syncs:", error);
      return false;
    }
  }

  async getInventoryProductCount(): Promise<number> {
    try {
      const info = await this.getInventoryInfo();
      return info.data.productCount;
    } catch (error) {
      console.error("Error getting inventory product count:", error);
      return 0;
    }
  }

  // Event Listeners
  onSyncManualCompleted(callback: (data: any) => void) {
    if (window.backendAPI && window.backendAPI.onSyncManualCompleted) {
      window.backendAPI.onSyncManualCompleted(callback);
    } else {
      // Fallback: listen for IPC messages
      window.backendAPI?.on?.('sync:manual_completed', callback);
    }
  }

  onSyncProductsCompleted(callback: (data: any) => void) {
    if (window.backendAPI && window.backendAPI.onSyncProductsCompleted) {
      window.backendAPI.onSyncProductsCompleted(callback);
    } else {
      window.backendAPI?.on?.('sync:products_completed', callback);
    }
  }

  onSyncConfigUpdated(callback: (data: { key: string; value: any }) => void) {
    if (window.backendAPI && window.backendAPI.onSyncConfigUpdated) {
      window.backendAPI.onSyncConfigUpdated(callback);
    } else {
      window.backendAPI?.on?.('sync:config_updated', callback);
    }
  }

  // Setup event listeners for all sync events
  setupEventListeners() {
    // Listen for all sync events from IPC
    if (window.backendAPI?.on) {
      window.backendAPI.on('sync:manual_completed', (data: any) => {
        // Dispatch custom event for React components
        window.dispatchEvent(new CustomEvent('sync-manual-completed', { detail: data }));
      });

      window.backendAPI.on('sync:products_completed', (data: any) => {
        window.dispatchEvent(new CustomEvent('sync-products-completed', { detail: data }));
      });

      window.backendAPI.on('sync:config_updated', (data: any) => {
        window.dispatchEvent(new CustomEvent('sync-config-updated', { detail: data }));
      });
    }
  }

  // React hook style event subscription (for use in React components)
  subscribeToSyncEvents(eventType: string, callback: (data: any) => void) {
    const eventName = `sync-${eventType}`;
    const handler = (event: CustomEvent) => callback(event.detail);
    
    window.addEventListener(eventName, handler as EventListener);
    
    // Return cleanup function
    return () => {
      window.removeEventListener(eventName, handler as EventListener);
    };
  }
}

const syncAPI = new SyncAPI();

export default syncAPI;