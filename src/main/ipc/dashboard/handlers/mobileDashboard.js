// dashboard/handlers/mobileDashboard.js
//@ts-check

const { getDashboardAlerts } = require("./utils");

module.exports = {

  // @ts-ignore
  async getMobileDashboard(repositories, params) {
    // @ts-ignore
    const { sales: salesRepo, product: productRepo } = repositories;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get today's summary
    const todaySummary = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactions",
        "SUM(sale.total) as revenue",
        "AVG(sale.total) as avgTransaction"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :todayStart", { todayStart })
      .getRawOne();

    // Get top 3 products today
    const topProducts = await productRepo.createQueryBuilder("product")
      .leftJoin("product.saleItems", "saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.id",
        "product.name",
        "product.sku",
        "SUM(saleItem.quantity) as sold",
        "SUM(saleItem.total_price) as revenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :todayStart", { todayStart })
      .groupBy("product.id")
      .orderBy("sold", "DESC")
      .limit(3)
      .getRawMany();

    // Get low stock products
    const lowStock = await productRepo.createQueryBuilder("product")
      .select([
        "product.id",
        "product.name",
        "product.sku",
        "product.stock",
        "product.min_stock",
        "product.category_name"
      ])
      .where("product.stock <= product.min_stock")
      .andWhere("product.is_active = :active", { active: true })
      .orderBy("product.stock", "ASC")
      .limit(3)
      .getMany();

    // Get recent sales
    const recentSales = await salesRepo.createQueryBuilder("sale")
      .leftJoin("sale.user", "user")
      .select([
        "sale.id",
        "sale.total",
        "sale.datetime",
        "sale.reference_number",
        "user.display_name as cashier"
      ])
      .where("sale.status = :status", { status: "completed" })
      .orderBy("sale.datetime", "DESC")
      .limit(5)
      .getRawMany();

    // Get system alerts
    const alerts = await getDashboardAlerts(repositories);

    // Get hourly performance for today
    const hourlyPerformance = await salesRepo.createQueryBuilder("sale")
      .select([
        "HOUR(sale.datetime) as hour",
        "COUNT(*) as transactions",
        "SUM(sale.total) as revenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :todayStart", { todayStart })
      .groupBy("HOUR(sale.datetime)")
      .orderBy("hour", "ASC")
      .getRawMany();

    // Get payment method distribution for today
    const paymentMethods = await salesRepo.createQueryBuilder("sale")
      .select([
        "sale.payment_method as method",
        "COUNT(*) as transactions",
        "SUM(sale.total) as revenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :todayStart", { todayStart })
      .andWhere("sale.payment_method IS NOT NULL")
      .groupBy("sale.payment_method")
      .getRawMany();

    // Calculate metrics
    const currentHour = now.getHours();
    const currentHourData = hourlyPerformance.find((/** @type {{ hour: string; }} */ h) => parseInt(h.hour) === currentHour);
    const isPeakHour = this.isCurrentHourPeak(hourlyPerformance, currentHour);

    return {
      status: true,
      message: "Mobile dashboard data retrieved successfully",
      data: {
        timestamp: now.toISOString(),
        summary: {
          transactions: parseInt(todaySummary?.transactions) || 0,
          revenue: parseInt(todaySummary?.revenue) || 0,
          avgTransaction: parseFloat(todaySummary?.avgTransaction) || 0,
          currentHour: currentHourData ? {
            transactions: parseInt(currentHourData.transactions),
            revenue: parseInt(currentHourData.revenue)
          } : { transactions: 0, revenue: 0 }
        },
        topProducts: topProducts.map((/** @type {{ product_id: any; product_name: any; product_sku: any; sold: string; revenue: string; }} */ p) => ({
          id: p.product_id,
          name: p.product_name,
          sku: p.product_sku,
          sold: parseInt(p.sold),
          revenue: parseInt(p.revenue)
        })),
        lowStock: lowStock.map((/** @type {{ id: any; name: any; sku: any; stock: number; min_stock: number; category_name: any; }} */ p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          minStock: p.min_stock,
          category: p.category_name,
          status: p.stock === 0 ? 'Out of Stock' : 
                 p.stock <= p.min_stock ? 'Low Stock' : 'Adequate',
          urgency: p.stock === 0 ? 'critical' : 
                  p.stock <= p.min_stock ? 'warning' : 'normal'
        })),
        recentSales: recentSales.map((/** @type {{ sale_id: any; sale_total: any; sale_datetime: string | number | Date; sale_reference_number: any; cashier: any; }} */ s) => ({
          id: s.sale_id,
          amount: s.sale_total,
          time: new Date(s.sale_datetime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          reference: s.sale_reference_number,
          cashier: s.cashier
        })),
        hourlyPerformance: hourlyPerformance.map((/** @type {{ hour: string; transactions: string; revenue: string; }} */ h) => ({
          hour: parseInt(h.hour),
          transactions: parseInt(h.transactions),
          revenue: parseInt(h.revenue)
        })),
        paymentMethods: paymentMethods.map((/** @type {{ method: any; transactions: string; revenue: string; }} */ m) => ({
          method: m.method,
          transactions: parseInt(m.transactions),
          revenue: parseInt(m.revenue),
          percentage: parseInt(todaySummary?.transactions) > 0 ? 
            (parseInt(m.transactions) / parseInt(todaySummary.transactions)) * 100 : 0
        })),
        alerts: alerts.slice(0, 3), // Limit to 3 alerts for mobile
        metrics: {
          isPeakHour,
          businessStatus: this.getBusinessStatus(
            parseInt(todaySummary?.transactions) || 0,
            hourlyPerformance,
            currentHour
          ),
          estimatedTodayRevenue: this.estimateTodayRevenue(
            parseInt(todaySummary?.revenue) || 0,
            currentHour
          )
        }
      }
    };
  },

  /**
     * @param {any[]} hourlyPerformance
     * @param {number} currentHour
     */
  isCurrentHourPeak(hourlyPerformance, currentHour) {
    if (hourlyPerformance.length === 0) return false;
    
    const currentHourData = hourlyPerformance.find((/** @type {{ hour: string; }} */ h) => parseInt(h.hour) === currentHour);
    if (!currentHourData) return false;

    const maxRevenue = Math.max(...hourlyPerformance.map((/** @type {{ revenue: string; }} */ h) => parseInt(h.revenue)));
    return parseInt(currentHourData.revenue) >= maxRevenue * 0.7; // 70% of peak
  },

  /**
   * @param {number} todayTransactions
   * @param {any} hourlyPerformance
   * @param {number} currentHour
   */
  // @ts-ignore
  getBusinessStatus(todayTransactions, hourlyPerformance, currentHour) {
    if (todayTransactions === 0) return 'Quiet';
    
    const hoursCompleted = currentHour + 1;
    const avgTransactionsPerHour = todayTransactions / hoursCompleted;
    
    if (avgTransactionsPerHour > 5) return 'Busy';
    if (avgTransactionsPerHour > 2) return 'Moderate';
    return 'Slow';
  },

  /**
   * @param {number} currentRevenue
   * @param {number} currentHour
   */
  estimateTodayRevenue(currentRevenue, currentHour) {
    const hoursCompleted = currentHour + 1;
    const hoursRemaining = 24 - hoursCompleted;
    
    if (hoursCompleted === 0) return currentRevenue;
    
    const revenuePerHour = currentRevenue / hoursCompleted;
    return Math.round(currentRevenue + (revenuePerHour * hoursRemaining));
  },


  // @ts-ignore
  async getQuickStats(repositories, params) {
    // @ts-ignore
    const { sales: salesRepo, product: productRepo, user: userRepo } = repositories;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Today's stats
    const todayStats = await salesRepo.createQueryBuilder("sale")
      .select(["COUNT(*) as transactions", "SUM(sale.total) as revenue"])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: todayStart })
      .getRawOne();

    // Yesterday's stats for comparison
    const yesterdayStats = await salesRepo.createQueryBuilder("sale")
      .select(["COUNT(*) as transactions", "SUM(sale.total) as revenue"])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start AND sale.datetime < :end", { 
        start: yesterdayStart, 
        end: todayStart 
      })
      .getRawOne();

    // This week's stats
    const weekStats = await salesRepo.createQueryBuilder("sale")
      .select(["COUNT(*) as transactions", "SUM(sale.total) as revenue"])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: weekStart })
      .getRawOne();

    // Product count
    const productCount = await productRepo.createQueryBuilder("product")
      .where("product.is_active = :active", { active: true })
      .andWhere("product.is_deleted = :deleted", { deleted: false })
      .getCount();

    // Low stock count
    const lowStockCount = await productRepo.createQueryBuilder("product")
      .where("product.stock <= product.min_stock")
      .andWhere("product.stock > 0")
      .andWhere("product.is_active = :active", { active: true })
      .getCount();

    // Out of stock count
    const outOfStockCount = await productRepo.createQueryBuilder("product")
      .where("product.stock = 0")
      .andWhere("product.is_active = :active", { active: true })
      .getCount();

    // Active users today
    const activeUsersToday = await userRepo.createQueryBuilder("user")
      .where("user.last_login_at >= :todayStart", { todayStart })
      .andWhere("user.is_active = :active", { active: true })
      .getCount();

    // Current hour stats
    const currentHour = now.getHours();
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), currentHour, 0, 0);
    
    const currentHourStats = await salesRepo.createQueryBuilder("sale")
      .select(["COUNT(*) as transactions", "SUM(sale.total) as revenue"])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: hourStart })
      .getRawOne();

    // Calculate changes
    const todayTransactions = parseInt(todayStats?.transactions) || 0;
    const todayRevenue = parseInt(todayStats?.revenue) || 0;
    const yesterdayTransactions = parseInt(yesterdayStats?.transactions) || 0;
    const yesterdayRevenue = parseInt(yesterdayStats?.revenue) || 0;

    const transactionChange = this.calculateChange(todayTransactions, yesterdayTransactions);
    const revenueChange = this.calculateChange(todayRevenue, yesterdayRevenue);

    // Recent activity (last 30 minutes)
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const recentActivity = await salesRepo.createQueryBuilder("sale")
      .select("COUNT(*) as count")
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: thirtyMinutesAgo })
      .getRawOne();

    return {
      status: true,
      message: "Quick stats retrieved successfully",
      data: {
        timestamp: now.toISOString(),
        sales: {
          today: {
            transactions: todayTransactions,
            revenue: todayRevenue,
            avgTransactionValue: todayTransactions > 0 ? todayRevenue / todayTransactions : 0,
            vsYesterday: {
              transactions: transactionChange,
              revenue: revenueChange
            }
          },
          week: {
            transactions: parseInt(weekStats?.transactions) || 0,
            revenue: parseInt(weekStats?.revenue) || 0
          },
          currentHour: {
            transactions: parseInt(currentHourStats?.transactions) || 0,
            revenue: parseInt(currentHourStats?.revenue) || 0,
            hour: currentHour
          }
        },
        inventory: {
          totalProducts: productCount,
          lowStock: lowStockCount,
          outOfStock: outOfStockCount,
          inStock: productCount - lowStockCount - outOfStockCount,
          stockHealth: this.getStockHealth(productCount, lowStockCount, outOfStockCount)
        },
        users: {
          activeToday: activeUsersToday,
          recentActivity: parseInt(recentActivity?.count) || 0
        },
        performance: {
          salesPerHour: currentHour > 0 ? todayTransactions / (currentHour + 1) : todayTransactions,
          revenuePerHour: currentHour > 0 ? todayRevenue / (currentHour + 1) : todayRevenue,
          conversionRate: 0 // Placeholder for actual conversion rate calculation
        },
        insights: {
          businessStatus: this.getBusinessStatusFromMetrics(
            todayTransactions,
            parseInt(recentActivity?.count) || 0,
            currentHour
          ),
          topHour: currentHour, // This would need actual calculation
          trend: transactionChange > 0 ? 'up' : transactionChange < 0 ? 'down' : 'stable'
        }
      }
    };
  },

  /**
   * @param {number} current
   * @param {number} previous
   */
  calculateChange(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  },

  /**
   * @param {number} totalProducts
   * @param {number} lowStock
   * @param {number} outOfStock
   */
  getStockHealth(totalProducts, lowStock, outOfStock) {
    const healthyStock = totalProducts - lowStock - outOfStock;
    const healthPercentage = totalProducts > 0 ? (healthyStock / totalProducts) * 100 : 100;
    
    if (healthPercentage >= 90) return 'Excellent';
    if (healthPercentage >= 75) return 'Good';
    if (healthPercentage >= 60) return 'Fair';
    return 'Poor';
  },

  /**
   * @param {number} todayTransactions
   * @param {number} recentActivity
   * @param {number} currentHour
   */
  getBusinessStatusFromMetrics(todayTransactions, recentActivity, currentHour) {
    if (todayTransactions === 0) return 'Closed/Quiet';
    
    const transactionsPerHour = todayTransactions / (currentHour + 1);
    const recentActivityRate = recentActivity / 0.5; // Convert 30-minute rate to hourly
    
    if (recentActivityRate > 10 || transactionsPerHour > 15) return 'Very Busy';
    if (recentActivityRate > 5 || transactionsPerHour > 8) return 'Busy';
    if (recentActivityRate > 2 || transactionsPerHour > 3) return 'Moderate';
    return 'Slow';
  },

  // Additional mobile-specific methods
  /**
   * @param {{ sales: any; product: any; }} repositories
   * @param {{ timeframe?: "today" | undefined; }} params
   */
  async getSalesSnapshot(repositories, params) {
    const { sales: salesRepo, product: productRepo } = repositories;
    const { timeframe = 'today' } = params;
    
    let startDate;
    const now = new Date();
    
    switch (timeframe) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      // @ts-ignore
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        break;
      // @ts-ignore
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        break;
      // @ts-ignore
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const salesData = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactions",
        "SUM(sale.total) as revenue",
        "AVG(sale.total) as avgTransaction"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: startDate })
      .getRawOne();

    const topProducts = await productRepo.createQueryBuilder("product")
      .leftJoin("product.saleItems", "saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.name",
        "SUM(saleItem.quantity) as sold",
        "SUM(saleItem.total_price) as revenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: startDate })
      .groupBy("product.id")
      .orderBy("sold", "DESC")
      .limit(3)
      .getRawMany();

    return {
      status: true,
      message: `Sales snapshot for ${timeframe} retrieved`,
      data: {
        timeframe,
        summary: {
          transactions: parseInt(salesData?.transactions) || 0,
          revenue: parseInt(salesData?.revenue) || 0,
          avgTransaction: parseFloat(salesData?.avgTransaction) || 0
        },
        topProducts: topProducts.map((/** @type {{ product_name: any; sold: string; revenue: string; }} */ p) => ({
          name: p.product_name,
          sold: parseInt(p.sold),
          revenue: parseInt(p.revenue)
        }))
      }
    };
  },

  /**
   * @param {{ product: any; }} repositories
   * @param {any} params
   */
  // @ts-ignore
  async getInventorySnapshot(repositories, params) {
    const { product: productRepo } = repositories;
    
    const inventoryStats = await productRepo.createQueryBuilder("product")
      .select([
        "COUNT(*) as totalProducts",
        "SUM(CASE WHEN product.stock = 0 THEN 1 ELSE 0 END) as outOfStock",
        "SUM(CASE WHEN product.stock > 0 AND product.stock <= product.min_stock THEN 1 ELSE 0 END) as lowStock",
        "SUM(product.stock) as totalStock"
      ])
      .where("product.is_active = :active", { active: true })
      .getRawOne();

    const criticalProducts = await productRepo.createQueryBuilder("product")
      .select([
        "product.name",
        "product.sku",
        "product.stock",
        "product.min_stock"
      ])
      .where("product.stock <= product.min_stock")
      .andWhere("product.is_active = :active", { active: true })
      .orderBy("product.stock", "ASC")
      .limit(5)
      .getMany();

    return {
      status: true,
      message: "Inventory snapshot retrieved",
      data: {
        summary: {
          totalProducts: parseInt(inventoryStats.totalProducts),
          outOfStock: parseInt(inventoryStats.outOfStock),
          lowStock: parseInt(inventoryStats.lowStock),
          totalStock: parseInt(inventoryStats.totalStock),
          inStock: parseInt(inventoryStats.totalProducts) - 
                   parseInt(inventoryStats.outOfStock) - 
                   parseInt(inventoryStats.lowStock)
        },
        criticalProducts: criticalProducts.map((/** @type {{ name: any; sku: any; stock: number; min_stock: any; }} */ p) => ({
          name: p.name,
          sku: p.sku,
          stock: p.stock,
          minStock: p.min_stock,
          status: p.stock === 0 ? 'Out of Stock' : 'Low Stock'
        }))
      }
    };
  }
};