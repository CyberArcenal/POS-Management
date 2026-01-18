// audit_trail/get/by_user.ipc.js
//@ts-check
const AuditTrail = require("../../../../entities/AuditTrail");
const User = require("../../../../entities/User");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} userId
 * @param {Object} filters
 * @param {number} currentUserId
 */
async function getAuditTrailsByUser(userId, filters = {}, currentUserId) {
  try {
    if (!userId) {
      return {
        status: false,
        message: "User ID is required",
        data: null,
      };
    }

    // Check if user exists
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
      return {
        status: false,
        message: `User with ID ${userId} not found`,
        data: null,
      };
    }

    const auditRepo = AppDataSource.getRepository(AuditTrail);

    const queryBuilder = auditRepo
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.user", "user")
      .where("audit.user_id = :user_id", { user_id: userId })
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
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("audit.action = :action", { action: filters.action });
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
        message: `No audit trails found for user: ${user.username}`,
        data: {
          user_info: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            role: user.role,
          },
          audits: [],
          summary: {
            total_audits: 0,
            // @ts-ignore
            period: filters.start_date && filters.end_date ? 
              // @ts-ignore
              `${filters.start_date} to ${filters.end_date}` : 'All time',
          },
        },
      };
    }

    // Calculate user audit statistics
    const userStats = {
      total_audits: audits.length,
      first_audit: audits[audits.length - 1].timestamp,
      last_audit: audits[0].timestamp,
      entities: new Set(),
      actions: {},
      entities_accessed: new Set(),
      audit_frequency: 0,
    };

    // Calculate metrics
    audits.forEach(audit => {
      userStats.entities.add(audit.entity);
      // @ts-ignore
      userStats.actions[audit.action] = (userStats.actions[audit.action] || 0) + 1;
      userStats.entities_accessed.add(`${audit.entity}-${audit.entity_id}`);
    });

    // Calculate audit frequency
    // @ts-ignore
    const periodDays = filters.start_date && filters.end_date ? 
      // @ts-ignore
      (new Date(filters.end_date) - new Date(filters.start_date)) / (1000 * 60 * 60 * 24) :
      // @ts-ignore
      (new Date() - new Date(userStats.first_audit)) / (1000 * 60 * 60 * 24);
    
    userStats.audit_frequency = userStats.total_audits / Math.max(1, periodDays);
    // @ts-ignore
    userStats.unique_entities = userStats.entities.size;
    // @ts-ignore
    userStats.unique_entities_accessed = userStats.entities_accessed.size;

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
        action: audit.action,
        entity: audit.entity,
        entity_id: audit.entity_id,
        timestamp: audit.timestamp,
        details: parsedDetails,
        context: {
          entity_type: audit.entity,
          entity_id: audit.entity_id,
        },
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
          actions: {},
          first_audit: audit.timestamp,
          last_audit: audit.timestamp,
        };
      }
      
      // @ts-ignore
      entityBreakdown[audit.entity].audits++;
      // @ts-ignore
      entityBreakdown[audit.entity].actions[audit.action] = 
        // @ts-ignore
        (entityBreakdown[audit.entity].actions[audit.action] || 0) + 1;
      
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

    // Group by date for activity trend
    const activityTrend = {};
    audits.forEach(audit => {
      // @ts-ignore
      const date = audit.timestamp.toISOString().split('T')[0];
      // @ts-ignore
      if (!activityTrend[date]) {
        // @ts-ignore
        activityTrend[date] = {
          date,
          audits: 0,
          entities: new Set(),
          actions: new Set(),
        };
      }
      // @ts-ignore
      activityTrend[date].audits++;
      // @ts-ignore
      activityTrend[date].entities.add(audit.entity);
      // @ts-ignore
      activityTrend[date].actions.add(audit.action);
    });

    // Convert Sets to counts
    Object.keys(activityTrend).forEach(date => {
      // @ts-ignore
      activityTrend[date].unique_entities = activityTrend[date].entities.size;
      // @ts-ignore
      activityTrend[date].unique_actions = activityTrend[date].actions.size;
      // @ts-ignore
      delete activityTrend[date].entities;
      // @ts-ignore
      delete activityTrend[date].actions;
    });

    const activityTrendArray = Object.values(activityTrend)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get most recent audits
    const recentAudits = parsedAudits.slice(0, 10);

    // Generate user audit insights
    const insights = generateUserAuditInsights(userStats, entityBreakdown, activityTrendArray);

    await log_audit("fetch_by_user", "AuditTrail", 0, currentUserId, {
      target_user_id: userId,
      user_name: user.username,
      audits_count: audits.length,
    });

    return {
      status: true,
      message: `Audit trails for ${user.username} retrieved successfully`,
      data: {
        user_info: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
          employee_id: user.employee_id,
          department: user.department,
        },
        audits: parsedAudits,
        user_stats: userStats,
        entity_breakdown: entityBreakdown,
        activity_trend: activityTrendArray,
        recent_audits: recentAudits,
        insights,
        // @ts-ignore
        period: filters.start_date && filters.end_date ? 
          // @ts-ignore
          `${filters.start_date} to ${filters.end_date}` : 'All time',
      },
    };
  } catch (error) {
    console.error("getAuditTrailsByUser error:", error);

    await log_audit("error", "AuditTrail", 0, currentUserId, {
      target_user_id: userId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get audit trails by user: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Generate insights from user audit data
 * @param {{ total_audits: any; first_audit?: unknown; last_audit?: unknown; entities?: Set<any>; actions?: {}; entities_accessed?: Set<any>; audit_frequency: any; unique_entities?: any; }} userStats
 * @param {{ [s: string]: any; } | ArrayLike<any>} entityBreakdown
 * @param {any[]} activityTrend
 */
function generateUserAuditInsights(userStats, entityBreakdown, activityTrend) {
  const insights = [];

  // Activity level insight
  if (userStats.audit_frequency > 5) {
    insights.push({
      type: 'high_activity',
      message: `High audit activity: ${userStats.audit_frequency.toFixed(1)} audits per day on average`,
      priority: 'medium',
      data: { audit_frequency: userStats.audit_frequency },
    });
  } else if (userStats.audit_frequency < 0.5) {
    insights.push({
      type: 'low_activity',
      message: `Low audit activity: ${userStats.audit_frequency.toFixed(1)} audits per day on average`,
      priority: 'low',
      data: { audit_frequency: userStats.audit_frequency },
    });
  }

  // Entity diversity insight
  if (userStats.unique_entities > 5) {
    insights.push({
      type: 'high_entity_diversity',
      message: `Works with ${userStats.unique_entities} different entity types`,
      priority: 'low',
      data: { unique_entities: userStats.unique_entities },
    });
  }

  // Most active entity insight
  const mostActiveEntity = Object.values(entityBreakdown)
    .reduce((max, entity) => entity.audits > max.audits ? entity : max, { audits: 0 });
  
  if (mostActiveEntity.entity) {
    const percentage = (mostActiveEntity.audits / userStats.total_audits) * 100;
    if (percentage > 50) {
      insights.push({
        type: 'entity_concentration',
        message: `${mostActiveEntity.entity} accounts for ${percentage.toFixed(1)}% of user's audits`,
        priority: 'medium',
        data: {
          entity: mostActiveEntity.entity,
          percentage: percentage,
          audits: mostActiveEntity.audits,
        },
      });
    }
  }

  // Activity consistency insight
  const daysWithAudits = activityTrend.filter((/** @type {{ audits: number; }} */ day) => day.audits > 0).length;
  const totalDays = activityTrend.length;
  
  if (totalDays > 0) {
    const consistency = (daysWithAudits / totalDays) * 100;
    if (consistency > 80) {
      insights.push({
        type: 'high_consistency',
        message: `Consistent activity on ${consistency.toFixed(1)}% of days (${daysWithAudits}/${totalDays} days)`,
        priority: 'low',
        data: { consistency_percentage: consistency, active_days: daysWithAudits },
      });
    } else if (consistency < 30) {
      insights.push({
        type: 'low_consistency',
        message: `Activity on only ${consistency.toFixed(1)}% of days (${daysWithAudits}/${totalDays} days)`,
        priority: 'medium',
        data: { consistency_percentage: consistency, active_days: daysWithAudits },
      });
    }
  }

  // Recent activity insight
  if (activityTrend.length > 0) {
    const recentDays = activityTrend.slice(-7); // Last 7 days
    const recentAudits = recentDays.reduce((/** @type {any} */ sum, /** @type {{ audits: any; }} */ day) => sum + day.audits, 0);
    const avgRecentAudits = recentAudits / Math.min(7, recentDays.length);
    
    if (avgRecentAudits > userStats.audit_frequency * 1.5) {
      insights.push({
        type: 'increased_recent_activity',
        message: `Recent activity increased by ${((avgRecentAudits / userStats.audit_frequency - 1) * 100).toFixed(1)}% compared to average`,
        priority: 'medium',
        data: {
          recent_average: avgRecentAudits,
          overall_average: userStats.audit_frequency,
          increase_percentage: ((avgRecentAudits / userStats.audit_frequency - 1) * 100),
        },
      });
    }
  }

  return insights;
}

module.exports = getAuditTrailsByUser;