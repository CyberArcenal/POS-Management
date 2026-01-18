// sales/get/by_user.ipc.js
//@ts-check
const Sale = require("../../../../entities/Sale");
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} userId
 * @param {Object} filters
 * @param {number} currentUserId
 */
async function getSalesByUser(userId, filters = {}, currentUserId) {
  try {
    if (!userId) {
      return {
        status: false,
        message: "User ID is required",
        data: null,
      };
    }

    // Check if user exists
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      return {
        status: false,
        message: `User with ID ${userId} not found`,
        data: null,
      };
    }

    const saleRepo = AppDataSource.getRepository(Sale);

    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .where("sale.user_id = :user_id", { user_id: userId })
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
    if (filters.status) {
      // @ts-ignore
      queryBuilder.andWhere("sale.status = :status", { status: filters.status });
    }

    const sales = await queryBuilder.getMany();

    // Calculate user performance metrics
    const performance = {
      total_sales: sales.length,
      // @ts-ignore
      total_revenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      // @ts-ignore
      average_sale_value: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      total_items_sold: sales.reduce((sum, sale) => 
        // @ts-ignore
        sum + (sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0),
      completion_rate: sales.length > 0 ? 
        (sales.filter(s => s.status === 'completed').length / sales.length) * 100 : 0,
      best_selling_day: getBestSellingDay(sales),
    };

    await log_audit("fetch_by_user", "Sale", 0, currentUserId, {
      target_user_id: userId,
      result_count: sales.length,
      user_name: user.username,
    });

    return {
      status: true,
      message: `Sales for user ${user.username} fetched successfully`,
      data: {
        user_info: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
        },
        sales,
        performance,
        // @ts-ignore
        period: filters.start_date && filters.end_date ? 
          // @ts-ignore
          `${filters.start_date} to ${filters.end_date}` : 'All time',
      },
    };
  } catch (error) {
    console.error("getSalesByUser error:", error);

    await log_audit("error", "Sale", 0, currentUserId, {
      target_user_id: userId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch sales by user: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Helper function to find best selling day
 */
// @ts-ignore
function getBestSellingDay(sales) {
  if (sales.length === 0) return null;

  const dayCounts = {};
  // @ts-ignore
  sales.forEach(sale => {
    const date = new Date(sale.datetime).toISOString().split('T')[0];
    // @ts-ignore
    dayCounts[date] = (dayCounts[date] || 0) + 1;
  });

  const bestDay = Object.entries(dayCounts).reduce((max, [date, count]) => 
    count > max.count ? { date, count } : max, { date: '', count: 0 });

  return bestDay.date ? { date: bestDay.date, sales_count: bestDay.count } : null;
}

module.exports = getSalesByUser;