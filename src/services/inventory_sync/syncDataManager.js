// syncDataManager.js - UPDATED VERSION
//@ts-check
const SyncData = require("../../entities/SyncData");
const { AppDataSource } = require("../../main/db/dataSource");

class SyncDataManager {
  constructor() {
    this.syncDataRepo = AppDataSource.getRepository(SyncData);
  }

  /**
   * @param {string} entityType
   * @param {string} entityId
   * @param {string} direction
   * @param {string} syncType
   * @param {object} payload
   * @param {object} userInfo
   */
  async recordSyncStart(
    entityType, 
    entityId, 
    direction = 'inbound', 
    syncType = 'auto',
    // @ts-ignore
    payload = null,
    // @ts-ignore
    userInfo = null
  ) {
    const syncData = this.syncDataRepo.create({
      entityType,
      entityId,
      syncDirection: direction,
      syncType,
      status: 'processing',
      payload: payload ? JSON.stringify(payload) : null,
      startedAt: new Date(),
      // @ts-ignore
      performedById: userInfo?.id || null,
      // @ts-ignore
      performedByUsername: userInfo?.username || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.syncDataRepo.save(syncData);
  }

  /**
   * @param {number} syncDataId
   * @param {object} result
   * @param {object} stats
   */
  // @ts-ignore
  async recordSyncSuccess(syncDataId, result = null, stats = {}) {
    return await this.syncDataRepo.update(syncDataId, {
      status: 'success',
      completedAt: new Date(),
      lastSyncedAt: new Date(),
      // @ts-ignore
      itemsProcessed: stats.itemsProcessed || 0,
      // @ts-ignore
      itemsSucceeded: stats.itemsSucceeded || 0,
      // @ts-ignore
      itemsFailed: stats.itemsFailed || 0,
      updatedAt: new Date(),
      retryCount: 0,
      // @ts-ignore
      errorMessage: null,
      // @ts-ignore
      nextRetryAt: null,
      // @ts-ignore
      payload: result ? JSON.stringify(result) : null,
    });
  }

  /**
   * @param {number} syncDataId
   * @param {Error} error
   * @param {object} stats
   * @param {number} maxRetries
   */
  async recordSyncFailure(syncDataId, error, stats = {}, maxRetries = 3) {
    const syncData = await this.syncDataRepo.findOne({
      where: { id: syncDataId },
    });

    if (!syncData) return;

    // @ts-ignore
    const retryCount = syncData.retryCount + 1;
    const shouldRetry = retryCount < maxRetries;

    const updateData = {
      status: shouldRetry ? 'pending' : 'failed',
      completedAt: new Date(),
      errorMessage: error.message,
      // @ts-ignore
      itemsProcessed: stats.itemsProcessed || 0,
      // @ts-ignore
      itemsSucceeded: stats.itemsSucceeded || 0,
      // @ts-ignore
      itemsFailed: stats.itemsFailed || 0,
      retryCount: retryCount,
      updatedAt: new Date(),
    };

    if (shouldRetry) {
      // Exponential backoff: 5, 10, 20, 40 minutes
      const retryDelay = 5 * 60 * 1000 * Math.pow(2, retryCount - 1);
      // @ts-ignore
      updateData.nextRetryAt = new Date(Date.now() + retryDelay);
    }

    return await this.syncDataRepo.update(syncDataId, updateData);
  }

  /**
   * @param {string} entityType
   * @param {string} entityId
   * @param {string} direction
   * @param {object} result
   * @param {object} stats
   * @param {object} userInfo
   */
  // @ts-ignore
  async recordPartialSync(entityType, entityId, direction, result, stats, userInfo = null) {
    const syncData = this.syncDataRepo.create({
      entityType,
      entityId,
      syncDirection: direction,
      syncType: 'auto',
      status: 'partial',
      payload: JSON.stringify(result),
      startedAt: new Date(),
      completedAt: new Date(),
      lastSyncedAt: new Date(),
      // @ts-ignore
      itemsProcessed: stats.itemsProcessed || 0,
      // @ts-ignore
      itemsSucceeded: stats.itemsSucceeded || 0,
      // @ts-ignore
      itemsFailed: stats.itemsFailed || 0,
      // @ts-ignore
      performedById: userInfo?.id || null,
      // @ts-ignore
      performedByUsername: userInfo?.username || null,
      // @ts-ignore
      errorMessage: stats.itemsFailed > 0 ? `${stats.itemsFailed} items failed to sync` : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return await this.syncDataRepo.save(syncData);
  }

  async getPendingSyncs(entityType = null, direction = null) {
    const where = { status: "pending" };

    if (entityType) {
      // @ts-ignore
      where.entityType = entityType;
    }

    if (direction) {
      // @ts-ignore
      where.syncDirection = direction;
    }

    return await this.syncDataRepo.find({
      where,
      order: { createdAt: "ASC" },
    });
  }

  /**
   * @param {string} entityType
   * @param {string} entityId
   * @param {number} limit
   */
  // @ts-ignore
  async getSyncHistory(entityType = null, entityId = null, limit = 50) {
    const where = {};
    
    if (entityType) {
      where.entityType = entityType;
    }
    
    if (entityId) {
      where.entityId = entityId;
    }

    return await this.syncDataRepo.find({
      where,
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async getSyncStats(timeRange = 'day') {
    const date = new Date();
    let startDate;
    
    switch(timeRange) {
      case 'hour':
        startDate = new Date(date.setHours(date.getHours() - 1));
        break;
      case 'day':
        startDate = new Date(date.setDate(date.getDate() - 1));
        break;
      case 'week':
        startDate = new Date(date.setDate(date.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(date.setMonth(date.getMonth() - 1));
        break;
      default:
        startDate = new Date(date.setDate(date.getDate() - 1));
    }

    const stats = await this.syncDataRepo
      .createQueryBuilder('sync')
      .select([
        'COUNT(*) as total',
        'SUM(CASE WHEN status = "success" THEN 1 ELSE 0 END) as success',
        'SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) as failed',
        'SUM(CASE WHEN status = "partial" THEN 1 ELSE 0 END) as partial',
        'SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending',
        'syncDirection',
        'entityType'
      ])
      .where('sync.createdAt >= :startDate', { startDate })
      .groupBy('syncDirection, entityType')
      .getRawMany();

    return {
      timeRange,
      startDate,
      stats,
      summary: {
        total: stats.reduce((sum, item) => sum + parseInt(item.total), 0),
        success: stats.reduce((sum, item) => sum + parseInt(item.success), 0),
        failed: stats.reduce((sum, item) => sum + parseInt(item.failed), 0),
        partial: stats.reduce((sum, item) => sum + parseInt(item.partial), 0),
        pending: stats.reduce((sum, item) => sum + parseInt(item.pending), 0),
      }
    };
  }

  async cleanOldSyncRecords(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await this.syncDataRepo
      .createQueryBuilder()
      .delete()
      .where("createdAt < :cutoffDate", { cutoffDate })
      .andWhere("status IN (:...statuses)", {
        statuses: ["success", "failed", "partial"],
      })
      .execute();
  }

  async resetFailedSyncs(entityType = null) {
    const where = { status: 'failed' };
    
    if (entityType) {
      // @ts-ignore
      where.entityType = entityType;
    }

    return await this.syncDataRepo.update(where, {
      status: 'pending',
      nextRetryAt: new Date(),
      retryCount: 0,
      // @ts-ignore
      errorMessage: null,
      updatedAt: new Date(),
    });
  }
}

module.exports = new SyncDataManager();