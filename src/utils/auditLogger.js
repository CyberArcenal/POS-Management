// src/main/utils/logAudit.js
//@ts-check

const AuditTrail = require("../entities/AuditTrail");
const { AppDataSource } = require("../main/db/dataSource");
const { logger } = require("./logger");
const { auditLogEnabled } = require("./system");

/**
 * Safe audit logging utility
 * @param {string} action - e.g. "create", "update", "delete", "resend"
 * @param {string} entity - e.g. "Appointment", "NotificationLog"
 * @param {number} entityId - target entity id
 * @param {number} userId - actor user id
 * @param {object} [details] - optional context (payload, args, error message)
 */
// @ts-ignore
async function log_audit(action, entity, entityId, userId, details = null) {
  const isEnabled = await auditLogEnabled();
  if(!isEnabled)return;
  try {
    // Validate inputs
    if (!action || !entity || !entityId || !userId) {
      logger.warn(`[AUDIT] Skipped → Missing required fields: action=${action}, entity=${entity}, entityId=${entityId}, userId=${userId}`);
      return;
    }

    // Ensure datasource is ready
    if (!AppDataSource.isInitialized) {
      logger.warn("[AUDIT] Skipped → DataSource not initialized");
      return;
    }

    const repo = AppDataSource.getRepository(AuditTrail);

    const auditEntry = repo.create({
      action,
      entity,
      entity_id: entityId,
      user_id: userId,
      details: details ? JSON.stringify(details) : null,
    });

    await repo.save(auditEntry);

    logger.info(`[AUDIT] Logged → Action=${action}, Entity=${entity}#${entityId}, User=${userId}`);
  } catch (error) {
    // Critical: never throw, just log
    // @ts-ignore
    logger.error(`[AUDIT] Failed → Action=${action}, Entity=${entity}#${entityId}, User=${userId}, Error=${error.message}`);
  }
}

module.exports = { log_audit };