// loyalty/customers/get_all.ipc.js
//@ts-check

const { LoyaltyCustomer } = require("../../../../entities/LoyaltyCustomer");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {any} userId
 */
// @ts-ignore
async function getLoyaltyCustomers(filters = {}, userId) {
  try {
    const loyaltyRepo = AppDataSource.getRepository(LoyaltyCustomer);
    
    const queryBuilder = loyaltyRepo
      .createQueryBuilder("loyalty")
      .leftJoinAndSelect("loyalty.customer", "customer")
      .leftJoinAndSelect("loyalty.transactions", "transactions")
      .where("loyalty.is_active = :active", { active: true })
      .orderBy("loyalty.current_points", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.tier) {
      // @ts-ignore
      queryBuilder.andWhere("loyalty.tier = :tier", { tier: filters.tier });
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("loyalty.is_active = :status", { 
        // @ts-ignore
        status: filters.status === 'active' 
      });
    }

    // @ts-ignore
    if (filters.min_points !== undefined) {
      queryBuilder.andWhere("loyalty.current_points >= :min_points", {
        // @ts-ignore
        min_points: filters.min_points,
      });
    }

    // @ts-ignore
    if (filters.max_points !== undefined) {
      queryBuilder.andWhere("loyalty.current_points <= :max_points", {
        // @ts-ignore
        max_points: filters.max_points,
      });
    }

    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        "(customer.first_name LIKE :search OR customer.last_name LIKE :search OR customer.company_name LIKE :search OR customer.email LIKE :search OR customer.customer_code LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }

    // @ts-ignore
    if (filters.enrollment_source) {
      queryBuilder.andWhere("loyalty.enrollment_source = :source", {
        // @ts-ignore
        source: filters.enrollment_source,
      });
    }

    // Date range filters
    // @ts-ignore
    if (filters.membership_start_after) {
      queryBuilder.andWhere("loyalty.membership_start_date >= :start_after", {
        // @ts-ignore
        start_after: new Date(filters.membership_start_after),
      });
    }

    // @ts-ignore
    if (filters.membership_start_before) {
      queryBuilder.andWhere("loyalty.membership_start_date <= :start_before", {
        // @ts-ignore
        start_before: new Date(filters.membership_start_before),
      });
    }

    // @ts-ignore
    if (filters.last_activity_after) {
      queryBuilder.andWhere("loyalty.last_points_activity >= :activity_after", {
        // @ts-ignore
        activity_after: new Date(filters.last_activity_after),
      });
    }

    // Pagination
    // @ts-ignore
    const page = filters.page || 1;
    // @ts-ignore
    const pageSize = filters.pageSize || 20;
    const totalCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);

    const customers = await queryBuilder
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Calculate tier distribution
    const tierStats = await loyaltyRepo
      .createQueryBuilder("loyalty")
      .select("loyalty.tier, COUNT(*) as count, SUM(loyalty.current_points) as total_points")
      .where("loyalty.is_active = true")
      .groupBy("loyalty.tier")
      .getRawMany();

    return {
      status: true,
      message: "Loyalty customers retrieved successfully",
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      summary: {
        total_members: totalCount,
        tier_distribution: tierStats.map(stat => ({
          tier: stat.loyalty_tier,
          count: parseInt(stat.count),
          total_points: parseInt(stat.total_points) || 0,
        })),
        average_points: totalCount > 0 ? 
          (await loyaltyRepo
            .createQueryBuilder("loyalty")
            .select("AVG(loyalty.current_points)", "avg_points")
            .where("loyalty.is_active = true")
            .getRawOne()).avg_points || 0 : 0,
      },
      data: customers,
    };
  } catch (error) {
    console.error("getLoyaltyCustomers error:", error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to get loyalty customers: ${error.message}`,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
      summary: {
        total_members: 0,
        tier_distribution: [],
        average_points: 0,
      },
    };
  }
}

module.exports = getLoyaltyCustomers;