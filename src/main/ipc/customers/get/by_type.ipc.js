// customers/get/by_type.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} customer_type
 * @param {Object} filters
 * @param {number} userId
 */
async function getCustomersByType(customer_type, filters = {}, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);

    // Build query
    const queryBuilder = customerRepo
      .createQueryBuilder("customer")
      .where("customer.customer_type = :customer_type", { customer_type })
      .orderBy("customer.created_at", "DESC");

    // Apply additional filters
    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("customer.status = :status", {
        // @ts-ignore
        status: filters.status,
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
        "(customer.first_name LIKE :search OR customer.last_name LIKE :search OR customer.company_name LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }

    // Execute query
    const customers = await queryBuilder.getMany();

    // Calculate statistics
    const statistics = {
      total_customers: customers.length,
      total_balance: customers.reduce((/** @type {number} */ sum, /** @type {{ current_balance: any; }} */ c) => sum + parseFloat(c.current_balance || 0), 0),
      // @ts-ignore
      active_customers: customers.filter((/** @type {{ status: string; }} */ c) => c.status === "active").length,
      avg_credit_limit: customers.reduce((/** @type {number} */ sum, /** @type {{ credit_limit: any; }} */ c) => sum + parseFloat(c.credit_limit || 0), 0) / customers.length,
    };

    // Audit log
    await log_audit("fetch_by_type", "Customer", 0, userId, {
      customer_type,
      filter_count: Object.keys(filters).length,
      result_count: customers.length,
    });

    return {
      status: true,
      message: `Customers of type '${customer_type}' fetched successfully`,
      data: customers,
      statistics: statistics,
    };
  } catch (error) {
    console.error("getCustomersByType error:", error);

    await log_audit("error", "Customer", 0, userId, {
      customer_type,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customers by type: ${error.message}`,
      data: [],
      statistics: {
        total_customers: 0,
        total_balance: 0,
        active_customers: 0,
        avg_credit_limit: 0,
      },
    };
  }
}

module.exports = getCustomersByType;