// dashboard/handlers/performanceAnalytics.js
//@ts-check
module.exports = {

  /**
     * @param {{ sales?: any; product?: any; user: any; inventory?: any; syncData?: any; userActivity?: any; auditTrail?: any; priceHistory?: any; saleItem?: any; }} repositories
     * @param {{ startDate?: any; endDate?: any; }} params
     */
  async getStaffPerformance(repositories, params) {
    // @ts-ignore
    const { user: userRepo } = repositories;
    const { startDate, endDate } = params;

    const performance = await userRepo.createQueryBuilder("user")
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

    const performanceData = performance.map((/** @type {{ user_id: any; user_display_name: any; user_username: any; user_role: any; totalSales: string; totalRevenue: string; avgSaleValue: string; highestSale: string; lowestSale: string; }} */ staff) => ({
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
          averageRevenue: performanceData.reduce((/** @type {any} */ sum, /** @type {{ metrics: { totalRevenue: any; }; }} */ s) => sum + s.metrics.totalRevenue, 0) / performanceData.length,
          totalStaff: performanceData.length,
          totalSales: performanceData.reduce((/** @type {any} */ sum, /** @type {{ metrics: { totalSales: any; }; }} */ s) => sum + s.metrics.totalSales, 0),
          totalRevenue: performanceData.reduce((/** @type {any} */ sum, /** @type {{ metrics: { totalRevenue: any; }; }} */ s) => sum + s.metrics.totalRevenue, 0)
        }
      }
    };
  },


  /**
     * @param {{ sales: any; product?: any; user: any; inventory?: any; syncData?: any; userActivity?: any; auditTrail?: any; priceHistory?: any; saleItem?: any; }} repositories
     * @param {{ startDate?: any; endDate?: any; period?: any; }} params
     */
  async getCashierPerformance(repositories, params) {
    // @ts-ignore
    const { user: userRepo, sales: salesRepo } = repositories;
    // @ts-ignore
    const { startDate, endDate, period = "daily" } = params;

    // Get cashiers (users with sales)
    const cashiers = await userRepo.createQueryBuilder("user")
      .leftJoin("user.sales", "sale")
      .select([
        "user.id",
        "user.username",
        "user.display_name",
        "user.role"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("user.role LIKE :cashierRole", { cashierRole: '%cashier%' })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("user.id")
      .getRawMany();

    // Get detailed performance for each cashier
    const cashierPerformance = await Promise.all(cashiers.map(async (/** @type {{ user_id: any; user_display_name: any; user_username: any; user_role: any; }} */ cashier) => {
      const dailyStats = await salesRepo.createQueryBuilder("sale")
        .select([
          "DATE(sale.datetime) as sale_date",
          "COUNT(*) as transaction_count",
          "SUM(sale.total) as total_revenue",
          "AVG(sale.total) as avg_transaction",
          "MIN(sale.datetime) as first_sale",
          "MAX(sale.datetime) as last_sale"
        ])
        .where("sale.status = :status", { status: "completed" })
        .andWhere("sale.user_id = :userId", { userId: cashier.user_id })
        .andWhere("sale.datetime BETWEEN :start AND :end", {
          start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: endDate || new Date()
        })
        .groupBy("DATE(sale.datetime)")
        .orderBy("sale_date", "DESC")
        .getRawMany();

      const hourlyPerformance = await salesRepo.createQueryBuilder("sale")
        .select([
          "HOUR(sale.datetime) as hour",
          "COUNT(*) as transaction_count",
          "SUM(sale.total) as total_revenue"
        ])
        .where("sale.status = :status", { status: "completed" })
        .andWhere("sale.user_id = :userId", { userId: cashier.user_id })
        .andWhere("sale.datetime BETWEEN :start AND :end", {
          start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: endDate || new Date()
        })
        .groupBy("HOUR(sale.datetime)")
        .orderBy("total_revenue", "DESC")
        .getRawMany();

      const summary = dailyStats.reduce((/** @type {{ totalTransactions: number; totalRevenue: number; daysActive: number; }} */ acc, /** @type {{ transaction_count: string; total_revenue: string; }} */ day) => ({
        totalTransactions: acc.totalTransactions + parseInt(day.transaction_count),
        totalRevenue: acc.totalRevenue + parseInt(day.total_revenue),
        daysActive: acc.daysActive + 1
      }), { totalTransactions: 0, totalRevenue: 0, daysActive: 0 });

      return {
        id: cashier.user_id,
        name: cashier.user_display_name || cashier.user_username,
        username: cashier.user_username,
        role: cashier.user_role,
        summary: {
          ...summary,
          avgDailyTransactions: summary.totalTransactions / (summary.daysActive || 1),
          avgDailyRevenue: summary.totalRevenue / (summary.daysActive || 1),
          bestHour: hourlyPerformance[0] ? {
            hour: parseInt(hourlyPerformance[0].hour),
            transactions: parseInt(hourlyPerformance[0].transaction_count),
            revenue: parseInt(hourlyPerformance[0].total_revenue)
          } : null
        },
        dailyStats: dailyStats.map((/** @type {{ sale_date: any; transaction_count: string; total_revenue: string; avg_transaction: string; first_sale: any; last_sale: any; }} */ day) => ({
          date: day.sale_date,
          transactions: parseInt(day.transaction_count),
          revenue: parseInt(day.total_revenue),
          avgTransaction: parseFloat(day.avg_transaction),
          firstSale: day.first_sale,
          lastSale: day.last_sale
        })),
        hourlyStats: hourlyPerformance.map((/** @type {{ hour: string; transaction_count: string; total_revenue: string; }} */ hour) => ({
          hour: parseInt(hour.hour),
          transactions: parseInt(hour.transaction_count),
          revenue: parseInt(hour.total_revenue)
        }))
      };
    }));

    // Calculate rankings
    const rankedCashiers = cashierPerformance
      .map((/** @type {{ summary: { totalRevenue: number; totalTransactions: number; avgDailyRevenue: number; }; }} */ cashier) => ({
        ...cashier,
        rankScore: (cashier.summary.totalRevenue * 0.5) + 
                  (cashier.summary.totalTransactions * 0.3) +
                  (cashier.summary.avgDailyRevenue * 0.2)
      }))
      .sort((/** @type {{ rankScore: number; }} */ a, /** @type {{ rankScore: number; }} */ b) => b.rankScore - a.rankScore)
      .map((/** @type {any} */ cashier, /** @type {number} */ index) => ({
        ...cashier,
        rank: index + 1
      }));

    return {
      status: true,
      message: "Cashier performance retrieved successfully",
      data: {
        cashiers: rankedCashiers,
        summary: {
          totalCashiers: rankedCashiers.length,
          period: {
            start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: endDate || new Date()
          },
          topCashier: rankedCashiers[0],
          averagePerformance: {
            avgTransactions: rankedCashiers.reduce((/** @type {any} */ sum, /** @type {{ summary: { totalTransactions: any; }; }} */ c) => sum + c.summary.totalTransactions, 0) / rankedCashiers.length,
            avgRevenue: rankedCashiers.reduce((/** @type {any} */ sum, /** @type {{ summary: { totalRevenue: any; }; }} */ c) => sum + c.summary.totalRevenue, 0) / rankedCashiers.length,
            avgDailyTransactions: rankedCashiers.reduce((/** @type {any} */ sum, /** @type {{ summary: { avgDailyTransactions: any; }; }} */ c) => sum + c.summary.avgDailyTransactions, 0) / rankedCashiers.length
          }
        }
      }
    };
  },


  /**
   * @param {{ sales?: any; product?: any; user: any; inventory?: any; syncData?: any; userActivity: any; auditTrail?: any; priceHistory?: any; saleItem?: any; }} repositories
   * @param {{ startDate?: any; endDate?: any; userId?: any; limit?: any; }} params
   */
  async getUserActivitySummary(repositories, params) {
    // @ts-ignore
    const { userActivity: userActivityRepo, user: userRepo } = repositories;
    const { startDate, endDate, userId, limit = 100 } = params;

    const query = userActivityRepo.createQueryBuilder("activity")
      .leftJoin("activity.user", "user")
      .select([
        "activity.id",
        "activity.action",
        "activity.entity",
        "activity.entity_id",
        "activity.ip_address",
        "activity.user_agent",
        "activity.details",
        "activity.created_at",
        "user.id as user_id",
        "user.username as user_username",
        "user.display_name as user_display_name",
        "user.role as user_role"
      ])
      .orderBy("activity.created_at", "DESC");

    if (startDate && endDate) {
      query.andWhere("activity.created_at BETWEEN :start AND :end", {
        start: startDate,
        end: endDate
      });
    }

    if (userId) {
      query.andWhere("activity.user_id = :userId", { userId });
    }

    if (limit) {
      query.limit(limit);
    }

    const activities = await query.getRawMany();

    // Get activity statistics
    const activityStats = await userActivityRepo.createQueryBuilder("activity")
      .select([
        "activity.action",
        "COUNT(*) as count",
        "COUNT(DISTINCT activity.user_id) as unique_users"
      ])
      .where("activity.created_at BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("activity.action")
      .orderBy("count", "DESC")
      .getRawMany();

    // Get most active users
    const activeUsers = await userActivityRepo.createQueryBuilder("activity")
      .leftJoin("activity.user", "user")
      .select([
        "user.id as user_id",
        "user.username as user_username",
        "user.display_name as user_display_name",
        "COUNT(activity.id) as activity_count",
        "MAX(activity.created_at) as last_activity"
      ])
      .where("activity.created_at BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("user.id")
      .orderBy("activity_count", "DESC")
      .limit(10)
      .getRawMany();

    // Get hourly activity pattern
    const hourlyPattern = await userActivityRepo.createQueryBuilder("activity")
      .select([
        "HOUR(activity.created_at) as hour",
        "COUNT(*) as activity_count",
        "COUNT(DISTINCT activity.user_id) as unique_users"
      ])
      .where("activity.created_at BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("HOUR(activity.created_at)")
      .orderBy("hour", "ASC")
      .getRawMany();

    return {
      status: true,
      message: "User activity summary retrieved successfully",
      data: {
        activities: activities.map((/** @type {{ activity_id: any; activity_action: any; activity_entity: any; activity_entity_id: any; activity_ip_address: any; activity_user_agent: any; activity_details: any; activity_created_at: any; user_id: any; user_username: any; user_display_name: any; user_role: any; }} */ activity) => ({
          id: activity.activity_id,
          action: activity.activity_action,
          entity: activity.activity_entity,
          entityId: activity.activity_entity_id,
          ipAddress: activity.activity_ip_address,
          userAgent: activity.activity_user_agent,
          details: activity.activity_details,
          createdAt: activity.activity_created_at,
          user: {
            id: activity.user_id,
            username: activity.user_username,
            displayName: activity.user_display_name,
            role: activity.user_role
          }
        })),
        statistics: {
          activityStats: activityStats.map((/** @type {{ activity_action: any; count: string; unique_users: string; }} */ stat) => ({
            action: stat.activity_action,
            count: parseInt(stat.count),
            uniqueUsers: parseInt(stat.unique_users)
          })),
          totalActivities: activities.length,
          uniqueUsers: new Set(activities.map((/** @type {{ user_id: any; }} */ a) => a.user_id)).size,
          mostActiveHour: hourlyPattern.reduce((/** @type {{ activity_count: string; }} */ max, /** @type {{ activity_count: string; }} */ hour) => 
            parseInt(hour.activity_count) > parseInt(max.activity_count) ? hour : max, 
            hourlyPattern[0]
          )
        },
        activeUsers: activeUsers.map((/** @type {{ user_id: any; user_username: any; user_display_name: any; activity_count: string; last_activity: any; }} */ user) => ({
          id: user.user_id,
          username: user.user_username,
          displayName: user.user_display_name,
          activityCount: parseInt(user.activity_count),
          lastActivity: user.last_activity,
          avgDailyActivities: parseInt(user.activity_count) / 
            // @ts-ignore
            Math.ceil((new Date(endDate || new Date()) - new Date(startDate || new Date(Date.now() - 24 * 60 * 60 * 1000))) / 
            (1000 * 60 * 60 * 24))
        })),
        hourlyPattern: hourlyPattern.map((/** @type {{ hour: string; activity_count: string; unique_users: string; }} */ hour) => ({
          hour: parseInt(hour.hour),
          activityCount: parseInt(hour.activity_count),
          uniqueUsers: parseInt(hour.unique_users)
        }))
      }
    };
  }
};