// get_available_warehouses.ipc.js
//@ts-check
const inventoryDB = require("../../../services/inventory_sync/inventoryDB");
const inventoryConfig = require("../../../services/inventory_sync/inventoryConfig");

/**
 * Get available warehouses from inventory system
 * @param {{ userId: any; }} params
 */
async function getAvailableWarehouses(params) {
  try {
    // @ts-ignore
    const { userId } = params;

    console.log(`Getting available warehouses (requested by user: ${userId})`);

    // Check connection first
    const connectionStatus = await inventoryDB.checkConnection();
    
    if (!connectionStatus.connected) {
      return {
        status: false,
        message: `Cannot connect to inventory database: ${connectionStatus.message}`,
        data: null,
      };
    }

    // Connect and get warehouses
    await inventoryDB.connect();
    
    try {
      const warehouses = await inventoryDB.getWarehouses();
      
      // Get current warehouse from settings
      const currentWarehouseId = await inventoryConfig.getSetting("current_warehouse_id");
      const currentWarehouseName = await inventoryConfig.getSetting("current_warehouse_name");
      
      return {
        status: true,
        message: `Found ${warehouses.length} warehouses`,
        data: {
          warehouses,
          currentWarehouse: currentWarehouseId ? {
            id: currentWarehouseId,
            name: currentWarehouseName
          } : null,
          total: warehouses.length,
          timestamp: new Date().toISOString(),
        },
      };
    } finally {
      await inventoryDB.disconnect();
    }
  } catch (error) {
    console.error("getAvailableWarehouses error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get warehouses: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getAvailableWarehouses;