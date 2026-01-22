// customers/get/by_group.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} customer_group
 * @param {Object} filters
 * @param {number} userId
 */
async function getCustomersByGroup(customer_group, filters = {}, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);

    // Build query
    const queryBuilder = customerRepo
      .createQueryBuilder("customer")
      .where("customer.customer_group = :customer_group", { customer_group })
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
    if (filters.customer_type) {
      queryBuilder.andWhere("customer.customer_type = :customer_type", {
        // @ts-ignore
        customer_type: filters.customer_type,
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
      avg_credit_limit: customers.length > 0 ? 
        customers.reduce((/** @type {number} */ sum, /** @type {{ credit_limit: any; }} */ c) => sum + parseFloat(c.credit_limit || 0), 0) / customers.length : 0,
    };

    // Audit log
    await log_audit("fetch_by_group", "Customer", 0, userId, {
      customer_group,
      filter_count: Object.keys(filters).length,
      result_count: customers.length,
    });

    return {
      status: true,
      message: `Customers in group '${customer_group}' fetched successfully`,
      data: customers,
      statistics: statistics,
    };
  } catch (error) {
    console.error("getCustomersByGroup error:", error);

    await log_audit("error", "Customer", 0, userId, {
      customer_group,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customers by group: ${error.message}`,
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

module.exports = getCustomersByGroup;