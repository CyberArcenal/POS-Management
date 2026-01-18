// inventory_transactions/search.ipc.js
//@ts-check
const InventoryTransactionLog = require("../../../entities/InventoryTransactionLogs");
const { InventoryAction } = require("../../../entities/InventoryTransactionLogs");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {string} query
 * @param {Object} filters
 * @param {number} userId
 */
async function searchTransactionLogs(query = "", filters = {}, userId) {
  try {
    // If no query and no filters, return error
    if (!query && Object.keys(filters).length === 0) {
      return {
        status: false,
        message: "Search query or filters are required",
        data: null,
      };
    }

    const transactionRepo = AppDataSource.getRepository(InventoryTransactionLog);

    const queryBuilder = transactionRepo
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.product", "product")
      .leftJoinAndSelect("transaction.performed_by", "performed_by")
      .leftJoinAndSelect("transaction.location", "location")
      .orderBy("transaction.created_at", "DESC")
      .take(100); // Limit search results

    // Apply text search if query provided
    if (query) {
      const searchPattern = `%${query}%`;
      queryBuilder.where(
        "(product.name LIKE :search OR " +
        "product.sku LIKE :search OR " +
        "product.barcode LIKE :search OR " +
        "transaction.notes LIKE :search OR " +
        "transaction.batch_number LIKE :search OR " +
        "transaction.reference_id LIKE :search OR " +
        "performed_by.username LIKE :search OR " +
        "performed_by.display_name LIKE :search)",
        { search: searchPattern }
      );
    }

    // Apply filters (they work alongside or without text search)
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      queryBuilder.andWhere("transaction.created_at BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.product_id) {
      queryBuilder.andWhere("transaction.product_id = :product_id", {
        // @ts-ignore
        product_id: filters.product_id.toString(),
      });
    }

    // @ts-ignore
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("transaction.action = :action", { action: filters.action });
    }

    // @ts-ignore
    if (filters.reference_type) {
      queryBuilder.andWhere("transaction.reference_type = :reference_type", {
        // @ts-ignore
        reference_type: filters.reference_type,
      });
    }

    // @ts-ignore
    if (filters.user_id) {
      queryBuilder.andWhere("transaction.performed_by_id = :user_id", {
        // @ts-ignore
        user_id: filters.user_id.toString(),
      });
    }

    // @ts-ignore
    if (filters.location_id) {
      queryBuilder.andWhere("transaction.location_id = :location_id", {
        // @ts-ignore
        location_id: filters.location_id,
      });
    }

    // @ts-ignore
    if (filters.change_type) {
      // @ts-ignore
      if (filters.change_type === 'increase') {
        queryBuilder.andWhere("transaction.change_amount > 0");
      // @ts-ignore
      } else if (filters.change_type === 'decrease') {
        queryBuilder.andWhere("transaction.change_amount < 0");
      // @ts-ignore
      } else if (filters.change_type === 'no_change') {
        queryBuilder.andWhere("transaction.change_amount = 0");
      }
    }

    // @ts-ignore
    if (filters.min_change_amount !== undefined) {
      queryBuilder.andWhere("ABS(transaction.change_amount) >= :min_change_amount", {
        // @ts-ignore
        min_change_amount: Math.abs(filters.min_change_amount),
      });
    }

    // @ts-ignore
    if (filters.max_change_amount !== undefined) {
      queryBuilder.andWhere("ABS(transaction.change_amount) <= :max_change_amount", {
        // @ts-ignore
        max_change_amount: Math.abs(filters.max_change_amount),
      });
    }

    const transactions = await queryBuilder.getMany();

    // Group results by match type for better UX
    const groupedResults = {
      product_matches: [],
      user_matches: [],
      reference_matches: [],
      note_matches: [],
      other_matches: [],
    };

    transactions.forEach(transaction => {
      let matched = false;

      // Check for product matches
      // @ts-ignore
      if (query && transaction.product && (
          // @ts-ignore
          transaction.product.name.toLowerCase().includes(query.toLowerCase()) ||
          // @ts-ignore
          transaction.product.sku.toLowerCase().includes(query.toLowerCase()) ||
          // @ts-ignore
          transaction.product.barcode?.toLowerCase().includes(query.toLowerCase())
      )) {
        // @ts-ignore
        groupedResults.product_matches.push(transaction);
        matched = true;
      }

      // Check for user matches
      // @ts-ignore
      if (!matched && query && transaction.performed_by && (
          // @ts-ignore
          transaction.performed_by.username.toLowerCase().includes(query.toLowerCase()) ||
          // @ts-ignore
          (transaction.performed_by.display_name && 
           // @ts-ignore
           transaction.performed_by.display_name.toLowerCase().includes(query.toLowerCase()))
      )) {
        // @ts-ignore
        groupedResults.user_matches.push(transaction);
        matched = true;
      }

      // Check for reference matches
      if (!matched && query && transaction.reference_id && 
          // @ts-ignore
          transaction.reference_id.includes(query)) {
        // @ts-ignore
        groupedResults.reference_matches.push(transaction);
        matched = true;
      }

      // Check for note matches
      if (!matched && query && transaction.notes && 
          // @ts-ignore
          transaction.notes.toLowerCase().includes(query.toLowerCase())) {
        // @ts-ignore
        groupedResults.note_matches.push(transaction);
        matched = true;
      }

      // Check for batch number matches
      if (!matched && query && transaction.batch_number && 
          // @ts-ignore
          transaction.batch_number.includes(query)) {
        // @ts-ignore
        groupedResults.reference_matches.push(transaction);
        matched = true;
      }

      // If no specific match but passed filters, add to other matches
      if (!matched) {
        // @ts-ignore
        groupedResults.other_matches.push(transaction);
      }
    });

    // Calculate search statistics
    const searchStats = {
      total_results: transactions.length,
      by_action: {},
      by_change_type: {
        // @ts-ignore
        increase: transactions.filter(t => t.change_amount > 0).length,
        // @ts-ignore
        decrease: transactions.filter(t => t.change_amount < 0).length,
        no_change: transactions.filter(t => t.change_amount === 0).length,
      },
      by_product: {},
      by_user: {},
    };

    transactions.forEach(transaction => {
      // Count by action
      // @ts-ignore
      searchStats.by_action[transaction.action] = 
        // @ts-ignore
        (searchStats.by_action[transaction.action] || 0) + 1;
      
      // Count by product
      // @ts-ignore
      const productKey = transaction.product ? 
        // @ts-ignore
        `${transaction.product_id} - ${transaction.product.name}` : 
        `Product ${transaction.product_id}`;
      // @ts-ignore
      searchStats.by_product[productKey] = 
        // @ts-ignore
        (searchStats.by_product[productKey] || 0) + 1;
      
      // Count by user
      // @ts-ignore
      if (transaction.performed_by) {
        // @ts-ignore
        const userKey = `${transaction.performed_by_id} - ${transaction.performed_by.username}`;
        // @ts-ignore
        searchStats.by_user[userKey] = (searchStats.by_user[userKey] || 0) + 1;
      }
    });

    // Generate search insights
    const insights = generateSearchInsights(transactions, searchStats, query);

    await log_audit("search", "InventoryTransactionLog", 0, userId, {
      query,
      filters,
      result_count: transactions.length,
    });

    return {
      status: true,
      message: `Found ${transactions.length} transaction(s) matching your criteria`,
      data: {
        results: transactions,
        grouped_results: groupedResults,
        search_stats: searchStats,
        search_insights: insights,
        search_criteria: {
          query: query || null,
          // @ts-ignore
          filters_applied: Object.keys(filters).filter(key => filters[key] !== undefined),
        },
      },
    };
  } catch (error) {
    console.error("searchTransactionLogs error:", error);

    await log_audit("error", "InventoryTransactionLog", 0, userId, {
      query,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to search transaction logs: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Generate insights from search results
 */
// @ts-ignore
function generateSearchInsights(transactions, searchStats, query) {
  const insights = [];

  if (transactions.length === 0) {
    insights.push({
      type: 'no_results',
      message: 'No transactions found matching your search criteria',
      priority: 'info',
    });
    return insights;
  }

  // Most common action insight
  const mostCommonAction = Object.entries(searchStats.by_action)
    .reduce((max, [action, count]) => count > max.count ? { action, count } : max, 
            { action: '', count: 0 });
  
  if (mostCommonAction.action) {
    const percentage = (mostCommonAction.count / transactions.length) * 100;
    insights.push({
      type: 'common_action',
      message: `Most common action in results: ${mostCommonAction.action} (${percentage.toFixed(1)}% of results)`,
      priority: 'medium',
      data: {
        action: mostCommonAction.action,
        percentage: percentage,
        count: mostCommonAction.count,
      },
    });
  }

  // Change type distribution insight
  const totalWithChange = searchStats.by_change_type.increase + searchStats.by_change_type.decrease;
  if (totalWithChange > 0) {
    const increasePercentage = (searchStats.by_change_type.increase / totalWithChange) * 100;
    const decreasePercentage = (searchStats.by_change_type.decrease / totalWithChange) * 100;
    
    if (increasePercentage > 70) {
      insights.push({
        type: 'mostly_increases',
        message: `Search results are mostly stock increases (${increasePercentage.toFixed(1)}%)`,
        priority: 'low',
        data: { increase_percentage: increasePercentage },
      });
    } else if (decreasePercentage > 70) {
      insights.push({
        type: 'mostly_decreases',
        message: `Search results are mostly stock decreases (${decreasePercentage.toFixed(1)}%)`,
        priority: 'low',
        data: { decrease_percentage: decreasePercentage },
      });
    }
  }

  // Time range insight if we have date information
  if (transactions.length > 1) {
    // @ts-ignore
    const dates = transactions.map(t => new Date(t.created_at));
    const oldest = new Date(Math.min(...dates));
    const newest = new Date(Math.max(...dates));
    // @ts-ignore
    const daysSpan = (newest - oldest) / (1000 * 60 * 60 * 24);
    
    if (daysSpan > 30) {
      insights.push({
        type: 'wide_time_range',
        message: `Results span ${Math.ceil(daysSpan)} days (${oldest.toLocaleDateString()} to ${newest.toLocaleDateString()})`,
        priority: 'low',
        data: { days_span: daysSpan, oldest: oldest, newest: newest },
      });
    }
  }

  // Product concentration insight
  const totalProducts = Object.keys(searchStats.by_product).length;
  if (totalProducts > 0) {
    const topProduct = Object.entries(searchStats.by_product)
      .reduce((max, [product, count]) => count > max.count ? { product, count } : max, 
              { product: '', count: 0 });
    
    const concentration = (topProduct.count / transactions.length) * 100;
    if (concentration > 30) {
      insights.push({
        type: 'product_concentration',
        message: `Results concentrated on ${topProduct.product.split(' - ')[1]} (${concentration.toFixed(1)}% of results)`,
        priority: 'medium',
        data: { product: topProduct.product, concentration: concentration },
      });
    }
  }

  // Query-specific insights
  if (query) {
    // Check if query matches any action
    const matchingAction = Object.keys(InventoryAction)
      // @ts-ignore
      .find(key => InventoryAction[key].toLowerCase() === query.toLowerCase());
    
    if (matchingAction) {
      insights.push({
        type: 'action_match',
        // @ts-ignore
        message: `Query matches the '${InventoryAction[matchingAction]}' action type`,
        priority: 'low',
        // @ts-ignore
        data: { action: InventoryAction[matchingAction] },
      });
    }

    // Check if query looks like a reference ID
    if (query.match(/^(SALE|ORDER|RETURN|TRF|ADJ)-/i)) {
      insights.push({
        type: 'reference_id_pattern',
        message: 'Query appears to be a reference ID pattern',
        priority: 'low',
        data: { pattern_detected: true },
      });
    }

    // Check if query looks like a batch number
    if (query.match(/^BATCH|LOT|SN/i)) {
      insights.push({
        type: 'batch_number_pattern',
        message: 'Query appears to be a batch/lot number pattern',
        priority: 'low',
        data: { pattern_detected: true },
      });
    }
  }

  return insights;
}

module.exports = searchTransactionLogs;