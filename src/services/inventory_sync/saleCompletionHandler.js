// services/inventory_sync/saleCompletionHandler.js
//@ts-check
const SyncManager = require('./syncManager');
const inventoryConfig = require('./inventoryConfig');

class SaleCompletionHandler {
  /**
     * @param {any} saleData
     * @param {string | undefined} userId
     */
  async handleSaleCompletion(saleData, userId) {
    try {
      // Check if auto-update is enabled
      const config = await inventoryConfig.getSyncConfig();
      
      if (config.autoUpdateOnSale && config.enabled) {
        // Update inventory stock
        // @ts-ignore
        await SyncManager.updateInventoryStockFromSale(saleData, userId);
        console.log('✅ Inventory stock updated after sale');
        return { 
          success: true, 
          inventoryUpdated: true,
          message: 'Inventory stock updated successfully'
        };
      }
      
      return { 
        success: true, 
        inventoryUpdated: false,
        message: 'Auto-update disabled, inventory not updated'
      };
    } catch (error) {
      console.error('❌ Failed to update inventory after sale:', error);
      // Sale still succeeds, but inventory sync failed (will retry)
      return { 
        success: true, // Sale still succeeds
        inventoryUpdated: false,
        // @ts-ignore
        error: error.message,
        message: 'Sale completed but inventory sync failed (will retry)'
      };
    }
  }
}

module.exports = new SaleCompletionHandler();