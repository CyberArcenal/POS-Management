// inventory_transactions/reports/movement.ipc.js
//@ts-check
const InventoryTransactionLog = require("../../../../entities/InventoryTransactionLogs");
const Product = require("../../../../entities/Product");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 */
async function getInventoryMovementReport(filters = {}, userId) {
  try {
    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);
    const productRepo = AppDataSource.getRepository(Product);

    // Get date range (default to last 30 days)
    // @ts-ignore
    const endDate = filters.end_date ? new Date(filters.end_date) : new Date();
    // @ts-ignore
    const startDate = filters.start_date ? new Date(filters.start_date) : new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Build query for transactions
    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.product", "product")
      .leftJoinAndSelect("transaction.performed_by", "performed_by")
      .where("transaction.created_at BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      })
      .andWhere("transaction.change_amount != 0") // Only include actual stock movements
      .orderBy("transaction.created_at", "DESC");

    // Apply additional filters
    // @ts-ignore
    if (filters.product_id) {
      queryBuilder.andWhere("transaction.product_id = :product_id", {
        // @ts-ignore
        product_id: filters.product_id.toString(),
      });
    }

    // @ts-ignore
    if (filters.category_name) {
      queryBuilder.andWhere("product.category_name = :category_name", {
        // @ts-ignore
        category_name: filters.category_name,
      });
    }

    // @ts-ignore
    if (filters.supplier_name) {
      queryBuilder.andWhere("product.supplier_name = :supplier_name", {
        // @ts-ignore
        supplier_name: filters.supplier_name,
      });
    }

    // @ts-ignore
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("transaction.action = :action", { action: filters.action });
    }

    // @ts-ignore
    if (filters.location_id) {
      queryBuilder.andWhere("transaction.location_id = :location_id", {
        // @ts-ignore
        location_id: filters.location_id,
      });
    }

    const transactions = await queryBuilder.getMany();

    if (transactions.length === 0) {
      return {
        status: true,
        message: "No inventory movement data found for the specified period",
        data: {
          period: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            // @ts-ignore
            days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
          },
          summary: {
            total_movements: 0,
            total_increase: 0,
            total_decrease: 0,
            net_change: 0,
            unique_products: 0,
          },
          movements: [],
          product_analysis: [],
          daily_trend: [],
        },
      };
    }

    // Get current product stock for comparison
    const products = await productRepo.find({
      where: { is_deleted: false, is_active: true },
      select: ["id", "name", "sku", "stock", "category_name", "supplier_name"],
    });

    // Calculate movement summary
    const summary = {
      total_movements: transactions.length,
      total_increase: transactions
        // @ts-ignore
        .filter(t => t.change_amount > 0)
        // @ts-ignore
        .reduce((sum, t) => sum + t.change_amount, 0),
      total_decrease: Math.abs(transactions
        // @ts-ignore
        .filter(t => t.change_amount < 0)
        // @ts-ignore
        .reduce((sum, t) => sum + t.change_amount, 0)),
      // @ts-ignore
      net_change: transactions.reduce((sum, t) => sum + t.change_amount, 0),
      unique_products: new Set(transactions.map(t => t.product_id)).size,
      unique_actions: new Set(transactions.map(t => t.action)).size,
      total_monetary_impact: transactions.reduce((sum, t) => 
        // @ts-ignore
        sum + (t.change_amount * (t.price_before || 0)), 0),
      // @ts-ignore
      period_days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
    };

    // Group by product for detailed analysis
    const productMovements = {};
    
    // Initialize with current stock
    products.forEach(product => {
      // @ts-ignore
      productMovements[product.id] = {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        category: product.category_name,
        supplier: product.supplier_name,
        current_stock: product.stock,
        movements: [],
        total_increase: 0,
        total_decrease: 0,
        net_change: 0,
        transaction_count: 0,
        first_movement: null,
        last_movement: null,
      };
    });

    // Add transactions to product movements
    transactions.forEach(transaction => {
      const productId = transaction.product_id;
      
      // @ts-ignore
      if (!productMovements[productId]) {
        // Product might have been deleted, create entry anyway
        // @ts-ignore
        productMovements[productId] = {
          product_id: productId,
          // @ts-ignore
          product_name: transaction.product?.name || `Product ${productId}`,
          // @ts-ignore
          sku: transaction.product?.sku || 'N/A',
          // @ts-ignore
          category: transaction.product?.category_name || 'Uncategorized',
          // @ts-ignore
          supplier: transaction.product?.supplier_name || 'Unknown',
          // @ts-ignore
          current_stock: transaction.product?.stock || 0,
          movements: [],
          total_increase: 0,
          total_decrease: 0,
          net_change: 0,
          transaction_count: 0,
          first_movement: null,
          last_movement: null,
        };
      }

      // @ts-ignore
      productMovements[productId].movements.push({
        id: transaction.id,
        action: transaction.action,
        change_amount: transaction.change_amount,
        quantity_before: transaction.quantity_before,
        quantity_after: transaction.quantity_after,
        date: transaction.created_at,
        // @ts-ignore
        performed_by: transaction.performed_by ? {
          // @ts-ignore
          id: transaction.performed_by.id,
          // @ts-ignore
          username: transaction.performed_by.username,
        } : null,
      });

      // @ts-ignore
      productMovements[productId].transaction_count++;
      
      // @ts-ignore
      if (transaction.change_amount > 0) {
        // @ts-ignore
        productMovements[productId].total_increase += transaction.change_amount;
      } else {
        // @ts-ignore
        productMovements[productId].total_decrease += Math.abs(transaction.change_amount);
      }
      
      // @ts-ignore
      productMovements[productId].net_change += transaction.change_amount;

      // Update first and last movement dates
      // @ts-ignore
      const movementDate = new Date(transaction.created_at);
      // @ts-ignore
      if (!productMovements[productId].first_movement || 
          // @ts-ignore
          movementDate < new Date(productMovements[productId].first_movement)) {
        // @ts-ignore
        productMovements[productId].first_movement = transaction.created_at;
      }
      // @ts-ignore
      if (!productMovements[productId].last_movement || 
          // @ts-ignore
          movementDate > new Date(productMovements[productId].last_movement)) {
        // @ts-ignore
        productMovements[productId].last_movement = transaction.created_at;
      }
    });

    // Convert to array and calculate additional metrics
    const productAnalysis = Object.values(productMovements)
      .filter(product => product.transaction_count > 0)
      .map(product => ({
        ...product,
        movement_frequency: product.transaction_count / summary.period_days,
        average_movement: Math.abs(product.net_change) / product.transaction_count,
        turnover_rate: product.current_stock > 0 ? 
          Math.abs(product.net_change) / product.current_stock : 0,
        activity_level: getActivityLevel(product.transaction_count, summary.period_days),
      }));

    // Sort by various criteria
    const topProductsByVolume = [...productAnalysis]
      .sort((a, b) => Math.abs(b.net_change) - Math.abs(a.net_change))
      .slice(0, 10);

    const topProductsByFrequency = [...productAnalysis]
      .sort((a, b) => b.transaction_count - a.transaction_count)
      .slice(0, 10);

    const mostActiveProducts = [...productAnalysis]
      .sort((a, b) => b.movement_frequency - a.movement_frequency)
      .slice(0, 10);

    // Group by day for daily trend
    const dailyTrend = {};
    transactions.forEach(transaction => {
      // @ts-ignore
      const date = transaction.created_at.toISOString().split('T')[0];
      // @ts-ignore
      if (!dailyTrend[date]) {
        // @ts-ignore
        dailyTrend[date] = {
          date,
          movements: 0,
          increase: 0,
          decrease: 0,
          net_change: 0,
          products: new Set(),
        };
      }
      // @ts-ignore
      dailyTrend[date].movements++;
      // @ts-ignore
      if (transaction.change_amount > 0) {
        // @ts-ignore
        dailyTrend[date].increase += transaction.change_amount;
      } else {
        // @ts-ignore
        dailyTrend[date].decrease += Math.abs(transaction.change_amount);
      }
      // @ts-ignore
      dailyTrend[date].net_change += transaction.change_amount;
      // @ts-ignore
      dailyTrend[date].products.add(transaction.product_id);
    });

    // Convert Set to count
    Object.keys(dailyTrend).forEach(date => {
      // @ts-ignore
      dailyTrend[date].unique_products = dailyTrend[date].products.size;
      // @ts-ignore
      delete dailyTrend[date].products;
    });

    const dailyTrendArray = Object.values(dailyTrend)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Generate report insights
    const insights = generateMovementInsights(summary, productAnalysis, dailyTrendArray);

    await log_audit("movement_report", "InventoryTransactionLog", 0, userId, {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      total_movements: summary.total_movements,
      unique_products: summary.unique_products,
    });

    return {
      status: true,
      message: "Inventory movement report generated successfully",
      data: {
        report_period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          days: summary.period_days,
        },
        summary,
        // @ts-ignore
        product_analysis,
        top_products: {
          by_volume: topProductsByVolume,
          by_frequency: topProductsByFrequency,
          by_activity: mostActiveProducts,
        },
        daily_trend: dailyTrendArray,
        insights,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getInventoryMovementReport error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, userId, {
      action: "movement_report",
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to generate inventory movement report: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Determine activity level based on transactions per day
 * @param {number} transactionCount
 * @param {number} days
 */
function getActivityLevel(transactionCount, days) {
  const transactionsPerDay = transactionCount / days;
  
  if (transactionsPerDay > 1) return 'high';
  if (transactionsPerDay > 0.3) return 'medium';
  return 'low';
}

/**
 * Generate insights from movement data
 * @param {{ total_movements: any; total_increase?: number; total_decrease?: number; net_change: any; unique_products?: number; unique_actions?: number; total_monetary_impact?: number; period_days: any; }} summary
 * @param {any[]} productAnalysis
 * @param {any[]} dailyTrend
 */
function generateMovementInsights(summary, productAnalysis, dailyTrend) {
  const insights = [];

  // Overall activity insight
  const movementsPerDay = summary.total_movements / summary.period_days;
  if (movementsPerDay > 10) {
    insights.push({
      type: 'high_activity',
      message: `High inventory activity: ${movementsPerDay.toFixed(1)} movements per day on average`,
      priority: 'medium',
      data: { movements_per_day: movementsPerDay },
    });
  } else if (movementsPerDay < 1) {
    insights.push({
      type: 'low_activity',
      message: `Low inventory activity: ${movementsPerDay.toFixed(1)} movements per day on average`,
      priority: 'low',
      data: { movements_per_day: movementsPerDay },
    });
  }

  // Net change insight
  if (summary.net_change > 0) {
    insights.push({
      type: 'net_stock_increase',
      message: `Net stock increase of ${summary.net_change} units across all products`,
      priority: 'medium',
      data: { net_change: summary.net_change },
    });
  } else if (summary.net_change < 0) {
    insights.push({
      type: 'net_stock_decrease',
      message: `Net stock decrease of ${Math.abs(summary.net_change)} units across all products`,
      priority: 'medium',
      data: { net_change: summary.net_change },
    });
  }

  // Product concentration insight
  const top10Products = productAnalysis
    .sort((/** @type {{ net_change: number; }} */ a, /** @type {{ net_change: number; }} */ b) => Math.abs(b.net_change) - Math.abs(a.net_change))
    .slice(0, 10);
  
  const top10Volume = top10Products.reduce((/** @type {number} */ sum, /** @type {{ net_change: number; }} */ product) => sum + Math.abs(product.net_change), 0);
  const totalVolume = productAnalysis.reduce((/** @type {number} */ sum, /** @type {{ net_change: number; }} */ product) => sum + Math.abs(product.net_change), 0);
  
  if (totalVolume > 0) {
    const concentration = (top10Volume / totalVolume) * 100;
    if (concentration > 80) {
      insights.push({
        type: 'high_concentration',
        message: `Top 10 products account for ${concentration.toFixed(1)}% of total movement volume`,
        priority: 'medium',
        data: { concentration_percentage: concentration },
      });
    }
  }

  // Daily consistency insight
  const daysWithMovement = dailyTrend.filter((/** @type {{ movements: number; }} */ day) => day.movements > 0).length;
  const consistency = (daysWithMovement / summary.period_days) * 100;
  
  if (consistency > 90) {
    insights.push({
      type: 'high_consistency',
      message: `Inventory activity on ${consistency.toFixed(1)}% of days (${daysWithMovement}/${summary.period_days} days)`,
      priority: 'low',
      data: { consistency_percentage: consistency, active_days: daysWithMovement },
    });
  } else if (consistency < 50) {
    insights.push({
      type: 'low_consistency',
      message: `Inventory activity on only ${consistency.toFixed(1)}% of days (${daysWithMovement}/${summary.period_days} days)`,
      priority: 'medium',
      data: { consistency_percentage: consistency, active_days: daysWithMovement },
    });
  }

  // Fast-moving products insight
  const fastMovingProducts = productAnalysis
    .filter((/** @type {{ activity_level: string; }} */ product) => product.activity_level === 'high')
    .slice(0, 5);
  
  if (fastMovingProducts.length > 0) {
    insights.push({
      type: 'fast_moving_products',
      message: `${fastMovingProducts.length} products with high movement activity`,
      priority: 'medium',
      data: {
        products: fastMovingProducts.map((/** @type {{ product_id: any; product_name: any; movement_frequency: any; }} */ p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          movement_frequency: p.movement_frequency,
        })),
      },
    });
  }

  // Inactive products insight (if we have product data)
  const inactiveProducts = productAnalysis
    .filter((/** @type {{ activity_level: string; transaction_count: number; }} */ product) => product.activity_level === 'low' && product.transaction_count > 0)
    .slice(0, 5);
  
  if (inactiveProducts.length > 0) {
    insights.push({
      type: 'inactive_products',
      message: `${inactiveProducts.length} products with low movement activity`,
      priority: 'low',
      data: {
        products: inactiveProducts.map((/** @type {{ product_id: any; product_name: any; last_movement: any; }} */ p) => ({
          product_id: p.product_id,
          product_name: p.product_name,
          last_movement: p.last_movement,
        })),
      },
    });
  }

  return insights;
}

module.exports = getInventoryMovementReport;