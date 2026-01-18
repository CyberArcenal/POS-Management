// sync_from_inventory.ipc.js (REFACTORED - Module Pattern)
//@ts-check
const Product = require("../../../entities/Product");
const syncDataManager = require("../../../services/inventory_sync/syncDataManager");
const { log_audit } = require("../../../utils/auditLogger");
const inventoryConfig = require("../../../services/inventory_sync/inventoryConfig");
const inventoryDB = require("../../../services/inventory_sync/inventoryDB");
const { logger } = require("../../../utils/logger");

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate inventory product data
 * @param {Object} invProduct
 * @returns {boolean}
 */
function validateProductData(invProduct) {
  return (
    // @ts-ignore
    invProduct.inventory_id &&
    // @ts-ignore
    invProduct.name &&
    // @ts-ignore
    invProduct.price !== undefined
  );
}

/**
 * Check inventory connection
 * @returns {Promise<{connected: boolean, message: string}>}
 */
async function checkInventoryConnection() {
  try {
    return await inventoryDB.checkConnection();
  } catch (error) {
    return {
      connected: false,
      // @ts-ignore
      message: `Failed to check connection: ${error.message}`,
    };
  }
}

/**
 * Fetch products from inventory
 * @param {boolean} incremental
 */
async function fetchInventoryProducts(incremental) {
  if (incremental) {
    const lastSync = await inventoryConfig.getSetting("inventory_last_sync");
    if (lastSync) {
      const query = `
        SELECT 
          p.id as inventory_id,
          p.name,
          p.sku,
          p.net_price as price,
          p.description,
          p.barcode,
          p.cost_per_item as cost_price,
          p.low_stock_threshold as min_stock,
          c.name as category_name,
          s.name as supplier_name,
          p.is_published as is_active,
          p.track_quantity,
          p.allow_backorder,
          COALESCE(SUM(si.quantity), 0) as total_stock,
          p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN product_supplier ps ON p.id = ps.product_id
        LEFT JOIN suppliers s ON ps.supplier_id = s.id
        LEFT JOIN stock_items si ON p.id = si.product_id AND si.variant_id IS NULL
        WHERE p.is_deleted = 0 
          AND (p.updated_at > ? OR p.created_at > ?)
        GROUP BY p.id
      `;
      return await inventoryDB.runQuery(query, [lastSync, lastSync]);
    }
  }
  // Fallback to full sync
  return await inventoryDB.getAllProducts();
}

/**
 * Check if product needs update
 * @param {Object} existingProduct
 * @param {Object} invProduct
 * @param {boolean} fullSync
 * @returns {boolean}
 */
function needsUpdate(existingProduct, invProduct, fullSync) {
  if (fullSync) return true;

  // @ts-ignore
  const stockDiff = Math.abs(existingProduct.stock - invProduct.total_stock);
  // @ts-ignore
  const priceDiff = Math.abs(existingProduct.price - invProduct.price);

  return (
    stockDiff > 0 ||
    priceDiff > 0 ||
    // @ts-ignore
    existingProduct.name !== invProduct.name ||
    // @ts-ignore
    existingProduct.category_name !== invProduct.category_name
  );
}

/**
 * Create update data for product
 * @param {Object} existingProduct
 * @param {Object} invProduct
 * @returns {Object}
 */
function createUpdateData(existingProduct, invProduct) {
  const updateData = {
    // @ts-ignore
    name: invProduct.name,
    // @ts-ignore
    price: invProduct.price,
    // @ts-ignore
    stock: invProduct.total_stock || 0,
    // @ts-ignore
    min_stock: invProduct.min_stock || 0,
    // @ts-ignore
    category_name: invProduct.category_name || null,
    // @ts-ignore
    supplier_name: invProduct.supplier_name || null,
    // @ts-ignore
    barcode: invProduct.barcode || null,
    // @ts-ignore
    description: invProduct.description || null,
    // @ts-ignore
    cost_price: invProduct.cost_price || null,
    // @ts-ignore
    is_active: invProduct.is_active ? true : false,
    updated_at: new Date(),
  };

  // Preserve original price if not set
  // @ts-ignore
  if (!existingProduct.original_price) {
    // @ts-ignore
    updateData.original_price = invProduct.price;
  }

  return updateData;
}

/**
 * Create new product from inventory
 * @param {Object} invProduct
 * @returns {Object}
 */
function createNewProductData(invProduct) {
  return {
    // @ts-ignore
    sku: invProduct.sku || `INV-${invProduct.inventory_id}`,
    // @ts-ignore
    name: invProduct.name,
    // @ts-ignore
    price: invProduct.price,
    // @ts-ignore
    stock: invProduct.total_stock || 0,
    // @ts-ignore
    min_stock: invProduct.min_stock || 0,
    // @ts-ignore
    stock_item_id: invProduct.inventory_id,
    // @ts-ignore
    category_name: invProduct.category_name || null,
    // @ts-ignore
    supplier_name: invProduct.supplier_name || null,
    // @ts-ignore
    barcode: invProduct.barcode || null,
    // @ts-ignore
    description: invProduct.description || null,
    // @ts-ignore
    cost_price: invProduct.cost_price || null,
    // @ts-ignore
    is_active: invProduct.is_active ? true : false,
    // @ts-ignore
    original_price: invProduct.price,
    created_at: new Date(),
    updated_at: new Date(),
    is_deleted: false,
  };
}

/**
 * Log inventory transaction
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function logInventoryTransaction(params, queryRunner) {
  const {
    // @ts-ignore
    productId,
    // @ts-ignore
    action,
    // @ts-ignore
    changeAmount,
    // @ts-ignore
    quantityBefore,
    // @ts-ignore
    quantityAfter,
    // @ts-ignore
    priceBefore,
    // @ts-ignore
    priceAfter,
    // @ts-ignore
    userId,
    // @ts-ignore
    notes,
  } = params;

  await queryRunner.manager.query(
    `
    INSERT INTO inventory_transaction_logs (
      product_id, action, change_amount,
      quantity_before, quantity_after,
      price_before, price_after,
      reference_type, performed_by_id,
      notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `,
    [
      productId,
      action,
      changeAmount,
      quantityBefore,
      quantityAfter,
      priceBefore,
      priceAfter,
      "inventory_sync",
      userId,
      notes,
    ]
  );
}

/**
 * Handle existing product update
 */
async function handleExistingProduct(
  // @ts-ignore
  existingProduct,
  // @ts-ignore
  invProduct,
  // @ts-ignore
  productRepo,
  // @ts-ignore
  queryRunner,
  // @ts-ignore
  userId,
  // @ts-ignore
  fullSync,
  // @ts-ignore
  productSyncRecord,
  // @ts-ignore
  results
) {
  if (needsUpdate(existingProduct, invProduct, fullSync)) {
    const updateData = createUpdateData(existingProduct, invProduct);

    await productRepo.update(existingProduct.id, updateData);
    results.updated++;

    // Update sync record with success
    await syncDataManager.recordSyncSuccess(productSyncRecord.id, {
      changes: {
        stock: {
          from: existingProduct.stock,
          to: invProduct.total_stock,
        },
        price: { from: existingProduct.price, to: invProduct.price },
      },
    });

    results.syncRecords.push({
      productId: existingProduct.id,
      syncId: productSyncRecord.id,
      action: "updated",
      success: true,
    });

    // Log inventory transaction for stock sync
    const stockDiff = Math.abs(existingProduct.stock - invProduct.total_stock);
    const priceDiff = Math.abs(existingProduct.price - invProduct.price);

    if (stockDiff > 0 || priceDiff > 0) {
      await logInventoryTransaction(
        {
          productId: existingProduct.id,
          action: "STOCK_SYNC",
          changeAmount: invProduct.total_stock - existingProduct.stock,
          quantityBefore: existingProduct.stock,
          quantityAfter: invProduct.total_stock,
          priceBefore: existingProduct.price,
          priceAfter: invProduct.price,
          userId: userId,
          notes: `Product synced from inventory. Stock: ${existingProduct.stock} → ${invProduct.total_stock}, Price: ${existingProduct.price} → ${invProduct.price}`,
        },
        queryRunner
      );
    }
  } else {
    results.skipped++;
    // Mark as synced even though no changes were needed
    await syncDataManager.recordSyncSuccess(productSyncRecord.id, {
      message: "No changes needed",
    });

    results.syncRecords.push({
      productId: existingProduct.id,
      syncId: productSyncRecord.id,
      action: "skipped",
      success: true,
    });
  }
}

/**
 * Handle new product creation
 */
async function handleNewProduct(
  // @ts-ignore
  invProduct,
  // @ts-ignore
  productRepo,
  // @ts-ignore
  queryRunner,
  // @ts-ignore
  userId,
  // @ts-ignore
  productSyncRecord,
  // @ts-ignore
  results
) {
  const newProductData = createNewProductData(invProduct);
  const newProduct = productRepo.create(newProductData);
  await productRepo.save(newProduct);
  results.created++;

  // Update sync record with new product ID
  await syncDataManager.recordSyncSuccess(productSyncRecord.id, {
    newProductId: newProduct.id,
  });

  // Update the sync record with the actual product ID
  await syncDataManager.syncDataRepo.update(productSyncRecord.id, {
    entityId: newProduct.id,
  });

  results.syncRecords.push({
    productId: newProduct.id,
    syncId: productSyncRecord.id,
    action: "created",
    success: true,
  });

  // Log inventory transaction for new product
  await logInventoryTransaction(
    {
      productId: newProduct.id,
      action: "PRODUCT_CREATED",
      changeAmount: invProduct.total_stock,
      quantityBefore: 0,
      quantityAfter: invProduct.total_stock,
      priceBefore: 0,
      priceAfter: invProduct.price,
      userId: userId,
      notes: `New product synced from inventory system: ${invProduct.name}`,
    },
    queryRunner
  );
}

/**
 * Handle product processing error
 */
async function handleProductError(
  // @ts-ignore
  error,
  // @ts-ignore
  invProduct,
  // @ts-ignore
  productSyncRecord,
  // @ts-ignore
  masterSyncRecord,
  // @ts-ignore
  results
) {
  results.skipped++;
  results.errors.push({
    product: invProduct.name || invProduct.inventory_id,
    error: error.message,
  });

  // Record sync failure for this product
  if (productSyncRecord) {
    await syncDataManager.recordSyncFailure(productSyncRecord.id, error);
    results.syncRecords.push({
      productId: invProduct.inventory_id,
      syncId: productSyncRecord.id,
      action: "failed",
      success: false,
      error: error.message,
    });
  }

  logger.error(
    `Error syncing product ${invProduct.inventory_id}:`,
    error
  );
}

/**
 * Process a single product
 */
async function processProduct(
  // @ts-ignore
  invProduct,
  // @ts-ignore
  productRepo,
  // @ts-ignore
  queryRunner,
  // @ts-ignore
  userId,
  // @ts-ignore
  fullSync,
  // @ts-ignore
  masterSyncRecord,
  // @ts-ignore
  results
) {
  let productSyncRecord = null;

  try {
    // Validate required fields
    if (!validateProductData(invProduct)) {
      results.skipped++;
      results.errors.push({
        product: invProduct.name || "Unknown",
        error: "Missing required fields (inventory_id, name, or price)",
      });
      return;
    }

    const existingProduct = await productRepo.findOne({
      where: { stock_item_id: invProduct.inventory_id },
    });

    // Create individual sync record for this product
    productSyncRecord = await syncDataManager.recordSyncStart(
      "Product",
      existingProduct ? existingProduct.id : 0,
      "inbound",
      // @ts-ignore
      {
        inventory_id: invProduct.inventory_id,
        product_name: invProduct.name,
        action: existingProduct ? "update" : "create",
      }
    );

    if (existingProduct) {
      await handleExistingProduct(
        existingProduct,
        invProduct,
        productRepo,
        queryRunner,
        userId,
        fullSync,
        productSyncRecord,
        results
      );
    } else {
      await handleNewProduct(
        invProduct,
        productRepo,
        queryRunner,
        userId,
        productSyncRecord,
        results
      );
    }
  } catch (error) {
    await handleProductError(
      error,
      invProduct,
      productSyncRecord,
      masterSyncRecord,
      results
    );
  }
}

/**
 * Update sync settings after successful sync
 */
// @ts-ignore
async function updateSyncSettings(results) {
  if (results.created > 0 || results.updated > 0) {
    await inventoryConfig.updateLastSync();
    await inventoryConfig.updateSetting(
      "inventory_connection_status",
      "connected",
      // @ts-ignore
      "Inventory database connection status"
    );
  }
}

// ==================== MAIN FUNCTION ====================

/**
 * Syncs products from inventory management system to POS
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
    inventoryConnection: { connected: false },
  };

  try {
    // @ts-ignore
    const { userId, fullSync = false, incremental = false } = params;
    const productRepo = queryRunner.manager.getRepository(Product);

    // Create master sync record for this batch
    masterSyncRecord = await syncDataManager.recordSyncStart(
      "ProductBatch",
      // @ts-ignore
      0,
      "inbound",
      {
        syncType: incremental ? "incremental" : "full",
        userId,
        timestamp: new Date().toISOString(),
      }
    );

    // Check inventory connection
    const connectionStatus = await checkInventoryConnection();
    results.inventoryConnection = connectionStatus;

    if (!connectionStatus.connected) {
      await syncDataManager.recordSyncFailure(
        // @ts-ignore
        masterSyncRecord.id,
        new Error(
          `Cannot connect to inventory database: ${connectionStatus.message}`
        )
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
      // Get products from inventory
      const inventoryProducts = await fetchInventoryProducts(incremental);
      logger.info(`Found ${inventoryProducts.length} products in inventory`);

      // Process each product
      for (const invProduct of inventoryProducts) {
        await processProduct(
          invProduct,
          productRepo,
          queryRunner,
          userId,
          fullSync,
          masterSyncRecord,
          results
        );
      }

      // Update sync settings
      await updateSyncSettings(results);

      // Record master sync success
      // @ts-ignore
      await syncDataManager.recordSyncSuccess(masterSyncRecord.id, {
        summary: results,
        totalProcessed: inventoryProducts.length,
      });
    } finally {
      // Disconnect from inventory database
      await inventoryDB.disconnect();
    }

    // Log audit
    await log_audit("sync_products", "Product", 0, userId, {
      source: "inventory_system",
      sync_type: incremental ? "incremental" : "full",
      results: results,
      masterSyncId: masterSyncRecord.id,
      timestamp: new Date().toISOString(),
    });

    return {
      status: true,
      message: `Products synced: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      data: {
        ...results,
        masterSyncId: masterSyncRecord.id,
      },
    };
  } catch (error) {
    // @ts-ignore
    logger.error("syncProductsFromInventory error:", error);

    // Record master sync failure
    if (masterSyncRecord) {
      // @ts-ignore
      await syncDataManager.recordSyncFailure(masterSyncRecord.id, error);
    }

    // Update connection status on error
    await inventoryConfig.updateSetting(
      "inventory_connection_status",
      "error",
      // @ts-ignore
      `Inventory connection error: ${error.message}`
    );

    throw error;
  }
}

module.exports = syncProductsFromInventory;