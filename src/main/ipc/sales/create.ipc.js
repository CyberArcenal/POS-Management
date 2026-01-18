// sales/create.ipc.js
//@ts-check
const Sale = require("../../../entities/Sale");
const SaleItem = require("../../../entities/SaleItem");
const Product = require("../../../entities/Product");
const { InventoryAction } = require("../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../utils/auditLogger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");

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
    payment_method, 
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
  
  try {
    const saleRepo = queryRunner.manager.getRepository(Sale);
    const saleItemRepo = queryRunner.manager.getRepository(SaleItem);
    const productRepo = queryRunner.manager.getRepository(Product);
    const inventoryLogRepo = queryRunner.manager.getRepository(InventoryTransactionLog);

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

    for (const item of items) {
      const product = await productRepo.findOne({
        where: { id: item.product_id, is_deleted: false }
      });

      if (!product) {
        return {
          status: false,
          message: `Product not found: ${item.product_id}`,
          data: null,
        };
      }

      // @ts-ignore
      if (product.stock < item.quantity) {
        outOfStockItems.push({
          product_id: product.id,
          name: product.name,
          available: product.stock,
          requested: item.quantity
        });
      }

      const itemTotal = item.unit_price * item.quantity;
      subtotal += itemTotal;
      totalQuantity += item.quantity;

      validatedItems.push({
        ...item,
        product,
        itemTotal,
      });
    }

    // Check for out of stock items
    if (outOfStockItems.length > 0) {
      return {
        status: false,
        message: "Insufficient stock for some items",
        data: { outOfStockItems },
      };
    }

    // Calculate final total
    const discountAmount = (subtotal * discount) / 100;
    const taxAmount = (subtotal * tax) / 100;
    const total = subtotal - discountAmount + taxAmount;

    // Generate reference number
    const referenceNumber = `SALE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create sale
    const sale = saleRepo.create({
      // @ts-ignore
      user_id,
      total,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      payment_method,
      status: "completed",
      reference_number: referenceNumber,
      notes,
      customer_name: customer_info.name || null,
      customer_phone: customer_info.phone || null,
      customer_email: customer_info.email || null,
      items: [],
    });

    await saleRepo.save(sale);

    // Create sale items and update inventory
    const saleItems = [];
    for (const item of validatedItems) {
      const saleItem = saleItemRepo.create({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.itemTotal,
        discount_percentage: item.discount_percentage || 0,
        discount_amount: item.discount_amount || 0,
        price_before_discount: item.unit_price,
        cost_price: item.product.cost_price || 0,
        profit: item.itemTotal - ((item.product.cost_price || 0) * item.quantity),
      });

      await saleItemRepo.save(saleItem);
      saleItems.push(saleItem);

      // Update product stock
      const newStock = item.product.stock - item.quantity;
      await productRepo.update(item.product_id, {
        stock: newStock,
        updated_at: new Date(),
      });

      // Log inventory transaction
      const inventoryLog = inventoryLogRepo.create({
        product_id: item.product_id.toString(),
        action: InventoryAction.SALE,
        change_amount: -item.quantity,
        quantity_before: item.product.stock,
        quantity_after: newStock,
        price_before: item.product.price,
        price_after: item.product.price,
        // @ts-ignore
        reference_id: sale.id.toString(),
        reference_type: "sale",
        performed_by_id: _userId.toString(),
        notes: `Sale #${referenceNumber}`,
      });

      await inventoryLogRepo.save(inventoryLog);
    }

    // Log activity
    // @ts-ignore
    await log_audit("create", "Sale", sale.id, _userId, {
      total,
      item_count: items.length,
      payment_method,
      reference_number: referenceNumber,
    });

    return {
      status: true,
      message: "Sale created successfully",
      data: {
        sale,
        sale_items: saleItems,
        receipt_number: referenceNumber,
        timestamp: sale.created_at,
      },
    };
  } catch (error) {
    console.error("createSale error:", error);
    
    await log_audit("error", "Sale", 0, _userId, {
      // @ts-ignore
      error: error.message,
      items_count: items?.length || 0,
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