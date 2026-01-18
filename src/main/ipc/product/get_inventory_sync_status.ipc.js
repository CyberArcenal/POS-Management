//@ts-check

const inventoryConfig = require("../../../services/inventory_sync/inventoryConfig");

/**
 * Get current inventory sync status and configuration
 * @param {{ userId: any; }} params
 */
async function getInventorySyncStatus(params) {
  try {
    // @ts-ignore
    const { userId } = params;

    console.log(`Getting inventory sync status (requested by user: ${userId})`);

    const syncConfig = await inventoryConfig.getSyncConfig();
    const allSettings = await inventoryConfig.loadSettings();

    // Get last sync details if available
    let lastSyncDetails = null;
    if (syncConfig.lastSync) {
      // You could add more details here, like count of synced products
      lastSyncDetails = {
        timestamp: syncConfig.lastSync,
        // Add any additional sync statistics you track
      };
    }

    return {
      status: true,
      message: "Inventory sync status retrieved",
      data: {
        config: syncConfig,
        settings: allSettings,
        lastSync: lastSyncDetails,
        systemTime: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("getInventorySyncStatus error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get sync status: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getInventorySyncStatus;
