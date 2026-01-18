// sales/get/top_products.ipc.js
//@ts-check

const Product = require("../../../entities/Product");
const SaleItem = require("../../../entities/SaleItem");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {number} limit
 * @param {Object} dateRange
 * @param {number} userId
 */
async function getTopSellingProducts(limit = 10, dateRange = {}, userId) {
  try {
    const saleItemRepo = AppDataSource.getRepository(SaleItem);

    const queryBuilder = saleItemRepo
      .createQueryBuilder("sale_item")
      .leftJoinAndSelect("sale_item.sale", "sale")
      .leftJoinAndSelect("sale_item.product", "product")
      .where("sale.status = :status", { status: "completed" });

    // Apply date range if provided
    // @ts-ignore
    if (dateRange.start_date && dateRange.end_date) {
      queryBuilder.andWhere("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: dateRange.start_date,
        // @ts-ignore
        end_date: dateRange.end_date,
      });
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      queryBuilder.andWhere("sale.datetime >= :start_date", {
        start_date: thirtyDaysAgo,
      });
    }

    // Get aggregated data
    const topProducts = await queryBuilder
      .select([
        "product.id as product_id",
        "product.name as product_name",
        "product.sku as sku",
        "product.category_name as category",
        "SUM(sale_item.quantity) as total_quantity",
        "SUM(sale_item.total_price) as total_revenue",
        "COUNT(DISTINCT sale.id) as sales_count",
        "AVG(sale_item.unit_price) as average_price",
      ])
      .groupBy("product.id")
      .orderBy("total_quantity", "DESC")
      .addOrderBy("total_revenue", "DESC")
      .limit(limit)
      .getRawMany();

    // Calculate percentages and rankings
    const totalQuantity = topProducts.reduce((sum, product) => sum + parseFloat(product.total_quantity), 0);
    const totalRevenue = topProducts.reduce((sum, product) => sum + parseFloat(product.total_revenue), 0);

    const enrichedProducts = topProducts.map((product, index) => ({
      rank: index + 1,
      product_id: parseInt(product.product_id),
      product_name: product.product_name,
      sku: product.sku,
      category: product.category,
      metrics: {
        quantity_sold: parseFloat(product.total_quantity),
        revenue: parseFloat(product.total_revenue),
        sales_count: parseInt(product.sales_count),
        average_price: parseFloat(product.average_price),
        average_quantity_per_sale: parseFloat(product.total_quantity) / parseInt(product.sales_count),
        market_share_quantity: totalQuantity > 0 ? 
          (parseFloat(product.total_quantity) / totalQuantity) * 100 : 0,
        market_share_revenue: totalRevenue > 0 ? 
          (parseFloat(product.total_revenue) / totalRevenue) * 100 : 0,
      },
      trends: {
        // These would require historical data comparison
        quantity_growth: 0,
        revenue_growth: 0,
      },
    }));

    // Get fastest moving products (highest turnover rate)
    const productRepo = AppDataSource.getRepository(Product);
    const allProducts = await productRepo.find({
      where: { is_deleted: false, is_active: true },
      select: ["id", "name", "stock", "min_stock"],
    });

    // Calculate turnover for top products
    enrichedProducts.forEach(product => {
      const productInfo = allProducts.find(p => p.id === product.product_id);
      if (productInfo) {
        // @ts-ignore
        product.inventory = {
          current_stock: productInfo.stock,
          min_stock: productInfo.min_stock,
          // @ts-ignore
          turnover_rate: productInfo.stock > 0 ? 
            // @ts-ignore
            product.metrics.quantity_sold / productInfo.stock : 0,
          // @ts-ignore
          stock_status: productInfo.stock <= productInfo.min_stock ? 'low' : 'adequate',
        };
      }
    });

    // Calculate category performance
    const categoryPerformance = {};
    enrichedProducts.forEach(product => {
      const category = product.category || 'Uncategorized';
      // @ts-ignore
      if (!categoryPerformance[category]) {
        // @ts-ignore
        categoryPerformance[category] = {
          products_count: 0,
          total_quantity: 0,
          total_revenue: 0,
          products: [],
        };
      }
      // @ts-ignore
      categoryPerformance[category].products_count++;
      // @ts-ignore
      categoryPerformance[category].total_quantity += product.metrics.quantity_sold;
      // @ts-ignore
      categoryPerformance[category].total_revenue += product.metrics.revenue;
      // @ts-ignore
      categoryPerformance[category].products.push({
        product_id: product.product_id,
        product_name: product.product_name,
        rank: product.rank,
      });
    });

    // Generate insights
    const insights = generateProductInsights(enrichedProducts, categoryPerformance);

    await log_audit("top_products", "Sale", 0, userId, {
      limit,
      date_range: dateRange,
      products_count: enrichedProducts.length,
    });

    return {
      status: true,
      message: `Top ${enrichedProducts.length} selling products retrieved successfully`,
      data: {
        products: enrichedProducts,
        summary: {
          total_products_analyzed: enrichedProducts.length,
          total_quantity_sold: totalQuantity,
          total_revenue: totalRevenue,
          average_price_all: totalQuantity > 0 ? totalRevenue / totalQuantity : 0,
          // @ts-ignore
          date_range: dateRange.start_date && dateRange.end_date ? 
            // @ts-ignore
            `${dateRange.start_date} to ${dateRange.end_date}` : 'Last 30 days',
        },
        category_performance: categoryPerformance,
        insights: insights,
        time_period: dateRange,
      },
    };
  } catch (error) {
    console.error("getTopSellingProducts error:", error);

    await log_audit("error", "Sale", 0, userId, {
      action: "top_products",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get top selling products: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Generate insights from top products data
 * @param {any[]} products
 * @param {{ [s: string]: any; } | ArrayLike<any>} categoryPerformance
 */
function generateProductInsights(products, categoryPerformance) {
  const insights = [];

  if (products.length === 0) {
    insights.push({
      type: 'no_data',
      message: 'No sales data available for analysis',
      priority: 'info',
    });
    return insights;
  }

  // Top performer insight
  const topProduct = products[0];
  insights.push({
    type: 'top_performer',
    message: `Top seller: ${topProduct.product_name} sold ${topProduct.metrics.quantity_sold} units generating ₱${topProduct.metrics.revenue.toFixed(2)}`,
    priority: 'high',
    data: {
      product_id: topProduct.product_id,
      product_name: topProduct.product_name,
      quantity: topProduct.metrics.quantity_sold,
      revenue: topProduct.metrics.revenue,
    },
  });

  // Category performance insight
  const topCategory = Object.entries(categoryPerformance)
    .reduce((max, [category, data]) => 
      data.total_revenue > max.total_revenue ? { category, ...data } : max, 
      { category: '', total_revenue: 0 });

  if (topCategory.category) {
    insights.push({
      type: 'top_category',
      message: `Best performing category: ${topCategory.category} with ₱${topCategory.total_revenue.toFixed(2)} revenue`,
      priority: 'medium',
      data: {
        category: topCategory.category,
        revenue: topCategory.total_revenue,
        // @ts-ignore
        products_count: topCategory.products_count,
      },
    });
  }

  // Stock level insights
  const lowStockProducts = products.filter((/** @type {{ inventory: { stock_status: string; }; }} */ p) => 
    p.inventory && p.inventory.stock_status === 'low'
  );

  if (lowStockProducts.length > 0) {
    insights.push({
      type: 'low_stock_warning',
      message: `${lowStockProducts.length} top-selling products are low on stock`,
      priority: 'high',
      data: {
        products: lowStockProducts.map((/** @type {{ product_id: any; product_name: any; inventory: { current_stock: any; min_stock: any; }; }} */ p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          current_stock: p.inventory.current_stock,
          min_stock: p.inventory.min_stock,
        })),
      },
    });
  }

  // High turnover insight
  const highTurnoverProducts = products
    .filter((/** @type {{ inventory: { turnover_rate: number; }; }} */ p) => p.inventory && p.inventory.turnover_rate > 2)
    .sort((/** @type {{ inventory: { turnover_rate: number; }; }} */ a, /** @type {{ inventory: { turnover_rate: number; }; }} */ b) => b.inventory.turnover_rate - a.inventory.turnover_rate);

  if (highTurnoverProducts.length > 0) {
    const fastest = highTurnoverProducts[0];
    insights.push({
      type: 'high_turnover',
      message: `Fastest moving product: ${fastest.product_name} with turnover rate of ${fastest.inventory.turnover_rate.toFixed(2)}`,
      priority: 'medium',
      data: {
        product_id: fastest.product_id,
        product_name: fastest.product_name,
        turnover_rate: fastest.inventory.turnover_rate,
      },
    });
  }

  // Revenue concentration insight
  const top3Revenue = products.slice(0, 3).reduce((/** @type {any} */ sum, /** @type {{ metrics: { revenue: any; }; }} */ p) => sum + p.metrics.revenue, 0);
  const revenueConcentration = (top3Revenue / products.reduce((/** @type {any} */ sum, /** @type {{ metrics: { revenue: any; }; }} */ p) => sum + p.metrics.revenue, 0)) * 100;

  if (revenueConcentration > 50) {
    insights.push({
      type: 'revenue_concentration',
      message: `Top 3 products generate ${revenueConcentration.toFixed(1)}% of total revenue. Consider diversifying product offerings.`,
      priority: 'medium',
      data: {
        concentration_percentage: revenueConcentration,
        top_products: products.slice(0, 3).map((/** @type {{ product_id: any; product_name: any; metrics: { revenue: any; }; }} */ p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          revenue: p.metrics.revenue,
        })),
      },
    });
  }

  return insights;
}

module.exports = getTopSellingProducts;