// get_warehouse_sync_status.ipc.js
//@ts-check
const inventoryDB = require("../../../services/inventory_sync/inventoryDB");
const { AppDataSource } = require("../../db/dataSource");

/**
 * Get sync status for specific warehouse
 * @param {{ warehouseId: any; userId: any; }} params
 */
async function getWarehouseSyncStatus(params) {
  try {
    const { warehouseId, userId } = params;
    
    if (!warehouseId) {
      return {
        status: false,
        message: "Warehouse ID is required",
        data: null,
      };
    }

    console.log(`Getting warehouse sync status for ${warehouseId} (requested by user: ${userId})`);

    // Check inventory connection
    const connectionStatus = await inventoryDB.checkConnection();
    
    if (!connectionStatus.connected) {
      return {
        status: false,
        message: `Cannot connect to inventory database: ${connectionStatus.message}`,
        data: null,
      };
    }

    // Connect to inventory
    await inventoryDB.connect();
    
    try {
      // Get warehouse info from inventory
      const warehouseInfo = await inventoryDB.getWarehouseById(warehouseId);
      
      if (!warehouseInfo) {
        return {
          status: false,
          message: `Warehouse ${warehouseId} not found in inventory system`,
          data: null,
        };
      }

      // Get warehouse products from inventory
      const inventoryProducts = await inventoryDB.getProductsByWarehouse(warehouseId);
      
      // Get POS products for this warehouse
      const productRepo = AppDataSource.getRepository("Product");
      const posProducts = await productRepo.find({
        where: { 
          warehouse_id: warehouseId,
          is_deleted: false 
        }
      });

      // Get sync status
      const syncedProducts = posProducts.filter(p => 
        p.sync_status === "synced" || p.sync_status === "pending"
      );
      
      const outOfSyncProducts = posProducts.filter(p => 
        p.sync_status === "out_of_sync" || !p.sync_status
      );

      return {
        status: true,
        message: `Warehouse ${warehouseInfo.name} sync status retrieved`,
        data: {
          warehouse: warehouseInfo,
          inventory: {
            productCount: inventoryProducts.length,
            totalStock: inventoryProducts.reduce((/** @type {any} */ sum, /** @type {{ warehouse_stock: any; }} */ p) => sum + (p.warehouse_stock || 0), 0)
          },
          pos: {
            productCount: posProducts.length,
            syncedCount: syncedProducts.length,
            outOfSyncCount: outOfSyncProducts.length
          },
          syncStatus: {
            percentage: posProducts.length > 0 ? 
              Math.round((syncedProducts.length / posProducts.length) * 100) : 0,
            needsSync: outOfSyncProducts.length > 0,
            lastSync: posProducts.length > 0 ? 
              Math.max(...posProducts.map(p => p.last_sync_at || 0)) : null
          }
        },
      };
    } finally {
      await inventoryDB.disconnect();
    }
  } catch (error) {
    console.error("getWarehouseSyncStatus error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get warehouse sync status: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getWarehouseSyncStatus;