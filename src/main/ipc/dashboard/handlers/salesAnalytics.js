// dashboard/handlers/salesAnalytics.js
//@ts-check

const { getBusiestDay } = require("./utils");

module.exports = {
  /**
     * @param {{ sales: any; product: any; }} repositories
     * @param {{ startDate: any; endDate: any; comparePeriod?: false | undefined; }} params
     */
  async getSalesOverview(repositories, params) {
    const { sales: salesRepo, product: productRepo } = repositories;
    const { startDate, endDate, comparePeriod = false } = params;
    
    // Current period sales
    const salesQuery = salesRepo.createQueryBuilder("sale")
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
    const paymentMethodStats = await salesRepo.createQueryBuilder("sale")
      .select(["sale.payment_method as paymentMethod", "COUNT(*) as count", "SUM(sale.total) as total"])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.payment_method IS NOT NULL")
      .groupBy("sale.payment_method")
      .getRawMany();

    // Get top 5 products
    const topProducts = await productRepo.createQueryBuilder("product")
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
      const previousStartDate = new Date(startDate);
      const previousEndDate = new Date(endDate);
      const periodLength = endDate - startDate;
      
      previousStartDate.setTime(previousStartDate.getTime() - periodLength);
      previousEndDate.setTime(previousEndDate.getTime() - periodLength);

      const previousStats = await salesRepo.createQueryBuilder("sale")
        .select([
          "COUNT(sale.id) as totalTransactions",
          "SUM(sale.total) as totalRevenue"
        ])
        .where("sale.status = :status", { status: "completed" })
        .andWhere("sale.datetime BETWEEN :start AND :end", { 
          start: previousStartDate, 
          end: previousEndDate 
        })
        .getRawOne();

      growthStats = {
        revenueGrowth: currentStats.totalRevenue && previousStats.totalRevenue 
          ? ((parseInt(currentStats.totalRevenue) - parseInt(previousStats.totalRevenue)) / parseInt(previousStats.totalRevenue)) * 100 
          : 0,
        transactionGrowth: currentStats.totalTransactions && previousStats.totalTransactions
          ? ((parseInt(currentStats.totalTransactions) - parseInt(previousStats.totalTransactions)) / parseInt(previousStats.totalTransactions)) * 100
          : 0
      };
    }

    return {
      status: true,
      message: "Sales overview retrieved successfully",
      data: {
        overview: {
          totalTransactions: parseInt(currentStats?.totalTransactions) || 0,
          totalRevenue: parseInt(currentStats?.totalRevenue) || 0,
          averageTransactionValue: parseFloat(currentStats?.averageTransactionValue) || 0,
          highestSale: parseInt(currentStats?.highestSale) || 0,
          lowestSale: parseInt(currentStats?.lowestSale) || 0,
          conversionRate: 0,
        },
        paymentMethods: paymentMethodStats,
        topProducts: topProducts.map((/** @type {{ product_id: any; product_name: any; product_sku: any; totalQuantity: string; totalRevenue: string; }} */ p) => ({
          id: p.product_id,
          name: p.product_name,
          sku: p.product_sku,
          quantity: parseInt(p.totalQuantity) || 0,
          revenue: parseInt(p.totalRevenue) || 0
        })),
        growth: growthStats
      }
    };
  },

  /**
     * @param {{ sales: any; }} repositories
     * @param {{ period?: "daily" | undefined; startDate: any; endDate: any; groupBy?: "day" | undefined; }} params
     */
  async getSalesTrend(repositories, params) {
    const { sales: salesRepo } = repositories;
    const { period = "daily", startDate, endDate, groupBy = "day" } = params;
    
    let dateFormat;
    switch (groupBy) {
      // @ts-ignore
      case "hour":
        dateFormat = "%Y-%m-%d %H:00:00";
        break;
      // @ts-ignore
      case "week":
        dateFormat = "%Y-%W";
        break;
      // @ts-ignore
      case "month":
        dateFormat = "%Y-%m";
        break;
      case "day":
      default:
        dateFormat = "%Y-%m-%d";
    }

 const trendData = await salesRepo
  .createQueryBuilder("sale")
  .select([
    `strftime('${dateFormat}', sale.datetime) AS period`,   // ✅ SQLite date formatting
    "COUNT(*) AS transactionCount",
    "SUM(sale.total) AS totalRevenue",
    "AVG(sale.total) AS avgTransactionValue",
  ])
  .where("sale.status = :status", { status: "completed" })
  .andWhere("sale.datetime BETWEEN :start AND :end", {
    start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: endDate || new Date(),
  })
  .groupBy("period")
  .orderBy("period", "ASC")
  .getRawMany();

    return {
      status: true,
      message: "Sales trend retrieved successfully",
      data: {
        period,
        trend: trendData.map((/** @type {{ period: any; transactionCount: string; totalRevenue: string; avgTransactionValue: string; }} */ item) => ({
          period: item.period,
          transactionCount: parseInt(item.transactionCount),
          totalRevenue: parseInt(item.totalRevenue),
          avgTransactionValue: parseFloat(item.avgTransactionValue)
        })),
        summary: {
          totalRevenue: trendData.reduce((/** @type {number} */ sum, /** @type {{ totalRevenue: string; }} */ item) => sum + parseInt(item.totalRevenue), 0),
          totalTransactions: trendData.reduce((/** @type {number} */ sum, /** @type {{ transactionCount: string; }} */ item) => sum + parseInt(item.transactionCount), 0),
          peakPeriod: trendData.reduce((/** @type {{ totalRevenue: string; }} */ max, /** @type {{ totalRevenue: string; }} */ item) => 
            parseInt(item.totalRevenue) > parseInt(max.totalRevenue) ? item : max
          , trendData[0])
        }
      }
    };
  },

  /**
   * @param {{ product: any; }} repositories
   * @param {{ limit?: 10 | undefined; startDate: any; endDate: any; }} params
   */
  async getTopSellingProducts(repositories, params) {
    const { product: productRepo } = repositories;
    const { limit = 10, startDate, endDate } = params;

    const query = productRepo.createQueryBuilder("product")
      .leftJoin("product.saleItems", "saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.id",
        "product.name",
        "product.sku",
        "product.price",
        "product.stock",
        "product.category_name",
        "product.cost_price",
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

    const productsWithMetrics = topProducts.map((/** @type {{ product_cost_price: number; totalRevenue: string; totalSold: string; product_id: any; product_name: any; product_sku: any; product_price: any; product_stock: any; product_category_name: any; avgSellingPrice: string; timesSold: string; }} */ p) => {
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
          totalItemsSold: productsWithMetrics.reduce((/** @type {any} */ sum, /** @type {{ totalSold: any; }} */ p) => sum + p.totalSold, 0),
          totalRevenue: productsWithMetrics.reduce((/** @type {any} */ sum, /** @type {{ totalRevenue: any; }} */ p) => sum + p.totalRevenue, 0),
          averagePrice: productsWithMetrics.reduce((/** @type {any} */ sum, /** @type {{ price: any; }} */ p) => sum + p.price, 0) / productsWithMetrics.length
        }
      }
    };
  },

  /**
   * @param {{ product: any; }} repositories
   * @param {{ startDate: any; endDate: any; }} params
   */
  async getSalesByCategory(repositories, params) {
    const { product: productRepo } = repositories;
    const { startDate, endDate } = params;

    const categorySales = await productRepo.createQueryBuilder("product")
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

    const totalRevenue = categorySales.reduce((/** @type {number} */ sum, /** @type {{ totalRevenue: string; }} */ item) => sum + parseInt(item.totalRevenue), 0);

    const categoryData = categorySales.map((/** @type {{ category: any; productCount: string; totalQuantity: string; totalRevenue: string; avgPrice: string; }} */ item) => ({
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
  },

  /**
   * @param {{ sales: any; }} repositories
   * @param {{ days?: 30 | undefined; }} params
   */
  async getHourlySalesPattern(repositories, params) {
    const { sales: salesRepo } = repositories;
    const { days = 30 } = params;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const hourlyPattern = await salesRepo.createQueryBuilder("sale")
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
    // @ts-ignore
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    hourlyPattern.forEach((/** @type {{ hour: string; totalRevenue: string; transactionCount: string; day: string | number; }} */ item) => {
      const hour = parseInt(item.hour);
      // @ts-ignore
      if (!hourlySummary[hour]) {
        // @ts-ignore
        hourlySummary[hour] = {
          hour: hour,
          totalRevenue: 0,
          totalTransactions: 0,
          byDay: {}
        };
      }

      // @ts-ignore
      hourlySummary[hour].totalRevenue += parseInt(item.totalRevenue);
      // @ts-ignore
      hourlySummary[hour].totalTransactions += parseInt(item.transactionCount);
      // @ts-ignore
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
          busiestDay: getBusiestDay(hourlyPattern),
          quietestHour: hoursArray.reduce((min, hour) => 
            hour.totalRevenue < min.totalRevenue ? hour : min, hoursArray[0]
          )
        }
      }
    };
  },

  /**
   * @param {{ sales: any; }} repositories
   * @param {{ period1Start: any; period1End: any; period2Start: any; period2End: any; }} params
   */
  async getSalesComparison(repositories, params) {
    const { sales: salesRepo } = repositories;
    const { period1Start, period1End, period2Start, period2End } = params;

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return {
        status: false,
        message: "Please provide both periods for comparison",
        data: null
      };
    }

    // Get data for period 1
    const period1Data = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactionCount",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgTransactionValue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: period1Start,
        end: period1End
      })
      .getRawOne();

    // Get data for period 2
    const period2Data = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactionCount",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgTransactionValue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: period2Start,
        end: period2End
      })
      .getRawOne();

    // Get top products for each period
    // @ts-ignore
    const topProductsPeriod1 = await this.getTopSellingProductsForPeriod(repositories, period1Start, period1End);
    // @ts-ignore
    const topProductsPeriod2 = await this.getTopSellingProductsForPeriod(repositories, period2Start, period2End);

    const revenueChange = ((parseInt(period2Data.totalRevenue) - parseInt(period1Data.totalRevenue)) / parseInt(period1Data.totalRevenue)) * 100;
    const transactionChange = ((parseInt(period2Data.transactionCount) - parseInt(period1Data.transactionCount)) / parseInt(period1Data.transactionCount)) * 100;

    return {
      status: true,
      message: "Sales comparison retrieved successfully",
      data: {
        period1: {
          start: period1Start,
          end: period1End,
          transactionCount: parseInt(period1Data.transactionCount),
          totalRevenue: parseInt(period1Data.totalRevenue),
          avgTransactionValue: parseFloat(period1Data.avgTransactionValue),
          topProducts: topProductsPeriod1
        },
        period2: {
          start: period2Start,
          end: period2End,
          transactionCount: parseInt(period2Data.transactionCount),
          totalRevenue: parseInt(period2Data.totalRevenue),
          avgTransactionValue: parseFloat(period2Data.avgTransactionValue),
          topProducts: topProductsPeriod2
        },
        comparison: {
          revenueChange,
          transactionChange,
          avgTransactionChange: ((parseFloat(period2Data.avgTransactionValue) - parseFloat(period1Data.avgTransactionValue)) / parseFloat(period1Data.avgTransactionValue)) * 100,
          growthTrend: revenueChange > 0 ? 'positive' : revenueChange < 0 ? 'negative' : 'neutral'
        }
      }
    };
  },

  /**
   * @param {{ product: any; }} repositories
   * @param {any} startDate
   * @param {any} endDate
   */
  async getTopSellingProductsForPeriod(repositories, startDate, endDate) {
    const { product: productRepo } = repositories;

    const topProducts = await productRepo.createQueryBuilder("product")
      .leftJoin("product.saleItems", "saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.id",
        "product.name",
        "product.sku",
        "SUM(saleItem.quantity) as totalSold",
        "SUM(saleItem.total_price) as totalRevenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", { start: startDate, end: endDate })
      .groupBy("product.id")
      .orderBy("totalSold", "DESC")
      .limit(5)
      .getRawMany();

    return topProducts.map((/** @type {{ product_id: any; product_name: any; product_sku: any; totalSold: string; totalRevenue: string; }} */ p) => ({
      id: p.product_id,
      name: p.product_name,
      sku: p.product_sku,
      totalSold: parseInt(p.totalSold),
      totalRevenue: parseInt(p.totalRevenue)
    }));
  }
};