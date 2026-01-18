// sales/get/by_status.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} status
 * @param {Object} filters
 * @param {number} userId
 */
async function getSalesByStatus(status, filters = {}, userId) {
  try {
    if (!status) {
      return {
        status: false,
        message: "Status is required",
        data: null,
      };
    }

    const validStatuses = ['completed', 'cancelled', 'refunded', 'pending', 'processing'];
    if (!validStatuses.includes(status)) {
      return {
        status: false,
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`,
        data: null,
      };
    }

    const saleRepo = AppDataSource.getRepository(Sale);

    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.user", "user")
      .leftJoinAndSelect("sale.items", "items")
      .where("sale.status = :status", { status })
      .orderBy("sale.datetime", "DESC");

    // Apply date filters
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
    if (filters.user_id) {
      queryBuilder.andWhere("sale.user_id = :user_id", {
        // @ts-ignore
        user_id: filters.user_id,
      });
    }

    // @ts-ignore
    if (filters.min_total !== undefined) {
      queryBuilder.andWhere("sale.total >= :min_total", {
        // @ts-ignore
        min_total: filters.min_total,
      });
    }

    // @ts-ignore
    if (filters.max_total !== undefined) {
      queryBuilder.andWhere("sale.total <= :max_total", {
        // @ts-ignore
        max_total: filters.max_total,
      });
    }

    const sales = await queryBuilder.getMany();

    // Calculate status-specific statistics
    const stats = {
      total_count: sales.length,
      // @ts-ignore
      total_amount: sales.reduce((sum, sale) => sum + sale.total, 0),
      // @ts-ignore
      average_amount: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      // @ts-ignore
      oldest_sale: sales.length > 0 ? new Date(Math.min(...sales.map(s => new Date(s.datetime)))) : null,
      // @ts-ignore
      newest_sale: sales.length > 0 ? new Date(Math.max(...sales.map(s => new Date(s.datetime)))) : null,
      // @ts-ignore
      unique_users: new Set(sales.map(s => s.user_id)).size,
    };

    // Group by payment method
    const paymentMethods = {};
    sales.forEach(sale => {
      // @ts-ignore
      if (sale.payment_method) {
        // @ts-ignore
        paymentMethods[sale.payment_method] = (paymentMethods[sale.payment_method] || 0) + 1;
      }
    });

    await log_audit("fetch_by_status", "Sale", 0, userId, {
      status,
      result_count: sales.length,
      total_amount: stats.total_amount,
    });

    return {
      status: true,
      message: `Sales with status '${status}' fetched successfully`,
      data: {
        sales,
        stats,
        payment_method_distribution: paymentMethods,
        filters_applied: {
          // @ts-ignore
          date_range: filters.start_date && filters.end_date ? 
            // @ts-ignore
            `${filters.start_date} to ${filters.end_date}` : 'All time',
          // @ts-ignore
          user_filter: filters.user_id ? 'Applied' : 'Not applied',
        },
      },
    };
  } catch (error) {
    console.error("getSalesByStatus error:", error);

    await log_audit("error", "Sale", 0, userId, {
      status,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch sales by status: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getSalesByStatus;