// loyalty/points/transactions.ipc.js
//@ts-check

const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { PointsTransaction } = require("../../../../entities/PointsTransaction");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {any} customerId
 * @param {any} userId
 */
// @ts-ignore
async function getPointsTransactions(customerId, filters = {}, userId) {
  try {
    const pointsRepo = AppDataSource.getRepository(PointsTransaction);
    const loyaltyRepo = AppDataSource.getRepository(LoyaltyCustomer);
    
    // Verify customer exists in loyalty program
    const loyaltyCustomer = await loyaltyRepo.findOne({
      where: { customer_id: customerId },
    });

    if (!loyaltyCustomer) {
      return {
        status: false,
        message: "Customer not enrolled in loyalty program",
        data: [],
      };
    }

    const queryBuilder = pointsRepo
      .createQueryBuilder("transaction")
      .where("transaction.customer_id = :customerId", { customerId })
      .orderBy("transaction.created_at", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.transaction_type) {
      queryBuilder.andWhere("transaction.transaction_type = :type", {
        // @ts-ignore
        type: filters.transaction_type,
      });
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("transaction.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.reference_type) {
      queryBuilder.andWhere("transaction.reference_type = :reference_type", {
        // @ts-ignore
        reference_type: filters.reference_type,
      });
    }

    // @ts-ignore
    if (filters.start_date) {
      queryBuilder.andWhere("transaction.created_at >= :start_date", {
        // @ts-ignore
        start_date: new Date(filters.start_date),
      });
    }

    // @ts-ignore
    if (filters.end_date) {
      queryBuilder.andWhere("transaction.created_at <= :end_date", {
        // @ts-ignore
        end_date: new Date(filters.end_date),
      });
    }

    // @ts-ignore
    if (filters.expiring_soon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      queryBuilder.andWhere(
        "transaction.expiration_date IS NOT NULL AND transaction.expiration_date <= :expiry_date",
        { expiry_date: thirtyDaysFromNow }
      );
    }

    // Pagination
    // @ts-ignore
    const page = filters.page || 1;
    // @ts-ignore
    const pageSize = filters.pageSize || 50;
    const totalCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);

    const transactions = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Calculate summary stats
    const summary = await pointsRepo
      .createQueryBuilder("transaction")
      .select([
        "SUM(CASE WHEN transaction.transaction_type IN ('earn', 'bonus') THEN transaction.points_amount ELSE 0 END) as total_earned",
        "SUM(CASE WHEN transaction.transaction_type = 'redeem' THEN transaction.points_amount ELSE 0 END) as total_redeemed",
        "SUM(CASE WHEN transaction.transaction_type = 'expire' THEN transaction.points_amount ELSE 0 END) as total_expired",
        "COUNT(DISTINCT DATE(transaction.created_at)) as active_days",
      ])
      .where("transaction.customer_id = :customerId", { customerId })
      .getRawOne();

    // Group by month for chart data
    const monthlyData = await pointsRepo
      .createQueryBuilder("transaction")
      .select([
        "DATE_FORMAT(transaction.created_at, '%Y-%m') as month",
        "SUM(CASE WHEN transaction.transaction_type IN ('earn', 'bonus') THEN transaction.points_amount ELSE 0 END) as points_earned",
        "SUM(CASE WHEN transaction.transaction_type = 'redeem' THEN transaction.points_amount ELSE 0 END) as points_redeemed",
      ])
      .where("transaction.customer_id = :customerId", { customerId })
      .andWhere("transaction.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)")
      .groupBy("month")
      .orderBy("month", "ASC")
      .getRawMany();

    return {
      status: true,
      message: "Points transactions retrieved successfully",
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      summary: {
        total_earned: parseInt(summary.total_earned) || 0,
        total_redeemed: parseInt(summary.total_redeemed) || 0,
        total_expired: parseInt(summary.total_expired) || 0,
        active_days: parseInt(summary.active_days) || 0,
        net_points: (parseInt(summary.total_earned) || 0) - (parseInt(summary.total_redeemed) || 0) - (parseInt(summary.total_expired) || 0),
      },
      monthly_data: monthlyData,
      data: transactions,
    };
  } catch (error) {
    console.error("getPointsTransactions error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get points transactions: ${error.message}`,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
      summary: {
        total_earned: 0,
        total_redeemed: 0,
        total_expired: 0,
        active_days: 0,
        net_points: 0,
      },
      monthly_data: [],
    };
  }
}

module.exports = getPointsTransactions;