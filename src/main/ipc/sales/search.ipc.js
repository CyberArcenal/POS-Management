// sales/search.ipc.js
//@ts-check
const Sale = require("../../../entities/Sale");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {string} query
 * @param {Object} filters
 * @param {number} userId
 */
async function searchSales(query = "", filters = {}, userId) {
  try {
    if (!query && Object.keys(filters).length === 0) {
      return {
        status: false,
        message: "Search query or filters are required",
        data: null,
      };
    }

    const saleRepo = AppDataSource.getRepository(Sale);

    const queryBuilder = saleRepo
      .createQueryBuilder("sale")
      .leftJoinAndSelect("sale.user", "user")
      .leftJoinAndSelect("sale.items", "items")
      .leftJoinAndSelect("items.product", "product")
      .orderBy("sale.datetime", "DESC")
      .take(50); // Limit search results

    // Apply text search if query provided
    if (query) {
      const searchPattern = `%${query}%`;
      queryBuilder.where(
        "(sale.reference_number LIKE :search OR " +
        "user.username LIKE :search OR " +
        "sale.customer_name LIKE :search OR " +
        "sale.customer_phone LIKE :search OR " +
        "sale.customer_email LIKE :search OR " +
        "product.name LIKE :search OR " +
        "product.sku LIKE :search)",
        { search: searchPattern }
      );
    }

    // Apply filters (they work alongside or without text search)
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      queryBuilder.andWhere("sale.datetime BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.user_id) {
      queryBuilder.andWhere("sale.user_id = :user_id", {
        // @ts-ignore
        user_id: filters.user_id,
      });
    }

    // @ts-ignore
    if (filters.status) {
      queryBuilder.andWhere("sale.status = :status", {
        // @ts-ignore
        status: filters.status,
      });
    }

    // @ts-ignore
    if (filters.payment_method) {
      queryBuilder.andWhere("sale.payment_method = :payment_method", {
        // @ts-ignore
        payment_method: filters.payment_method,
      });
    }

    // @ts-ignore
    if (filters.min_total !== undefined) {
      queryBuilder.andWhere("sale.total >= :min_total", {
        // @ts-ignore
        min_total: filters.min_total,
      });
    }

    // @ts-ignore
    if (filters.max_total !== undefined) {
      queryBuilder.andWhere("sale.total <= :max_total", {
        // @ts-ignore
        max_total: filters.max_total,
      });
    }

    const sales = await queryBuilder.getMany();

    // Group results by match type for better UX
    const groupedResults = {
      exact_matches: [],
      customer_matches: [],
      reference_matches: [],
      product_matches: [],
      user_matches: [],
    };

    sales.forEach(sale => {
      // Check for exact reference number match
      if (query && sale.reference_number && 
          // @ts-ignore
          sale.reference_number.toLowerCase().includes(query.toLowerCase())) {
        // @ts-ignore
        groupedResults.exact_matches.push(sale);
        return;
      }

      // Check for customer matches
      if (query && (
          // @ts-ignore
          (sale.customer_name && sale.customer_name.toLowerCase().includes(query.toLowerCase())) ||
          // @ts-ignore
          (sale.customer_phone && sale.customer_phone.includes(query)) ||
          // @ts-ignore
          (sale.customer_email && sale.customer_email.toLowerCase().includes(query.toLowerCase()))
      )) {
        // @ts-ignore
        groupedResults.customer_matches.push(sale);
        return;
      }

      // Check for product matches in items
      let hasProductMatch = false;
      // @ts-ignore
      if (sale.items && query) {
        // @ts-ignore
        for (const item of sale.items) {
          if (item.product && (
              item.product.name.toLowerCase().includes(query.toLowerCase()) ||
              item.product.sku.toLowerCase().includes(query.toLowerCase())
          )) {
            hasProductMatch = true;
            break;
          }
        }
      }

      if (hasProductMatch) {
        // @ts-ignore
        groupedResults.product_matches.push(sale);
        return;
      }

      // Check for user match
      // @ts-ignore
      if (query && sale.user && 
          // @ts-ignore
          sale.user.username.toLowerCase().includes(query.toLowerCase())) {
        // @ts-ignore
        groupedResults.user_matches.push(sale);
        return;
      }

      // If no specific match but passed filters, add to reference matches
      // @ts-ignore
      groupedResults.reference_matches.push(sale);
    });

    // Calculate search statistics
    const searchStats = {
      total_results: sales.length,
      by_status: {},
      by_payment_method: {},
      date_range: null,
    };

    sales.forEach(sale => {
      // @ts-ignore
      searchStats.by_status[sale.status] = (searchStats.by_status[sale.status] || 0) + 1;
      // @ts-ignore
      searchStats.by_payment_method[sale.payment_method] = 
        // @ts-ignore
        (searchStats.by_payment_method[sale.payment_method] || 0) + 1;
    });

    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      // @ts-ignore
      searchStats.date_range = {
        // @ts-ignore
        start: filters.start_date,
        // @ts-ignore
        end: filters.end_date,
      };
    }

    await log_audit("search", "Sale", 0, userId, {
      query,
      filters,
      result_count: sales.length,
    });

    return {
      status: true,
      message: `Found ${sales.length} sale(s) matching your criteria`,
      data: {
        results: sales,
        grouped_results: groupedResults,
        search_stats: searchStats,
        search_criteria: {
          query: query || null,
          // @ts-ignore
          filters_applied: Object.keys(filters).filter(key => filters[key] !== undefined),
        },
      },
    };
  } catch (error) {
    console.error("searchSales error:", error);

    await log_audit("error", "Sale", 0, userId, {
      query,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to search sales: ${error.message}`,
      data: null,
    };
  }
}

module.exports = searchSales;