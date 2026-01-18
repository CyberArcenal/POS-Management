//@ts-check
const Sale = require("../../../../entities/Sale");
// @ts-ignore
const SaleItem = require("../../../../entities/SaleItem");
// @ts-ignore
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * Get user sales report
 * @param {number} user_id
 * @param {Object} date_range
 * @param {number} userId
 */
async function getUserSalesReport(user_id, date_range = {}, userId) {
  try {
    if (!user_id) {
      return {
        status: false,
        message: "User ID is required",
        data: null
      };
    }

    const saleRepo = AppDataSource.getRepository(Sale);
    
    // Build query
    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .where("sale.user_id = :user_id", { user_id });

    // Apply date range if provided
    // @ts-ignore
    if (date_range.start_date && date_range.end_date) {
      queryBuilder.andWhere("sale.created_at BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: date_range.start_date,
        // @ts-ignore
        end_date: date_range.end_date
      });
    } else {
      // Default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      queryBuilder.andWhere("sale.created_at BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate
      });
    }

    const sales = await queryBuilder
      .orderBy("sale.created_at", "DESC")
      .getMany();

    // Calculate statistics
    const totalSales = sales.length;
    // @ts-ignore
    const totalAmount = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const averageSale = totalSales > 0 ? totalAmount / totalSales : 0;

    // Top selling products for this user
    const productSales = {};
    sales.forEach(sale => {
      // @ts-ignore
      sale.items.forEach(item => {
        const productId = item.product_id;
        // @ts-ignore
        if (!productSales[productId]) {
          // @ts-ignore
          productSales[productId] = {
            product_id: productId,
            product_name: item.product?.name || 'Unknown',
            quantity: 0,
            amount: 0
          };
        }
        // @ts-ignore
        productSales[productId].quantity += item.quantity;
        // @ts-ignore
        productSales[productId].amount += item.total_price;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Daily sales breakdown
    const dailySales = {};
    sales.forEach(sale => {
      // @ts-ignore
      const date = sale.created_at.toISOString().split('T')[0];
      // @ts-ignore
      if (!dailySales[date]) {
        // @ts-ignore
        dailySales[date] = {
          date: date,
          sales_count: 0,
          total_amount: 0
        };
      }
      // @ts-ignore
      dailySales[date].sales_count++;
      // @ts-ignore
      dailySales[date].total_amount += sale.total_amount;
    });

    const dailyBreakdown = Object.values(dailySales)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    await log_audit("fetch_sales_report", "User", user_id, userId, {
      sales_count: totalSales,
      total_amount: totalAmount
    });

    return {
      status: true,
      message: "Sales report retrieved successfully",
      data: {
        user_id: user_id,
        period: date_range,
        summary: {
          total_sales: totalSales,
          total_amount: totalAmount,
          average_sale: averageSale
        },
        top_products: topProducts,
        daily_breakdown: dailyBreakdown,
        recent_sales: sales.slice(0, 20) // Return recent 20 sales
      }
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: error.message,
      data: null
    };
  }
}

module.exports = getUserSalesReport;