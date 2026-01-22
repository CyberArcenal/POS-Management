// customers/find_page.ipc.js
//@ts-check
// @ts-ignore
const { Customer } = require("../../../entities/Customer");
const Sale = require("../../../entities/Sale");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 * @param {number} page
 * @param {number} pageSize
 */
async function findPage(filters = {}, userId, page = 1, pageSize = 20) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);

    // Build query
    const queryBuilder = customerRepo
      .createQueryBuilder("customer")
      .leftJoinAndSelect("customer.sales", "sales")
      .orderBy("customer.created_at", "DESC");

    // Apply filters
    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("customer.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.customer_type) {
      queryBuilder.andWhere("customer.customer_type = :customer_type", {
        // @ts-ignore
        customer_type: filters.customer_type,
      });
    }

    // @ts-ignore
    if (filters.customer_group) {
      queryBuilder.andWhere("customer.customer_group = :customer_group", {
        // @ts-ignore
        customer_group: filters.customer_group,
      });
    }

    // @ts-ignore
    if (filters.city) {
      queryBuilder.andWhere("customer.city = :city", {
        // @ts-ignore
        city: filters.city,
      });
    }

    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        "(customer.customer_code LIKE :search OR customer.first_name LIKE :search OR customer.last_name LIKE :search OR customer.company_name LIKE :search OR customer.email LIKE :search OR customer.phone LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` },
      );
    }

    // @ts-ignore
    if (filters.min_balance !== undefined) {
      queryBuilder.andWhere("customer.current_balance >= :min_balance", {
        // @ts-ignore
        min_balance: filters.min_balance,
      });
    }

    // @ts-ignore
    if (filters.max_balance !== undefined) {
      queryBuilder.andWhere("customer.current_balance <= :max_balance", {
        // @ts-ignore
        max_balance: filters.max_balance,
      });
    }

    // Date range filters
    // @ts-ignore
    if (filters.created_after) {
      queryBuilder.andWhere("customer.created_at >= :created_after", {
        // @ts-ignore
        created_after: filters.created_after,
      });
    }

    // @ts-ignore
    if (filters.created_before) {
      queryBuilder.andWhere("customer.created_at <= :created_before", {
        // @ts-ignore
        created_before: filters.created_before,
      });
    }

    // @ts-ignore
    if (filters.last_purchase_after) {
      queryBuilder.andWhere(
        "customer.last_purchase_at >= :last_purchase_after",
        {
          // @ts-ignore
          last_purchase_after: filters.last_purchase_after,
        },
      );
    }

    // Pagination
    const totalCount = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.max(1, page);

    const customers = await queryBuilder
      .skip((currentPage - 1) * pageSize)
      .take(pageSize)
      .getMany();

    // Calculate summary stats
    const stats = await customerRepo
      .createQueryBuilder("customer")
      .select([
        "COUNT(customer.id) as total_customers",
        "SUM(customer.current_balance) as total_balance",
        "SUM(CASE WHEN customer.status = 'active' THEN 1 ELSE 0 END) as active_customers",
        "SUM(CASE WHEN customer.status = 'inactive' THEN 1 ELSE 0 END) as inactive_customers",
      ])
      .getRawOne();

    // Calculate customer counts by type
    const typeStats = await customerRepo
      .createQueryBuilder("customer")
      .select("customer.customer_type, COUNT(*) as count")
      .groupBy("customer.customer_type")
      .getRawMany();

    // Audit log for fetch
    await log_audit("fetch", "Customer", 0, userId, {
      filters,
      count: customers.length,
      page: currentPage,
      pageSize,
    });

    return {
      status: true,
      message: "Customers fetched successfully",
      pagination: {
        count: totalCount,
        current_page: currentPage,
        total_pages: totalPages,
        page_size: pageSize,
        next: currentPage < totalPages,
        previous: currentPage > 1,
      },
      summary: {
        total_customers: parseInt(stats.total_customers) || 0,
        total_balance: parseFloat(stats.total_balance) || 0,
        active_customers: parseInt(stats.active_customers) || 0,
        inactive_customers: parseInt(stats.inactive_customers) || 0,
        customer_types: typeStats,
      },
      data: customers,
    };
  } catch (error) {
    console.error("findPage customers error:", error);

    await log_audit("error", "Customer", 0, userId, {
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customers: ${error.message}`,
      pagination: {
        count: 0,
        current_page: 1,
        total_pages: 0,
        page_size: pageSize,
        next: false,
        previous: false,
      },
      summary: {
        total_customers: 0,
        total_balance: 0,
        active_customers: 0,
        inactive_customers: 0,
        customer_types: [],
      },
      data: [],
    };
  }
}

module.exports = findPage;
