//@ts-check

const inventoryConfig = require("../../../services/inventory_sync/inventoryConfig");
const inventoryDB = require("../../../services/inventory_sync/inventoryDB");

/**
 * Check inventory database connection
 * @param {{ userId: any; }} params
 */
async function checkInventoryConnection(params) {
  try {
    // @ts-ignore
    const { userId } = params;

    console.log(`Checking inventory connection (requested by user: ${userId})`);

    const connectionStatus = await inventoryDB.checkConnection();

    // Update system settings with connection status
    await inventoryConfig.updateSetting(
      "inventory_connection_status",
      connectionStatus.connected ? "connected" : "disconnected",
      // @ts-ignore
      connectionStatus.message,
    );

    // Get current sync configuration
    const syncConfig = await inventoryConfig.getSyncConfig();

    return {
      status: true,
      message: "Inventory connection checked successfully",
      data: {
        connection: connectionStatus,
        config: syncConfig,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("checkInventoryConnection error:", error);

    await inventoryConfig.updateSetting(
      "inventory_connection_status",
      "error",
      // @ts-ignore
      `Connection check failed: ${error.message}`,
    );

    return {
      status: false,
      // @ts-ignore
      message: `Connection check failed: ${error.message}`,
      data: null,
    };
  }
}

module.exports = checkInventoryConnection;
