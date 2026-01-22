// WarehouseManager.js - FIXED VERSION
//@ts-check
const inventoryDB = require("./inventoryDB");
const inventoryConfig = require("./inventoryConfig");
const { logger } = require("../../utils/logger");
const { AppDataSource } = require("../../main/db/dataSource");

class WarehouseManager {
  constructor() {
    // @ts-ignore
    this.currentWarehouseId = null;
    // @ts-ignore
    this.currentWarehouseName = null;
    this.unsyncedChangesCount = 0;
  }

  // Initialize from settings - FIXED
  async initialize() {
    try {
      this.currentWarehouseId = await inventoryConfig.getSetting("current_warehouse_id");
      this.currentWarehouseName = await inventoryConfig.getSetting("current_warehouse_name");
      
      // FIX: Changed from checkUnsyncedChanges() to hasUnsyncedChanges()
      if (this.currentWarehouseId) {
        await this.hasUnsyncedChanges(this.currentWarehouseId);
      }
      
      logger.info(`Warehouse Manager initialized. Current: ${this.currentWarehouseName} (${this.currentWarehouseId})`);
    } catch (error) {
      // @ts-ignore
      logger.error("Failed to initialize WarehouseManager:", error);
    }
  }

  // Get current warehouse
  // @ts-ignore
  async getCurrentWarehouse() {
    if (!this.currentWarehouseId) {
      await this.initialize();
    }
    return {
      id: this.currentWarehouseId,
      name: this.currentWarehouseName
    };
  }

  // Set current warehouse with sync check
  /**
     * @param {unknown} warehouseId
     */
  async setCurrentWarehouse(warehouseId, warehouseName = null, force = false) {
    // @ts-ignore
    const currentWarehouse = await this.getCurrentWarehouse();
    
    // If switching to same warehouse
    if (currentWarehouse.id === warehouseId) {
      return { 
        success: true, 
        message: "Already in this warehouse",
        warehouse: { id: warehouseId, name: warehouseName }
      };
    }

    // Check for unsynced changes
    const hasUnsynced = await this.hasUnsyncedChanges(currentWarehouse.id);
    
    if (hasUnsynced && !force) {
      return {
        success: false,
        requiresSync: true,
        message: "There are unsynced stock changes. Sync them before switching warehouse?",
        unsyncedCount: this.unsyncedChangesCount,
        currentWarehouse,
        newWarehouse: { id: warehouseId, name: warehouseName }
      };
    }

    // If force or no unsynced changes, proceed
    try {
      // Sync any pending changes (even if force, we still sync)
      if (hasUnsynced) {
        await this.syncStockChangesToInventory(currentWarehouse.id);
      }

      // Update current warehouse
      this.currentWarehouseId = warehouseId;
      this.currentWarehouseName = warehouseName || `Warehouse ${warehouseId}`;
      
      // Save to settings
      await inventoryConfig.updateSetting("current_warehouse_id", warehouseId);
      await inventoryConfig.updateSetting("current_warehouse_name", this.currentWarehouseName);

      // Sync products from new warehouse
      // @ts-ignore
      await this.syncProductsFromWarehouse(warehouseId);

      logger.info(`Switched to warehouse: ${this.currentWarehouseName} (${this.currentWarehouseId})`);
      
      return {
        success: true,
        message: "Warehouse changed successfully",
        warehouse: {
          id: this.currentWarehouseId,
          name: this.currentWarehouseName
        },
        previousWarehouse: currentWarehouse
      };
      
    } catch (error) {
      // @ts-ignore
      logger.error("Failed to switch warehouse:", error);
      throw error;
    }
  }

  // Check for unsynced changes - RENAMED FROM hasUnsyncedChanges
  async hasUnsyncedChanges(warehouseId = null) {
    const targetWarehouseId = warehouseId || this.currentWarehouseId;
    
    if (!targetWarehouseId) return false;
    
    const stockChangeRepo = AppDataSource.getRepository("StockChange");
    const count = await stockChangeRepo.count({
      where: { 
        warehouse_id: targetWarehouseId,
        synced_to_inventory: false 
      }
    });
    
    this.unsyncedChangesCount = count;
    return count > 0;
  }

  // Track stock change (called on sales, returns, adjustments)
  /**
     * @param {{ product_id: any; quantity_change: any; change_type: any; reference: any; user_info: any; notes: any; }} params
     */
  async trackStockChange(params) {
    const {
      product_id,
      quantity_change,
      change_type,
      reference = null,
      user_info = null,
      notes = ""
    } = params;

    const productRepo = AppDataSource.getRepository("Product");
    const stockChangeRepo = AppDataSource.getRepository("StockChange");
    
    const product = await productRepo.findOne({ 
      where: { id: product_id } 
    });
    
    if (!product) {
      throw new Error(`Product ${product_id} not found`);
    }

    const warehouse = await this.getCurrentWarehouse();
    if (!warehouse.id) {
      throw new Error("No warehouse selected");
    }

    // Calculate new quantities
    const quantityBefore = product.stock;
    const quantityAfter = Math.max(0, quantityBefore + quantity_change);
    
    // Update product stock in POS
    product.stock = quantityAfter;
    product.sync_status = "pending";
    product.updated_at = new Date();
    await productRepo.save(product);

    // Log stock change
    const stockChange = stockChangeRepo.create({
      product_id,
      warehouse_id: warehouse.id,
      quantity_change,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      change_type,
      reference_id: reference?.id,
      reference_type: reference?.type,
      performed_by_id: user_info?.id,
      performed_by_name: user_info?.name,
      notes: notes || `${change_type}: ${quantity_change} units`,
      created_at: new Date(),
      updated_at: new Date()
    });

    await stockChangeRepo.save(stockChange);
    
    // Update unsynced count
    this.unsyncedChangesCount++;
    
    // Auto-sync if enabled
    const config = await inventoryConfig.getSyncConfig();
    if (config.autoUpdateOnSale && change_type === "sale") {
      await this.syncStockChangesToInventory(warehouse.id);
    }

    return {
      success: true,
      stockChange,
      product: {
        id: product.id,
        name: product.name,
        stock_before: quantityBefore,
        stock_after: quantityAfter
      }
    };
  }

  // Sync stock changes to inventory
  async syncStockChangesToInventory(warehouseId = null) {
    const targetWarehouseId = warehouseId || this.currentWarehouseId;
    
    if (!targetWarehouseId) {
      throw new Error("No warehouse selected for sync");
    }

    const stockChangeRepo = AppDataSource.getRepository("StockChange");
    const productRepo = AppDataSource.getRepository("Product");
    
    // Get unsynced changes
    const unsyncedChanges = await stockChangeRepo.find({
      where: { 
        warehouse_id: targetWarehouseId,
        synced_to_inventory: false 
      },
      order: { created_at: "ASC" },
      take: 100 // Limit batch size
    });

    if (unsyncedChanges.length === 0) {
      return {
        success: true,
        message: "No unsynced changes found",
        syncedCount: 0
      };
    }

    await inventoryDB.connect();
    
    try {
      let syncedCount = 0;
      let failedChanges = [];

      for (const change of unsyncedChanges) {
        try {
          const product = await productRepo.findOne({ 
            where: { id: change.product_id } 
          });

          if (!product) {
            throw new Error(`Product ${change.product_id} not found`);
          }

          // Determine item type and update inventory
          let inventoryResult;
          
          if (product.is_variant && product.stock_item_id) {
            // Update variant stock
            inventoryResult = await inventoryDB.updateVariantStock(
              product.stock_item_id,
              targetWarehouseId,
              change.quantity_change,
              change.change_type,
              change.performed_by_id || "pos_system"
            );
          } else if (product.stock_item_id) {
            // Update product stock
            inventoryResult = await inventoryDB.updateProductStock(
              product.stock_item_id,
              targetWarehouseId,
              change.quantity_change,
              change.change_type,
              // @ts-ignore
              change.performed_by_id || "pos_system"
            );
          } else {
            // Product not linked to inventory
            change.notes += " (Not linked to inventory)";
            change.synced_to_inventory = true;
            change.sync_date = new Date();
            await stockChangeRepo.save(change);
            syncedCount++;
            continue;
          }

          // Mark as synced
          change.synced_to_inventory = true;
          change.sync_date = new Date();
          // @ts-ignore
          change.inventory_transaction_id = inventoryResult?.transactionId;
          await stockChangeRepo.save(change);

          // Update product sync status
          product.sync_status = "synced";
          product.last_sync_at = new Date();
          await productRepo.save(product);

          syncedCount++;
          
        } catch (error) {
          failedChanges.push({
            changeId: change.id,
            // @ts-ignore
            error: error.message
          });
          
          // Update sync status to error
          // @ts-ignore
          change.notes += ` (Sync failed: ${error.message})`;
          await stockChangeRepo.save(change);
          
          // @ts-ignore
          logger.error(`Failed to sync stock change ${change.id}:`, error);
        }
      }

      // Update unsynced count
      this.unsyncedChangesCount = Math.max(0, this.unsyncedChangesCount - syncedCount);

      return {
        success: failedChanges.length === 0,
        syncedCount,
        failedCount: failedChanges.length,
        totalProcessed: unsyncedChanges.length,
        failedChanges: failedChanges.length > 0 ? failedChanges : undefined
      };
      
    } finally {
      await inventoryDB.disconnect();
    }
  }

  // Sync products FROM inventory TO POS
  async syncProductsFromWarehouse(warehouseId = null) {
    const targetWarehouseId = warehouseId || this.currentWarehouseId;
    
    if (!targetWarehouseId) {
      throw new Error("No warehouse selected for sync");
    }

    await inventoryDB.connect();
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const productRepo = queryRunner.manager.getRepository("Product");
      
      // Get warehouse info
      const warehouseInfo = await inventoryDB.getWarehouseById(targetWarehouseId);
      if (!warehouseInfo) {
        throw new Error(`Warehouse ${targetWarehouseId} not found in inventory`);
      }

      // Get products and variants for this warehouse
      const warehouseItems = await inventoryDB.getProductsByWarehouse(targetWarehouseId);
      
      let created = 0;
      let updated = 0;
      let deactivated = 0;
      let errors = [];

      // Process each item (products and variants)
      for (const item of warehouseItems) {
        try {
          // Generate unique sync ID
          const syncId = `${item.inventory_id}_${targetWarehouseId}`;
          
          // Check if exists in POS
          let existingProduct = await productRepo.findOne({
            where: { sync_id: syncId }
          });

          if (existingProduct) {
            // Update existing
            existingProduct.name = item.name;
            existingProduct.price = item.price || 0;
            existingProduct.stock = item.warehouse_stock || 0;
            existingProduct.min_stock = item.min_stock || 0;
            existingProduct.cost_price = item.cost_price;
            existingProduct.category_name = item.category_name;
            existingProduct.barcode = item.barcode;
            existingProduct.sku = item.sku || syncId;
            existingProduct.is_active = item.is_active ? true : false;
            existingProduct.is_variant = item.item_type === "variant";
            existingProduct.variant_name = item.variant_name;
            existingProduct.parent_product_id = item.parent_product_id;
            existingProduct.stock_item_id = item.inventory_id;
            existingProduct.item_type = item.item_type;
            existingProduct.sync_status = "synced";
            existingProduct.last_sync_at = new Date();
            existingProduct.updated_at = new Date();

            await productRepo.save(existingProduct);
            updated++;
            
          } else {
            // Create new
            const newProduct = productRepo.create({
              sync_id: syncId,
              sku: item.sku || syncId,
              name: item.name,
              price: item.price || 0,
              stock: item.warehouse_stock || 0,
              min_stock: item.min_stock || 0,
              warehouse_id: targetWarehouseId,
              warehouse_name: warehouseInfo.name,
              is_variant: item.item_type === "variant",
              variant_name: item.variant_name,
              parent_product_id: item.parent_product_id,
              stock_item_id: item.inventory_id,
              item_type: item.item_type,
              category_name: item.category_name,
              supplier_name: item.supplier_name,
              barcode: item.barcode,
              description: item.description,
              cost_price: item.cost_price,
              is_active: item.is_active ? true : false,
              sync_status: "synced",
              last_sync_at: new Date(),
              created_at: new Date(),
              updated_at: new Date()
            });

            await productRepo.save(newProduct);
            created++;
          }
          
        } catch (error) {
          errors.push({
            item: item.name || item.inventory_id,
            // @ts-ignore
            error: error.message
          });
          // @ts-ignore
          logger.error(`Failed to sync item ${item.inventory_id}:`, error);
        }
      }

      // Deactivate products not in current warehouse
      const activeSyncIds = warehouseItems.map((/** @type {{ inventory_id: any; }} */ item) => `${item.inventory_id}_${targetWarehouseId}`);
      
      if (activeSyncIds.length > 0) {
        const deactivateResult = await productRepo
          .createQueryBuilder()
          .update()
          .set({ 
            is_active: false,
            sync_status: "out_of_sync",
            updated_at: new Date()
          })
          .where("warehouse_id = :warehouseId", { warehouseId: targetWarehouseId })
          .andWhere("sync_id NOT IN (:...syncIds)", { syncIds: activeSyncIds })
          .andWhere("is_active = :isActive", { isActive: true })
          .execute();
        
        deactivated = deactivateResult.affected || 0;
      }

      await queryRunner.commitTransaction();

      logger.info(`Warehouse sync completed. Created: ${created}, Updated: ${updated}, Deactivated: ${deactivated}`);
      
      return {
        success: true,
        warehouse: warehouseInfo.name,
        created,
        updated,
        deactivated,
        errors: errors.length > 0 ? errors : undefined
      };
      
    } catch (error) {
      await queryRunner.rollbackTransaction();
      // @ts-ignore
      logger.error("Warehouse sync failed:", error);
      throw error;
    } finally {
      await queryRunner.release();
      await inventoryDB.disconnect();
    }
  }

  // Get warehouse status
  async getWarehouseStatus(warehouseId = null) {
    const targetWarehouseId = warehouseId || this.currentWarehouseId;
    
    if (!targetWarehouseId) {
      return null;
    }

    await inventoryDB.connect();
    
    try {
      // Get warehouse info
      const warehouse = await inventoryDB.getWarehouseById(targetWarehouseId);
      if (!warehouse) {
        return null;
      }

      // Get stock summary
      const stockSummary = await inventoryDB.getWarehouseStockSummary(targetWarehouseId);
      
      // Get unsynced changes count - FIXED method name
      const unsyncedCount = await this.getUnsyncedChangeCount(targetWarehouseId);

      // Get POS product count for this warehouse
      const productRepo = AppDataSource.getRepository("Product");
      const posProductCount = await productRepo.count({
        where: { 
          warehouse_id: targetWarehouseId,
          is_active: true,
          is_deleted: false 
        }
      });

      return {
        warehouse: {
          id: warehouse.id,
          name: warehouse.name,
          type: warehouse.type,
          location: warehouse.location,
          is_active: warehouse.is_active
        },
        inventory: {
          item_count: stockSummary.length,
          total_stock: stockSummary.reduce((/** @type {any} */ sum, /** @type {{ current_stock: any; }} */ item) => sum + (item.current_stock || 0), 0)
        },
        pos: {
          product_count: posProductCount
        },
        sync: {
          unsynced_changes: unsyncedCount,
          last_sync: await inventoryConfig.getSetting("inventory_last_sync")
        }
      };
    } finally {
      await inventoryDB.disconnect();
    }
  }

  // Get all warehouses from inventory
  async getAvailableWarehouses() {
    await inventoryDB.connect();
    
    try {
      return await inventoryDB.getWarehouses();
    } finally {
      await inventoryDB.disconnect();
    }
  }

  // Get unsynced change count - FIXED: this method exists
  async getUnsyncedChangeCount(warehouseId = null) {
    const targetWarehouseId = warehouseId || this.currentWarehouseId;
    
    if (!targetWarehouseId) return 0;

    const stockChangeRepo = AppDataSource.getRepository("StockChange");
    return await stockChangeRepo.count({
      where: { 
        warehouse_id: targetWarehouseId,
        synced_to_inventory: false 
      }
    });
  }

  // NEW: Validate sale items against warehouse stock
  /**
     * @param {string | any[]} saleItems
     */
  async validateSaleItems(saleItems, warehouseId = null) {
    const targetWarehouseId = warehouseId || this.currentWarehouseId;
    
    if (!targetWarehouseId) {
      throw new Error("No warehouse selected for validation");
    }

    const productRepo = AppDataSource.getRepository("Product");
    const validations = [];
    const errors = [];

    for (const item of saleItems) {
      const product = await productRepo.findOne({
        where: { 
          id: item.product_id,
          warehouse_id: targetWarehouseId,
          is_active: true,
          is_deleted: false 
        }
      });

      if (!product) {
        errors.push({
          product_id: item.product_id,
          error: "Product not found in current warehouse"
        });
        continue;
      }

      const availableStock = product.stock;
      const requested = item.quantity;
      const sufficient = availableStock >= requested;

      validations.push({
        product_id: product.id,
        product_name: product.name,
        sync_id: product.sync_id,
        available_stock: availableStock,
        requested_quantity: requested,
        sufficient: sufficient,
        deficit: sufficient ? 0 : requested - availableStock,
        is_variant: product.is_variant,
        variant_name: product.variant_name
      });

      if (!sufficient) {
        errors.push({
          product_id: product.id,
          product_name: product.name,
          available: availableStock,
          requested: requested,
          deficit: requested - availableStock
        });
      }
    }

    return {
      valid: errors.length === 0,
      validations,
      errors,
      total_items: saleItems.length,
      insufficient_items: errors.length
    };
  }

  // NEW: Process bulk stock changes for a sale
  /**
     * @param {any} saleId
     * @param {any[]} saleItems
     * @param {any} warehouseId
     * @param {any} userInfo
     */
  // @ts-ignore
  async processSaleStockChanges(saleId, saleItems, warehouseId, userInfo) {
    const stockChangePromises = saleItems.map((/** @type {{ product_id: any; quantity: number; }} */ item) => 
      this.trackStockChange({
        product_id: item.product_id,
        quantity_change: -item.quantity, // Negative for sale
        change_type: "sale",
        reference: {
          id: saleId,
          type: "sale"
        },
        user_info: userInfo,
        notes: `Sale #${saleId} - ${item.quantity} units`
      })
    );

    const results = await Promise.allSettled(stockChangePromises);
    
    const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

    return {
      success: failed.length === 0,
      successful_count: successful.length,
      failed_count: failed.length,
      successful,
      failed
    };
  }
  /**
     * Get warehouse sales summary
     * @param {any} warehouseId
     * @param {any} startDate
     * @param {any} endDate
     */
  async getWarehouseSalesSummary(warehouseId, startDate, endDate) {
    const saleRepo = AppDataSource.getRepository("Sale");
    
    const queryBuilder = saleRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as total_sales",
        "SUM(sale.total) as total_revenue",
        "SUM(sale.discount_amount) as total_discounts",
        "SUM(sale.tax_amount) as total_taxes",
        "AVG(sale.total) as average_sale"
      ])
      .where("sale.warehouse_id = :warehouseId", { warehouseId })
      .andWhere("sale.status = 'completed'");

    if (startDate) {
      queryBuilder.andWhere("sale.created_at >= :startDate", { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere("sale.created_at <= :endDate", { endDate });
    }

    const summary = await queryBuilder.getRawOne();

    // Get top products
    const topProducts = await this.getTopProductsInWarehouse(warehouseId, startDate, endDate);

    return {
      summary,
      top_products: topProducts,
      date_range: { startDate, endDate }
    };
  }

  /**
     * Get top selling products in warehouse
     * @param {any} warehouseId
     * @param {any} startDate
     * @param {any} endDate
     */
  async getTopProductsInWarehouse(warehouseId, startDate, endDate) {
    const saleItemRepo = AppDataSource.getRepository("SaleItem");
    
    const query = saleItemRepo.createQueryBuilder("item")
      .select([
        "item.product_id",
        "item.product_name",
        "SUM(item.quantity) as total_quantity",
        "SUM(item.total_price) as total_revenue",
        "COUNT(DISTINCT item.sale_id) as sale_count"
      ])
      .innerJoin("item.sale", "sale")
      .where("sale.warehouse_id = :warehouseId", { warehouseId })
      .andWhere("sale.status = 'completed'");

    if (startDate) {
      query.andWhere("sale.created_at >= :startDate", { startDate });
    }
    if (endDate) {
      query.andWhere("sale.created_at <= :endDate", { endDate });
    }

    query.groupBy("item.product_id")
      .orderBy("total_quantity", "DESC")
      .limit(10);

    return await query.getRawMany();
  }
}

module.exports = WarehouseManager;