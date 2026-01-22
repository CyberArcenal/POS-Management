// customers/get/all.ipc.js
//@ts-check
const Customer = require("../../../../entities/Customer");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {Object} filters
 * @param {number} userId
 */
async function getAllCustomers(filters = {}, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);

    // Build query
    const queryBuilder = customerRepo
      .createQueryBuilder("customer")
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

    // Search filter
    // @ts-ignore
    if (filters.search) {
      queryBuilder.andWhere(
        "(customer.customer_code LIKE :search OR customer.first_name LIKE :search OR customer.last_name LIKE :search OR customer.company_name LIKE :search OR customer.email LIKE :search OR customer.phone LIKE :search)",
        // @ts-ignore
        { search: `%${filters.search}%` }
      );
    }

    // Get all customers
    const customers = await queryBuilder.getMany();

    // Calculate summary
    const summary = {
      total: customers.length,
      // @ts-ignore
      active: customers.filter((/** @type {{ status: string; }} */ c) => c.status === "active").length,
      // @ts-ignore
      inactive: customers.filter((/** @type {{ status: string; }} */ c) => c.status === "inactive").length,
      // @ts-ignore
      blocked: customers.filter((/** @type {{ status: string; }} */ c) => c.status === "blocked").length,
    };

    // Audit log
    await log_audit("fetch_all", "Customer", 0, userId, {
      filter_count: Object.keys(filters).length,
      result_count: customers.length,
    });

    return {
      status: true,
      message: "Customers fetched successfully",
      data: customers,
      summary: summary,
    };
  } catch (error) {
    console.error("getAllCustomers error:", error);

    await log_audit("error", "Customer", 0, userId, {
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to fetch customers: ${error.message}`,
      data: [],
      summary: {
        total: 0,
        active: 0,
        inactive: 0,
        blocked: 0,
      },
    };
  }
}

module.exports = getAllCustomers;