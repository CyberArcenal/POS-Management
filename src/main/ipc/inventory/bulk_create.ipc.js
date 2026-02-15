// src/main/ipc/inventory/bulk_create.ipc.js
//@ts-check
const { AppDataSource } = require("../../db/datasource");
const InventoryMovement = require("../../../entities/InventoryMovement");
const Product = require("../../../entities/Product");
const Sale = require("../../../entities/Sale");
const { validateInventoryMovement } = require("../../../utils/inventoryUtils");

/**
 * Create multiple inventory movements in one transaction.
 * @param {Object} params
 * @param {Array<{productId: number, qtyChange: number, movementType: string, notes?: string, saleId?: number}>} params.movements
 * @param {string} [params.user="system"]
 * @param {import("typeorm").QueryRunner} queryRunner
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  if (!queryRunner) {
    return { status: false, message: "Transaction required for bulk create", data: null };
  }

  try {
    const { movements, user = "system" } = params;
    if (!Array.isArray(movements) || movements.length === 0) {
      return { status: false, message: "Movements array is required and cannot be empty", data: null };
    }

    const movementRepo = queryRunner.manager.getRepository(InventoryMovement);
    const productRepo = queryRunner.manager.getRepository(Product);
    const saleRepo = queryRunner.manager.getRepository(Sale);

    const createdMovements = [];
    const errors = [];

    for (const [index, data] of movements.entries()) {
      try {
        // Validate each
        const validation = validateInventoryMovement(data);
        if (!validation.valid) {
          errors.push(`Movement ${index}: ${validation.errors.join(", ")}`);
          continue;
        }

        const { productId, qtyChange, movementType, notes, saleId } = data;

        const product = await productRepo.findOne({ where: { id: productId } });
        if (!product) {
          errors.push(`Movement ${index}: Product ${productId} not found`);
          continue;
        }

        if (qtyChange < 0 && product.stockQty + qtyChange < 0) {
          errors.push(`Movement ${index}: Insufficient stock for product ${productId}`);
          continue;
        }

        let sale = null;
        if (saleId) {
          sale = await saleRepo.findOne({ where: { id: saleId } });
          if (!sale) {
            errors.push(`Movement ${index}: Sale ${saleId} not found`);
            continue;
          }
        }

        // Update stock
        product.stockQty += qtyChange;
        product.updatedAt = new Date();
        await productRepo.save(product);

        const movement = movementRepo.create({
          movementType,
          qtyChange,
          notes,
          product,
          sale,
          timestamp: new Date(),
        });
        const saved = await movementRepo.save(movement);
        createdMovements.push(saved);
      } catch (itemError) {
        errors.push(`Movement ${index}: ${itemError.message}`);
      }
    }

    const success = errors.length === 0;
    return {
      status: success,
      message: success
        ? "All movements created successfully"
        : `Created ${createdMovements.length} movements with ${errors.length} errors`,
      data: { created: createdMovements, errors },
    };
  } catch (error) {
    console.error("Error in bulkCreateInventoryMovements:", error);
    return {
      status: false,
      message: error.message || "Bulk create failed",
      data: null,
    };
  }
};