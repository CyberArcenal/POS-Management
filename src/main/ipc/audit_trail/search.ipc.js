// audit_trail/search.ipc.js
//@ts-check
const AuditTrail = require("../../../entities/AuditTrail");
const { log_audit } = require("../../../utils/auditLogger");
const { AppDataSource } = require("../../db/dataSource");

/**
 * @param {string} query
 * @param {Object} filters
 * @param {number} userId
 */
async function searchAuditTrails(query = "", filters = {}, userId) {
  try {
    // If no query and no filters, return error
    if (!query && Object.keys(filters).length === 0) {
      return {
        status: false,
        message: "Search query or filters are required",
        data: null,
      };
    }

    const auditRepo = AppDataSource.getRepository(AuditTrail);

    const queryBuilder = auditRepo
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.user", "user")
      .orderBy("audit.timestamp", "DESC")
      .take(100); // Limit search results

    // Apply text search if query provided
    if (query) {
      const searchPattern = `%${query}%`;
      queryBuilder.where(
        "(audit.action LIKE :search OR " +
        "audit.entity LIKE :search OR " +
        "audit.details LIKE :search OR " +
        "user.username LIKE :search OR " +
        "user.display_name LIKE :search)",
        { search: searchPattern }
      );
    }

    // Apply filters (they work alongside or without text search)
    // @ts-ignore
    if (filters.start_date && filters.end_date) {
      queryBuilder.andWhere("audit.timestamp BETWEEN :start_date AND :end_date", {
        // @ts-ignore
        start_date: filters.start_date,
        // @ts-ignore
        end_date: filters.end_date,
      });
    }

    // @ts-ignore
    if (filters.entity) {
      // @ts-ignore
      queryBuilder.andWhere("audit.entity = :entity", { entity: filters.entity });
    }

    // @ts-ignore
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("audit.action = :action", { action: filters.action });
    }

    // @ts-ignore
    if (filters.user_id) {
      // @ts-ignore
      queryBuilder.andWhere("audit.user_id = :user_id", { user_id: filters.user_id });
    }

    // @ts-ignore
    if (filters.entity_id) {
      // @ts-ignore
      queryBuilder.andWhere("audit.entity_id = :entity_id", { entity_id: filters.entity_id });
    }

    const audits = await queryBuilder.getMany();

    // Group results by match type for better UX
    const groupedResults = {
      action_matches: [],
      entity_matches: [],
      user_matches: [],
      detail_matches: [],
      other_matches: [],
    };

    audits.forEach(audit => {
      let matched = false;

      // Check for action matches
      // @ts-ignore
      if (query && audit.action.toLowerCase().includes(query.toLowerCase())) {
        // @ts-ignore
        groupedResults.action_matches.push(audit);
        matched = true;
      }

      // Check for entity matches
      // @ts-ignore
      if (!matched && query && audit.entity.toLowerCase().includes(query.toLowerCase())) {
        // @ts-ignore
        groupedResults.entity_matches.push(audit);
        matched = true;
      }

      // Check for user matches
      // @ts-ignore
      if (!matched && query && audit.user && (
          // @ts-ignore
          audit.user.username.toLowerCase().includes(query.toLowerCase()) ||
          // @ts-ignore
          (audit.user.display_name && 
           // @ts-ignore
           audit.user.display_name.toLowerCase().includes(query.toLowerCase()))
      )) {
        // @ts-ignore
        groupedResults.user_matches.push(audit);
        matched = true;
      }

      // Check for detail matches
      if (!matched && query && audit.details && 
          // @ts-ignore
          audit.details.toLowerCase().includes(query.toLowerCase())) {
        // @ts-ignore
        groupedResults.detail_matches.push(audit);
        matched = true;
      }

      // If no specific match but passed filters, add to other matches
      if (!matched) {
        // @ts-ignore
        groupedResults.other_matches.push(audit);
      }
    });

    // Calculate search statistics
    const searchStats = {
      total_results: audits.length,
      by_action: {},
      by_entity: {},
      by_user: {},
      by_date: null,
    };

    audits.forEach(audit => {
      // Count by action
      // @ts-ignore
      searchStats.by_action[audit.action] = 
        // @ts-ignore
        (searchStats.by_action[audit.action] || 0) + 1;
      
      // Count by entity
      // @ts-ignore
      searchStats.by_entity[audit.entity] = 
        // @ts-ignore
        (searchStats.by_entity[audit.entity] || 0) + 1;
      
      // Count by user
      // @ts-ignore
      if (audit.user) {
        // @ts-ignore
        const userKey = `${audit.user_id} - ${audit.user.username}`;
        // @ts-ignore
        searchStats.by_user[userKey] = (searchStats.by_user[userKey] || 0) + 1;
      }
    });

    // Parse details for display
    const parsedAudits = audits.map(audit => {
      let parsedDetails = null;
      if (audit.details) {
        try {
          // @ts-ignore
          parsedDetails = JSON.parse(audit.details);
        } catch {
          parsedDetails = audit.details;
        }
      }

      return {
        id: audit.id,
        action: audit.action,
        entity: audit.entity,
        entity_id: audit.entity_id,
        timestamp: audit.timestamp,
        details: parsedDetails,
        // @ts-ignore
        user_info: audit.user ? {
          // @ts-ignore
          id: audit.user.id,
          // @ts-ignore
          username: audit.user.username,
          // @ts-ignore
          role: audit.user.role,
        } : null,
      };
    });

    // Generate search insights
    const insights = generateSearchInsights(audits, searchStats, query);

    await log_audit("search", "AuditTrail", 0, userId, {
      query,
      filters,
      result_count: audits.length,
    });

    return {
      status: true,
      message: `Found ${audits.length} audit trail(s) matching your criteria`,
      data: {
        results: parsedAudits,
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
    console.error("searchAuditTrails error:", error);

    await log_audit("error", "AuditTrail", 0, userId, {
      query,
      filters,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to search audit trails: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Generate insights from search results
 * @param {any[]} audits
 * @param {{ total_results?: number; by_action: any; by_entity: any; by_user: any; by_date?: null; }} searchStats
 * @param {string} query
 */
function generateSearchInsights(audits, searchStats, query) {
  const insights = [];

  if (audits.length === 0) {
    insights.push({
      type: 'no_results',
      message: 'No audit trails found matching your search criteria',
      priority: 'info',
    });
    return insights;
  }

  // Most common action insight
  const mostCommonAction = Object.entries(searchStats.by_action)
    .reduce((max, [action, count]) => count > max.count ? { action, count } : max, 
            { action: '', count: 0 });
  
  if (mostCommonAction.action) {
    const percentage = (mostCommonAction.count / audits.length) * 100;
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

  // Most common entity insight
  const mostCommonEntity = Object.entries(searchStats.by_entity)
    .reduce((max, [entity, count]) => count > max.count ? { entity, count } : max, 
            { entity: '', count: 0 });
  
  if (mostCommonEntity.entity) {
    const percentage = (mostCommonEntity.count / audits.length) * 100;
    insights.push({
      type: 'common_entity',
      message: `Most common entity in results: ${mostCommonEntity.entity} (${percentage.toFixed(1)}% of results)`,
      priority: 'low',
      data: {
        entity: mostCommonEntity.entity,
        percentage: percentage,
        count: mostCommonEntity.count,
      },
    });
  }

  // Time range insight
  if (audits.length > 1) {
    const dates = audits.map((/** @type {{ timestamp: string | number | Date; }} */ a) => new Date(a.timestamp));
    // @ts-ignore
    const oldest = new Date(Math.min(...dates));
    // @ts-ignore
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

  // Query-specific insights
  if (query) {
    // Check if query matches common action patterns
    const commonActions = ['create', 'update', 'delete', 'view', 'login', 'error'];
    const matchingAction = commonActions.find(action => 
      action.toLowerCase() === query.toLowerCase());
    
    if (matchingAction) {
      insights.push({
        type: 'action_match',
        message: `Query matches the '${matchingAction}' action type`,
        priority: 'low',
        data: { action: matchingAction },
      });
    }

    // Check if query looks like an entity ID
    if (query.match(/^\d+$/)) {
      insights.push({
        type: 'numeric_id',
        message: 'Query appears to be a numeric entity ID',
        priority: 'low',
        data: { is_numeric: true },
      });
    }

    // Check if query looks like a username pattern
    if (query.match(/^user|admin|staff/i)) {
      insights.push({
        type: 'username_pattern',
        message: 'Query appears to be a username pattern',
        priority: 'low',
        data: { pattern_detected: true },
      });
    }
  }

  // Security-related insights
  const securityActions = ['access_denied', 'login', 'logout', 'permission_change', 'password_change'];
  const securityAudits = audits.filter((/** @type {{ action: string; }} */ audit) => securityActions.includes(audit.action));
  
  if (securityAudits.length > 0) {
    insights.push({
      type: 'security_activities',
      message: `${securityAudits.length} security-related audit trails found`,
      priority: 'medium',
      data: {
        count: securityAudits.length,
        actions: [...new Set(securityAudits.map((/** @type {{ action: any; }} */ a) => a.action))],
      },
    });
  }

  // Error-related insights
  const errorAudits = audits.filter((/** @type {{ action: string; }} */ audit) => audit.action === 'error');
  if (errorAudits.length > 0) {
    insights.push({
      type: 'error_activities',
      message: `${errorAudits.length} error audit trails found`,
      priority: 'high',
      data: { count: errorAudits.length },
    });
  }

  // User concentration insight
  if (Object.keys(searchStats.by_user).length > 0) {
    const userCounts = Object.values(searchStats.by_user);
    const topUserCount = Math.max(...userCounts);
    const concentration = (topUserCount / audits.length) * 100;
    
    if (concentration > 50) {
      insights.push({
        type: 'user_concentration',
        message: `Top user accounts for ${concentration.toFixed(1)}% of results`,
        priority: 'medium',
        data: { concentration_percentage: concentration },
      });
    }
  }

  return insights;
}

module.exports = searchAuditTrails;