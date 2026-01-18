// sales_items/create.ipc.js
//@ts-check
const SaleItem = require("../../../entities/SaleItem");
const Sale = require("../../../entities/Sale");
const Product = require("../../../entities/Product");
const { log_audit } = require("../../../utils/auditLogger");
// @ts-ignore
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} queryRunner
 */
async function createSaleItem(params, queryRunner) {
  const { 
    // @ts-ignore
    sale_id, 
    // @ts-ignore
    product_id, 
    // @ts-ignore
    quantity, 
    // @ts-ignore
    unit_price, 
    // @ts-ignore
    discount_amount = 0,
    // @ts-ignore
    variant_id = null,
    // @ts-ignore
    notes = "",
    // @ts-ignore
    _userId 
  } = params;
  
  try {
    const saleItemRepo = queryRunner.manager.getRepository(SaleItem);
    const saleRepo = queryRunner.manager.getRepository(Sale);
    const productRepo = queryRunner.manager.getRepository(Product);

    // Validate required fields
    if (!sale_id || !product_id || !quantity || !unit_price) {
      return {
        status: false,
        message: "Sale ID, Product ID, Quantity, and Unit Price are required",
        data: null,
      };
    }

    // Check if sale exists and is modifiable
    const sale = await saleRepo.findOne({
      where: { id: sale_id }
    });

    if (!sale) {
      return {
        status: false,
        message: `Sale with ID ${sale_id} not found`,
        data: null,
      };
    }

    // @ts-ignore
    if (!['pending', 'processing'].includes(sale.status)) {
      return {
        status: false,
        message: `Cannot add items to a ${sale.status} sale`,
        data: null,
      };
    }

    // Check if product exists
    const product = await productRepo.findOne({
      where: { id: product_id, is_deleted: false }
    });

    if (!product) {
      return {
        status: false,
        message: `Product with ID ${product_id} not found`,
        data: null,
      };
    }

    // Check stock availability
    // @ts-ignore
    if (product.stock < quantity) {
      return {
        status: false,
        message: `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
        data: null,
      };
    }

    // Calculate total price
    const totalPrice = (unit_price * quantity) - discount_amount;

    // Create sale item
    // @ts-ignore
    const saleItem = saleItemRepo.create({
      sale_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price: totalPrice,
      discount_amount,
      price_before_discount: unit_price,
      cost_price: product.cost_price || 0,
      // @ts-ignore
      profit: totalPrice - ((product.cost_price || 0) * quantity),
      notes,
    });

    await saleItemRepo.save(saleItem);

    // Update sale total
    const existingItems = await saleItemRepo.find({
      where: { sale_id }
    });

    // @ts-ignore
    const newTotal = existingItems.reduce((sum, item) => sum + item.total_price, 0);
    await saleRepo.update(sale_id, {
      total: newTotal,
      updated_at: new Date(),
    });

    // Log audit
    // @ts-ignore
    await log_audit("create", "SaleItem", saleItem.id, _userId, {
      sale_id,
      product_id,
      quantity,
      unit_price,
      total_price: totalPrice,
    });

    return {
      status: true,
      message: "Sale item created successfully",
      data: {
        sale_item: saleItem,
        sale_total: newTotal,
      },
    };
  } catch (error) {
    console.error("createSaleItem error:", error);

    await log_audit("error", "SaleItem", 0, _userId, {
      action: "create",
      sale_id,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to create sale item: ${error.message}`,
      data: null,
    };
  }
}

module.exports = createSaleItem;