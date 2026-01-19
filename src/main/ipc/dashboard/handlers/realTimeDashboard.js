// dashboard/handlers/realTimeDashboard.js
//@ts-check

const { getDashboardAlerts } = require("./utils");

module.exports = {

  // @ts-ignore
  async getLiveDashboard(repositories, params) {
    // @ts-ignore
    const { sales: salesRepo, user: userRepo, syncData: syncDataRepo } = repositories;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Today's sales
    const todaySales = await salesRepo.createQueryBuilder("sale")
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
    
    const hourSales = await salesRepo.createQueryBuilder("sale")
      .select("COUNT(*) as transactionCount")
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :hourStart", { hourStart })
      .getRawOne();

    // Active users
    const activeUsers = await userRepo.createQueryBuilder("user")
      .where("user.last_login_at >= :recent", { 
        recent: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
      })
      .andWhere("user.is_active = :active", { active: true })
      .getCount();

    // Recent transactions
    const recentTransactions = await salesRepo.createQueryBuilder("sale")
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
    const lastSync = await syncDataRepo.createQueryBuilder("sync")
      .select(["sync.completedAt", "sync.status", "sync.errorMessage"])
      .orderBy("sync.completedAt", "DESC")
      .limit(1)
      .getOne();

    // Get alerts
    const alerts = await getDashboardAlerts(repositories);

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
        recentTransactions: recentTransactions.map((/** @type {{ id: any; total: any; datetime: any; reference_number: any; user: { display_name: any; }; }} */ tx) => ({
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
        alerts
      }
    };
  },


  // @ts-ignore
  async getTodayStats(repositories, params) {
    // @ts-ignore
    const { sales: salesRepo, product: productRepo } = repositories;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Today's summary
    const todaySummary = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactions",
        "SUM(sale.total) as revenue",
        "AVG(sale.total) as avgTransaction",
        "MIN(sale.datetime) as firstSale",
        "MAX(sale.datetime) as lastSale"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :todayStart", { todayStart })
      .getRawOne();

    // Yesterday's summary for comparison
    const yesterdaySummary = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactions",
        "SUM(sale.total) as revenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :yesterdayStart AND sale.datetime < :todayStart", {
        yesterdayStart,
        todayStart
      })
      .getRawOne();

    // This week's summary
    const weekSummary = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactions",
        "SUM(sale.total) as revenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :weekStart", { weekStart })
      .getRawOne();

    // Hourly breakdown for today
    const hourlyBreakdown = await salesRepo.createQueryBuilder("sale")
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

    // Top products today
    const topProductsToday = await productRepo.createQueryBuilder("product")
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
      .limit(5)
      .getRawMany();

    // Payment methods today
    const paymentMethodsToday = await salesRepo.createQueryBuilder("sale")
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

    const todayTransactions = parseInt(todaySummary?.transactions) || 0;
    const todayRevenue = parseInt(todaySummary?.revenue) || 0;
    const yesterdayTransactions = parseInt(yesterdaySummary?.transactions) || 0;
    const yesterdayRevenue = parseInt(yesterdaySummary?.revenue) || 0;

    const transactionGrowth = yesterdayTransactions > 0 ?
      ((todayTransactions - yesterdayTransactions) / yesterdayTransactions) * 100 :
      todayTransactions > 0 ? 100 : 0;

    const revenueGrowth = yesterdayRevenue > 0 ?
      ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 :
      todayRevenue > 0 ? 100 : 0;

    return {
      status: true,
      message: "Today's stats retrieved successfully",
      data: {
        date: todayStart.toISOString().split('T')[0],
        summary: {
          transactions: todayTransactions,
          revenue: todayRevenue,
          avgTransaction: parseFloat(todaySummary?.avgTransaction) || 0,
          firstSale: todaySummary?.firstSale,
          lastSale: todaySummary?.lastSale,
          transactionGrowth,
          revenueGrowth
        },
        comparison: {
          yesterday: {
            transactions: yesterdayTransactions,
            revenue: yesterdayRevenue
          },
          weekToDate: {
            transactions: parseInt(weekSummary?.transactions) || 0,
            revenue: parseInt(weekSummary?.revenue) || 0
          }
        },
        hourlyBreakdown: hourlyBreakdown.map((/** @type {{ hour: string; transactions: string; revenue: string; }} */ hour) => ({
          hour: parseInt(hour.hour),
          transactions: parseInt(hour.transactions),
          revenue: parseInt(hour.revenue)
        })),
        topProducts: topProductsToday.map((/** @type {{ product_id: any; product_name: any; product_sku: any; sold: string; revenue: string; }} */ product) => ({
          id: product.product_id,
          name: product.product_name,
          sku: product.product_sku,
          sold: parseInt(product.sold),
          revenue: parseInt(product.revenue)
        })),
        paymentMethods: paymentMethodsToday.map((/** @type {{ method: any; transactions: string; revenue: string; }} */ method) => ({
          method: method.method,
          transactions: parseInt(method.transactions),
          revenue: parseInt(method.revenue)
        })),
        currentHour: {
          hour: now.getHours(),
          isPeak: this.isPeakHour(hourlyBreakdown, now.getHours())
        }
      }
    };
  },

  /**
   * @param {any[]} hourlyBreakdown
   * @param {number} currentHour
   */
  isPeakHour(hourlyBreakdown, currentHour) {
    if (hourlyBreakdown.length === 0) return false;
    
    const currentHourData = hourlyBreakdown.find((/** @type {{ hour: string; }} */ h) => parseInt(h.hour) === currentHour);
    if (!currentHourData) return false;

    const maxTransactions = Math.max(...hourlyBreakdown.map((/** @type {{ transactions: string; }} */ h) => parseInt(h.transactions)));
    return parseInt(currentHourData.transactions) >= maxTransactions * 0.8;
  },

  /**
   * @param {{ sales: any; product?: any; user?: any; inventory?: any; syncData?: any; userActivity?: any; auditTrail?: any; priceHistory?: any; saleItem?: any; }} repositories
   * @param {{ minutes?: any; limit?: any; }} params
   */
  async getRealTimeSales(repositories, params) {
    // @ts-ignore
    const { sales: salesRepo } = repositories;
    const { minutes = 15, limit = 20 } = params;
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    // Get recent sales
    const recentSales = await salesRepo.createQueryBuilder("sale")
      .leftJoin("sale.user", "user")
      .leftJoin("sale.items", "saleItem")
      .select([
        "sale.id",
        "sale.total",
        "sale.datetime",
        "sale.reference_number",
        "sale.status",
        "user.display_name as cashier",
        "COUNT(saleItem.id) as itemCount"
      ])
      .where("sale.datetime >= :cutoffTime", { cutoffTime })
      .andWhere("sale.status = :status", { status: "completed" })
      .groupBy("sale.id")
      .orderBy("sale.datetime", "DESC")
      .limit(limit)
      .getRawMany();

    // Get sales rate
    const salesRate = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as totalSales",
        "MIN(sale.datetime) as firstSale",
        "MAX(sale.datetime) as lastSale"
      ])
      .where("sale.datetime >= :cutoffTime", { cutoffTime })
      .andWhere("sale.status = :status", { status: "completed" })
      .getRawOne();

    // Calculate sales per minute
    let salesPerMinute = 0;
    if (salesRate.firstSale && salesRate.lastSale) {
      // @ts-ignore
      const durationMinutes = (new Date(salesRate.lastSale) - new Date(salesRate.firstSale)) / (1000 * 60);
      salesPerMinute = durationMinutes > 0 ? parseInt(salesRate.totalSales) / durationMinutes : 0;
    }

    // Get current hour vs previous hour comparison
    const currentHour = new Date().getHours();
    const currentHourStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), currentHour, 0, 0);
    const previousHourStart = new Date(currentHourStart.getTime() - 60 * 60 * 1000);

    const currentHourSales = await salesRepo.createQueryBuilder("sale")
      .select("COUNT(*) as sales")
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start", { start: currentHourStart })
      .getRawOne();

    const previousHourSales = await salesRepo.createQueryBuilder("sale")
      .select("COUNT(*) as sales")
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :start AND sale.datetime < :end", {
        start: previousHourStart,
        end: currentHourStart
      })
      .getRawOne();

    return {
      status: true,
      message: "Real-time sales retrieved successfully",
      data: {
        timeframe: {
          minutes,
          from: cutoffTime.toISOString(),
          to: new Date().toISOString()
        },
        recentSales: recentSales.map((/** @type {{ sale_id: any; sale_total: any; sale_datetime: any; sale_reference_number: any; sale_status: any; cashier: any; itemCount: string; }} */ sale) => ({
          id: sale.sale_id,
          total: sale.sale_total,
          datetime: sale.sale_datetime,
          reference: sale.sale_reference_number,
          status: sale.sale_status,
          cashier: sale.cashier,
          itemCount: parseInt(sale.itemCount)
        })),
        metrics: {
          totalSales: parseInt(salesRate.totalSales) || 0,
          salesPerMinute: salesPerMinute,
          currentHourSales: parseInt(currentHourSales.sales) || 0,
          previousHourSales: parseInt(previousHourSales.sales) || 0,
          hourOverHourGrowth: parseInt(previousHourSales.sales) > 0 ?
            ((parseInt(currentHourSales.sales) - parseInt(previousHourSales.sales)) / parseInt(previousHourSales.sales)) * 100 : 0
        },
        trends: {
          isBusy: salesPerMinute > 1, // More than 1 sale per minute
          trend: parseInt(currentHourSales.sales) > parseInt(previousHourSales.sales) ? 'up' : 'down',
          peakTime: this.getPeakTime(recentSales)
        }
      }
    };
  },

  /**
   * @param {any[]} recentSales
   */
  getPeakTime(recentSales) {
    if (recentSales.length === 0) return null;
    
    const salesByMinute = {};
    recentSales.forEach((/** @type {{ sale_datetime: string | number | Date; }} */ sale) => {
      const minute = new Date(sale.sale_datetime).toISOString().substring(0, 16); // YYYY-MM-DDTHH:mm
      // @ts-ignore
      salesByMinute[minute] = (salesByMinute[minute] || 0) + 1;
    });

    const peakMinute = Object.entries(salesByMinute).reduce((max, [minute, count]) =>
      count > max.count ? { minute, count } : max,
      { minute: '', count: 0 }
    );

    return peakMinute;
  },


  // @ts-ignore
  async getCurrentQueue(repositories, params) {
    // This method would typically interface with a queue management system
    // For now, we'll simulate with pending sales/orders
    
    // @ts-ignore
    const { sales: salesRepo } = repositories;
    const pendingStatuses = ['pending', 'processing', 'awaiting_payment'];
    
    const currentQueue = await salesRepo.createQueryBuilder("sale")
      .leftJoin("sale.user", "user")
      .select([
        "sale.id",
        "sale.total",
        "sale.datetime",
        "sale.status",
        "sale.reference_number",
        "user.display_name as cashier",
        "TIMESTAMPDIFF(MINUTE, sale.datetime, NOW()) as wait_time"
      ])
      .where("sale.status IN (:...statuses)", { statuses: pendingStatuses })
      .orderBy("sale.datetime", "ASC")
      .getRawMany();

    // Get queue stats
    const queueStats = await salesRepo.createQueryBuilder("sale")
      .select([
        "sale.status",
        "COUNT(*) as count",
        "AVG(TIMESTAMPDIFF(MINUTE, sale.datetime, NOW())) as avg_wait_time"
      ])
      .where("sale.status IN (:...statuses)", { statuses: pendingStatuses })
      .groupBy("sale.status")
      .getRawMany();

    // Get estimated wait times
    // @ts-ignore
    const processingRate = await this.getProcessingRate(repositories);
    const estimatedWaitTimes = currentQueue.map((/** @type {any} */ item, /** @type {number} */ index) => ({
      ...item,
      estimatedCompletion: index * processingRate // minutes
    }));

    return {
      status: true,
      message: "Current queue retrieved successfully",
      data: {
        timestamp: new Date().toISOString(),
        queue: estimatedWaitTimes.map((/** @type {{ sale_id: any; sale_total: any; sale_datetime: any; sale_status: any; sale_reference_number: any; cashier: any; wait_time: string; estimatedCompletion: any; }} */ item) => ({
          id: item.sale_id,
          total: item.sale_total,
          datetime: item.sale_datetime,
          status: item.sale_status,
          reference: item.sale_reference_number,
          cashier: item.cashier,
          waitTime: parseInt(item.wait_time),
          estimatedCompletion: item.estimatedCompletion
        })),
        stats: {
          totalInQueue: currentQueue.length,
          byStatus: queueStats.map((/** @type {{ sale_status: any; count: string; avg_wait_time: string; }} */ stat) => ({
            status: stat.sale_status,
            count: parseInt(stat.count),
            avgWaitTime: parseFloat(stat.avg_wait_time)
          })),
          avgWaitTime: queueStats.reduce((/** @type {number} */ sum, /** @type {{ avg_wait_time: string; count: string; }} */ stat) => 
            sum + (parseFloat(stat.avg_wait_time) * parseInt(stat.count)), 0) / currentQueue.length || 0,
          maxWaitTime: Math.max(...currentQueue.map((/** @type {{ wait_time: string; }} */ item) => parseInt(item.wait_time))),
          estimatedClearanceTime: currentQueue.length * processingRate // minutes
        },
        processingMetrics: {
          ratePerMinute: processingRate,
          capacity: this.getQueueCapacity(currentQueue.length)
        }
      }
    };
  },

  /**
   * @param {{ sales: any; }} repositories
   */
  async getProcessingRate(repositories) {
    const { sales: salesRepo } = repositories;
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    
    const completedSales = await salesRepo.createQueryBuilder("sale")
      .select("COUNT(*) as count")
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime >= :lastHour", { lastHour })
      .getRawOne();

    // Assuming 60 minutes in the hour, calculate rate per minute
    return parseInt(completedSales.count) / 60 || 0.5; // Default 0.5 sales per minute
  },

  /**
   * @param {number} queueLength
   */
  getQueueCapacity(queueLength) {
    if (queueLength === 0) return 'empty';
    if (queueLength <= 3) return 'low';
    if (queueLength <= 7) return 'medium';
    if (queueLength <= 12) return 'high';
    return 'critical';
  },


  /**
   * @param {{ sales?: any; product?: any; user?: any; inventory?: any; syncData: any; userActivity?: any; auditTrail?: any; priceHistory?: any; saleItem?: any; }} repositories
   * @param {{ hours?: any; }} params
   */
  async getSyncStatus(repositories, params) {
    // @ts-ignore
    const { syncData: syncDataRepo } = repositories;
    const { hours = 24 } = params;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get recent sync operations
    const recentSyncs = await syncDataRepo.createQueryBuilder("sync")
      .select([
        "sync.id",
        "sync.sync_type",
        "sync.status",
        "sync.startedAt",
        "sync.completedAt",
        "sync.errorMessage",
        "sync.records_processed",
        "sync.records_succeeded",
        "sync.records_failed",
        "TIMESTAMPDIFF(SECOND, sync.startedAt, sync.completedAt) as duration_seconds"
      ])
      .where("sync.startedAt >= :cutoffTime", { cutoffTime })
      .orderBy("sync.startedAt", "DESC")
      .limit(20)
      .getRawMany();

    // Get sync statistics
    const syncStats = await syncDataRepo.createQueryBuilder("sync")
      .select([
        "sync.status",
        "COUNT(*) as count",
        "AVG(TIMESTAMPDIFF(SECOND, sync.startedAt, sync.completedAt)) as avg_duration",
        "SUM(sync.records_processed) as total_processed",
        "SUM(sync.records_succeeded) as total_succeeded",
        "SUM(sync.records_failed) as total_failed"
      ])
      .where("sync.startedAt >= :cutoffTime", { cutoffTime })
      .groupBy("sync.status")
      .getRawMany();

    // Get success rate by sync type
    const successByType = await syncDataRepo.createQueryBuilder("sync")
      .select([
        "sync.sync_type",
        "COUNT(*) as total",
        "SUM(CASE WHEN sync.status = 'completed' THEN 1 ELSE 0 END) as succeeded",
        "AVG(TIMESTAMPDIFF(SECOND, sync.startedAt, sync.completedAt)) as avg_duration"
      ])
      .where("sync.startedAt >= :cutoffTime", { cutoffTime })
      .groupBy("sync.sync_type")
      .getRawMany();

    // Get last successful sync of each type
    const lastSuccessfulSyncs = await syncDataRepo.createQueryBuilder("sync")
      .select([
        "sync.sync_type",
        "MAX(sync.completedAt) as last_success",
        "sync.records_succeeded"
      ])
      .where("sync.status = :status", { status: "completed" })
      .groupBy("sync.sync_type")
      .getRawMany();

    const totalProcessed = syncStats.reduce((/** @type {number} */ sum, /** @type {{ total_processed: string; }} */ stat) => sum + parseInt(stat.total_processed), 0);
    const totalSucceeded = syncStats.reduce((/** @type {number} */ sum, /** @type {{ total_succeeded: string; }} */ stat) => sum + parseInt(stat.total_succeeded), 0);
    const totalFailed = syncStats.reduce((/** @type {number} */ sum, /** @type {{ total_failed: string; }} */ stat) => sum + parseInt(stat.total_failed), 0);
    const successRate = totalProcessed > 0 ? (totalSucceeded / totalProcessed) * 100 : 0;

    return {
      status: true,
      message: "Sync status retrieved successfully",
      data: {
        timeframe: {
          hours,
          from: cutoffTime.toISOString(),
          to: new Date().toISOString()
        },
        recentSyncs: recentSyncs.map((/** @type {{ sync_id: any; sync_sync_type: any; sync_status: any; sync_startedAt: any; sync_completedAt: any; duration_seconds: string; sync_records_processed: string; sync_records_succeeded: string; sync_records_failed: string; sync_errorMessage: any; }} */ sync) => ({
          id: sync.sync_id,
          type: sync.sync_sync_type,
          status: sync.sync_status,
          startedAt: sync.sync_startedAt,
          completedAt: sync.sync_completedAt,
          duration: parseInt(sync.duration_seconds),
          recordsProcessed: parseInt(sync.sync_records_processed),
          recordsSucceeded: parseInt(sync.sync_records_succeeded),
          recordsFailed: parseInt(sync.sync_records_failed),
          error: sync.sync_errorMessage
        })),
        statistics: {
          totalSyncs: recentSyncs.length,
          byStatus: syncStats.map((/** @type {{ sync_status: any; count: string; avg_duration: string; total_processed: string; total_succeeded: string; total_failed: string; }} */ stat) => ({
            status: stat.sync_status,
            count: parseInt(stat.count),
            avgDuration: parseFloat(stat.avg_duration),
            totalProcessed: parseInt(stat.total_processed),
            totalSucceeded: parseInt(stat.total_succeeded),
            totalFailed: parseInt(stat.total_failed)
          })),
          overall: {
            totalProcessed,
            totalSucceeded,
            totalFailed,
            successRate,
            avgDuration: syncStats.reduce((/** @type {number} */ sum, /** @type {{ avg_duration: string; count: string; }} */ stat) => 
              sum + (parseFloat(stat.avg_duration) * parseInt(stat.count)), 0) / recentSyncs.length || 0
          }
        },
        byType: successByType.map((/** @type {{ sync_sync_type: any; total: string; succeeded: string; avg_duration: string; }} */ type) => ({
          type: type.sync_sync_type,
          total: parseInt(type.total),
          succeeded: parseInt(type.succeeded),
          successRate: parseInt(type.total) > 0 ? (parseInt(type.succeeded) / parseInt(type.total)) * 100 : 0,
          avgDuration: parseFloat(type.avg_duration)
        })),
        lastSuccessfulSyncs: lastSuccessfulSyncs.map((/** @type {{ sync_sync_type: any; last_success: string | number | Date; sync_records_succeeded: string; }} */ sync) => ({
          type: sync.sync_sync_type,
          lastSuccess: sync.last_success,
          recordsSucceeded: parseInt(sync.sync_records_succeeded),
          // @ts-ignore
          hoursSince: Math.floor((new Date() - new Date(sync.last_success)) / (1000 * 60 * 60))
        })),
        health: {
          status: successRate >= 95 ? 'healthy' : successRate >= 80 ? 'warning' : 'critical',
          requiresAttention: lastSuccessfulSyncs.some((/** @type {{ last_success: string | number | Date; }} */ sync) => 
            // @ts-ignore
            Math.floor((new Date() - new Date(sync.last_success)) / (1000 * 60 * 60)) > 24
          ),
          recommendations: this.getSyncRecommendations(successRate, lastSuccessfulSyncs)
        }
      }
    };
  },

  /**
   * @param {number} successRate
   * @param {any[]} lastSuccessfulSyncs
   */
  getSyncRecommendations(successRate, lastSuccessfulSyncs) {
    const recommendations = [];
    
    if (successRate < 90) {
      recommendations.push("Sync success rate is low. Check error logs for failed syncs.");
    }
    
    const oldSyncs = lastSuccessfulSyncs.filter((/** @type {{ last_success: string | number | Date; }} */ sync) => 
      // @ts-ignore
      Math.floor((new Date() - new Date(sync.last_success)) / (1000 * 60 * 60)) > 24
    );
    
    oldSyncs.forEach((/** @type {{ type: any; }} */ sync) => {
      recommendations.push(`Sync type "${sync.type}" hasn't succeeded in over 24 hours.`);
    });
    
    if (recommendations.length === 0) {
      recommendations.push("All sync operations are healthy.");
    }
    
    return recommendations;
  }
};