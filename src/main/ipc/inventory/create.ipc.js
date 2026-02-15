// src/main/ipc/inventory/create.ipc.js
//@ts-check
const { AppDataSource } = require("../../db/datasource");
const InventoryMovement = require("../../../entities/InventoryMovement");
const Product = require("../../../entities/Product");
const Sale = require("../../../entities/Sale");
const { validateInventoryMovement } = require("../../../utils/inventoryUtils");

/**
 * Create a manual inventory adjustment.
 * @param {Object} params
 * @param {number} params.productId
 * @param {number} params.qtyChange (positive or negative)
 * @param {string} params.movementType - "adjustment" (sale/refund handled elsewhere)
 * @param {string} [params.notes]
 * @param {number} [params.saleId]
 * @param {string} [params.user="system"]
 * @param {import("typeorm").QueryRunner} queryRunner - Required for transaction.
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  if (!queryRunner) {
    return { status: false, message: "Transaction required for create operation", data: null };
  }

  try {
    const { productId, qtyChange, movementType, notes, saleId, user = "system" } = params;

    // Validate input
    const validation = validateInventoryMovement({ productId, qtyChange, movementType });
    if (!validation.valid) {
      return { status: false, message: validation.errors.join(", "), data: null };
    }

    const movementRepo = queryRunner.manager.getRepository(InventoryMovement);
    const productRepo = queryRunner.manager.getRepository(Product);
    const saleRepo = queryRunner.manager.getRepository(Sale);

    // Fetch product
    const product = await productRepo.findOne({ where: { id: productId } });
    if (!product) {
      return { status: false, message: `Product with ID ${productId} not found`, data: null };
    }

    // Check stock if decreasing
    if (qtyChange < 0 && product.stockQty + qtyChange < 0) {
      return {
        status: false,
        message: `Insufficient stock. Available: ${product.stockQty}, Requested change: ${qtyChange}`,
        data: null,
      };
    }

    // Fetch sale if provided
    let sale = null;
    if (saleId) {
      sale = await saleRepo.findOne({ where: { id: saleId } });
      if (!sale) {
        return { status: false, message: `Sale with ID ${saleId} not found`, data: null };
      }
    }

    // Update product stock
    product.stockQty += qtyChange;
    product.updatedAt = new Date();
    await productRepo.save(product);

    // Create movement record
    const movement = movementRepo.create({
      movementType,
      qtyChange,
      notes,
      product,
      sale,
      timestamp: new Date(),
    });
    const savedMovement = await movementRepo.save(movement);

    // Optionally log to audit (can be done by caller)
    return {
      status: true,
      message: "Inventory movement created successfully",
      data: savedMovement,
    };
  } catch (error) {
    console.error("Error in createInventoryMovement:", error);
    return {
      status: false,
      message: error.message || "Failed to create inventory movement",
      data: null,
    };
  }
};