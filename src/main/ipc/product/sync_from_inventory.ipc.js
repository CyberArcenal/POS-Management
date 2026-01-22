// sync_from_inventory.ipc.js - REFACTORED WITH WAREHOUSE REQUIREMENT
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

      // 2. Get products FOR SPECIFIC WAREHOUSE
      const inventoryProducts =
        await inventoryDB.getProductsByWarehouse(warehouseId);
      logger.info(
        `Found ${inventoryProducts.length} products in warehouse ${warehouseInfo.name}`,
      );

      // 3. Sync products to POS database
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
        );
      }

      // 4. Deactivate POS products not in this warehouse
      await deactivateMissingProducts(
        warehouseId,
        inventoryProducts,
        productRepo,
        results,
      );

      // 5. Update sync settings
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
      results: results,
      masterSyncId: masterSyncRecord.id,
      timestamp: new Date().toISOString(),
    });

    return {
      status: true,
      // @ts-ignore
      message: `Products synced from warehouse ${results.warehouseInfo?.name}: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
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
 * Process product from specific warehouse
 * @param {{ inventory_id: { toString: () => any; }; name: any; warehouse_stock: number; }} invProduct
 * @param {any} warehouseId
 * @param {any} warehouseName
 * @param {import("typeorm").Repository<{ id: unknown; sku: unknown; name: unknown; price: unknown; stock: unknown; min_stock: unknown; sync_id: unknown; warehouse_id: unknown; warehouse_name: unknown; is_variant: unknown; variant_name: unknown; parent_product_id: unknown; stock_item_id: unknown; item_type: unknown; sync_status: unknown; last_sync_at: unknown; category_name: unknown; supplier_name: unknown; barcode: unknown; description: unknown; cost_price: unknown; is_active: unknown; reorder_quantity: unknown; last_reorder_date: unknown; created_at: unknown; updated_at: unknown; is_deleted: unknown; last_price_change: unknown; original_price: unknown; }>} productRepo
 * @param {import("typeorm").QueryRunner} queryRunner
 * @param {any} userId
 * @param {any} fullSync
 * @param {{ id: unknown; entityType: unknown; entityId: unknown; syncType: unknown; syncDirection: unknown; status: unknown; itemsProcessed: unknown; itemsSucceeded: unknown; itemsFailed: unknown; startedAt: unknown; completedAt: unknown; lastSyncedAt: unknown; payload: unknown; errorMessage: unknown; retryCount: unknown; nextRetryAt: unknown; performedById: unknown; performedByUsername: unknown; createdAt: unknown; updatedAt: unknown; }} masterSyncRecord
 * @param {{ created: any; updated: any; skipped: any; errors: any; syncRecords: any; warehouseInfo?: null; }} results
 */
async function processWarehouseProduct(
  invProduct,
  warehouseId,
  warehouseName,
  productRepo,
  queryRunner,
  userId,
  fullSync,
  // @ts-ignore
  // @ts-ignore
  masterSyncRecord,
  results,
) {
  let productSyncRecord = null;

  try {
    // Generate unique sync ID that includes warehouse
    const syncId = `wh-${warehouseId}-${invProduct.inventory_id}`;

    // Find existing product by sync_id (warehouse-specific)
    let existingProduct = await productRepo.findOne({
      where: {
        sync_id: syncId,
        warehouse_id: warehouseId,
      },
    });

    // If not found by sync_id, check by stock_item_id AND warehouse
    if (!existingProduct && invProduct.inventory_id) {
      existingProduct = await productRepo.findOne({
        where: {
          stock_item_id: invProduct.inventory_id.toString(),
          warehouse_id: warehouseId,
        },
      });
    }

    // Create individual sync record
    productSyncRecord = await syncDataManager.recordSyncStart(
      "Product",
      // @ts-ignore
      existingProduct ? existingProduct.id : 0,
      "inbound",
      {
        inventory_id: invProduct.inventory_id,
        product_name: invProduct.name,
        warehouse_id: warehouseId,
        action: existingProduct ? "update" : "create",
      },
    );

    if (existingProduct) {
      // UPDATE EXISTING PRODUCT
      // @ts-ignore
      if (needsUpdate(existingProduct, invProduct, fullSync)) {
        // @ts-ignore
        const updateData = createWarehouseUpdateData(
          // @ts-ignore
          invProduct,
          warehouseId,
          warehouseName,
        );
        // @ts-ignore
        await productRepo.update(existingProduct.id, updateData);
        results.updated++;

        // @ts-ignore
        await syncDataManager.recordSyncSuccess(productSyncRecord.id, {
          changes: {
            stock: {
              from: existingProduct.stock,
              to: invProduct.warehouse_stock,
            },
            warehouse: warehouseName,
          },
        });

        // Log inventory transaction
        await logWarehouseTransaction(
          existingProduct.id,
          "STOCK_SYNC",
          // @ts-ignore
          invProduct.warehouse_stock - existingProduct.stock,
          // @ts-ignore
          existingProduct.stock,
          invProduct.warehouse_stock,
          userId,
          warehouseId,
          `Synced from warehouse ${warehouseName}`,
          queryRunner,
        );
      } else {
        results.skipped++;
        // @ts-ignore
        await syncDataManager.recordSyncSuccess(productSyncRecord.id, {
          message: "No changes needed",
        });
      }
    } else {
      // CREATE NEW PRODUCT FOR WAREHOUSE
      // @ts-ignore
      const newProductData = createWarehouseProductData(
        // @ts-ignore
        invProduct,
        warehouseId,
        warehouseName,
        syncId,
      );
      const newProduct = productRepo.create(newProductData);
      await productRepo.save(newProduct);
      results.created++;

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
        "PRODUCT_CREATED",
        invProduct.warehouse_stock,
        0,
        invProduct.warehouse_stock,
        userId,
        warehouseId,
        `New product from warehouse ${warehouseName}`,
        queryRunner,
      );
    }

    results.syncRecords.push({
      productId: existingProduct ? existingProduct.id : "new",
      syncId: productSyncRecord.id,
      action: existingProduct ? "updated" : "created",
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
 * Deactivate products not present in current warehouse sync
 * @param {any} warehouseId
 * @param {any[]} inventoryProducts
 * @param {import("typeorm").Repository<{ id: unknown; sku: unknown; name: unknown; price: unknown; stock: unknown; min_stock: unknown; sync_id: unknown; warehouse_id: unknown; warehouse_name: unknown; is_variant: unknown; variant_name: unknown; parent_product_id: unknown; stock_item_id: unknown; item_type: unknown; sync_status: unknown; last_sync_at: unknown; category_name: unknown; supplier_name: unknown; barcode: unknown; description: unknown; cost_price: unknown; is_active: unknown; reorder_quantity: unknown; last_reorder_date: unknown; created_at: unknown; updated_at: unknown; is_deleted: unknown; last_price_change: unknown; original_price: unknown; }>} productRepo
 * @param {{ created?: number; updated?: number; skipped?: number; errors?: never[]; syncRecords?: never[]; warehouseInfo?: null; deactivated?: any; }} results
 */
async function deactivateMissingProducts(
  warehouseId,
  inventoryProducts,
  productRepo,
  results,
) {
  const activeInventoryIds = inventoryProducts.map(
    (/** @type {{ inventory_id: { toString: () => any; }; }} */ p) =>
      p.inventory_id.toString(),
  );

  if (activeInventoryIds.length > 0) {
    const deactivateResult = await productRepo
      .createQueryBuilder()
      .update()
      .set({
        is_active: false,
        sync_status: "out_of_sync",
        updated_at: new Date(),
      })
      .where("warehouse_id = :warehouseId", { warehouseId })
      .andWhere("stock_item_id NOT IN (:...inventoryIds)", {
        inventoryIds: activeInventoryIds,
      })
      .andWhere("is_active = :isActive", { isActive: true })
      .execute();

    results.deactivated = deactivateResult.affected || 0;
  }
}

/**
 * Create warehouse-specific product data
 * @param {{ sku: any; inventory_id: any; name: any; price: any; warehouse_stock: any; min_stock: any; category_name: any; supplier_name: any; barcode: any; description: any; cost_price: any; item_type: string; variant_name: any; parent_product_id: any; is_active: any; }} invProduct
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
  return {
    sync_id: syncId,
    sku: invProduct.sku || `WH-${warehouseId}-${invProduct.inventory_id}`,
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
}

/**
 * Create warehouse-specific update data
 * @param {{ name: any; price: any; warehouse_stock: any; min_stock: any; category_name: any; supplier_name: any; barcode: any; description: any; cost_price: any; item_type: string; variant_name: any; parent_product_id: any; is_active: any; }} invProduct
 * @param {any} warehouseId
 * @param {any} warehouseName
 */
function createWarehouseUpdateData(invProduct, warehouseId, warehouseName) {
  return {
    name: invProduct.name,
    price: invProduct.price || 0,
    stock: invProduct.warehouse_stock || 0,
    min_stock: invProduct.min_stock || 0,
    warehouse_id: warehouseId,
    warehouse_name: warehouseName,
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
    updated_at: new Date(),
  };
}

/**
 * Log warehouse-specific transaction
 * @param {any} productId
 * @param {string} action
 * @param {number} changeAmount
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

// Helper functions (keep from original)
/**
 * @param {{ inventory_id: any; name: any; price: undefined; }} invProduct
 */
// @ts-ignore
// @ts-ignore
function validateProductData(invProduct) {
  return (
    invProduct.inventory_id && invProduct.name && invProduct.price !== undefined
  );
}

/**
 * @param {{ stock: number; price: number; name: any; }} existingProduct
 * @param {{ warehouse_stock: any; price: any; name: any; }} invProduct
 * @param {any} fullSync
 */
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
