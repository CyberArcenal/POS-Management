// sales/get/by_date_range.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} startDate
 * @param {string} endDate
 * @param {Object} filters
 * @param {number} userId
 */
async function getSalesByDateRange(startDate, endDate, filters = {}, userId) {
  try {
    if (!startDate || !endDate) {
      return {
        status: false,
        message: "Start date and end date are required",
        data: null,
      };
    }

    const saleRepo = AppDataSource.getRepository(Sale);

    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.user", "user")
      .leftJoinAndSelect("sale.items", "items")
      .where("sale.datetime BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      })
      .orderBy("sale.datetime", "DESC");

    // Apply additional filters
    // @ts-ignore
    if (filters.user_id) {
      queryBuilder.andWhere("sale.user_id = :user_id", {
        // @ts-ignore
        user_id: filters.user_id,
      });
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("sale.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.payment_method) {
      queryBuilder.andWhere("sale.payment_method = :payment_method", {
        // @ts-ignore
        payment_method: filters.payment_method,
      });
    }

    const sales = await queryBuilder.getMany();

    // Calculate statistics
    const stats = {
      total_sales: sales.length,
      // @ts-ignore
      total_revenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      // @ts-ignore
      total_items: sales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0),
      // @ts-ignore
      average_sale: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      completed_sales: sales.filter(s => s.status === 'completed').length,
      cancelled_sales: sales.filter(s => s.status === 'cancelled').length,
      refunded_sales: sales.filter(s => s.status === 'refunded').length,
    };

    // Group by hour for hourly analysis
    const hourlyData = {};
    sales.forEach(sale => {
      // @ts-ignore
      const hour = new Date(sale.datetime).getHours();
      // @ts-ignore
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    await log_audit("fetch_by_date", "Sale", 0, userId, {
      start_date: startDate,
      end_date: endDate,
      result_count: sales.length,
    });

    return {
      status: true,
      message: "Sales fetched by date range successfully",
      data: {
        sales,
        stats,
        date_range: {
          start_date: startDate,
          end_date: endDate,
          // @ts-ignore
          days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
        },
        hourly_distribution: hourlyData,
      },
    };
  } catch (error) {
    console.error("getSalesByDateRange error:", error);

    await log_audit("error", "Sale", 0, userId, {
      start_date: startDate,
      end_date: endDate,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch sales by date range: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getSalesByDateRange;