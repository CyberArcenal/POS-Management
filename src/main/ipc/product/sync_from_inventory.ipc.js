// sync_from_inventory.ipc.js - FIXED VERSION WITH WAREHOUSE CLEANUP
//@ts-check
const Product = require("../../../entities/Product");
const syncDataManager = require("../../../services/inventory_sync/syncDataManager");
const { log_audit } = require("../../../utils/auditLogger");
const inventoryConfig = require("../../../services/inventory_sync/inventoryConfig");
const inventoryDB = require("../../../services/inventory_sync/inventoryDB");
const { logger } = require("../../../utils/logger");

/**
 * Syncs products from inventory management system to POS - WAREHOUSE REQUIRED
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function syncProductsFromInventory(params, queryRunner) {
  let masterSyncRecord = null;
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    syncRecords: [],
    warehouseInfo: null,
    deletedOldProducts: 0,
    barcodeConflicts: [],
  };

  try {
    // @ts-ignore
    const {
      // @ts-ignore
      userId,
      // @ts-ignore
      warehouseId,
      // @ts-ignore
      fullSync = false,
      // @ts-ignore
      incremental = false,
      // @ts-ignore
      cleanupBeforeSync = true, // New parameter to control cleanup
    } = params;

    // VALIDATION: Warehouse ID is REQUIRED
    if (!warehouseId) {
      return {
        status: false,
        message: "Warehouse ID is required for inventory sync",
        data: null,
      };
    }

    const productRepo = queryRunner.manager.getRepository(Product);

    // Create master sync record
    masterSyncRecord = await syncDataManager.recordSyncStart(
      "ProductBatch",
      `warehouse-${warehouseId}-${Date.now()}`,
      "inbound",
      // @ts-ignore
      {
        syncType: incremental ? "incremental" : "full",
        warehouseId,
        userId,
        cleanupBeforeSync,
        timestamp: new Date().toISOString(),
      },
    );

    // Check inventory connection
    const connectionStatus = await inventoryDB.checkConnection();
    if (!connectionStatus.connected) {
      await syncDataManager.recordSyncFailure(
        // @ts-ignore
        masterSyncRecord.id,
        new Error(
          `Cannot connect to inventory database: ${connectionStatus.message}`,
        ),
      );
      return {
        status: false,
        message: `Cannot connect to inventory database: ${connectionStatus.message}`,
        data: results,
      };
    }

    // Connect to inventory database
    await inventoryDB.connect();

    try {
      // 1. Get warehouse info from inventory
      const warehouseInfo = await inventoryDB.getWarehouseById(warehouseId);
      if (!warehouseInfo) {
        throw new Error(
          `Warehouse ${warehouseId} not found in inventory system`,
        );
      }

      results.warehouseInfo = warehouseInfo;

      // 2. GET PRODUCTS FOR SPECIFIC WAREHOUSE FROM INVENTORY FIRST
      const inventoryProducts =
        await inventoryDB.getProductsByWarehouse(warehouseId);
      logger.info(
        `Found ${inventoryProducts.length} products in warehouse ${warehouseInfo.name}`,
      );

      // 3. GET EXISTING BARCODES FROM POS (ALL WAREHOUSES) FOR CONFLICT CHECK
      const allExistingProducts = await productRepo.find({
        select: ['id', 'barcode', 'name', 'warehouse_id']
      });
      
      const barcodeMap = new Map();
      const existingBarcodesInWarehouse = new Set();
      
      allExistingProducts.forEach(product => {
        // @ts-ignore
        if (product.barcode && product.barcode.trim() !== '') {
          barcodeMap.set(product.barcode, {
            id: product.id,
            name: product.name,
            warehouse_id: product.warehouse_id,
          });
          
          // Track barcodes in current warehouse for cleanup check
          if (product.warehouse_id == warehouseId) {
            existingBarcodesInWarehouse.add(product.barcode);
          }
        }
      });

      // 4. DELETE ALL PRODUCTS FROM CURRENT WAREHOUSE BEFORE SYNC (if cleanup enabled)
      if (cleanupBeforeSync) {
        const deleteResult = await productRepo
          .createQueryBuilder()
          .delete()
          .where("warehouse_id = :warehouseId", { warehouseId })
          .execute();
        
        results.deletedOldProducts = deleteResult.affected || 0;
        logger.info(`Deleted ${results.deletedOldProducts} old products from warehouse ${warehouseId}`);
        
        // Clear the barcode map entries for this warehouse
        for (const [barcode, product] of barcodeMap.entries()) {
          if (product.warehouse_id == warehouseId) {
            barcodeMap.delete(barcode);
          }
        }
      }

      // 5. SYNC NEW PRODUCTS FROM INVENTORY
      for (const invProduct of inventoryProducts) {
        await processWarehouseProduct(
          invProduct,
          warehouseId,
          warehouseInfo.name,
          productRepo,
          queryRunner,
          userId,
          fullSync,
          masterSyncRecord,
          results,
          barcodeMap,
        );
      }

      // 6. Update sync settings
      await inventoryConfig.updateLastSync();
      await inventoryConfig.updateSetting(
        "inventory_connection_status",
        "connected",
        // @ts-ignore
        `Synced with warehouse: ${warehouseInfo.name}`,
      );

      // Record master sync success
      await syncDataManager.recordSyncSuccess(
        // @ts-ignore
        masterSyncRecord.id,
        {
          summary: results,
          warehouse: warehouseInfo,
          totalProcessed: inventoryProducts.length,
          barcodeConflicts: results.barcodeConflicts,
        },
      );
    } finally {
      await inventoryDB.disconnect();
    }

    // Log audit
    await log_audit("sync_products", "Product", 0, userId, {
      source: "inventory_system",
      warehouseId,
      sync_type: incremental ? "incremental" : "full",
      cleanup: cleanupBeforeSync,
      results: results,
      masterSyncId: masterSyncRecord.id,
      barcodeConflicts: results.barcodeConflicts,
      timestamp: new Date().toISOString(),
    });

    return {
      status: true,
      // @ts-ignore
      message: `Products synced from warehouse ${results.warehouseInfo?.name}: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped, ${results.deletedOldProducts} old products deleted`,
      data: {
        ...results,
        masterSyncId: masterSyncRecord.id,
      },
    };
  } catch (error) {
    // @ts-ignore
    logger.error("syncProductsFromInventory error:", error);

    if (masterSyncRecord) {
      // @ts-ignore
      await syncDataManager.recordSyncFailure(masterSyncRecord.id, error);
    }

    await inventoryConfig.updateSetting(
      "inventory_connection_status",
      "error",
      // @ts-ignore
      `Warehouse sync error: ${error.message}`,
    );

    throw error;
  }
}

/**
 * Process product from specific warehouse - SIMPLIFIED VERSION
 * @param {{ inventory_id: any; name: any; barcode: string; warehouse_stock: any; }} invProduct
 * @param {any} warehouseId
 * @param {any} warehouseName
 * @param {import("typeorm").Repository<{ id: unknown; sku: unknown; name: unknown; price: unknown; stock: unknown; min_stock: unknown; sync_id: unknown; warehouse_id: unknown; warehouse_name: unknown; is_variant: unknown; variant_name: unknown; parent_product_id: unknown; stock_item_id: unknown; item_type: unknown; sync_status: unknown; last_sync_at: unknown; category_name: unknown; supplier_name: unknown; barcode: unknown; description: unknown; cost_price: unknown; is_active: unknown; reorder_quantity: unknown; last_reorder_date: unknown; created_at: unknown; updated_at: unknown; is_deleted: unknown; last_price_change: unknown; original_price: unknown; }>} productRepo
 * @param {import("typeorm").QueryRunner} queryRunner
 * @param {any} userId
 * @param {any} fullSync
 * @param {{ id: unknown; entityType: unknown; entityId: unknown; syncType: unknown; syncDirection: unknown; status: unknown; itemsProcessed: unknown; itemsSucceeded: unknown; itemsFailed: unknown; startedAt: unknown; completedAt: unknown; lastSyncedAt: unknown; payload: unknown; errorMessage: unknown; retryCount: unknown; nextRetryAt: unknown; performedById: unknown; performedByUsername: unknown; createdAt: unknown; updatedAt: unknown; }} masterSyncRecord
 * @param {{ created: any; updated?: number; skipped: any; errors: any; syncRecords: any; warehouseInfo?: null; deletedOldProducts?: number; barcodeConflicts: any; }} results
 * @param {Map<any, any>} barcodeMap
 */
async function processWarehouseProduct(
  invProduct,
  warehouseId,
  warehouseName,
  productRepo,
  queryRunner,
  userId,
  // @ts-ignore
  fullSync,
  // @ts-ignore
  masterSyncRecord,
  results,
  barcodeMap,
) {
  let productSyncRecord = null;

  try {
    // Generate unique sync ID that includes warehouse
    const syncId = `wh-${warehouseId}-${invProduct.inventory_id}`;

    // Create individual sync record
    productSyncRecord = await syncDataManager.recordSyncStart(
      "Product",
      // @ts-ignore
      0, // 0 for new product
      "inbound",
      {
        inventory_id: invProduct.inventory_id,
        product_name: invProduct.name,
        warehouse_id: warehouseId,
        action: "create", // Always create since we deleted old ones
      },
    );

    // CHECK FOR BARCODE CONFLICT WITH OTHER WAREHOUSES
    if (invProduct.barcode && invProduct.barcode.trim() !== '') {
      const existingBarcodeProduct = barcodeMap.get(invProduct.barcode);
      
      if (existingBarcodeProduct) {
        // BARCODE CONFLICT: Same barcode exists in another warehouse
        results.barcodeConflicts.push({
          inventory_id: invProduct.inventory_id,
          product_name: invProduct.name,
          barcode: invProduct.barcode,
          warehouse_id: warehouseId,
          warehouse_name: warehouseName,
          conflicting_with: {
            product_id: existingBarcodeProduct.id,
            product_name: existingBarcodeProduct.name,
            warehouse_id: existingBarcodeProduct.warehouse_id,
          },
          action_taken: 'skipped'
        });

        results.skipped++;
        results.errors.push({
          product: invProduct.name || invProduct.inventory_id,
          error: `Barcode conflict: Barcode ${invProduct.barcode} already exists in warehouse ${existingBarcodeProduct.warehouse_id} for product "${existingBarcodeProduct.name}"`,
        });

        // @ts-ignore
        await syncDataManager.recordSyncFailure(productSyncRecord.id, 
          new Error(`Barcode conflict: ${invProduct.barcode} already exists in another warehouse`)
        );

        return;
      }
    }

    // CREATE NEW PRODUCT
    const newProductData = createWarehouseProductData(
      // @ts-ignore
      invProduct,
      warehouseId,
      warehouseName,
      syncId,
    );
    
    // Add barcode to map to prevent future conflicts in same sync
    if (invProduct.barcode && invProduct.barcode.trim() !== '') {
      barcodeMap.set(invProduct.barcode, {
        id: 0, // Will be updated after save
        name: invProduct.name,
        warehouse_id: warehouseId,
      });
    }
    
    const newProduct = productRepo.create(newProductData);
    await productRepo.save(newProduct);
    results.created++;

    // Update barcode map with actual product ID
    if (invProduct.barcode && invProduct.barcode.trim() !== '') {
      barcodeMap.set(invProduct.barcode, {
        id: newProduct.id,
        name: invProduct.name,
        warehouse_id: warehouseId,
      });
    }

    // @ts-ignore
    await syncDataManager.recordSyncSuccess(productSyncRecord.id, {
      newProductId: newProduct.id,
    });

    // Update sync record with actual product ID
    // @ts-ignore
    await syncDataManager.syncDataRepo.update(productSyncRecord.id, {
      entityId: newProduct.id,
    });

    // Log inventory transaction
    await logWarehouseTransaction(
      newProduct.id,
      "PRODUCT_SYNC",
      invProduct.warehouse_stock || 0,
      0,
      invProduct.warehouse_stock || 0,
      userId,
      warehouseId,
      `Synced from warehouse ${warehouseName}`,
      queryRunner,
    );

    results.syncRecords.push({
      productId: newProduct.id,
      syncId: productSyncRecord.id,
      action: "created",
      success: true,
    });
    
  } catch (error) {
    results.skipped++;
    results.errors.push({
      product: invProduct.name || invProduct.inventory_id,
      // @ts-ignore
      error: error.message,
    });

    if (productSyncRecord) {
      // @ts-ignore
      await syncDataManager.recordSyncFailure(productSyncRecord.id, error);
    }

    // @ts-ignore
    logger.error(
      `Error syncing product ${invProduct.inventory_id} from warehouse ${warehouseId}:`,
      // @ts-ignore
      error,
    );
  }
}

/**
 * Create warehouse-specific product data
 * @param {{ sku: any; inventory_id: any; name: any; price: any; warehouse_stock: any; min_stock: any; category_name: any; supplier_name: any; barcode: string; description: any; cost_price: any; item_type: string; variant_name: any; parent_product_id: any; is_active: any; }} invProduct
 * @param {any} warehouseId
 * @param {any} warehouseName
 * @param {string} syncId
 */
function createWarehouseProductData(
  invProduct,
  warehouseId,
  warehouseName,
  syncId,
) {
  // Generate a unique SKU if not provided
  let sku = invProduct.sku;
  if (!sku || sku.trim() === '') {
    sku = `WH${warehouseId}-${invProduct.inventory_id}-${Date.now().toString().slice(-6)}`;
  }

  const productData = {
    sync_id: syncId,
    sku: sku,
    name: invProduct.name,
    price: invProduct.price || 0,
    stock: invProduct.warehouse_stock || 0,
    min_stock: invProduct.min_stock || 0,
    warehouse_id: warehouseId,
    warehouse_name: warehouseName,
    stock_item_id: invProduct.inventory_id,
    category_name: invProduct.category_name || null,
    supplier_name: invProduct.supplier_name || null,
    barcode: invProduct.barcode || null,
    description: invProduct.description || null,
    cost_price: invProduct.cost_price || null,
    is_variant: invProduct.item_type === "variant",
    variant_name: invProduct.variant_name,
    parent_product_id: invProduct.parent_product_id,
    item_type: invProduct.item_type,
    is_active: invProduct.is_active ? true : false,
    sync_status: "synced",
    last_sync_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    is_deleted: false,
  };

  // Only include barcode if it's not empty and unique
  if (!invProduct.barcode || invProduct.barcode.trim() === '') {
    productData.barcode = null;
  }

  return productData;
}

/**
 * Log warehouse-specific transaction
 * @param {any} productId
 * @param {string} action
 * @param {any} changeAmount
 * @param {number} quantityBefore
 * @param {any} quantityAfter
 * @param {any} userId
 * @param {any} warehouseId
 * @param {string} notes
 * @param {{ manager: { query: (arg0: string, arg1: any[]) => any; }; }} queryRunner
 */
async function logWarehouseTransaction(
  productId,
  action,
  changeAmount,
  quantityBefore,
  quantityAfter,
  userId,
  warehouseId,
  notes,
  queryRunner,
) {
  try {
    await queryRunner.manager.query(
      `INSERT INTO inventory_transaction_logs (
        product_id, action, change_amount,
        quantity_before, quantity_after,
        warehouse_id, performed_by_id,
        notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        productId,
        action,
        changeAmount,
        quantityBefore,
        quantityAfter,
        warehouseId,
        userId,
        notes,
      ],
    );
  } catch (error) {
    // @ts-ignore
    logger.warn("Failed to log warehouse transaction:", error);
  }
}

// Helper function for incremental sync (kept for compatibility)
/**
 * @param {{ stock: number; price: number; name: any; }} existingProduct
 * @param {{ warehouse_stock: any; price: any; name: any; }} invProduct
 * @param {any} fullSync
 */
// @ts-ignore
function needsUpdate(existingProduct, invProduct, fullSync) {
  if (fullSync) return true;
  const stockDiff = Math.abs(
    existingProduct.stock - (invProduct.warehouse_stock || 0),
  );
  const priceDiff = Math.abs(existingProduct.price - (invProduct.price || 0));
  return (
    stockDiff > 0 || priceDiff > 0 || existingProduct.name !== invProduct.name
  );
}

module.exports = syncProductsFromInventory;