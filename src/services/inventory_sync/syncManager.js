// syncManager.js - UPDATED VERSION WITH EXISTENCE CHECK AND UNIQUE STOCK_ITEM_ID
//@ts-check
const inventoryDB = require("./inventoryDB");
const syncDataManager = require("./syncDataManager");
const inventoryConfig = require("./inventoryConfig");
const { logger } = require("../../utils/logger");
const { AppDataSource } = require("../../main/db/dataSource");
const { withTransaction } = require("../../utils/transactionWrapper");

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
        logger.info("Sync manager disabled by configuration");
      }
    } catch (error) {
      // @ts-ignore
      logger.error("Failed to start sync manager:", error);
    }
  }

  async stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    logger.info("Sync manager stopped");
  }

  async autoSync(userInfo = null) {
    if (this.isSyncing) {
      logger.debug("Sync already in progress, skipping");
      return;
    }

    this.isSyncing = true;

    try {
      logger.info("Starting automatic sync...");

      // Record sync start for overall sync operation
      const syncRecord = await syncDataManager.recordSyncStart(
        "ProductBatch",
        `batch-${Date.now()}`,
        "inbound",
        "auto",
        { trigger: "automatic", timestamp: new Date().toISOString() },
        // @ts-ignore
        userInfo,
      );

      this.currentSyncRecordId = syncRecord.id;

      // Sync products FROM inventory TO POS
      const result = await this.syncProductsFromInventory(userInfo);

      // Update sync record with results
      const stats = {
        itemsProcessed:
          (result.created || 0) + (result.updated || 0) + (result.failed || 0),
        itemsSucceeded: (result.created || 0) + (result.updated || 0),
        itemsFailed: result.failed || 0,
      };

      if (result.success) {
        await syncDataManager.recordSyncSuccess(
          // @ts-ignore
          syncRecord.id,
          result,
          stats,
        );

        // Update last sync time
        await inventoryConfig.updateLastSync(new Date().toISOString());
        this.lastSyncTime = new Date();

        logger.info(
          `Automatic sync completed. Created: ${result.created}, Updated: ${result.updated}, Failed: ${result.failed}`,
        );
      } else {
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          syncRecord.id,
          new Error(result.error || "Sync failed"),
          stats,
        );

        logger.error(`Automatic sync failed: ${result.error}`);
      }
    } catch (error) {
      // @ts-ignore
      logger.error("Automatic sync failed:", error);

      if (this.currentSyncRecordId) {
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          this.currentSyncRecordId,
          error,
          { itemsProcessed: 0, itemsSucceeded: 0, itemsFailed: 0 },
        );
      }
    } finally {
      this.isSyncing = false;
      this.currentSyncRecordId = null;
    }
  }

  async syncProductsFromInventory(userInfo = null) {
    return await withTransaction(
      async (
        /** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner,
      ) => {
        // 1. Connect to inventory database
        await inventoryDB.connect();

        try {
          // 2. Get all active products from inventory
          const inventoryProducts = await inventoryDB.getAllProducts();

          // 3. Sync to POS database
          const productRepo = queryRunner.manager.getRepository("Product");

          let created = 0;
          let updated = 0;
          let failed = 0;
          let failedItems = [];

          for (const invProduct of inventoryProducts) {
            if (!invProduct.is_active) continue;

            try {
              // Check if product exists in POS by stock_item_id (PRIMARY KEY FOR SYNC)
              const existingProduct = await productRepo.findOne({
                where: [{ stock_item_id: invProduct.inventory_id.toString() }],
              });

              // If exists by stock_item_id, update it
              if (existingProduct) {
                // Record individual product sync
                const productSyncRecord = await syncDataManager.recordSyncStart(
                  "Product",
                  existingProduct.id.toString(),
                  "inbound",
                  "auto",
                  {
                    inventoryId: invProduct.inventory_id,
                    action: "update",
                    timestamp: new Date().toISOString(),
                  },
                  // @ts-ignore
                  userInfo,
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
                  existingProduct.barcode = invProduct.barcode;
                  existingProduct.sku =
                    invProduct.sku || `INV-${invProduct.inventory_id}`;
                  existingProduct.updated_at = new Date();
                  existingProduct.stock_item_id =
                    invProduct.inventory_id.toString();

                  await productRepo.save(existingProduct);
                  updated++;

                  await syncDataManager.recordSyncSuccess(
                    // @ts-ignore
                    productSyncRecord.id,
                    { productId: existingProduct.id, action: "updated" },
                  );
                } catch (error) {
                  failed++;
                  failedItems.push({
                    product: invProduct.name,
                    // @ts-ignore
                    error: error.message,
                  });

                  await syncDataManager.recordSyncFailure(
                    // @ts-ignore
                    productSyncRecord.id,
                    error,
                  );
                }
              } else {
                // Check if exists by SKU or barcode (fallback)
                const existingBySkuOrBarcode = await productRepo.findOne({
                  where: [
                    { sku: invProduct.sku },
                    { barcode: invProduct.barcode },
                  ],
                });

                if (existingBySkuOrBarcode) {
                  // Record individual product sync
                  const productSyncRecord =
                    await syncDataManager.recordSyncStart(
                      "Product",
                      existingBySkuOrBarcode.id.toString(),
                      "inbound",
                      "auto",
                      {
                        inventoryId: invProduct.inventory_id,
                        action: "link_existing",
                        timestamp: new Date().toISOString(),
                      },
                      // @ts-ignore
                      userInfo,
                    );

                  try {
                    // Update existing product with stock_item_id
                    existingBySkuOrBarcode.name = invProduct.name;
                    existingBySkuOrBarcode.price = invProduct.price || 0;
                    existingBySkuOrBarcode.stock = invProduct.total_stock || 0;
                    existingBySkuOrBarcode.min_stock =
                      invProduct.min_stock || 0;
                    existingBySkuOrBarcode.cost_price = invProduct.cost_price;
                    existingBySkuOrBarcode.category_name =
                      invProduct.category_name;
                    existingBySkuOrBarcode.supplier_name =
                      invProduct.supplier_name;
                    existingBySkuOrBarcode.description = invProduct.description;
                    existingBySkuOrBarcode.barcode =
                      invProduct.barcode || existingBySkuOrBarcode.barcode;
                    existingBySkuOrBarcode.sku =
                      invProduct.sku || existingBySkuOrBarcode.sku;
                    existingBySkuOrBarcode.updated_at = new Date();
                    existingBySkuOrBarcode.stock_item_id =
                      invProduct.inventory_id.toString();

                    await productRepo.save(existingBySkuOrBarcode);
                    updated++;

                    await syncDataManager.recordSyncSuccess(
                      // @ts-ignore
                      productSyncRecord.id,
                      {
                        productId: existingBySkuOrBarcode.id,
                        action: "linked",
                      },
                    );
                  } catch (error) {
                    failed++;
                    failedItems.push({
                      product: invProduct.name,
                      // @ts-ignore
                      error: error.message,
                    });

                    await syncDataManager.recordSyncFailure(
                      // @ts-ignore
                      productSyncRecord.id,
                      error,
                    );
                  }
                } else {
                  // Record individual product sync
                  const productSyncRecord =
                    await syncDataManager.recordSyncStart(
                      "Product",
                      `new-${invProduct.inventory_id}`,
                      "inbound",
                      "auto",
                      {
                        inventoryId: invProduct.inventory_id,
                        action: "create",
                        timestamp: new Date().toISOString(),
                      },
                      // @ts-ignore
                      userInfo,
                    );

                  try {
                    // Create new product in POS
                    const newProduct = productRepo.create({
                      sku: invProduct.sku || `INV-${invProduct.inventory_id}`,
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
                      updated_at: new Date(),
                    });

                    await productRepo.save(newProduct);
                    created++;

                    await syncDataManager.recordSyncSuccess(
                      // @ts-ignore
                      productSyncRecord.id,
                      { productId: newProduct.id, action: "created" },
                    );
                  } catch (error) {
                    failed++;
                    failedItems.push({
                      product: invProduct.name,
                      // @ts-ignore
                      error: error.message,
                    });

                    await syncDataManager.recordSyncFailure(
                      // @ts-ignore
                      productSyncRecord.id,
                      error,
                    );
                  }
                }
              }
            } catch (error) {
              failed++;
              failedItems.push({
                product: invProduct.name,
                // @ts-ignore
                error: error.message,
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
            failedItems: failedItems.length > 0 ? failedItems : undefined,
          };

          logger.info(
            `Products sync completed. Created: ${created}, Updated: ${updated}, Failed: ${failed}`,
          );
          return result;
        } finally {
          // Always disconnect from inventory DB
          await inventoryDB.disconnect();
        }
      },
      {
        name: "syncProductsFromInventory",
        timeout: 60000, // 1 minute timeout
        autoRollbackOnError: true,
      },
    ).catch((error) => {
      logger.error("Failed to sync products from inventory:", error);

      return {
        success: false,
        error: error.message,
        created: 0,
        updated: 0,
        failed: 0,
      };
    });
  }

  /**
   * @param {{ id: { toString: () => string; }; items: any; }} saleData
   */
  async updateInventoryStockFromSale(saleData, userInfo = null) {
    // @ts-ignore
    return await withTransaction(
      // @ts-ignore
      async (/** @type {any} */ queryRunner) => {
        await inventoryDB.connect();

        try {
          const updates = [];
          const results = [];
          let successCount = 0;
          let failedCount = 0;

          // Record overall sale sync
          const saleSyncRecord = await syncDataManager.recordSyncStart(
            "Sale",
            saleData.id.toString(),
            "outbound",
            "auto",
            { saleId: saleData.id, action: "stock_update" },
            // @ts-ignore
            userInfo,
          );

          // Process each sale item
          for (const item of saleData.items) {
            const product = item.product;

            if (product.stock_item_id) {
              updates.push({
                inventoryId: parseInt(product.stock_item_id),
                quantityChange: -item.quantity, // Negative for sale
                action: "sale",
                productName: product.name,
                saleId: saleData.id,
                itemId: item.id,
              });
            }
          }

          // Bulk update inventory stock
          if (updates.length > 0) {
            // @ts-ignore
            const inventoryResults = await inventoryDB.bulkUpdateStock(
              updates,
              // @ts-ignore
              userInfo?.id || "pos_system",
            );

            // Process results and record individual syncs
            for (const result of inventoryResults) {
              const itemSyncRecord = await syncDataManager.recordSyncStart(
                "SaleItem",
                result.itemId.toString(),
                "outbound",
                "auto",
                result,
                // @ts-ignore
                userInfo,
              );

              if (result.success) {
                successCount++;
                await syncDataManager.recordSyncSuccess(
                  // @ts-ignore
                  itemSyncRecord.id,
                  result,
                );
              } else {
                failedCount++;
                await syncDataManager.recordSyncFailure(
                  // @ts-ignore
                  itemSyncRecord.id,
                  // @ts-ignore
                  new Error(result.error || "Stock update failed"),
                );
              }

              results.push(result);
            }

            // Update overall sale sync record
            const stats = {
              itemsProcessed: updates.length,
              itemsSucceeded: successCount,
              itemsFailed: failedCount,
            };

            if (failedCount === 0) {
              await syncDataManager.recordSyncSuccess(
                // @ts-ignore
                saleSyncRecord.id,
                { saleId: saleData.id, results },
                stats,
              );
            } else if (successCount > 0) {
              await syncDataManager.recordPartialSync(
                "Sale",
                saleData.id.toString(),
                "outbound",
                { saleId: saleData.id, results },
                stats,
                // @ts-ignore
                userInfo,
              );
            } else {
              await syncDataManager.recordSyncFailure(
                // @ts-ignore
                saleSyncRecord.id,
                new Error("All stock updates failed"),
                stats,
              );
            }

            logger.info(
              `Inventory stock updated: ${successCount} successful, ${failedCount} failed`,
            );
          }

          return {
            success: true,
            updates,
            results,
            summary: { successCount, failedCount, total: updates.length },
          };
        } finally {
          // Always disconnect from inventory DB
          await inventoryDB.disconnect();
        }
      },
      {
        name: "updateInventoryStockFromSale",
        timeout: 60000, // 1 minute timeout
        autoRollbackOnError: true,
      },
    ).catch((error) => {
      logger.error("Failed to update inventory stock from sale:", error);
      throw error;
    });
  }

  async getSyncStatus() {
    const config = await inventoryConfig.getSyncConfig();
    const pendingSyncs = await syncDataManager.getPendingSyncs();

    // Get recent sync stats
    const recentStats = await syncDataManager.getSyncStats("hour");

    return {
      enabled: config.enabled,
      lastSync: config.lastSync,
      isSyncing: this.isSyncing,
      pendingSyncs: pendingSyncs.length,
      // @ts-ignore
      connectionStatus: await inventoryConfig.getSetting(
        "inventory_connection_status",
        // @ts-ignore
        "not_checked",
      ),
      recentStats: recentStats.summary,
      lastSyncTime: this.lastSyncTime,
    };
  }

  async getDetailedSyncHistory(entityType = null, entityId = null, limit = 50) {
    // @ts-ignore
    return await syncDataManager.getSyncHistory(entityType, entityId, limit);
  }

  async getSyncStats(timeRange = "day") {
    return await syncDataManager.getSyncStats(timeRange);
  }

  async testConnection() {
    try {
      const result = await inventoryDB.checkConnection();

      await inventoryConfig.updateSetting(
        "inventory_connection_status",
        result.connected ? "connected" : "disconnected",
      );

      return result;
    } catch (error) {
      await inventoryConfig.updateSetting(
        "inventory_connection_status",
        "error",
      );

      throw error;
    }
  }

  async manualSync(userInfo = null, options = {}) {
    try {
      // @ts-ignore
      logger.info(
        // @ts-ignore
        `Manual sync requested by: ${userInfo?.username || "system"}`,
      );

      const syncRecord = await syncDataManager.recordSyncStart(
        "ProductBatch",
        `manual-${Date.now()}`,
        "inbound",
        "manual",
        {
          ...options,
          triggeredBy: userInfo,
          timestamp: new Date().toISOString(),
        },
        // @ts-ignore
        userInfo,
      );

      this.currentSyncRecordId = syncRecord.id;

      const result = await this.syncProductsFromInventory(userInfo);

      const stats = {
        itemsProcessed:
          (result.created || 0) + (result.updated || 0) + (result.failed || 0),
        itemsSucceeded: (result.created || 0) + (result.updated || 0),
        itemsFailed: result.failed || 0,
      };

      if (result.success) {
        await syncDataManager.recordSyncSuccess(
          // @ts-ignore
          syncRecord.id,
          result,
          stats,
        );

        await inventoryConfig.updateLastSync(new Date().toISOString());
        this.lastSyncTime = new Date();

        logger.info("Manual sync completed successfully");
      } else {
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          syncRecord.id,
          new Error(result.error || "Manual sync failed"),
          stats,
        );
      }

      return result;
    } catch (error) {
      // @ts-ignore
      logger.error("Manual sync failed:", error);

      if (this.currentSyncRecordId) {
        await syncDataManager.recordSyncFailure(
          // @ts-ignore
          this.currentSyncRecordId,
          error,
          { itemsProcessed: 0, itemsSucceeded: 0, itemsFailed: 0 },
        );
      }

      throw error;
    } finally {
      this.currentSyncRecordId = null;
    }
  }

  // New method: Find product by stock_item_id
  /**
   * @param {{ toString: () => any; }} stockItemId
   */
  async findProductByStockItemId(stockItemId) {
    const productRepo = AppDataSource.getRepository("Product");
    return await productRepo.findOne({
      where: { stock_item_id: stockItemId.toString() },
    });
  }

  // New method: Find product by SKU or barcode
  /**
   * @param {any} sku
   * @param {any} barcode
   */
  async findProductBySkuOrBarcode(sku, barcode) {
    const productRepo = AppDataSource.getRepository("Product");
    const conditions = [];

    if (sku) conditions.push({ sku });
    if (barcode) conditions.push({ barcode });

    return await productRepo.findOne({
      where: conditions,
    });
  }

  // New method: Link existing product with stock_item_id
  /**
   * @param {any} productId
   * @param {{ toString: () => any; }} stockItemId
   */
  async linkProductWithStockItemId(productId, stockItemId) {
    const productRepo = AppDataSource.getRepository("Product");
    const product = await productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Check if stock_item_id is already used by another product
    const existing = await this.findProductByStockItemId(stockItemId);
    if (existing && existing.id !== productId) {
      throw new Error(
        `Stock item ID ${stockItemId} is already linked to product: ${existing.name} (ID: ${existing.id})`,
      );
    }

    product.stock_item_id = stockItemId.toString();
    product.updated_at = new Date();

    return await productRepo.save(product);
  }

  // Add to syncManager.js after existing methods:

  /**
   * Sync products from specific warehouse
   * @param {any} warehouseId
   */
  // @ts-ignore
  async syncProductsFromWarehouse(warehouseId, userInfo = null) {
    return await withTransaction(async (/** @type {{ manager: { getRepository: (arg0: string) => any; }; }} */ queryRunner) => {
      await inventoryDB.connect();

      try {
        // Get warehouse info
        const warehouseInfo = await inventoryDB.getWarehouseById(warehouseId);
        if (!warehouseInfo) {
          throw new Error(`Warehouse ${warehouseId} not found in inventory`);
        }

        // Get products for this warehouse
        const warehouseProducts =
          await inventoryDB.getProductsByWarehouse(warehouseId);
        const productRepo = queryRunner.manager.getRepository("Product");

        let created = 0;
        let updated = 0;
        let failed = 0;

        for (const invProduct of warehouseProducts) {
          try {
            const syncId = `wh-${warehouseId}-${invProduct.inventory_id}`;

            // Find or create product
            let product = await productRepo.findOne({
              where: { sync_id: syncId },
            });

            if (product) {
              // Update existing
              product.name = invProduct.name;
              product.price = invProduct.price || 0;
              product.stock = invProduct.warehouse_stock || 0;
              product.warehouse_id = warehouseId;
              product.warehouse_name = warehouseInfo.name;
              product.updated_at = new Date();
              await productRepo.save(product);
              updated++;
            } else {
              // Create new
              const newProduct = productRepo.create({
                sync_id: syncId,
                sku: invProduct.sku || syncId,
                name: invProduct.name,
                price: invProduct.price || 0,
                stock: invProduct.warehouse_stock || 0,
                warehouse_id: warehouseId,
                warehouse_name: warehouseInfo.name,
                stock_item_id: invProduct.inventory_id,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
              });
              await productRepo.save(newProduct);
              created++;
            }
          } catch (error) {
            failed++;
            logger.error(
              `Failed to sync product from warehouse ${warehouseId}:`,
              // @ts-ignore
              error,
            );
          }
        }

        return {
          success: true,
          warehouse: warehouseInfo,
          created,
          updated,
          failed,
          total: warehouseProducts.length,
        };
      } finally {
        await inventoryDB.disconnect();
      }
    }).catch((error) => {
      logger.error(`Warehouse sync failed for ${warehouseId}:`, error);
      throw error;
    });
  }

  /**
   * Get available warehouses for sync
   */
  async getAvailableWarehouses() {
    try {
      await inventoryDB.connect();
      const warehouses = await inventoryDB.getWarehouses();
      await inventoryDB.disconnect();

      return warehouses;
    } catch (error) {
      // @ts-ignore
      logger.error("Failed to get warehouses:", error);
      return [];
    }
  }

  /**
   * Get warehouse sync status
   * @param {any} warehouseId
   */
  async getWarehouseSyncStatus(warehouseId) {
    const connection = await this.testConnection();
    if (!connection.connected) {
      return {
        connected: false,
        message: "Inventory database not connected",
      };
    }

    try {
      await inventoryDB.connect();
      const warehouse = await inventoryDB.getWarehouseById(warehouseId);
      const products = await inventoryDB.getProductsByWarehouse(warehouseId);
      await inventoryDB.disconnect();

      return {
        connected: true,
        warehouse,
        productCount: products.length,
        hasProducts: products.length > 0,
      };
    } catch (error) {
      return {
        connected: false,
        // @ts-ignore
        message: error.message,
      };
    }
  }
}

module.exports = new SyncManager();
