// audit_trail/get/by_action.ipc.js
//@ts-check
const AuditTrail = require("../../../../entities/AuditTrail");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} action
 * @param {Object} filters
 * @param {number} userId
 */
async function getAuditTrailsByAction(action, filters = {}, userId) {
  try {
    if (!action) {
      return {
        status: false,
        message: "Action is required",
        data: null,
      };
    }

    const auditRepo = AppDataSource.getRepository(AuditTrail);

    const queryBuilder = auditRepo
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.user", "user")
      .where("audit.action = :action", { action })
      .orderBy("audit.timestamp", "DESC");

    // Apply filters
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
    if (filters.user_id) {
      // @ts-ignore
      queryBuilder.andWhere("audit.user_id = :user_id", { user_id: filters.user_id });
    }

    // @ts-ignore
    if (filters.entity_id) {
      // @ts-ignore
      queryBuilder.andWhere("audit.entity_id = :entity_id", { entity_id: filters.entity_id });
    }

    // @ts-ignore
    if (filters.limit) {
      // @ts-ignore
      queryBuilder.take(filters.limit);
    }

    // @ts-ignore
    if (filters.offset) {
      // @ts-ignore
      queryBuilder.skip(filters.offset);
    }

    const audits = await queryBuilder.getMany();

    if (audits.length === 0) {
      return {
        status: true,
        message: `No audit trails found for action: ${action}`,
        data: {
          action,
          description: getActionDescription(action),
          audits: [],
          summary: {
            total_audits: 0,
            unique_entities: 0,
            unique_users: 0,
          },
        },
      };
    }

    // Calculate action-specific statistics
    const summary = {
      total_audits: audits.length,
      unique_entities: new Set(audits.map(a => a.entity)).size,
      unique_users: new Set(audits.map(a => a.user_id)).size,
      first_audit: audits[audits.length - 1].timestamp,
      last_audit: audits[0].timestamp,
      // @ts-ignore
      time_span_days: (new Date(audits[0].timestamp) - new Date(audits[audits.length - 1].timestamp)) / (1000 * 60 * 60 * 24),
    };

    // Parse details for each audit
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

    // Group by entity
    const entityBreakdown = {};
    audits.forEach(audit => {
      // @ts-ignore
      if (!entityBreakdown[audit.entity]) {
        // @ts-ignore
        entityBreakdown[audit.entity] = {
          entity: audit.entity,
          audits: 0,
          users: new Set(),
          first_audit: audit.timestamp,
          last_audit: audit.timestamp,
        };
      }
      
      // @ts-ignore
      entityBreakdown[audit.entity].audits++;
      // @ts-ignore
      entityBreakdown[audit.entity].users.add(audit.user_id);
      
      // @ts-ignore
      if (audit.timestamp < entityBreakdown[audit.entity].first_audit) {
        // @ts-ignore
        entityBreakdown[audit.entity].first_audit = audit.timestamp;
      }
      // @ts-ignore
      if (audit.timestamp > entityBreakdown[audit.entity].last_audit) {
        // @ts-ignore
        entityBreakdown[audit.entity].last_audit = audit.timestamp;
      }
    });

    // Convert Sets to counts
    Object.keys(entityBreakdown).forEach(entity => {
      // @ts-ignore
      entityBreakdown[entity].unique_users = entityBreakdown[entity].users.size;
      // @ts-ignore
      delete entityBreakdown[entity].users;
    });

    // Group by user
    const userBreakdown = {};
    audits.forEach(audit => {
      // @ts-ignore
      if (!audit.user) return;
      
      const userId = audit.user_id;
      // @ts-ignore
      if (!userBreakdown[userId]) {
        // @ts-ignore
        userBreakdown[userId] = {
          user_id: userId,
          // @ts-ignore
          username: audit.user.username,
          audits: 0,
          entities: new Set(),
          first_audit: audit.timestamp,
          last_audit: audit.timestamp,
        };
      }
      
      // @ts-ignore
      userBreakdown[userId].audits++;
      // @ts-ignore
      userBreakdown[userId].entities.add(audit.entity);
      
      // @ts-ignore
      if (audit.timestamp < userBreakdown[userId].first_audit) {
        // @ts-ignore
        userBreakdown[userId].first_audit = audit.timestamp;
      }
      // @ts-ignore
      if (audit.timestamp > userBreakdown[userId].last_audit) {
        // @ts-ignore
        userBreakdown[userId].last_audit = audit.timestamp;
      }
    });

    // Convert Sets to counts
    Object.keys(userBreakdown).forEach(userId => {
      // @ts-ignore
      userBreakdown[userId].unique_entities = userBreakdown[userId].entities.size;
      // @ts-ignore
      delete userBreakdown[userId].entities;
    });

    // Group by date for trend analysis
    const dateTrend = {};
    audits.forEach(audit => {
      // @ts-ignore
      const date = audit.timestamp.toISOString().split('T')[0];
      // @ts-ignore
      if (!dateTrend[date]) {
        // @ts-ignore
        dateTrend[date] = {
          date,
          audits: 0,
          entities: new Set(),
          users: new Set(),
        };
      }
      
      // @ts-ignore
      dateTrend[date].audits++;
      // @ts-ignore
      dateTrend[date].entities.add(audit.entity);
      // @ts-ignore
      dateTrend[date].users.add(audit.user_id);
    });

    // Convert Sets to counts
    Object.keys(dateTrend).forEach(date => {
      // @ts-ignore
      dateTrend[date].unique_entities = dateTrend[date].entities.size;
      // @ts-ignore
      dateTrend[date].unique_users = dateTrend[date].users.size;
      // @ts-ignore
      delete dateTrend[date].entities;
      // @ts-ignore
      delete dateTrend[date].users;
    });

    const dateTrendArray = Object.values(dateTrend)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get top entities for this action
    const topEntities = Object.values(entityBreakdown)
      .sort((a, b) => b.audits - a.audits)
      .slice(0, 5);

    // Get top users for this action
    const topUsers = Object.values(userBreakdown)
      .sort((a, b) => b.audits - a.audits)
      .slice(0, 5);

    // Calculate frequency metrics
    const auditsPerDay = summary.total_audits / Math.max(1, summary.time_span_days);

    // Generate action-specific insights
    const insights = generateActionInsights(action, summary, entityBreakdown, userBreakdown, dateTrendArray);

    await log_audit("fetch_by_action", "AuditTrail", 0, userId, {
      action,
      audits_count: audits.length,
      unique_entities: summary.unique_entities,
      unique_users: summary.unique_users,
    });

    return {
      status: true,
      message: `Audit trails for action '${action}' retrieved successfully`,
      data: {
        action,
        action_description: getActionDescription(action),
        audits: parsedAudits,
        summary,
        entity_breakdown: entityBreakdown,
        user_breakdown: userBreakdown,
        date_trend: dateTrendArray,
        top_lists: {
          entities: topEntities,
          users: topUsers,
        },
        metrics: {
          audits_per_day: auditsPerDay,
          average_audits_per_entity: summary.total_audits / Math.max(1, Object.keys(entityBreakdown).length),
          average_audits_per_user: summary.total_audits / Math.max(1, Object.keys(userBreakdown).length),
          user_participation_rate: (Object.keys(userBreakdown).length / summary.unique_users) * 100,
        },
        insights,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getAuditTrailsByAction error:", error);

    await log_audit("error", "AuditTrail", 0, userId, {
      action,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get audit trails by action: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Get human-readable description of audit action
 * @param {string} action
 */
function getActionDescription(action) {
  const descriptions = {
    'create': 'Create - New record created',
    'update': 'Update - Existing record modified',
    'delete': 'Delete - Record deleted',
    'view': 'View - Record accessed',
    'fetch': 'Fetch - Records retrieved',
    'search': 'Search - Records searched',
    'export': 'Export - Data exported',
    'import': 'Import - Data imported',
    'login': 'Login - User logged in',
    'logout': 'Logout - User logged out',
    'access_denied': 'Access Denied - Unauthorized access attempt',
    'error': 'Error - System error occurred',
    'backup': 'Backup - System backup performed',
    'restore': 'Restore - System restore performed',
    'config_change': 'Configuration Change - System configuration modified',
    'permission_change': 'Permission Change - User permissions modified',
    'password_change': 'Password Change - User password changed',
    'audit_view': 'Audit View - Audit trail accessed',
    'report_generate': 'Report Generate - Report generated',
    'bulk_action': 'Bulk Action - Multiple records processed',
  };
  
  // @ts-ignore
  return descriptions[action] || `Action: ${action}`;
}

/**
 * Generate insights based on action type
 * @param {string} action
 * @param {{ total_audits: any; unique_entities?: number; unique_users?: number; first_audit?: unknown; last_audit?: unknown; time_span_days: any; }} summary
 * @param {{ [s: string]: any; } | ArrayLike<any>} entityBreakdown
 * @param {{ [s: string]: any; } | ArrayLike<any>} userBreakdown
 * @param {any[]} dateTrend
 */
function generateActionInsights(action, summary, entityBreakdown, userBreakdown, dateTrend) {
  const insights = [];

  if (summary.total_audits === 0) {
    insights.push({
      type: 'no_data',
      message: 'No audit data available for this action',
      priority: 'info',
    });
    return insights;
  }

  // Frequency insight
  const auditsPerDay = summary.total_audits / Math.max(1, summary.time_span_days);
  if (auditsPerDay > 10) {
    insights.push({
      type: 'high_frequency',
      message: `High frequency: ${auditsPerDay.toFixed(1)} ${action} actions per day on average`,
      priority: 'medium',
      data: { audits_per_day: auditsPerDay },
    });
  }

  // Entity concentration insight
  if (Object.keys(entityBreakdown).length > 0) {
    const topEntity = Object.values(entityBreakdown)
      .reduce((max, entity) => entity.audits > max.audits ? entity : max, { audits: 0 });
    
    const concentration = (topEntity.audits / summary.total_audits) * 100;
    if (concentration > 50) {
      insights.push({
        type: 'entity_concentration',
        message: `${topEntity.entity} accounts for ${concentration.toFixed(1)}% of ${action} actions`,
        priority: 'medium',
        data: {
          entity: topEntity.entity,
          percentage: concentration,
          audits: topEntity.audits,
        },
      });
    }
  }

  // User concentration insight
  if (Object.keys(userBreakdown).length > 0) {
    const topUser = Object.values(userBreakdown)
      .reduce((max, user) => user.audits > max.audits ? user : max, { audits: 0 });
    
    const concentration = (topUser.audits / summary.total_audits) * 100;
    if (concentration > 50) {
      insights.push({
        type: 'user_concentration',
        message: `${topUser.username} accounts for ${concentration.toFixed(1)}% of ${action} actions`,
        priority: 'medium',
        data: {
          username: topUser.username,
          percentage: concentration,
          audits: topUser.audits,
        },
      });
    }
  }

  // Time trend insight
  if (dateTrend.length >= 7) {
    const recentWeek = dateTrend.slice(-7);
    const weekAudits = recentWeek.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ day) => sum + day.audits, 0);
    const previousWeek = dateTrend.slice(-14, -7);
    const previousWeekAudits = previousWeek.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ day) => sum + day.audits, 0);
    
    if (previousWeekAudits > 0) {
      const growth = ((weekAudits - previousWeekAudits) / previousWeekAudits) * 100;
      if (growth > 20) {
        insights.push({
          type: 'increasing_trend',
          message: `${action} actions increased by ${growth.toFixed(1)}% compared to previous week`,
          priority: 'medium',
          data: { growth_percentage: growth },
        });
      } else if (growth < -20) {
        insights.push({
          type: 'decreasing_trend',
          message: `${action} actions decreased by ${Math.abs(growth).toFixed(1)}% compared to previous week`,
          priority: 'medium',
          data: { decline_percentage: Math.abs(growth) },
        });
      }
    }
  }

  // Action-specific insights
  if (action === 'access_denied') {
    insights.push({
      type: 'security_concern',
      message: 'Access denied actions detected. Review security permissions.',
      priority: 'high',
      data: { action_type: 'security' },
    });
  }

  if (action === 'error') {
    insights.push({
      type: 'system_issues',
      message: 'Error actions detected. Review system stability and error handling.',
      priority: 'high',
      data: { action_type: 'system' },
    });
  }

  if (action === 'delete') {
    insights.push({
      type: 'data_management',
      message: 'Delete actions detected. Ensure proper data retention policies are followed.',
      priority: 'medium',
      data: { action_type: 'data_management' },
    });
  }

  if (action === 'config_change' || action === 'permission_change') {
    insights.push({
      type: 'system_changes',
      message: 'System configuration or permission changes detected. Review change management.',
      priority: 'high',
      data: { action_type: 'system_change' },
    });
  }

  // Consistency insight
  const daysWithAudits = dateTrend.filter((/** @type {{ audits: number; }} */ day) => day.audits > 0).length;
  const consistency = (daysWithAudits / dateTrend.length) * 100;
  
  if (consistency > 90) {
    insights.push({
      type: 'high_consistency',
      message: `Consistent ${action} activity on ${consistency.toFixed(1)}% of days`,
      priority: 'low',
      data: { consistency_percentage: consistency },
    });
  } else if (consistency < 30) {
    insights.push({
      type: 'sporadic_activity',
      message: `Sporadic ${action} activity on only ${consistency.toFixed(1)}% of days`,
      priority: 'medium',
      data: { consistency_percentage: consistency },
    });
  }

  return insights;
}

module.exports = getAuditTrailsByAction;