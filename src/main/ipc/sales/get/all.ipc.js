// sales/get/all.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 */
async function getAllSales(filters = {}, userId) {
  try {
    const saleRepo = AppDataSource.getRepository(Sale);

    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.user", "user")
      .orderBy("sale.datetime", "DESC")
      .take(1000); // Limit to prevent performance issues

    // Apply filters
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      queryBuilder.andWhere("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.status) {
      // @ts-ignore
      queryBuilder.andWhere("sale.status = :status", { status: filters.status });
    }

    // @ts-ignore
    if (filters.user_id) {
      // @ts-ignore
      queryBuilder.andWhere("sale.user_id = :user_id", { user_id: filters.user_id });
    }

    const sales = await queryBuilder.getMany();

    await log_audit("fetch_all", "Sale", 0, userId, {
      filter_count: Object.keys(filters).length,
      result_count: sales.length,
    });

    return {
      status: true,
      message: "All sales fetched successfully",
      data: sales,
    };
  } catch (error) {
    console.error("getAllSales error:", error);

    await log_audit("error", "Sale", 0, userId, {
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch all sales: ${error.message}`,
      data: [],
    };
  }
}

module.exports = getAllSales;