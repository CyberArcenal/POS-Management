// dashboard/handlers/financialAnalytics.js
//@ts-check
module.exports = {

  /**
     * @param {{ sales: any; product?: any; user?: any; inventory?: any; syncData?: any; userActivity?: any; auditTrail?: any; priceHistory?: any; saleItem: any; }} repositories
     * @param {{ startDate?: any; endDate?: any; groupBy?: any; comparePeriod?: any; }} params
     */
  async getRevenueMetrics(repositories, params) {
    // @ts-ignore
    const { sales: salesRepo, saleItem: saleItemRepo } = repositories;
    const { startDate, endDate, groupBy = "daily", comparePeriod = false } = params;

    // Base query for revenue metrics
    const revenueQuery = salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactionCount",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgTransactionValue",
        "MIN(sale.total) as minTransaction",
        "MAX(sale.total) as maxTransaction"
      ])
      .where("sale.status = :status", { status: "completed" });

    if (startDate && endDate) {
      revenueQuery.andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate,
        end: endDate
      });
    }

    const revenueStats = await revenueQuery.getRawOne();

    // Revenue by payment method (if available)
    const revenueByPaymentMethod = await salesRepo.createQueryBuilder("sale")
      .select([
        "sale.payment_method as paymentMethod",
        "COUNT(*) as transactionCount",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgTransaction"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.payment_method IS NOT NULL")
      .groupBy("sale.payment_method")
      .getRawMany();

    // Revenue trend
    let dateFormat;
    switch (groupBy) {
      case "hourly":
        dateFormat = "%Y-%m-%d %H:00:00";
        break;
      case "weekly":
        dateFormat = "%Y-%W";
        break;
      case "monthly":
        dateFormat = "%Y-%m";
        break;
      case "daily":
      default:
        dateFormat = "%Y-%m-%d";
    }

const revenueTrend = await salesRepo
  .createQueryBuilder("sale")
  .select([
    `strftime('${dateFormat}', sale.datetime) AS period`,
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

    // Get revenue by product category
    const revenueByCategory = await saleItemRepo.createQueryBuilder("saleItem")
      .leftJoin("saleItem.product", "product")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.category_name as category",
        "COUNT(DISTINCT sale.id) as transactionCount",
        "SUM(saleItem.quantity) as totalQuantity",
        "SUM(saleItem.total_price) as totalRevenue",
        "AVG(saleItem.unit_price) as avgPrice"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("product.category_name IS NOT NULL")
      .groupBy("product.category_name")
      .orderBy("totalRevenue", "DESC")
      .getRawMany();

    // Calculate growth if comparing periods
    let growthMetrics = null;
    if (comparePeriod && startDate && endDate) {
      // @ts-ignore
      const periodDuration = new Date(endDate) - new Date(startDate);
      const previousStartDate = new Date(new Date(startDate).getTime() - periodDuration);
      const previousEndDate = new Date(new Date(endDate).getTime() - periodDuration);

      const previousRevenue = await salesRepo.createQueryBuilder("sale")
        .select("SUM(sale.total) as totalRevenue")
        .where("sale.status = :status", { status: "completed" })
        .andWhere("sale.datetime BETWEEN :start AND :end", {
          start: previousStartDate,
          end: previousEndDate
        })
        .getRawOne();

      const currentRevenue = parseInt(revenueStats.totalRevenue) || 0;
      const previousRevenueValue = parseInt(previousRevenue.totalRevenue) || 0;

      growthMetrics = {
        revenueGrowth: previousRevenueValue > 0 ? 
          ((currentRevenue - previousRevenueValue) / previousRevenueValue) * 100 : 
          currentRevenue > 0 ? 100 : 0,
        transactionGrowth: 0 // Can be calculated similarly
      };
    }

    return {
      status: true,
      message: "Revenue metrics retrieved successfully",
      data: {
        summary: {
          totalRevenue: parseInt(revenueStats.totalRevenue) || 0,
          transactionCount: parseInt(revenueStats.transactionCount) || 0,
          avgTransactionValue: parseFloat(revenueStats.avgTransactionValue) || 0,
          minTransaction: parseInt(revenueStats.minTransaction) || 0,
          maxTransaction: parseInt(revenueStats.maxTransaction) || 0,
          revenuePerTransaction: parseInt(revenueStats.totalRevenue) / parseInt(revenueStats.transactionCount) || 0
        },
        byPaymentMethod: revenueByPaymentMethod.map((/** @type {{ paymentMethod: any; transactionCount: string; totalRevenue: string; avgTransaction: string; }} */ method) => ({
          method: method.paymentMethod,
          transactionCount: parseInt(method.transactionCount),
          totalRevenue: parseInt(method.totalRevenue),
          avgTransaction: parseFloat(method.avgTransaction)
        })),
        trend: revenueTrend.map((/** @type {{ period: any; transactionCount: string; totalRevenue: string; avgTransactionValue: string; }} */ item) => ({
          period: item.period,
          transactionCount: parseInt(item.transactionCount),
          totalRevenue: parseInt(item.totalRevenue),
          avgTransactionValue: parseFloat(item.avgTransactionValue)
        })),
        byCategory: revenueByCategory.map((/** @type {{ category: any; transactionCount: string; totalQuantity: string; totalRevenue: string; avgPrice: string; }} */ category) => ({
          category: category.category,
          transactionCount: parseInt(category.transactionCount),
          totalQuantity: parseInt(category.totalQuantity),
          totalRevenue: parseInt(category.totalRevenue),
          avgPrice: parseFloat(category.avgPrice),
          percentage: (parseInt(category.totalRevenue) / parseInt(revenueStats.totalRevenue)) * 100 || 0
        })),
        growth: growthMetrics
      }
    };
  },


  /**
     * @param {{ sales?: any; product: any; user?: any; inventory?: any; syncData?: any; userActivity?: any; auditTrail?: any; priceHistory?: any; saleItem: any; }} repositories
     * @param {{ startDate?: any; endDate?: any; byCategory?: any; byProduct?: any; }} params
     */
  async getProfitAnalysis(repositories, params) {
    // @ts-ignore
    const { saleItem: saleItemRepo, product: productRepo } = repositories;
    const { startDate, endDate, byCategory = false, byProduct = false } = params;

    // Profit analysis query
    const profitQuery = saleItemRepo.createQueryBuilder("saleItem")
      .leftJoin("saleItem.product", "product")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "SUM(saleItem.quantity) as totalQuantity",
        "SUM(saleItem.total_price) as totalRevenue",
        "SUM(saleItem.quantity * COALESCE(product.cost_price, saleItem.unit_price * 0.7)) as totalCost",
        "AVG(saleItem.unit_price) as avgSellingPrice",
        "AVG(COALESCE(product.cost_price, saleItem.unit_price * 0.7)) as avgCostPrice"
      ])
      .where("sale.status = :status", { status: "completed" });

    if (startDate && endDate) {
      profitQuery.andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate,
        end: endDate
      });
    }

    const profitStats = await profitQuery.getRawOne();

    const totalRevenue = parseInt(profitStats.totalRevenue) || 0;
    const totalCost = parseInt(profitStats.totalCost) || 0;
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Profit by category
    let profitByCategory = [];
    if (byCategory) {
      profitByCategory = await saleItemRepo.createQueryBuilder("saleItem")
        .leftJoin("saleItem.product", "product")
        .leftJoin("saleItem.sale", "sale")
        .select([
          "product.category_name as category",
          "SUM(saleItem.quantity) as totalQuantity",
          "SUM(saleItem.total_price) as totalRevenue",
          "SUM(saleItem.quantity * COALESCE(product.cost_price, saleItem.unit_price * 0.7)) as totalCost",
          "COUNT(DISTINCT sale.id) as transactionCount"
        ])
        .where("sale.status = :status", { status: "completed" })
        .andWhere("product.category_name IS NOT NULL")
        .groupBy("product.category_name")
        .orderBy("totalProfit", "DESC")
        .getRawMany();

      profitByCategory = profitByCategory.map((/** @type {{ totalRevenue: string; totalCost: string; category: any; totalQuantity: string; transactionCount: string; }} */ item) => {
        const revenue = parseInt(item.totalRevenue) || 0;
        const cost = parseInt(item.totalCost) || 0;
        const profit = revenue - cost;
        
        return {
          category: item.category,
          totalQuantity: parseInt(item.totalQuantity),
          totalRevenue: revenue,
          totalCost: cost,
          totalProfit: profit,
          profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
          transactionCount: parseInt(item.transactionCount),
          avgProfitPerTransaction: parseInt(item.transactionCount) > 0 ? profit / parseInt(item.transactionCount) : 0
        };
      });
    }

    // Top profitable products
    let topProfitableProducts = [];
    if (byProduct) {
      topProfitableProducts = await productRepo.createQueryBuilder("product")
        .leftJoin("product.saleItems", "saleItem")
        .leftJoin("saleItem.sale", "sale")
        .select([
          "product.id",
          "product.name",
          "product.sku",
          "product.category_name",
          "SUM(saleItem.quantity) as totalSold",
          "SUM(saleItem.total_price) as totalRevenue",
          "SUM(saleItem.quantity * COALESCE(product.cost_price, saleItem.unit_price * 0.7)) as totalCost",
          "AVG(saleItem.unit_price) as avgSellingPrice",
          "AVG(COALESCE(product.cost_price, saleItem.unit_price * 0.7)) as avgCostPrice"
        ])
        .where("sale.status = :status", { status: "completed" })
        .groupBy("product.id")
        .having("totalRevenue > 0")
        .orderBy("(totalRevenue - totalCost)", "DESC")
        .limit(10)
        .getRawMany();

      topProfitableProducts = topProfitableProducts.map((/** @type {{ totalRevenue: string; totalCost: string; product_id: any; product_name: any; product_sku: any; product_category_name: any; totalSold: string; avgSellingPrice: string; avgCostPrice: string; }} */ item) => {
        const revenue = parseInt(item.totalRevenue) || 0;
        const cost = parseInt(item.totalCost) || 0;
        const profit = revenue - cost;
        
        return {
          id: item.product_id,
          name: item.product_name,
          sku: item.product_sku,
          category: item.product_category_name,
          totalSold: parseInt(item.totalSold),
          totalRevenue: revenue,
          totalCost: cost,
          totalProfit: profit,
          profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
          avgSellingPrice: parseFloat(item.avgSellingPrice),
          avgCostPrice: parseFloat(item.avgCostPrice),
          profitPerUnit: parseInt(item.totalSold) > 0 ? profit / parseInt(item.totalSold) : 0
        };
      });
    }

    // Profit trend
    const profitTrend = await saleItemRepo.createQueryBuilder("saleItem")
      .leftJoin("saleItem.sale", "sale")
      .leftJoin("saleItem.product", "product")
      .select([
        "DATE(sale.datetime) as date",
        "SUM(saleItem.total_price) as dailyRevenue",
        "SUM(saleItem.quantity * COALESCE(product.cost_price, saleItem.unit_price * 0.7)) as dailyCost",
        "COUNT(DISTINCT sale.id) as transactionCount"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("DATE(sale.datetime)")
      .orderBy("date", "ASC")
      .getRawMany();

    const trendWithProfit = profitTrend.map((/** @type {{ dailyRevenue: string; dailyCost: string; date: any; transactionCount: string; }} */ item) => {
      const revenue = parseInt(item.dailyRevenue) || 0;
      const cost = parseInt(item.dailyCost) || 0;
      
      return {
        date: item.date,
        revenue: revenue,
        cost: cost,
        profit: revenue - cost,
        profitMargin: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
        transactionCount: parseInt(item.transactionCount),
        avgProfitPerTransaction: parseInt(item.transactionCount) > 0 ? (revenue - cost) / parseInt(item.transactionCount) : 0
      };
    });

    return {
      status: true,
      message: "Profit analysis retrieved successfully",
      data: {
        summary: {
          totalRevenue,
          totalCost,
          totalProfit,
          profitMargin,
          totalQuantity: parseInt(profitStats.totalQuantity) || 0,
          avgSellingPrice: parseFloat(profitStats.avgSellingPrice) || 0,
          avgCostPrice: parseFloat(profitStats.avgCostPrice) || 0,
          avgProfitPerUnit: parseInt(profitStats.totalQuantity) > 0 ? totalProfit / parseInt(profitStats.totalQuantity) : 0
        },
        byCategory: profitByCategory,
        topProfitableProducts,
        trend: trendWithProfit,
        performanceMetrics: {
          returnOnSales: profitMargin,
          grossProfitRatio: totalRevenue > 0 ? totalProfit / totalRevenue : 0,
          costOfGoodsSoldRatio: totalRevenue > 0 ? totalCost / totalRevenue : 0,
          breakevenPoint: totalProfit > 0 ? "Achieved" : "Not Achieved"
        }
      }
    };
  },


  /**
   * @param {{ sales: any; product?: any; user?: any; inventory?: any; syncData?: any; userActivity?: any; auditTrail?: any; priceHistory?: any; saleItem?: any; }} repositories
   * @param {{ startDate?: any; endDate?: any; groupBy?: any; }} params
   */
  async getAverageTransactionValue(repositories, params) {
    // @ts-ignore
    const { sales: salesRepo } = repositories;
    const { startDate, endDate, groupBy = "daily" } = params;

    // Overall ATV
    const overallATV = await salesRepo.createQueryBuilder("sale")
      .select([
        "COUNT(*) as transactionCount",
        "SUM(sale.total) as totalRevenue",
        "AVG(sale.total) as avgTransactionValue",
        "MIN(sale.total) as minTransaction",
        "MAX(sale.total) as maxTransaction"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .getRawOne();

    // ATV by hour
    const atvByHour = await salesRepo.createQueryBuilder("sale")
      .select([
        "HOUR(sale.datetime) as hour",
        "COUNT(*) as transactionCount",
        "AVG(sale.total) as avgTransactionValue",
        "SUM(sale.total) as totalRevenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("HOUR(sale.datetime)")
      .orderBy("avgTransactionValue", "DESC")
      .getRawMany();

    // ATV by day of week
    const atvByDay = await salesRepo.createQueryBuilder("sale")
      .select([
        "DAYNAME(sale.datetime) as day",
        "COUNT(*) as transactionCount",
        "AVG(sale.total) as avgTransactionValue",
        "SUM(sale.total) as totalRevenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("DAYNAME(sale.datetime)")
      .orderBy("FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')")
      .getRawMany();

    // ATV trend
    let dateFormat;
    switch (groupBy) {
      case "hourly":
        dateFormat = "%Y-%m-%d %H:00:00";
        break;
      case "weekly":
        dateFormat = "%Y-%W";
        break;
      case "monthly":
        dateFormat = "%Y-%m";
        break;
      case "daily":
      default:
        dateFormat = "%Y-%m-%d";
    }

 const atvTrend = await salesRepo
  .createQueryBuilder("sale")
  .select([
    `strftime('${dateFormat}', sale.datetime) AS period`,   // ✅ SQLite date formatting
    "COUNT(*) AS transactionCount",
    "AVG(sale.total) AS avgTransactionValue",
    "SUM(sale.total) AS totalRevenue",
  ])
  .where("sale.status = :status", { status: "completed" })
  .andWhere("sale.datetime BETWEEN :start AND :end", {
    start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: endDate || new Date(),
  })
  .groupBy("period")
  .orderBy("period", "ASC")
  .getRawMany();

    // ATV by cashier
    const atvByCashier = await salesRepo.createQueryBuilder("sale")
      .leftJoin("sale.user", "user")
      .select([
        "user.id as user_id",
        "user.display_name as cashier_name",
        "COUNT(sale.id) as transactionCount",
        "AVG(sale.total) as avgTransactionValue",
        "SUM(sale.total) as totalRevenue"
      ])
      .where("sale.status = :status", { status: "completed" })
      .groupBy("user.id")
      .having("transactionCount > 0")
      .orderBy("avgTransactionValue", "DESC")
      .getRawMany();

    return {
      status: true,
      message: "Average transaction value analysis retrieved successfully",
      data: {
        overall: {
          avgTransactionValue: parseFloat(overallATV.avgTransactionValue) || 0,
          transactionCount: parseInt(overallATV.transactionCount) || 0,
          totalRevenue: parseInt(overallATV.totalRevenue) || 0,
          minTransaction: parseInt(overallATV.minTransaction) || 0,
          maxTransaction: parseInt(overallATV.maxTransaction) || 0,
          range: parseInt(overallATV.maxTransaction) - parseInt(overallATV.minTransaction)
        },
        byHour: atvByHour.map((/** @type {{ hour: string; avgTransactionValue: string; transactionCount: string; totalRevenue: string; }} */ hour) => ({
          hour: parseInt(hour.hour),
          avgTransactionValue: parseFloat(hour.avgTransactionValue),
          transactionCount: parseInt(hour.transactionCount),
          totalRevenue: parseInt(hour.totalRevenue)
        })),
        byDay: atvByDay.map((/** @type {{ day: any; avgTransactionValue: string; transactionCount: string; totalRevenue: string; }} */ day) => ({
          day: day.day,
          avgTransactionValue: parseFloat(day.avgTransactionValue),
          transactionCount: parseInt(day.transactionCount),
          totalRevenue: parseInt(day.totalRevenue)
        })),
        trend: atvTrend.map((/** @type {{ period: any; avgTransactionValue: string; transactionCount: string; totalRevenue: string; }} */ item) => ({
          period: item.period,
          avgTransactionValue: parseFloat(item.avgTransactionValue),
          transactionCount: parseInt(item.transactionCount),
          totalRevenue: parseInt(item.totalRevenue)
        })),
        byCashier: atvByCashier.map((/** @type {{ user_id: any; cashier_name: any; avgTransactionValue: string; transactionCount: string; totalRevenue: string; }} */ cashier) => ({
          id: cashier.user_id,
          name: cashier.cashier_name,
          avgTransactionValue: parseFloat(cashier.avgTransactionValue),
          transactionCount: parseInt(cashier.transactionCount),
          totalRevenue: parseInt(cashier.totalRevenue)
        })),
        insights: {
          peakHour: atvByHour.reduce((/** @type {{ avgTransactionValue: string; }} */ max, /** @type {{ avgTransactionValue: string; }} */ hour) => 
            parseFloat(hour.avgTransactionValue) > parseFloat(max.avgTransactionValue) ? hour : max, 
            atvByHour[0]
          ),
          peakDay: atvByDay.reduce((/** @type {{ avgTransactionValue: string; }} */ max, /** @type {{ avgTransactionValue: string; }} */ day) => 
            parseFloat(day.avgTransactionValue) > parseFloat(max.avgTransactionValue) ? day : max, 
            atvByDay[0]
          ),
          bestCashier: atvByCashier[0],
          atvGrowth: atvTrend.length > 1 ? 
            ((parseFloat(atvTrend[atvTrend.length - 1].avgTransactionValue) - 
              parseFloat(atvTrend[0].avgTransactionValue)) / 
              parseFloat(atvTrend[0].avgTransactionValue)) * 100 : 0
        }
      }
    };
  },


  /**
   * @param {{ sales: any; product?: any; user?: any; inventory?: any; syncData?: any; userActivity?: any; auditTrail?: any; priceHistory?: any; saleItem: any; }} repositories
   * @param {{ startDate?: any; endDate?: any; }} params
   */
  async getDiscountAnalysis(repositories, params) {
    // @ts-ignore
    const { saleItem: saleItemRepo, sales: salesRepo } = repositories;
    const { startDate, endDate } = params;

    // Discount analysis
    const discountStats = await saleItemRepo.createQueryBuilder("saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "COUNT(*) as totalItems",
        "SUM(CASE WHEN saleItem.discount_amount > 0 OR saleItem.discount_percentage > 0 THEN 1 ELSE 0 END) as discountedItems",
        "SUM(saleItem.total_price) as totalRevenue",
        "SUM(saleItem.discount_amount) as totalDiscountAmount",
        "SUM(saleItem.price_before_discount * saleItem.quantity) as totalBeforeDiscount",
        "AVG(saleItem.discount_percentage) as avgDiscountPercentage",
        "AVG(saleItem.discount_amount) as avgDiscountAmount"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .getRawOne();

    // Discounts by product
    const discountsByProduct = await saleItemRepo.createQueryBuilder("saleItem")
      .leftJoin("saleItem.product", "product")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "product.id as product_id",
        "product.name as product_name",
        "product.sku as product_sku",
        "COUNT(saleItem.id) as itemCount",
        "SUM(saleItem.quantity) as totalQuantity",
        "SUM(saleItem.discount_amount) as totalDiscount",
        "AVG(saleItem.discount_percentage) as avgDiscountPercentage",
        "SUM(saleItem.total_price) as totalRevenueAfterDiscount",
        "SUM(saleItem.price_before_discount * saleItem.quantity) as totalRevenueBeforeDiscount"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("(saleItem.discount_amount > 0 OR saleItem.discount_percentage > 0)")
      .groupBy("product.id")
      .orderBy("totalDiscount", "DESC")
      .limit(10)
      .getRawMany();

    // Discount trend
    const discountTrend = await saleItemRepo.createQueryBuilder("saleItem")
      .leftJoin("saleItem.sale", "sale")
      .select([
        "DATE(sale.datetime) as date",
        "COUNT(*) as totalItems",
        "SUM(CASE WHEN saleItem.discount_amount > 0 OR saleItem.discount_percentage > 0 THEN 1 ELSE 0 END) as discountedItems",
        "SUM(saleItem.discount_amount) as dailyDiscountAmount",
        "SUM(saleItem.total_price) as dailyRevenue",
        "AVG(saleItem.discount_percentage) as avgDiscountPercentage"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .groupBy("DATE(sale.datetime)")
      .orderBy("date", "ASC")
      .getRawMany();

    // Transactions with vs without discounts
    const transactionAnalysis = await salesRepo.createQueryBuilder("sale")
      .leftJoin("sale.items", "saleItem")
      .select([
        "COUNT(DISTINCT sale.id) as totalTransactions",
        "COUNT(DISTINCT CASE WHEN saleItem.discount_amount > 0 OR saleItem.discount_percentage > 0 THEN sale.id END) as discountedTransactions",
        "AVG(CASE WHEN saleItem.discount_amount > 0 OR saleItem.discount_percentage > 0 THEN sale.total END) as avgDiscountedTransaction",
        "AVG(CASE WHEN saleItem.discount_amount = 0 AND saleItem.discount_percentage = 0 THEN sale.total END) as avgNonDiscountedTransaction"
      ])
      .where("sale.status = :status", { status: "completed" })
      .andWhere("sale.datetime BETWEEN :start AND :end", {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      })
      .getRawOne();

    const totalItems = parseInt(discountStats.totalItems) || 0;
    const discountedItems = parseInt(discountStats.discountedItems) || 0;
    const totalDiscountAmount = parseInt(discountStats.totalDiscountAmount) || 0;
    const totalBeforeDiscount = parseInt(discountStats.totalBeforeDiscount) || 0;
    const totalRevenue = parseInt(discountStats.totalRevenue) || 0;
    const discountRate = totalItems > 0 ? (discountedItems / totalItems) * 100 : 0;
    const discountImpact = totalBeforeDiscount > 0 ? (totalDiscountAmount / totalBeforeDiscount) * 100 : 0;

    return {
      status: true,
      message: "Discount analysis retrieved successfully",
      data: {
        summary: {
          totalItems,
          discountedItems,
          discountRate,
          totalDiscountAmount,
          totalRevenueBeforeDiscount: totalBeforeDiscount,
          totalRevenueAfterDiscount: totalRevenue,
          discountImpact,
          avgDiscountPercentage: parseFloat(discountStats.avgDiscountPercentage) || 0,
          avgDiscountAmount: parseFloat(discountStats.avgDiscountAmount) || 0,
          lostRevenueDueToDiscount: totalDiscountAmount,
          netRevenueGain: totalRevenue - (totalBeforeDiscount - totalDiscountAmount)
        },
        byProduct: discountsByProduct.map((/** @type {{ totalDiscount: string; totalRevenueBeforeDiscount: string; totalRevenueAfterDiscount: string; product_id: any; product_name: any; product_sku: any; itemCount: string; totalQuantity: string; avgDiscountPercentage: string; }} */ product) => {
          const discountAmount = parseInt(product.totalDiscount) || 0;
          const revenueBefore = parseInt(product.totalRevenueBeforeDiscount) || 0;
          const revenueAfter = parseInt(product.totalRevenueAfterDiscount) || 0;
          
          return {
            id: product.product_id,
            name: product.product_name,
            sku: product.product_sku,
            itemCount: parseInt(product.itemCount),
            totalQuantity: parseInt(product.totalQuantity),
            totalDiscount: discountAmount,
            avgDiscountPercentage: parseFloat(product.avgDiscountPercentage),
            revenueBeforeDiscount: revenueBefore,
            revenueAfterDiscount: revenueAfter,
            discountRate: revenueBefore > 0 ? (discountAmount / revenueBefore) * 100 : 0,
            discountEffectiveness: parseInt(product.totalQuantity) > 0 ? 
              discountAmount / parseInt(product.totalQuantity) : 0
          };
        }),
        trend: discountTrend.map((/** @type {{ date: any; totalItems: string; discountedItems: string; dailyDiscountAmount: string; dailyRevenue: string; avgDiscountPercentage: string; }} */ day) => ({
          date: day.date,
          totalItems: parseInt(day.totalItems),
          discountedItems: parseInt(day.discountedItems),
          discountRate: parseInt(day.totalItems) > 0 ? (parseInt(day.discountedItems) / parseInt(day.totalItems)) * 100 : 0,
          dailyDiscountAmount: parseInt(day.dailyDiscountAmount),
          dailyRevenue: parseInt(day.dailyRevenue),
          avgDiscountPercentage: parseFloat(day.avgDiscountPercentage)
        })),
        transactionAnalysis: {
          totalTransactions: parseInt(transactionAnalysis.totalTransactions) || 0,
          discountedTransactions: parseInt(transactionAnalysis.discountedTransactions) || 0,
          discountPenetration: parseInt(transactionAnalysis.totalTransactions) > 0 ? 
            (parseInt(transactionAnalysis.discountedTransactions) / parseInt(transactionAnalysis.totalTransactions)) * 100 : 0,
          avgDiscountedTransaction: parseFloat(transactionAnalysis.avgDiscountedTransaction) || 0,
          avgNonDiscountedTransaction: parseFloat(transactionAnalysis.avgNonDiscountedTransaction) || 0,
          discountVsNonDiscountDifference: 
            parseFloat(transactionAnalysis.avgDiscountedTransaction) - 
            parseFloat(transactionAnalysis.avgNonDiscountedTransaction)
        },
        insights: {
          mostDiscountedProduct: discountsByProduct[0],
          peakDiscountDay: discountTrend.reduce((/** @type {{ dailyDiscountAmount: string; }} */ max, /** @type {{ dailyDiscountAmount: string; }} */ day) => 
            parseInt(day.dailyDiscountAmount) > parseInt(max.dailyDiscountAmount) ? day : max, 
            discountTrend[0]
          ),
          discountEffectiveness: discountRate > 0 ? 
            (totalRevenue - (totalBeforeDiscount - totalDiscountAmount)) / totalDiscountAmount : 0
        }
      }
    };
  }
};