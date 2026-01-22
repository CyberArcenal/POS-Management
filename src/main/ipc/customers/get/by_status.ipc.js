// customers/get/by_status.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} status
 * @param {Object} filters
 * @param {number} userId
 */
async function getCustomersByStatus(status, filters = {}, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);

    // Build query
    const queryBuilder = customerRepo
      .createQueryBuilder("customer")
      .where("customer.status = :status", { status })
      .orderBy("customer.created_at", "DESC");

    // Apply additional filters
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
    if (filters.search) {
      queryBuilder.andWhere(
        "(customer.first_name LIKE :search OR customer.last_name LIKE :search OR customer.company_name LIKE :search OR customer.customer_code LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
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

    // Execute query
    const customers = await queryBuilder.getMany();

    // Calculate statistics
    const statistics = {
      total_customers: customers.length,
      // @ts-ignore
      total_balance: customers.reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0),
      avg_balance: customers.length > 0 ? 
        // @ts-ignore
        customers.reduce((sum, c) => sum + parseFloat(c.current_balance || 0), 0) / customers.length : 0,
      // @ts-ignore
      with_sales: customers.filter(c => c.last_purchase_at !== null).length,
    };

    // Audit log
    await log_audit("fetch_by_status", "Customer", 0, userId, {
      status,
      filter_count: Object.keys(filters).length,
      result_count: customers.length,
    });

    return {
      status: true,
      message: `Customers with status '${status}' fetched successfully`,
      data: customers,
      statistics: statistics,
    };
  } catch (error) {
    console.error("getCustomersByStatus error:", error);

    await log_audit("error", "Customer", 0, userId, {
      status,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customers by status: ${error.message}`,
      data: [],
      statistics: {
        total_customers: 0,
        total_balance: 0,
        avg_balance: 0,
        with_sales: 0,
      },
    };
  }
}

module.exports = getCustomersByStatus;