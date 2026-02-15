// src/main/ipc/inventory/get/statistics.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const InventoryMovement = require("../../../../entities/InventoryMovement");

/**
 * Get inventory movement statistics.
 * @param {Object} params - (unused, kept for consistency)
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params, queryRunner) => {
  try {
    const repo = queryRunner
      ? queryRunner.manager.getRepository(InventoryMovement)
      : AppDataSource.getRepository(InventoryMovement);

    // By type
    const byType = await repo
      .createQueryBuilder("movement")
      .select("movement.movementType", "type")
      .addSelect("SUM(movement.qtyChange)", "totalChange")
      .addSelect("COUNT(*)", "count")
      .groupBy("movement.movementType")
      .getRawMany();

    // Totals increase / decrease
    const totalIncrease = await repo
      .createQueryBuilder("movement")
      .select("SUM(movement.qtyChange)", "total")
      .where("movement.qtyChange > 0")
      .getRawOne();

    const totalDecrease = await repo
      .createQueryBuilder("movement")
      .select("SUM(ABS(movement.qtyChange))", "total")
      .where("movement.qtyChange < 0")
      .getRawOne();

    // Top 5 products by movement count
    const topProducts = await repo
      .createQueryBuilder("movement")
      .select("movement.productId", "productId")
      .addSelect("SUM(movement.qtyChange)", "netChange")
      .addSelect("COUNT(*)", "movementCount")
      .groupBy("movement.productId")
      .orderBy("movementCount", "DESC")
      .limit(5)
      .getRawMany();

    // Monthly trends (last 6 months)
    const monthly = await repo
      .createQueryBuilder("movement")
      .select([
        "strftime('%Y-%m', movement.timestamp) as month",
        "COUNT(*) as count",
        "SUM(CASE WHEN movement.qtyChange > 0 THEN movement.qtyChange ELSE 0 END) as totalIncrease",
        "SUM(CASE WHEN movement.qtyChange < 0 THEN ABS(movement.qtyChange) ELSE 0 END) as totalDecrease",
      ])
      .where("movement.timestamp >= date('now', '-6 months')")
      .groupBy("month")
      .orderBy("month", "DESC")
      .getRawMany();

    return {
      status: true,
      message: "Statistics retrieved successfully",
      data: {
        byType,
        totals: {
          totalIncrease: parseFloat(totalIncrease?.total) || 0,
          totalDecrease: parseFloat(totalDecrease?.total) || 0,
        },
        topProducts,
        monthlyTrends: monthly,
      },
    };
  } catch (error) {
    console.error("Error in getInventoryStatistics:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve statistics",
      data: null,
    };
  }
};