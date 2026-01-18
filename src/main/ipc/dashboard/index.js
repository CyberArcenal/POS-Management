// dashboard/index.js - POS Management Dashboard Handler
//@ts-check
const { ipcMain } = require("electron");
const { withErrorHandling } = require("../../../utils/errorHandler");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/dataSource");

class DashboardHandler {
  constructor() {
    this.salesRepo = null;
    this.productRepo = null;
    this.userRepo = null;
    this.inventoryRepo = null;
    this.syncDataRepo = null;
    this.initializeRepositories();
  }

  initializeRepositories() {
    this.salesRepo = AppDataSource.getRepository("Sale");
    this.productRepo = AppDataSource.getRepository("Product");
    this.userRepo = AppDataSource.getRepository("User");
    this.inventoryRepo = AppDataSource.getRepository("InventoryTransactionLog");
    this.syncDataRepo = AppDataSource.getRepository("SyncData");
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};
      const userId = params.userId || event.sender.id || 0;

      // Log the request
      if (logger) {
        logger.info(`DashboardHandler: ${method}`, { params, userId });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📊 SALES ANALYTICS
        case "getSalesOverview":
          return await this.getSalesOverview(params);
        
        case "getSalesTrend":
          return await this.getSalesTrend(params);
        
        case "getTopSellingProducts":
          return await this.getTopSellingProducts(params);
        
        case "getSalesByCategory":
          return await this.getSalesByCategory(params);
        
        case "getHourlySalesPattern":
          return await this.getHourlySalesPattern(params);
        
        case "getSalesComparison":
          return await this.getSalesComparison(params);

        // 📦 INVENTORY ANALYTICS
        case "getInventoryOverview":
          return await this.getInventoryOverview(params);
        
        case "getLowStockAlerts":
          return await this.getLowStockAlerts(params);
        
        case "getStockMovement":
          return await this.getStockMovement(params);
        
        case "getInventoryTurnover":
          return await this.getInventoryTurnover(params);
        
        case "getExpiringProducts":
          return await this.getExpiringProducts(params);
        
        case "getInventoryValue":
          return await this.getInventoryValue(params);

        // 👤 PERFORMANCE ANALYTICS
        case "getStaffPerformance":
          return await this.getStaffPerformance(params);
        
        case "getCashierPerformance":
          return await this.getCashierPerformance(params);
        
        case "getUserActivitySummary":
          return await this.getUserActivitySummary(params);

        // 💰 FINANCIAL METRICS
        case "getRevenueMetrics":
          return await this.getRevenueMetrics(params);
        
        case "getProfitAnalysis":
          return await this.getProfitAnalysis(params);
        
        case "getAverageTransactionValue":
          return await this.getAverageTransactionValue(params);
        
        case "getDiscountAnalysis":
          return await this.getDiscountAnalysis(params);

        // 📈 REAL-TIME DASHBOARD
        case "getLiveDashboard":
          return await this.getLiveDashboard(params);
        
        case "getTodayStats":
          return await this.getTodayStats(params);
        
        case "getRealTimeSales":
          return await this.getRealTimeSales(params);
        
        case "getCurrentQueue":
          return await this.getCurrentQueue(params);

        // 🔄 SYNC & SYSTEM HEALTH
        case "getSyncStatus":
          return await this.getSyncStatus(params);
        
        case "getSystemHealth":
          return await this.getSystemHealth(params);
        
        case "getAuditSummary":
          return await this.getAuditSummary(params);
        
        case "getRecentActivities":
          return await this.getRecentActivities(params);

        // 📱 MOBILE DASHBOARD
        case "getMobileDashboard":
          return await this.getMobileDashboard(params);
        
        case "getQuickStats":
          return await this.getQuickStats(params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("DashboardHandler error:", error);
      if (logger) {
        logger.error("DashboardHandler error:", error);
      }
      return {
        status: false,
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  // 📊 SALES ANALYTICS METHODS
  /**
     * @param {{ startDate?: any; endDate?: any; comparePeriod?: any; }} params
     */
  async getSalesOverview(params) {
    try {
      const { startDate, endDate, comparePeriod = false } = params;
      
      // Current period sales
      const salesQuery = this.salesRepo.createQueryBuilder("sale")
        .select([
          "COUNT(sale.id) as totalTransactions",
          "SUM(sale.total) as totalRevenue",
          "AVG(sale.total) as averageTransactionValue",
          "MAX(sale.total) as highestSale",
          "MIN(sale.total) as lowestSale"
        ])
        .where("sale.status = :status", { status: "completed" });

      if (startDate && endDate) {
        salesQuery.andWhere("sale.datetime BETWEEN :start AND :end", { 
          start: startDate, 
          end: endDate 
        });
      }

      const currentStats = await salesQuery.getRawOne();

      // Get sales by payment method (if available)
      const paymentMethodStats = await this.salesRepo.createQueryBuilder("sale")
        .select(["sale.payment_method as paymentMethod", "COUNT(*) as count", "SUM(sale.total) as total"])
        .where("sale.status = :status", { status: "completed" })
        .andWhere("sale.payment_method IS NOT NULL")
        .groupBy("sale.payment_method")
        .getRawMany();

      // Get top 5 products
      const topProducts = await this.productRepo.createQueryBuilder("product")
        .leftJoin("product.saleItems", "saleItem")
        .leftJoin("saleItem.sale", "sale")
        .select([
          "product.id",
          "product.name",
          "product.sku",
          "SUM(saleItem.quantity) as totalQuantity",
          "SUM(saleItem.total_price) as totalRevenue"
        ])
        .where("sale.status = :status", { status: "completed" })
        .groupBy("product.id")
        .orderBy("totalQuantity", "DESC")
        .limit(5)
        .getRawMany();

      // Get sales growth compared to previous period
      let growthStats = null;
      if (comparePeriod) {
        // Calculate previous period (same length)
        // Implementation depends on your date logic
      }

      return {
        status: true,
        message: "Sales overview retrieved successfully",
        data: {
          overview: {
            totalTransactions: parseInt(currentStats.totalTransactions) || 0,
            totalRevenue: parseInt(currentStats.totalRevenue) || 0,
            averageTransactionValue: parseFloat(currentStats.averageTransactionValue) || 0,
            highestSale: parseInt(currentStats.highestSale) || 0,
            lowestSale: parseInt(currentStats.lowestSale) || 0,
            conversionRate: 0, // You can calculate based on traffic
          },
          paymentMethods: paymentMethodStats,
          topProducts: topProducts.map(p => ({
            id: p.product_id,
            name: p.product_name,
            sku: p.product_sku,
            quantity: parseInt(p.totalQuantity) || 0,
            revenue: parseInt(p.totalRevenue) || 0
          })),
          growth: growthStats
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
     * @param {{ period?: any; startDate?: any; endDate?: any; groupBy?: any; }} params
     */
  async getSalesTrend(params) {
    const { period = "daily", startDate, endDate, groupBy = "day" } = params;
    
    let dateFormat;
    switch (groupBy) {
      case "hour":
        dateFormat = "%Y-%m-%d %H:00:00";
        break;
      case "week":
        dateFormat = "%Y-%W";
        break;
      case "month":
        dateFormat = "%Y-%m";
        break;
      case "day":
      default:
        dateFormat = "%Y-%m-%d";
    }

    const trendData = await this.salesRepo.createQueryBuilder("sale")
      .select([
        `DATE_FORMAT(sale.datetime, '${dateFormat}') as period`,
        "COUNT(*) as transactionCount",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgTransactionValue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", { 
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days default
        end: endDate || new Date()
      })
      .groupBy("period")
      .orderBy("period", "ASC")
      .getRawMany();

    return {
      status: true,
      message: "Sales trend retrieved successfully",
      data: {
        period,
        trend: trendData.map(item => ({
          period: item.period,
          transactionCount: parseInt(item.transactionCount),
          totalRevenue: parseInt(item.totalRevenue),
          avgTransactionValue: parseFloat(item.avgTransactionValue)
        })),
        summary: {
          totalRevenue: trendData.reduce((sum, item) => sum + parseInt(item.totalRevenue), 0),
          totalTransactions: trendData.reduce((sum, item) => sum + parseInt(item.transactionCount), 0),
          peakPeriod: trendData.reduce((max, item) => 
            parseInt(item.totalRevenue) > parseInt(max.totalRevenue) ? item : max
          , trendData[0])
        }
      }
    };
  }

  /**
     * @param {{ limit?: any; startDate?: any; endDate?: any; }} params
     */
  async getTopSellingProducts(params) {
    const { limit = 10, startDate, endDate } = params;

    const query = this.productRepo.createQueryBuilder("product")
      .leftJoin("product.saleItems", "saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.id",
        "product.name",
        "product.sku",
        "product.price",
        "product.stock",
        "product.category_name",
        "SUM(saleItem.quantity) as totalSold",
        "SUM(saleItem.total_price) as totalRevenue",
        "AVG(saleItem.unit_price) as avgSellingPrice",
        "COUNT(DISTINCT sale.id) as timesSold"
      ])
      .where("sale.status = :status", { status: "completed" });

    if (startDate && endDate) {
      query.andWhere("sale.datetime BETWEEN :start AND :end", { start: startDate, end: endDate });
    }

    const topProducts = await query
      .groupBy("product.id")
      .orderBy("totalSold", "DESC")
      .limit(limit)
      .getRawMany();

    // Calculate additional metrics
    const productsWithMetrics = topProducts.map(p => {
      const profit = p.product_cost_price ? 
        (parseInt(p.totalRevenue) - (parseInt(p.totalSold) * p.product_cost_price)) : null;
      
      return {
        id: p.product_id,
        name: p.product_name,
        sku: p.product_sku,
        price: p.product_price,
        costPrice: p.product_cost_price,
        stock: p.product_stock,
        category: p.product_category_name,
        totalSold: parseInt(p.totalSold),
        totalRevenue: parseInt(p.totalRevenue),
        avgSellingPrice: parseFloat(p.avgSellingPrice),
        timesSold: parseInt(p.timesSold),
        profit: profit,
        profitMargin: profit ? (profit / parseInt(p.totalRevenue)) * 100 : null
      };
    });

    return {
      status: true,
      message: "Top selling products retrieved successfully",
      data: {
        products: productsWithMetrics,
        summary: {
          totalItemsSold: productsWithMetrics.reduce((sum, p) => sum + p.totalSold, 0),
          totalRevenue: productsWithMetrics.reduce((sum, p) => sum + p.totalRevenue, 0),
          averagePrice: productsWithMetrics.reduce((sum, p) => sum + p.price, 0) / productsWithMetrics.length
        }
      }
    };
  }

  /**
     * @param {{ startDate?: any; endDate?: any; }} params
     */
  async getSalesByCategory(params) {
    const { startDate, endDate } = params;

    const categorySales = await this.productRepo.createQueryBuilder("product")
      .leftJoin("product.saleItems", "saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.category_name as category",
        "COUNT(DISTINCT product.id) as productCount",
        "SUM(saleItem.quantity) as totalQuantity",
        "SUM(saleItem.total_price) as totalRevenue",
        "AVG(saleItem.unit_price) as avgPrice"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("product.category_name IS NOT NULL")
      .andWhere("sale.datetime BETWEEN :start AND :end", { 
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("product.category_name")
      .orderBy("totalRevenue", "DESC")
      .getRawMany();

    const totalRevenue = categorySales.reduce((sum, item) => sum + parseInt(item.totalRevenue), 0);

    const categoryData = categorySales.map(item => ({
      category: item.category,
      productCount: parseInt(item.productCount),
      totalQuantity: parseInt(item.totalQuantity),
      totalRevenue: parseInt(item.totalRevenue),
      avgPrice: parseFloat(item.avgPrice),
      percentage: totalRevenue > 0 ? (parseInt(item.totalRevenue) / totalRevenue) * 100 : 0
    }));

    return {
      status: true,
      message: "Sales by category retrieved successfully",
      data: {
        categories: categoryData,
        summary: {
          totalCategories: categoryData.length,
          totalRevenue,
          mostPopularCategory: categoryData[0],
          leastPopularCategory: categoryData[categoryData.length - 1]
        }
      }
    };
  }

  /**
     * @param {{ days?: any; }} params
     */
  async getHourlySalesPattern(params) {
    const { days = 30 } = params;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const hourlyPattern = await this.salesRepo.createQueryBuilder("sale")
      .select([
        "HOUR(sale.datetime) as hour",
        "DAYNAME(sale.datetime) as day",
        "COUNT(*) as transactionCount",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgTransactionValue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :startDate", { startDate })
      .groupBy("HOUR(sale.datetime), DAYNAME(sale.datetime)")
      .orderBy("hour", "ASC")
      .addOrderBy("FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
      .getRawMany();

    // Group by hour
    const hourlySummary = {};
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    hourlyPattern.forEach(item => {
      const hour = parseInt(item.hour);
      if (!hourlySummary[hour]) {
        hourlySummary[hour] = {
          hour: hour,
          totalRevenue: 0,
          totalTransactions: 0,
          byDay: {}
        };
      }

      hourlySummary[hour].totalRevenue += parseInt(item.totalRevenue);
      hourlySummary[hour].totalTransactions += parseInt(item.transactionCount);
      hourlySummary[hour].byDay[item.day] = {
        revenue: parseInt(item.totalRevenue),
        transactions: parseInt(item.transactionCount)
      };
    });

    // Find peak hours
    const hoursArray = Object.values(hourlySummary);
    const peakHour = hoursArray.reduce((max, hour) => 
      hour.totalRevenue > max.totalRevenue ? hour : max, hoursArray[0]
    );

    return {
      status: true,
      message: "Hourly sales pattern retrieved successfully",
      data: {
        pattern: hoursArray,
        peakHours: {
          hour: peakHour.hour,
          revenue: peakHour.totalRevenue,
          transactions: peakHour.totalTransactions
        },
        summary: {
          busiestDay: this.getBusiestDay(hourlyPattern),
          quietestHour: hoursArray.reduce((min, hour) => 
            hour.totalRevenue < min.totalRevenue ? hour : min, hoursArray[0]
          )
        }
      }
    };
  }

  /**
     * @param {any[]} hourlyPattern
     */
  getBusiestDay(hourlyPattern) {
    const dayTotals = {};
    
    hourlyPattern.forEach((/** @type {{ day: string | number; totalRevenue: string; transactionCount: string; }} */ item) => {
      if (!dayTotals[item.day]) {
        dayTotals[item.day] = { revenue: 0, transactions: 0 };
      }
      dayTotals[item.day].revenue += parseInt(item.totalRevenue);
      dayTotals[item.day].transactions += parseInt(item.transactionCount);
    });

    return Object.entries(dayTotals).reduce((max, [day, stats]) => 
      stats.revenue > max.stats.revenue ? { day, stats } : max, 
      { day: '', stats: { revenue: 0, transactions: 0 } }
    );
  }

  /**
     * @param {{}} params
     */
  async getInventoryOverview(params) {
    const inventoryStats = await this.productRepo.createQueryBuilder("product")
      .select([
        "COUNT(*) as totalProducts",
        "SUM(CASE WHEN product.stock <= 0 THEN 1 ELSE 0 END) as outOfStock",
        "SUM(CASE WHEN product.stock > 0 AND product.stock <= product.min_stock THEN 1 ELSE 0 END) as lowStock",
        "SUM(product.stock) as totalStock",
        "SUM(product.stock * product.price) as totalValue"
      ])
      .where("product.is_active = :active", { active: true })
      .andWhere("product.is_deleted = :deleted", { deleted: false })
      .getRawOne();

    // Recent inventory movements
    const recentMovements = await this.inventoryRepo.createQueryBuilder("log")
      .leftJoin("log.product", "product")
      .select([
        "log.action",
        "log.change_amount",
        "log.created_at",
        "product.name",
        "product.sku"
      ])
      .orderBy("log.created_at", "DESC")
      .limit(10)
      .getMany();

    // Stock alerts
    const stockAlerts = await this.productRepo.createQueryBuilder("product")
      .where("product.stock <= product.min_stock")
      .andWhere("product.stock > 0")
      .andWhere("product.is_active = :active", { active: true })
      .orderBy("product.stock", "ASC")
      .limit(10)
      .getMany();

    return {
      status: true,
      message: "Inventory overview retrieved successfully",
      data: {
        summary: {
          totalProducts: parseInt(inventoryStats.totalProducts),
          outOfStock: parseInt(inventoryStats.outOfStock),
          lowStock: parseInt(inventoryStats.lowStock),
          totalStock: parseInt(inventoryStats.totalStock),
          totalValue: parseInt(inventoryStats.totalValue) || 0,
          inStock: parseInt(inventoryStats.totalProducts) - 
                   parseInt(inventoryStats.outOfStock) - 
                   parseInt(inventoryStats.lowStock)
        },
        recentMovements: recentMovements.map(move => ({
          action: move.action,
          change: move.change_amount,
          date: move.created_at,
          product: move.product?.name,
          sku: move.product?.sku
        })),
        stockAlerts: stockAlerts.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stock,
          minStock: product.min_stock,
          needed: product.min_stock - product.stock
        }))
      }
    };
  }

  /**
     * @param {{ threshold?: any; }} params
     */
  async getLowStockAlerts(params) {
    const { threshold = 0 } = params;

    const alerts = await this.productRepo.createQueryBuilder("product")
      .where("product.stock <= :threshold", { threshold })
      .orWhere("product.stock <= product.min_stock")
      .andWhere("product.is_active = :active", { active: true })
      .andWhere("product.is_deleted = :deleted", { deleted: false })
      .orderBy("product.stock", "ASC")
      .getMany();

    return {
      status: true,
      message: "Low stock alerts retrieved successfully",
      data: {
        alerts: alerts.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stock,
          minStock: product.min_stock,
          category: product.category_name,
          supplier: product.supplier_name,
          lastReorder: product.last_reorder_date,
          reorderQuantity: product.reorder_quantity,
          urgency: this.calculateStockUrgency(product.stock, product.min_stock)
        })),
        summary: {
          critical: alerts.filter(p => p.stock === 0).length,
          warning: alerts.filter(p => p.stock > 0 && p.stock <= p.min_stock).length,
          attention: alerts.filter(p => p.stock > p.min_stock && p.stock <= p.min_stock * 2).length
        }
      }
    };
  }

  /**
     * @param {number} currentStock
     * @param {number} minStock
     */
  calculateStockUrgency(currentStock, minStock) {
    if (currentStock === 0) return 'critical';
    if (currentStock <= minStock) return 'warning';
    if (currentStock <= minStock * 2) return 'attention';
    return 'normal';
  }

  /**
     * @param {{ startDate?: any; endDate?: any; }} params
     */
  async getStaffPerformance(params) {
    const { startDate, endDate } = params;

    const performance = await this.userRepo.createQueryBuilder("user")
      .leftJoin("user.sales", "sale")
      .select([
        "user.id",
        "user.username",
        "user.display_name",
        "user.role",
        "COUNT(sale.id) as totalSales",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgSaleValue",
        "MAX(sale.total) as highestSale",
        "MIN(sale.total) as lowestSale"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("user.id")
      .orderBy("totalRevenue", "DESC")
      .getRawMany();

    const performanceData = performance.map(staff => ({
      id: staff.user_id,
      name: staff.user_display_name || staff.user_username,
      username: staff.user_username,
      role: staff.user_role,
      metrics: {
        totalSales: parseInt(staff.totalSales),
        totalRevenue: parseInt(staff.totalRevenue),
        avgSaleValue: parseFloat(staff.avgSaleValue),
        highestSale: parseInt(staff.highestSale),
        lowestSale: parseInt(staff.lowestSale),
        efficiency: parseInt(staff.totalSales) > 0 ? 
          parseInt(staff.totalRevenue) / parseInt(staff.totalSales) : 0
      }
    }));

    return {
      status: true,
      message: "Staff performance retrieved successfully",
      data: {
        performance: performanceData,
        summary: {
          topPerformer: performanceData[0],
          averageRevenue: performanceData.reduce((sum, s) => sum + s.metrics.totalRevenue, 0) / performanceData.length,
          totalStaff: performanceData.length
        }
      }
    };
  }

  /**
     * @param {{}} params
     */
  async getLiveDashboard(params) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Today's sales
    const todaySales = await this.salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactionCount",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgTransactionValue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :todayStart", { todayStart })
      .getRawOne();

    // Current hour sales
    const currentHour = now.getHours();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 0, 0);
    
    const hourSales = await this.salesRepo.createQueryBuilder("sale")
      .select("COUNT(*) as transactionCount")
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :hourStart", { hourStart })
      .getRawOne();

    // Active users
    const activeUsers = await this.userRepo.createQueryBuilder("user")
      .where("user.last_login_at >= :recent", { 
        recent: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
      })
      .andWhere("user.is_active = :active", { active: true })
      .getCount();

    // Recent transactions
    const recentTransactions = await this.salesRepo.createQueryBuilder("sale")
      .leftJoin("sale.user", "user")
      .select([
        "sale.id",
        "sale.total",
        "sale.datetime",
        "sale.reference_number",
        "user.display_name"
      ])
      .where("sale.status = :status", { status: "completed" })
      .orderBy("sale.datetime", "DESC")
      .limit(5)
      .getMany();

    // System status
    const lastSync = await this.syncDataRepo.createQueryBuilder("sync")
      .select(["sync.completedAt", "sync.status", "sync.errorMessage"])
      .orderBy("sync.completedAt", "DESC")
      .limit(1)
      .getOne();

    return {
      status: true,
      message: "Live dashboard data retrieved successfully",
      data: {
        timestamp: now.toISOString(),
        today: {
          transactionCount: parseInt(todaySales?.transactionCount) || 0,
          totalRevenue: parseInt(todaySales?.totalRevenue) || 0,
          avgTransactionValue: parseFloat(todaySales?.avgTransactionValue) || 0
        },
        currentHour: {
          transactionCount: parseInt(hourSales?.transactionCount) || 0,
          hour: currentHour
        },
        activeUsers,
        recentTransactions: recentTransactions.map(tx => ({
          id: tx.id,
          total: tx.total,
          time: tx.datetime,
          reference: tx.reference_number,
          cashier: tx.user?.display_name
        })),
        systemStatus: {
          lastSync: lastSync?.completedAt,
          syncStatus: lastSync?.status,
          hasErrors: lastSync?.status === 'failed',
          uptime: process.uptime()
        },
        alerts: await this.getDashboardAlerts()
      }
    };
  }

  async getDashboardAlerts() {
    const alerts = [];
    
    // Check for low stock
    const lowStockCount = await this.productRepo.createQueryBuilder("product")
      .where("product.stock <= product.min_stock")
      .andWhere("product.stock > 0")
      .andWhere("product.is_active = :active", { active: true })
      .getCount();
    
    if (lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        message: `${lowStockCount} products are low in stock`,
        icon: 'exclamation-triangle'
      });
    }

    // Check for out of stock
    const outOfStockCount = await this.productRepo.createQueryBuilder("product")
      .where("product.stock = 0")
      .andWhere("product.is_active = :active", { active: true })
      .getCount();
    
    if (outOfStockCount > 0) {
      alerts.push({
        type: 'danger',
        message: `${outOfStockCount} products are out of stock`,
        icon: 'times-circle'
      });
    }

    // Check for failed syncs
    const failedSyncs = await this.syncDataRepo.createQueryBuilder("sync")
      .where("sync.status = :status", { status: 'failed' })
      .andWhere("sync.createdAt >= :recent", { 
        recent: new Date(Date.now() - 24 * 60 * 60 * 1000)
      })
      .getCount();
    
    if (failedSyncs > 0) {
      alerts.push({
        type: 'danger',
        message: `${failedSyncs} sync operations failed in the last 24 hours`,
        icon: 'sync-alt'
      });
    }

    return alerts;
  }

  /**
     * @param {{}} params
     */
  async getMobileDashboard(params) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get today's summary
    const todaySummary = await this.salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactions",
        "SUM(sale.total) as revenue",
        "AVG(sale.total) as avgTransaction"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :todayStart", { todayStart })
      .getRawOne();

    // Get top 3 products today
    const topProducts = await this.productRepo.createQueryBuilder("product")
      .leftJoin("product.saleItems", "saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.name",
        "SUM(saleItem.quantity) as sold"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :todayStart", { todayStart })
      .groupBy("product.id")
      .orderBy("sold", "DESC")
      .limit(3)
      .getRawMany();

    // Get low stock products
    const lowStock = await this.productRepo.createQueryBuilder("product")
      .select(["product.name", "product.stock", "product.min_stock"])
      .where("product.stock <= product.min_stock")
      .andWhere("product.is_active = :active", { active: true })
      .limit(3)
      .getMany();

    // Get recent sales
    const recentSales = await this.salesRepo.createQueryBuilder("sale")
      .select(["sale.total", "sale.datetime"])
      .where("sale.status = :status", { status: "completed" })
      .orderBy("sale.datetime", "DESC")
      .limit(5)
      .getMany();

    return {
      status: true,
      message: "Mobile dashboard data retrieved successfully",
      data: {
        summary: {
          transactions: parseInt(todaySummary?.transactions) || 0,
          revenue: parseInt(todaySummary?.revenue) || 0,
          avgTransaction: parseFloat(todaySummary?.avgTransaction) || 0
        },
        topProducts: topProducts.map(p => ({
          name: p.product_name,
          sold: parseInt(p.sold)
        })),
        lowStock: lowStock.map(p => ({
          name: p.name,
          stock: p.stock,
          minStock: p.min_stock,
          status: p.stock === 0 ? 'out' : 'low'
        })),
        recentSales: recentSales.map(s => ({
          amount: s.total,
          time: s.datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })),
        updatedAt: now.toISOString()
      }
    };
  }

  /**
     * @param {{}} params
     */
  async getQuickStats(params) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Today's stats
    const todayStats = await this.salesRepo.createQueryBuilder("sale")
      .select(["COUNT(*) as transactions", "SUM(sale.total) as revenue"])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: todayStart })
      .getRawOne();

    // Yesterday's stats for comparison
    const yesterdayStats = await this.salesRepo.createQueryBuilder("sale")
      .select(["COUNT(*) as transactions", "SUM(sale.total) as revenue"])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start AND sale.datetime < :end", { 
        start: yesterdayStart, 
        end: todayStart 
      })
      .getRawOne();

    // This week's stats
    const weekStats = await this.salesRepo.createQueryBuilder("sale")
      .select(["COUNT(*) as transactions", "SUM(sale.total) as revenue"])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: weekStart })
      .getRawOne();

    // Product count
    const productCount = await this.productRepo.createQueryBuilder("product")
      .where("product.is_active = :active", { active: true })
      .andWhere("product.is_deleted = :deleted", { deleted: false })
      .getCount();

    // Low stock count
    const lowStockCount = await this.productRepo.createQueryBuilder("product")
      .where("product.stock <= product.min_stock")
      .andWhere("product.stock > 0")
      .andWhere("product.is_active = :active", { active: true })
      .getCount();

    // Out of stock count
    const outOfStockCount = await this.productRepo.createQueryBuilder("product")
      .where("product.stock = 0")
      .andWhere("product.is_active = :active", { active: true })
      .getCount();

    return {
      status: true,
      message: "Quick stats retrieved successfully",
      data: {
        sales: {
          today: {
            transactions: parseInt(todayStats?.transactions) || 0,
            revenue: parseInt(todayStats?.revenue) || 0,
            vsYesterday: {
              transactions: this.calculateChange(
                parseInt(todayStats?.transactions) || 0,
                parseInt(yesterdayStats?.transactions) || 0
              ),
              revenue: this.calculateChange(
                parseInt(todayStats?.revenue) || 0,
                parseInt(yesterdayStats?.revenue) || 0
              )
            }
          },
          week: {
            transactions: parseInt(weekStats?.transactions) || 0,
            revenue: parseInt(weekStats?.revenue) || 0
          }
        },
        inventory: {
          totalProducts: productCount,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          inStock: productCount - lowStockCount - outOfStockCount
        },
        performance: {
          avgTransactionValue: parseInt(todayStats?.revenue) > 0 && parseInt(todayStats?.transactions) > 0 ?
            parseInt(todayStats.revenue) / parseInt(todayStats.transactions) : 0,
          conversionRate: 0 // You can calculate based on your business logic
        }
      }
    };
  }

  /**
     * @param {number} current
     * @param {number} previous
     */
  calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // Additional methods would follow the same pattern...
  // async getRevenueMetrics(params) { ... }
  // async getProfitAnalysis(params) { ... }
  // async getAverageTransactionValue(params) { ... }
  // async getDiscountAnalysis(params) { ... }
  // async getStockMovement(params) { ... }
  // async getInventoryTurnover(params) { ... }
  // async getExpiringProducts(params) { ... }
  // async getInventoryValue(params) { ... }
  // async getCashierPerformance(params) { ... }
  // async getUserActivitySummary(params) { ... }
  // async getSalesComparison(params) { ... }
  // async getRealTimeSales(params) { ... }
  // async getCurrentQueue(params) { ... }
  // async getSyncStatus(params) { ... }
  // async getSystemHealth(params) { ... }
  // async getAuditSummary(params) { ... }
  // async getRecentActivities(params) { ... }
}

// Register IPC handler
const dashboardHandler = new DashboardHandler();

ipcMain.handle(
  "dashboard",
  withErrorHandling(
    dashboardHandler.handleRequest.bind(dashboardHandler),
    "IPC:dashboard"
  )
);

module.exports = { DashboardHandler, dashboardHandler };