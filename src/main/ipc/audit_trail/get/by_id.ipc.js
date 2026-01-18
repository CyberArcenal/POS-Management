// audit_trail/get/by_id.ipc.js
//@ts-check
const AuditTrail = require("../../../../entities/AuditTrail");
const { log_audit } = require("../../../../utils/auditLogger");
const { AppDataSource } = require("../../../db/dataSource");

/**
 * @param {number} id
 * @param {number} userId
 */
async function getAuditTrailById(id, userId) {
  try {
    if (!id) {
      return {
        status: false,
        message: "Audit Trail ID is required",
        data: null,
      };
    }

    const auditRepo = AppDataSource.getRepository(AuditTrail);

    const audit = await auditRepo.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!audit) {
      return {
        status: false,
        message: `Audit trail with ID ${id} not found`,
        data: null,
      };
    }

    // Parse details if it's JSON
    let parsedDetails = null;
    if (audit.details) {
      try {
        // @ts-ignore
        parsedDetails = JSON.parse(audit.details);
      } catch {
        parsedDetails = audit.details;
      }
    }

    // Get related activities if any
    const relatedActivities = [];
    if (audit.entity && audit.entity_id) {
      const activityRepo = AppDataSource.getRepository("UserActivity");
      const activities = await activityRepo.find({
        where: {
          entity: audit.entity,
          entity_id: audit.entity_id,
        },
        order: { created_at: "DESC" },
        take: 5,
      });
      
      relatedActivities.push(...activities);
    }

    await log_audit("view", "AuditTrail", id, userId, {
      audit_id: id,
      entity: audit.entity,
      entity_id: audit.entity_id,
    });

    return {
      status: true,
      message: "Audit trail retrieved successfully",
      data: {
        audit,
        parsed_details: parsedDetails,
        context: {
          // @ts-ignore
          performed_by: audit.user ? {
            // @ts-ignore
            id: audit.user.id,
            // @ts-ignore
            username: audit.user.username,
            // @ts-ignore
            role: audit.user.role,
          } : null,
          timestamp: audit.timestamp,
          entity_info: {
            type: audit.entity,
            id: audit.entity_id,
          },
        },
        related_activities: relatedActivities,
      },
    };
  } catch (error) {
    console.error("getAuditTrailById error:", error);

    await log_audit("error", "AuditTrail", id, userId, {
      // @ts-ignore
      error: error.message,
    });

    return {
      status: false,
      // @ts-ignore
      message: `Failed to get audit trail: ${error.message}`,
      data: null,
    };
  }
}

module.exports = getAuditTrailById;