// customers/search.ipc.js
//@ts-check
const { Customer } = require("../../../entities/Customer");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {string} query
 * @param {Object} filters
 * @param {number} userId
 */
async function searchCustomers(query = "", filters = {}, userId) {
  try {
    const customerRepo = AppDataSource.getRepository(Customer);

    // Build query
    const queryBuilder = customerRepo
      .createQueryBuilder("customer")
      .orderBy("customer.created_at", "DESC");

    // Apply search query
    if (query) {
      queryBuilder.where(
        `(customer.customer_code LIKE :query 
         OR customer.first_name LIKE :query 
         OR customer.last_name LIKE :query 
         OR customer.display_name LIKE :query 
         OR customer.company_name LIKE :query 
         OR customer.email LIKE :query 
         OR customer.phone LIKE :query 
         OR customer.mobile LIKE :query 
         OR customer.address_line1 LIKE :query 
         OR customer.city LIKE :query 
         OR customer.tax_id LIKE :query)`,
        { query: `%${query}%` },
      );
    }

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

    // Limit results
    // @ts-ignore
    const limit = filters.limit || 50;
    queryBuilder.take(limit);

    // Execute query
    const customers = await queryBuilder.getMany();

    // Group results by match type for better presentation
    // @ts-ignore
    const groupedResults = {
      // @ts-ignore
      exact_matches: customers.filter(
        (c) =>
          // @ts-ignore
          c.customer_code?.toLowerCase() === query?.toLowerCase() ||
          // @ts-ignore
          c.email?.toLowerCase() === query?.toLowerCase() ||
          c.phone === query,
      ),
      // @ts-ignore
      partial_matches: customers.filter(
        (c) => !groupedResults.exact_matches.includes(c),
      ),
    };

    // Audit log
    await log_audit("search", "Customer", 0, userId, {
      query,
      filter_count: Object.keys(filters).length,
      result_count: customers.length,
      exact_matches: groupedResults.exact_matches.length,
    });

    return {
      status: true,
      message: "Customer search completed",
      data: customers,
      grouped_results: groupedResults,
      search_metadata: {
        query,
        total_results: customers.length,
        exact_matches: groupedResults.exact_matches.length,
        partial_matches: groupedResults.partial_matches.length,
        search_filters: filters,
      },
    };
  } catch (error) {
    console.error("searchCustomers error:", error);

    await log_audit("error", "Customer", 0, userId, {
      query,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to search customers: ${error.message}`,
      data: [],
      grouped_results: {
        exact_matches: [],
        partial_matches: [],
      },
      search_metadata: {
        query,
        total_results: 0,
        exact_matches: 0,
        partial_matches: 0,
        search_filters: filters,
      },
    };
  }
}

module.exports = searchCustomers;
