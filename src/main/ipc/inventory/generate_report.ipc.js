// src/main/ipc/inventory/generate_report.ipc.js
//@ts-check
const { AppDataSource } = require("../../db/datasource");
const InventoryMovement = require("../../../entities/InventoryMovement");
const Product = require("../../../entities/Product");

/**
 * Generate a comprehensive inventory report with summary and movements.
 * @param {Object} params
 * @param {string} [params.startDate] - ISO date.
 * @param {string} [params.endDate] - ISO date.
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const { startDate, endDate } = params;
    const movementRepo = queryRunner
      ? queryRunner.manager.getRepository(InventoryMovement)
      : AppDataSource.getRepository(InventoryMovement);
    const productRepo = queryRunner
      ? queryRunner.manager.getRepository(Product)
      : AppDataSource.getRepository(Product);

    // Product summary
    const products = await productRepo.find({ where: { isActive: true } });
    const productSummary = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: p.stockQty,
      price: p.price,
    }));

    // Movement summary within date range
    const queryBuilder = movementRepo
      .createQueryBuilder("movement")
      .leftJoinAndSelect("movement.product", "product")
      .leftJoinAndSelect("movement.sale", "sale");

    if (startDate) {
      queryBuilder.andWhere("movement.timestamp >= :startDate", { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere("movement.timestamp <= :endDate", { endDate });
    }

    const movements = await queryBuilder.getMany();

    // Group by type
    const byType = movements.reduce((acc, m) => {
      acc[m.movementType] = acc[m.movementType] || { count: 0, totalChange: 0 };
      acc[m.movementType].count++;
      acc[m.movementType].totalChange += m.qtyChange;
      return acc;
    }, {});

    // Top 5 moved products
    const productMovementCount = {};
    movements.forEach((m) => {
      if (m.product) {
        const pid = m.product.id;
        productMovementCount[pid] = productMovementCount[pid] || { count: 0, netChange: 0, name: m.product.name };
        productMovementCount[pid].count++;
        productMovementCount[pid].netChange += m.qtyChange;
      }
    });
    const topProducts = Object.values(productMovementCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      productSummary,
      movementSummary: {
        totalMovements: movements.length,
        byType,
      },
      topProducts,
      recentMovements: movements.slice(0, 50), // limit for performance
    };

    return {
      status: true,
      message: "Report generated",
      data: report,
    };
  } catch (error) {
    console.error("Error in generateInventoryReport:", error);
    return {
      status: false,
      message: error.message || "Report generation failed",
      data: null,
    };
  }
};