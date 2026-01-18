// audit_trail/get/by_date_range.ipc.js
//@ts-check
const AuditTrail = require("../../../../entities/AuditTrail");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} startDate
 * @param {string} endDate
 * @param {Object} filters
 * @param {number} userId
 */
async function getAuditTrailsByDateRange(startDate, endDate, filters = {}, userId) {
  try {
    if (!startDate || !endDate) {
      return {
        status: false,
        message: "Start date and end date are required",
        data: null,
      };
    }

    const auditRepo = AppDataSource.getRepository(AuditTrail);

    const queryBuilder = auditRepo
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.user", "user")
      .where("audit.timestamp BETWEEN :start_date AND :end_date", {
        start_date: startDate,
        end_date: endDate,
      })
      .orderBy("audit.timestamp", "DESC");

    // Apply filters
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

    // Calculate summary statistics
    const summary = {
      total_audits: audits.length,
      unique_entities: new Set(audits.map(a => a.entity)).size,
      unique_users: new Set(audits.map(a => a.user_id)).size,
      unique_actions: new Set(audits.map(a => a.action)).size,
      date_range: {
        start_date: startDate,
        end_date: endDate,
        // @ts-ignore
        days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
      },
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

    // Group by entity
    const entitySummary = {};
    audits.forEach(audit => {
      // @ts-ignore
      if (!entitySummary[audit.entity]) {
        // @ts-ignore
        entitySummary[audit.entity] = {
          entity: audit.entity,
          audits: 0,
          users: new Set(),
          actions: new Set(),
          first_audit: audit.timestamp,
          last_audit: audit.timestamp,
        };
      }
      
      // @ts-ignore
      entitySummary[audit.entity].audits++;
      // @ts-ignore
      entitySummary[audit.entity].users.add(audit.user_id);
      // @ts-ignore
      entitySummary[audit.entity].actions.add(audit.action);
      
      // @ts-ignore
      if (audit.timestamp < entitySummary[audit.entity].first_audit) {
        // @ts-ignore
        entitySummary[audit.entity].first_audit = audit.timestamp;
      }
      // @ts-ignore
      if (audit.timestamp > entitySummary[audit.entity].last_audit) {
        // @ts-ignore
        entitySummary[audit.entity].last_audit = audit.timestamp;
      }
    });

    // Convert Sets to counts
    Object.keys(entitySummary).forEach(entity => {
      // @ts-ignore
      entitySummary[entity].unique_users = entitySummary[entity].users.size;
      // @ts-ignore
      entitySummary[entity].unique_actions = entitySummary[entity].actions.size;
      // @ts-ignore
      delete entitySummary[entity].users;
      // @ts-ignore
      delete entitySummary[entity].actions;
    });

    // Group by action
    const actionSummary = {};
    audits.forEach(audit => {
      // @ts-ignore
      if (!actionSummary[audit.action]) {
        // @ts-ignore
        actionSummary[audit.action] = {
          action: audit.action,
          count: 0,
          entities: new Set(),
          users: new Set(),
        };
      }
      
      // @ts-ignore
      actionSummary[audit.action].count++;
      // @ts-ignore
      actionSummary[audit.action].entities.add(audit.entity);
      // @ts-ignore
      actionSummary[audit.action].users.add(audit.user_id);
    });

    // Convert Sets to counts
    Object.keys(actionSummary).forEach(action => {
      // @ts-ignore
      actionSummary[action].unique_entities = actionSummary[action].entities.size;
      // @ts-ignore
      actionSummary[action].unique_users = actionSummary[action].users.size;
      // @ts-ignore
      delete actionSummary[action].entities;
      // @ts-ignore
      delete actionSummary[action].users;
    });

    // Group by user
    const userSummary = {};
    audits.forEach(audit => {
      // @ts-ignore
      if (!audit.user) return;
      
      const userId = audit.user_id;
      // @ts-ignore
      if (!userSummary[userId]) {
        // @ts-ignore
        userSummary[userId] = {
          user_id: userId,
          // @ts-ignore
          username: audit.user.username,
          audits: 0,
          entities: new Set(),
          actions: new Set(),
        };
      }
      
      // @ts-ignore
      userSummary[userId].audits++;
      // @ts-ignore
      userSummary[userId].entities.add(audit.entity);
      // @ts-ignore
      userSummary[userId].actions.add(audit.action);
    });

    // Convert Sets to counts
    Object.keys(userSummary).forEach(userId => {
      // @ts-ignore
      userSummary[userId].unique_entities = userSummary[userId].entities.size;
      // @ts-ignore
      userSummary[userId].unique_actions = userSummary[userId].actions.size;
      // @ts-ignore
      delete userSummary[userId].entities;
      // @ts-ignore
      delete userSummary[userId].actions;
    });

    // Group by day for timeline
    const dailyTimeline = {};
    audits.forEach(audit => {
      // @ts-ignore
      const date = audit.timestamp.toISOString().split('T')[0];
      // @ts-ignore
      if (!dailyTimeline[date]) {
        // @ts-ignore
        dailyTimeline[date] = {
          date,
          audits: 0,
          entities: new Set(),
          users: new Set(),
          actions: new Set(),
        };
      }
      
      // @ts-ignore
      dailyTimeline[date].audits++;
      // @ts-ignore
      dailyTimeline[date].entities.add(audit.entity);
      // @ts-ignore
      dailyTimeline[date].users.add(audit.user_id);
      // @ts-ignore
      dailyTimeline[date].actions.add(audit.action);
    });

    // Convert Sets to counts
    Object.keys(dailyTimeline).forEach(date => {
      // @ts-ignore
      dailyTimeline[date].unique_entities = dailyTimeline[date].entities.size;
      // @ts-ignore
      dailyTimeline[date].unique_users = dailyTimeline[date].users.size;
      // @ts-ignore
      dailyTimeline[date].unique_actions = dailyTimeline[date].actions.size;
      // @ts-ignore
      delete dailyTimeline[date].entities;
      // @ts-ignore
      delete dailyTimeline[date].users;
      // @ts-ignore
      delete dailyTimeline[date].actions;
    });

    const timelineArray = Object.values(dailyTimeline)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate audit frequency per day
    const auditsPerDay = summary.total_audits / summary.date_range.days;

    // Get top statistics
    const topEntities = Object.values(entitySummary)
      .sort((a, b) => b.audits - a.audits)
      .slice(0, 5);

    const topActions = Object.values(actionSummary)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topUsers = Object.values(userSummary)
      .sort((a, b) => b.audits - a.audits)
      .slice(0, 5);

    await log_audit("fetch_by_date_range", "AuditTrail", 0, userId, {
      start_date: startDate,
      end_date: endDate,
      audits_count: audits.length,
    });

    return {
      status: true,
      message: "Audit trails retrieved by date range successfully",
      data: {
        audits: parsedAudits,
        summary,
        entity_summary: entitySummary,
        action_summary: actionSummary,
        user_summary: userSummary,
        timeline: timelineArray,
        top_lists: {
          entities: topEntities,
          actions: topActions,
          users: topUsers,
        },
        metrics: {
          audits_per_day: auditsPerDay,
          average_audits_per_user: summary.total_audits / Math.max(1, Object.keys(userSummary).length),
          average_audits_per_entity: summary.total_audits / Math.max(1, Object.keys(entitySummary).length),
          user_activity_rate: (Object.keys(userSummary).length / summary.unique_users) * 100,
        },
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getAuditTrailsByDateRange error:", error);

    await log_audit("error", "AuditTrail", 0, userId, {
      start_date: startDate,
      end_date: endDate,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get audit trails by date range: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getAuditTrailsByDateRange;