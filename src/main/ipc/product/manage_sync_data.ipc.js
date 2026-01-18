// manage_sync_data.ipc.js
//@ts-check
const syncDataManager = require("../../../services/inventory_sync/syncDataManager");
const syncRetryService = require("../../../services/inventory_sync/syncRetryService");

/**
 * Manage sync data - view history, retry failed syncs, etc.
 * @param {{ userId: any; action: any; filters?: {} | undefined; syncId: any; forceRetry?: false | undefined; }} params
 */
async function manageSyncData(params) {
  try {
    // @ts-ignore
    const { 
      // @ts-ignore
      userId, 
      action,
      filters = {},
      syncId,
      forceRetry = false
    } = params;
    
    switch (action) {
      case 'get_history':
        // @ts-ignore
        return await getSyncHistory(filters);
      
      case 'get_pending':
        // @ts-ignore
        return await getPendingSyncs(filters);
      
      case 'retry_sync':
        return await retrySync(syncId, forceRetry);
      
      case 'cleanup_old':
        // @ts-ignore
        return await cleanupOldSyncs(filters.daysToKeep);
      
      default:
        return {
          status: false,
          message: `Unknown action: ${action}`,
          data: null
        };
    }
  } catch (error) {
    console.error('manageSyncData error:', error);
    return {
      status: false,
      // @ts-ignore
      message: `Failed to manage sync data: ${error.message}`,
      data: null
    };
  }
}

/**
 * @param {{ entityType: any; entityId: any; direction: any; status: any; startDate: any; endDate: any; page?: 1 | undefined; limit?: 50 | undefined; }} filters
 */
async function getSyncHistory(filters) {
  const { 
    entityType, 
    entityId, 
    direction, 
    status,
    startDate, 
    endDate,
    page = 1,
    limit = 50
  } = filters;
  
  const queryBuilder = syncDataManager.syncDataRepo
    .createQueryBuilder('sync')
    .orderBy('sync.created_at', 'DESC');
  
  if (entityType) {
    queryBuilder.andWhere('sync.entityType = :entityType', { entityType });
  }
  
  if (entityId) {
    queryBuilder.andWhere('sync.entityId = :entityId', { entityId });
  }
  
  if (direction) {
    queryBuilder.andWhere('sync.sync_direction = :direction', { direction });
  }
  
  if (status) {
    queryBuilder.andWhere('sync.status = :status', { status });
  }
  
  if (startDate) {
    queryBuilder.andWhere('sync.created_at >= :startDate', { startDate });
  }
  
  if (endDate) {
    queryBuilder.andWhere('sync.created_at <= :endDate', { endDate });
  }
  
  const [data, total] = await queryBuilder
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();
  
  return {
    status: true,
    message: 'Sync history retrieved',
    data: {
      syncs: data.map(sync => ({
        ...sync,
        // @ts-ignore
        payload: sync.payload ? JSON.parse(sync.payload) : null
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  };
}

/**
 * @param {{ entityType: any; direction: any; }} filters
 */
async function getPendingSyncs(filters) {
  const { entityType, direction } = filters;
  
  const pendingSyncs = await syncDataManager.getPendingSyncs(entityType, direction);
  
  return {
    status: true,
    message: 'Pending syncs retrieved',
    data: {
      syncs: pendingSyncs.map(sync => ({
        ...sync,
        // @ts-ignore
        payload: sync.payload ? JSON.parse(sync.payload) : null
      })),
      count: pendingSyncs.length
    }
  };
}

/**
 * @param {string | number | string[] | import("typeorm").FindOptionsWhere<{ id: unknown; entityType: unknown; entityId: unknown; lastSyncedAt: unknown; status: unknown; sync_direction: unknown; payload: unknown; error_message: unknown; retry_count: unknown; next_retry_at: unknown; created_at: unknown; updated_at: unknown; }> | import("typeorm").FindOptionsWhere<{ id: unknown; entityType: unknown; entityId: unknown; lastSyncedAt: unknown; status: unknown; sync_direction: unknown; payload: unknown; error_message: unknown; retry_count: unknown; next_retry_at: unknown; created_at: unknown; updated_at: unknown; }>[] | Date | import("typeorm").ObjectId | number[] | Date[] | import("typeorm").ObjectId[]} syncId
 */
async function retrySync(syncId, forceRetry = false) {
  if (!syncId) {
    return {
      status: false,
      message: 'Sync ID is required',
      data: null
    };
  }
  
  try {
    // Import retry service
    
    if (forceRetry) {
      const result = await syncRetryService.forceRetry(syncId);
      return {
        status: true,
        message: result.message,
        data: { syncId }
      };
    } else {
      // Just update the next_retry_at to trigger automatic retry
      await syncDataManager.syncDataRepo.update(syncId, {
        nextRetryAt: new Date(),
        status: 'pending'
      });
      
      return {
        status: true,
        message: `Sync ${syncId} scheduled for retry`,
        data: { syncId }
      };
    }
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: `Failed to retry sync: ${error.message}`,
      data: null
    };
  }
}

async function cleanupOldSyncs(daysToKeep = 30) {
  try {
    const result = await syncDataManager.cleanOldSyncRecords(daysToKeep);
    
    return {
      status: true,
      message: `Cleaned up sync records older than ${daysToKeep} days`,
      data: {
        affected: result.affected || 0
      }
    };
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: `Failed to cleanup old syncs: ${error.message}`,
      data: null
    };
  }
}

module.exports = manageSyncData;