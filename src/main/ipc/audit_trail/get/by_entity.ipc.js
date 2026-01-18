// audit_trail/get/by_entity.ipc.js
//@ts-check
const AuditTrail = require("../../../../entities/AuditTrail");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {string} entity
 * @param {number} entityId
 * @param {Object} filters
 * @param {number} userId
 */
async function getAuditTrailsByEntity(entity, entityId, filters = {}, userId) {
  try {
    if (!entity) {
      return {
        status: false,
        message: "Entity name is required",
        data: null,
      };
    }

    const auditRepo = AppDataSource.getRepository(AuditTrail);

    const queryBuilder = auditRepo
      .createQueryBuilder("audit")
      .leftJoinAndSelect("audit.user", "user")
      .where("audit.entity = :entity", { entity });

    if (entityId) {
      queryBuilder.andWhere("audit.entity_id = :entity_id", { entity_id: entityId });
    }

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
    if (filters.action) {
      // @ts-ignore
      queryBuilder.andWhere("audit.action = :action", { action: filters.action });
    }

    // @ts-ignore
    if (filters.user_id) {
      // @ts-ignore
      queryBuilder.andWhere("audit.user_id = :user_id", { user_id: filters.user_id });
    }

    queryBuilder.orderBy("audit.timestamp", "DESC");

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
        message: entityId 
          ? `No audit trails found for ${entity} (ID: ${entityId})`
          : `No audit trails found for entity: ${entity}`,
        data: {
          entity,
          entity_id: entityId,
          audits: [],
          summary: {
            total_audits: 0,
            first_audit: null,
            last_audit: null,
            unique_users: 0,
          },
        },
      };
    }

    // Calculate summary statistics
    const summary = {
      total_audits: audits.length,
      first_audit: audits[audits.length - 1].timestamp,
      last_audit: audits[0].timestamp,
      unique_users: new Set(audits.map(a => a.user_id)).size,
      actions: {},
    };

    // Count actions
    audits.forEach(audit => {
      // @ts-ignore
      summary.actions[audit.action] = (summary.actions[audit.action] || 0) + 1;
    });

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
        ...audit,
        parsed_details: parsedDetails,
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

    // Group by action for timeline
    const timeline = {};
    audits.forEach(audit => {
      // @ts-ignore
      const date = audit.timestamp.toISOString().split('T')[0];
      // @ts-ignore
      if (!timeline[date]) {
        // @ts-ignore
        timeline[date] = {
          date,
          total: 0,
          actions: {},
        };
      }
      // @ts-ignore
      timeline[date].total++;
      // @ts-ignore
      timeline[date].actions[audit.action] = (timeline[date].actions[audit.action] || 0) + 1;
    });

    const timelineArray = Object.values(timeline)
      // @ts-ignore
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get most active users for this entity
    const userActivity = {};
    audits.forEach(audit => {
      // @ts-ignore
      if (audit.user) {
        const userId = audit.user_id;
        // @ts-ignore
        if (!userActivity[userId]) {
          // @ts-ignore
          userActivity[userId] = {
            user_id: userId,
            // @ts-ignore
            username: audit.user.username,
            audits: 0,
            first_audit: audit.timestamp,
            last_audit: audit.timestamp,
            actions: new Set(),
          };
        }
        // @ts-ignore
        userActivity[userId].audits++;
        // @ts-ignore
        userActivity[userId].actions.add(audit.action);
        // @ts-ignore
        if (audit.timestamp < userActivity[userId].first_audit) {
          // @ts-ignore
          userActivity[userId].first_audit = audit.timestamp;
        }
        // @ts-ignore
        if (audit.timestamp > userActivity[userId].last_audit) {
          // @ts-ignore
          userActivity[userId].last_audit = audit.timestamp;
        }
      }
    });

    // Convert Set to array
    Object.keys(userActivity).forEach(userId => {
      // @ts-ignore
      userActivity[userId].actions = Array.from(userActivity[userId].actions);
    });

    const topUsers = Object.values(userActivity)
      .sort((a, b) => b.audits - a.audits)
      .slice(0, 5);

    await log_audit("fetch_by_entity", "AuditTrail", 0, userId, {
      entity,
      entity_id: entityId,
      audits_count: audits.length,
    });

    return {
      status: true,
      message: `Audit trails for ${entity}${entityId ? ` (ID: ${entityId})` : ''} retrieved successfully`,
      data: {
        entity,
        entity_id: entityId,
        audits: parsedAudits,
        summary,
        timeline: timelineArray,
        user_activity: userActivity,
        top_users: topUsers,
        filters_applied: filters,
      },
    };
  } catch (error) {
    console.error("getAuditTrailsByEntity error:", error);

    await log_audit("error", "AuditTrail", 0, userId, {
      entity,
      entity_id: entityId,
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get audit trails by entity: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getAuditTrailsByEntity;