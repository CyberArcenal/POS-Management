// syncManager.js - UPDATED VERSION WITH SYNC DATA TRACKING AND TRANSACTION WRAPPING
//@ts-check
const inventoryDB = require('./inventoryDB');
const syncDataManager = require('./syncDataManager');
const inventoryConfig = require('./inventoryConfig');
const { logger } = require('../../utils/logger');
const { AppDataSource } = require('../../main/db/dataSource');
const { withTransaction } = require('../../utils/transactionWrapper');

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.currentSyncRecordId = null;
  }

  async start() {
    try {
      const config = await inventoryConfig.getSyncConfig();
      
      if (config.enabled) {
        const interval = config.syncInterval || 300000; // 5 minutes default
        
        this.syncInterval = setInterval(() => {
          this.autoSync();
        }, interval);
        
        logger.info(`Sync manager started. Interval: ${interval}ms`);
        
        // Initial sync after 10 seconds
        setTimeout(() => {
          this.autoSync();
        }, 10000);
      } else {
        logger.info('Sync manager disabled by configuration');
      }
    } catch (error) {
      // @ts-ignore
      logger.error('Failed to start sync manager:', error);
    }
  }

  async stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.info('Sync manager stopped');
  }

  async autoSync(userInfo = null) {
    if (this.isSyncing) {
      logger.debug('Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;

    try {
      logger.info('Starting automatic sync...');
      
      // Record sync start for overall sync operation
      const syncRecord = await syncDataManager.recordSyncStart(
        'System',
        'auto-sync',
        'inbound',
        'auto',
        { trigger: 'automatic' },
        // @ts-ignore
        userInfo
      );
      
      this.currentSyncRecordId = syncRecord.id;
      
      // Sync products FROM inventory TO POS
      const result = await this.syncProductsFromInventory(userInfo);
      
      // Update sync record with results
      const stats = {
        itemsProcessed: (result.created || 0) + (result.updated || 0),
        itemsSucceeded: (result.created || 0) + (result.updated || 0),
        itemsFailed: 0
      };
      
      if (result.success) {
        await syncDataManager.recordSyncSuccess(
          // @ts-ignore
          syncRecord.id, 
          result, 
          stats
        );
        
        // Update last sync time
        await inventoryConfig.updateLastSync(new Date().toISOString());
        this.lastSyncTime = new Date();
        
        logger.info('Automatic sync completed successfully');
      } else {
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          syncRecord.id,
          // @ts-ignore
          new Error(result.error || 'Sync failed'),
          stats
        );
        
        // @ts-ignore
        logger.error('Automatic sync failed:', result.error);
      }
      
    } catch (error) {
      // @ts-ignore
      logger.error('Automatic sync failed:', error);
      
      if (this.currentSyncRecordId) {
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          this.currentSyncRecordId,
          error,
          { itemsProcessed: 0, itemsSucceeded: 0, itemsFailed: 0 }
        );
      }
    } finally {
      this.isSyncing = false;
      this.currentSyncRecordId = null;
    }
  }

  async syncProductsFromInventory(userInfo = null) {
    return await withTransaction(async (/** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
      // 1. Connect to inventory database
      await inventoryDB.connect();
      
      try {
        // 2. Get all active products from inventory
        const inventoryProducts = await inventoryDB.getAllProducts();
        
        // 3. Sync to POS database
        const productRepo = queryRunner.manager.getRepository('Product');
        
        let created = 0;
        let updated = 0;
        let failed = 0;
        let failedItems = [];
        
        for (const invProduct of inventoryProducts) {
          if (!invProduct.is_active) continue;
          
          try {
            // Check if product exists in POS by SKU or barcode
            const existingProduct = await productRepo.findOne({
              where: [
                { sku: invProduct.sku },
                { barcode: invProduct.barcode }
              ]
            });
            
            if (existingProduct) {
              // Record individual product sync
              const productSyncRecord = await syncDataManager.recordSyncStart(
                'Product',
                existingProduct.id.toString(),
                'inbound',
                'auto',
                { inventoryId: invProduct.inventory_id, action: 'update' },
                // @ts-ignore
                userInfo
              );
              
              try {
                // Update existing product
                existingProduct.name = invProduct.name;
                existingProduct.price = invProduct.price || 0;
                existingProduct.stock = invProduct.total_stock || 0;
                existingProduct.min_stock = invProduct.min_stock || 0;
                existingProduct.cost_price = invProduct.cost_price;
                existingProduct.category_name = invProduct.category_name;
                existingProduct.supplier_name = invProduct.supplier_name;
                existingProduct.description = invProduct.description;
                existingProduct.updated_at = new Date();
                existingProduct.stock_item_id = invProduct.inventory_id.toString();
                
                await productRepo.save(existingProduct);
                updated++;
                
                await syncDataManager.recordSyncSuccess(
                  // @ts-ignore
                  productSyncRecord.id,
                  { productId: existingProduct.id, action: 'updated' }
                );
                
              } catch (error) {
                failed++;
                failedItems.push({
                  product: invProduct.name,
                  // @ts-ignore
                  error: error.message
                });
                
                await syncDataManager.recordSyncFailure(
                  // @ts-ignore
                  productSyncRecord.id,
                  error
                );
              }
              
            } else {
              // Record individual product sync
              const productSyncRecord = await syncDataManager.recordSyncStart(
                'Product',
                `new-${invProduct.inventory_id}`,
                'inbound',
                'auto',
                { inventoryId: invProduct.inventory_id, action: 'create' },
                // @ts-ignore
                userInfo
              );
              
              try {
                // Create new product in POS
                const newProduct = productRepo.create({
                  sku: invProduct.sku || `INV-${Date.now()}`,
                  name: invProduct.name,
                  price: invProduct.price || 0,
                  stock: invProduct.total_stock || 0,
                  min_stock: invProduct.min_stock || 0,
                  barcode: invProduct.barcode,
                  cost_price: invProduct.cost_price,
                  category_name: invProduct.category_name,
                  supplier_name: invProduct.supplier_name,
                  description: invProduct.description,
                  stock_item_id: invProduct.inventory_id.toString(),
                  is_active: true,
                  created_at: new Date(),
                  updated_at: new Date()
                });
                
                await productRepo.save(newProduct);
                created++;
                
                await syncDataManager.recordSyncSuccess(
                  // @ts-ignore
                  productSyncRecord.id,
                  { productId: newProduct.id, action: 'created' }
                );
                
              } catch (error) {
                failed++;
                failedItems.push({
                  product: invProduct.name,
                  // @ts-ignore
                  error: error.message
                });
                
                await syncDataManager.recordSyncFailure(
                  // @ts-ignore
                  productSyncRecord.id,
                  error
                );
              }
            }
            
          } catch (error) {
            failed++;
            failedItems.push({
              product: invProduct.name,
              // @ts-ignore
              error: error.message
            });
            
            // @ts-ignore
            logger.error(`Failed to sync product ${invProduct.name}:`, error);
          }
        }
        
        const result = {
          success: true,
          created,
          updated,
          failed,
          total: inventoryProducts.length,
          failedItems: failedItems.length > 0 ? failedItems : undefined
        };
        
        logger.info(`Products sync completed. Created: ${created}, Updated: ${updated}, Failed: ${failed}`);
        return result;
        
      } finally {
        // Always disconnect from inventory DB
        await inventoryDB.disconnect();
      }
    }, {
      name: 'syncProductsFromInventory',
      timeout: 60000, // 1 minute timeout
      autoRollbackOnError: true
    }).catch(error => {
      // @ts-ignore
      logger.error('Failed to sync products from inventory:', error);
      
      return {
        success: false,
        // @ts-ignore
        error: error.message,
        created: 0,
        updated: 0,
        failed: 0
      };
    });
  }

  // @ts-ignore
  async updateInventoryStockFromSale(saleData, userInfo = null) {
    return await withTransaction(async (/** @type {any} */ queryRunner) => {
      await inventoryDB.connect();
      
      try {
        const updates = [];
        const results = [];
        let successCount = 0;
        let failedCount = 0;
        
        // Record overall sale sync
        const saleSyncRecord = await syncDataManager.recordSyncStart(
          'Sale',
          saleData.id.toString(),
          'outbound',
          'auto',
          { saleId: saleData.id, action: 'stock_update' },
          // @ts-ignore
          userInfo
        );
        
        // Process each sale item
        for (const item of saleData.items) {
          const product = item.product;
          
          if (product.stock_item_id) {
            updates.push({
              inventoryId: parseInt(product.stock_item_id),
              quantityChange: -item.quantity, // Negative for sale
              action: 'sale',
              productName: product.name,
              saleId: saleData.id,
              itemId: item.id
            });
          }
        }
        
        // Bulk update inventory stock
        if (updates.length > 0) {
          // @ts-ignore
          const inventoryResults = await inventoryDB.bulkUpdateStock(updates, userInfo?.id || 'pos_system');
          
          // Process results and record individual syncs
          for (const result of inventoryResults) {
            const itemSyncRecord = await syncDataManager.recordSyncStart(
              'SaleItem',
              result.itemId.toString(),
              'outbound',
              'auto',
              result,
              // @ts-ignore
              userInfo
            );
            
            if (result.success) {
              successCount++;
              await syncDataManager.recordSyncSuccess(
                // @ts-ignore
                itemSyncRecord.id,
                result
              );
            } else {
              failedCount++;
              await syncDataManager.recordSyncFailure(
                // @ts-ignore
                itemSyncRecord.id,
                // @ts-ignore
                new Error(result.error || 'Stock update failed')
              );
            }
            
            results.push(result);
          }
          
          // Update overall sale sync record
          const stats = {
            itemsProcessed: updates.length,
            itemsSucceeded: successCount,
            itemsFailed: failedCount
          };
          
          if (failedCount === 0) {
            await syncDataManager.recordSyncSuccess(
              // @ts-ignore
              saleSyncRecord.id,
              { saleId: saleData.id, results },
              stats
            );
          } else if (successCount > 0) {
            await syncDataManager.recordPartialSync(
              'Sale',
              saleData.id.toString(),
              'outbound',
              { saleId: saleData.id, results },
              stats,
              // @ts-ignore
              userInfo
            );
          } else {
            await syncDataManager.recordSyncFailure(
              // @ts-ignore
              saleSyncRecord.id,
              new Error('All stock updates failed'),
              stats
            );
          }
          
          logger.info(`Inventory stock updated: ${successCount} successful, ${failedCount} failed`);
        }
        
        return { 
          success: true, 
          updates,
          results,
          summary: { successCount, failedCount, total: updates.length }
        };
        
      } finally {
        // Always disconnect from inventory DB
        await inventoryDB.disconnect();
      }
    }, {
      name: 'updateInventoryStockFromSale',
      timeout: 60000, // 1 minute timeout
      autoRollbackOnError: true
    }).catch(error => {
      // @ts-ignore
      logger.error('Failed to update inventory stock from sale:', error);
      
      // Record sync failure
      // @ts-ignore
      if (saleSyncRecord) {
        syncDataManager.recordSyncFailure(
          // @ts-ignore
          saleSyncRecord.id,
          // @ts-ignore
          error,
          // @ts-ignore
          { itemsProcessed: updates?.length || 0, itemsSucceeded: 0, itemsFailed: updates?.length || 0 }
        );
      }
      
      throw error;
    });
  }

  async getSyncStatus() {
    const config = await inventoryConfig.getSyncConfig();
    const pendingSyncs = await syncDataManager.getPendingSyncs();
    
    // Get recent sync stats
    const recentStats = await syncDataManager.getSyncStats('hour');
    
    return {
      enabled: config.enabled,
      lastSync: config.lastSync,
      isSyncing: this.isSyncing,
      pendingSyncs: pendingSyncs.length,
      // @ts-ignore
      connectionStatus: await inventoryConfig.getSetting('inventory_connection_status', 'not_checked'),
      recentStats: recentStats.summary,
      lastSyncTime: this.lastSyncTime
    };
  }

  async getDetailedSyncHistory(entityType = null, entityId = null, limit = 50) {
    // @ts-ignore
    return await syncDataManager.getSyncHistory(entityType, entityId, limit);
  }

  async getSyncStats(timeRange = 'day') {
    return await syncDataManager.getSyncStats(timeRange);
  }

  async testConnection() {
    try {
      const result = await inventoryDB.checkConnection();
      
      await inventoryConfig.updateSetting(
        'inventory_connection_status',
        result.connected ? 'connected' : 'disconnected'
      );
      
      return result;
    } catch (error) {
      await inventoryConfig.updateSetting(
        'inventory_connection_status',
        'error'
      );
      
      throw error;
    }
  }

  async manualSync(userInfo = null, options = {}) {
    try {
      // @ts-ignore
      logger.info(`Manual sync requested by: ${userInfo?.username || 'system'}`);
      
      const syncRecord = await syncDataManager.recordSyncStart(
        'System',
        'manual-sync',
        'inbound',
        'manual',
        { ...options, triggeredBy: userInfo },
        // @ts-ignore
        userInfo
      );
      
      this.currentSyncRecordId = syncRecord.id;
      
      const result = await this.syncProductsFromInventory(userInfo);
      
      const stats = {
        itemsProcessed: (result.created || 0) + (result.updated || 0) + (result.failed || 0),
        itemsSucceeded: (result.created || 0) + (result.updated || 0),
        itemsFailed: result.failed || 0
      };
      
      if (result.success) {
        await syncDataManager.recordSyncSuccess(
          // @ts-ignore
          syncRecord.id,
          result,
          stats
        );
        
        await inventoryConfig.updateLastSync(new Date().toISOString());
        this.lastSyncTime = new Date();
        
        logger.info('Manual sync completed successfully');
      } else {
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          syncRecord.id,
          // @ts-ignore
          new Error(result.error || 'Manual sync failed'),
          stats
        );
      }
      
      return result;
      
    } catch (error) {
      // @ts-ignore
      logger.error('Manual sync failed:', error);
      
      if (this.currentSyncRecordId) {
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          this.currentSyncRecordId,
          error,
          { itemsProcessed: 0, itemsSucceeded: 0, itemsFailed: 0 }
        );
      }
      
      throw error;
    } finally {
      this.currentSyncRecordId = null;
    }
  }
}

module.exports = new SyncManager();