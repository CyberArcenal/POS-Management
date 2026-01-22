// sales/create.ipc.js - REFACTORED FOR WAREHOUSE SYNC
//@ts-check
const Sale = require("../../../entities/Sale");
const SaleItem = require("../../../entities/SaleItem");
const Product = require("../../../entities/Product");
const { log_audit } = require("../../../utils/auditLogger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");
const { getSyncConfig } = require("../../../services/inventory_sync/inventoryConfig");
const WarehouseManager = require("../../../services/inventory_sync/warehouseManager");

/**
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function createSale(params, queryRunner) {
  const { 
    // @ts-ignore
    items, 
    // @ts-ignore
    user_id, 
    // @ts-ignore
    user_name,
    // @ts-ignore
    payment_method = "cash", 
    // @ts-ignore
    discount = 0, 
    // @ts-ignore
    tax = 0, 
    // @ts-ignore
    notes = "", 
    // @ts-ignore
    customer_info = {},
    // @ts-ignore
    _userId 
  } = params;
  const warehouseManager = new WarehouseManager();
  
  try {
    // Get current warehouse
    const warehouse = await warehouseManager.getCurrentWarehouse();
    if (!warehouse.id) {
      return {
        status: false,
        message: "No warehouse selected. Please select a warehouse first.",
        data: null,
      };
    }

    const saleRepo = queryRunner.manager.getRepository(Sale);
    const saleItemRepo = queryRunner.manager.getRepository(SaleItem);
    const productRepo = queryRunner.manager.getRepository(Product);

    // Validate items
    if (!items || items.length === 0) {
      return {
        status: false,
        message: "Sale must contain at least one item",
        data: null,
      };
    }

    // Calculate totals and validate stock
    let subtotal = 0;
    let totalQuantity = 0;
    const validatedItems = [];
    const outOfStockItems = [];
    const stockValidations = [];

    for (const item of items) {
      // Find product in current warehouse
      const product = await productRepo.findOne({
        where: { 
          id: item.product_id, 
          warehouse_id: warehouse.id,
          is_active: true,
          is_deleted: false 
        }
      });

      if (!product) {
        return {
          status: false,
          message: `Product not found in current warehouse: ${item.product_id}`,
          data: null,
        };
      }

      // Check stock availability
      // @ts-ignore
      if (product.stock < item.quantity) {
        outOfStockItems.push({
          product_id: product.id,
          name: product.name,
          available: product.stock,
          requested: item.quantity,
          warehouse: warehouse.name
        });
      }

      // Validate price
      const unitPrice = item.unit_price || product.price;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      totalQuantity += item.quantity;

      validatedItems.push({
        ...item,
        product,
        unitPrice,
        itemTotal,
        sync_id: product.sync_id,
        warehouse_id: warehouse.id
      });

      // Track for stock validation
      stockValidations.push({
        product_id: product.id,
        product_name: product.name,
        requested: item.quantity,
        available: product.stock,
        // @ts-ignore
        sufficient: product.stock >= item.quantity
      });
    }

    // Check for out of stock items
    if (outOfStockItems.length > 0) {
      return {
        status: false,
        message: "Insufficient stock for some items",
        data: { 
          outOfStockItems,
          warehouse: warehouse.name
        },
      };
    }

    // Calculate final total
    const discountAmount = discount > 0 ? (subtotal * discount) / 100 : 0;
    const taxAmount = tax > 0 ? (subtotal * tax) / 100 : 0;
    const total = subtotal - discountAmount + taxAmount;

    // Generate reference number
    const referenceNumber = `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create sale record
    const sale = saleRepo.create({
      user_id,
      user_name,
      warehouse_id: warehouse.id,
      warehouse_name: warehouse.name,
      customer_id: customer_info.id,
      customer_name: customer_info.name,
      customer_phone: customer_info.phone,
      customer_email: customer_info.email,
      total,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      payment_method,
      status: "completed",
      reference_number: referenceNumber,
      notes,
      inventory_synced: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await saleRepo.save(sale);

    // Create sale items and track stock changes
    // @ts-ignore
    const saleItems = [];
    const stockChangePromises = [];

    for (const item of validatedItems) {
      const product = item.product;
      
      // Create sale item with cached product info
      const saleItem = saleItemRepo.create({
        sale_id: sale.id,
        product_id: product.id,
        warehouse_id: warehouse.id,
        sync_id: product.sync_id,
        product_name: product.name,
        product_barcode: product.barcode,
        product_sku: product.sku,
        is_variant: product.is_variant,
        variant_name: product.variant_name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.itemTotal,
        discount_percentage: item.discount_percentage || 0,
        discount_amount: item.discount_amount || 0,
        price_before_discount: item.unitPrice,
        cost_price: product.cost_price || 0,
        profit: item.itemTotal - ((product.cost_price || 0) * item.quantity),
        created_at: new Date(),
        updated_at: new Date(),
      });

      await saleItemRepo.save(saleItem);
      saleItems.push(saleItem);

      // Track stock change via WarehouseManager
      const stockChangePromise = warehouseManager.trackStockChange({
        product_id: product.id,
        quantity_change: -item.quantity, // Negative for sale
        change_type: "sale",
        reference: {
          id: sale.id,
          type: "sale",
          reference_number: referenceNumber
        },
        user_info: { id: user_id, name: user_name },
        notes: `Sale #${referenceNumber} - ${item.quantity} units`
      });

      stockChangePromises.push(stockChangePromise);
    }

    // Process all stock changes
    const stockChangeResults = await Promise.allSettled(stockChangePromises);
    
    // Check for any stock change failures
    const failedStockChanges = stockChangeResults
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);

    if (failedStockChanges.length > 0) {
      console.warn('Some stock changes failed:', failedStockChanges);
      // We still complete the sale but mark sync as problematic
      // @ts-ignore
      await saleRepo.update(sale.id, {
        notes: (sale.notes || '') + ' [Stock sync warnings]',
        updated_at: new Date()
      });
    }

    // Log audit
    // @ts-ignore
    await log_audit("create", "Sale", sale.id, _userId, {
      total,
      item_count: items.length,
      payment_method,
      reference_number: referenceNumber,
      warehouse: warehouse.name,
      customer: customer_info.name || 'Walk-in'
    });

    // Auto-sync to inventory if enabled
    const syncConfig = await getSyncConfig();
    if (syncConfig.autoUpdateOnSale) {
      // Background sync - don't await
      warehouseManager.syncStockChangesToInventory(warehouse.id)
        .then(async (syncResult) => {
          if (syncResult.success && syncResult.syncedCount > 0) {
            // @ts-ignore
            await saleRepo.update(sale.id, {
              inventory_synced: true,
              inventory_sync_date: new Date(),
              updated_at: new Date()
            });
            
            // Update sale items sync status
            // @ts-ignore
            for (const saleItem of saleItems) {
              await saleItemRepo.update(saleItem.id, {
                inventory_synced: true,
                updated_at: new Date()
              });
            }
          }
        })
        .catch(error => {
          console.error('Auto-sync failed:', error);
        });
    }

    return {
      status: true,
      message: "Sale created successfully",
      data: {
        sale,
        sale_items: saleItems,
        receipt_number: referenceNumber,
        warehouse: warehouse.name,
        timestamp: sale.created_at,
        stock_validation: {
          total_validated: stockValidations.length,
          all_sufficient: stockValidations.every(v => v.sufficient),
          details: stockValidations
        }
      },
    };
  } catch (error) {
    console.error("createSale error:", error);
    
    await log_audit("error", "Sale", 0, _userId, {
      // @ts-ignore
      error: error.message,
      items_count: items?.length || 0,
      // @ts-ignore
      warehouse: warehouse?.name || 'unknown'
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to create sale: ${error.message}`,
      data: null,
    };
  }
}

module.exports = createSale;