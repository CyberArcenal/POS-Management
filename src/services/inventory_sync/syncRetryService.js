// syncRetryService.js - UPDATED VERSION
//@ts-check
const syncDataManager = require('./syncDataManager');
const SyncManager = require('./syncManager');

class SyncRetryService {
  constructor() {
    this.isRunning = false;
    this.retryInterval = null;
  }

  async start() {
    // Check for pending syncs every 5 minutes
    this.retryInterval = setInterval(() => {
      this.processPendingSyncs();
    }, 5 * 60 * 1000);
    
    console.log('✅ Sync retry service started');
  }

  stop() {
    if (this.retryInterval) {
      clearInterval(this.retryInterval);
      this.retryInterval = null;
    }
    console.log('🛑 Sync retry service stopped');
  }

  async processPendingSyncs() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    try {
      const pendingSyncs = await syncDataManager.getPendingSyncs();
      
      console.log(`🔍 Found ${pendingSyncs.length} pending syncs to retry`);
      
      for (const sync of pendingSyncs) {
        // Check if it's time to retry
        // @ts-ignore
        if (sync.nextRetryAt && new Date(sync.nextRetryAt) > new Date()) {
          continue;
        }
        
        await this.retrySync(sync);
      }
    } catch (error) {
      console.error('❌ Error processing pending syncs:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
     * @param {{ id: any; entityType: any; entityId: any; syncType?: any; syncDirection: any; status?: any; itemsProcessed?: any; itemsSucceeded?: any; itemsFailed?: any; startedAt?: any; completedAt?: any; lastSyncedAt?: any; payload: any; errorMessage?: any; retryCount?: any; nextRetryAt?: any; performedById?: any; performedByUsername?: any; createdAt?: any; updatedAt?: any; }} syncData
     */
  async retrySync(syncData) {
    try {
      console.log(`🔄 Retrying sync ${syncData.id} for ${syncData.entityType} ${syncData.entityId}`);
      
      // Mark as processing
      await syncDataManager.syncDataRepo.update(syncData.id, {
        status: 'processing',
        syncType: 'retry',
        updatedAt: new Date()
      });
      
      // Parse payload
      const payload = syncData.payload ? JSON.parse(syncData.payload) : {};
      
      // Handle different sync types
      switch (syncData.syncDirection) {
        case 'inbound':
          await this.retryInboundSync(syncData, payload);
          break;
        case 'outbound':
          await this.retryOutboundSync(syncData, payload);
          break;
        default:
          console.warn(`⚠️ Unknown sync direction: ${syncData.syncDirection}`);
      }
      
      console.log(`✅ Successfully retried sync ${syncData.id}`);
      
    } catch (error) {
      console.error(`❌ Failed to retry sync ${syncData.id}:`, error);
      
      // Update sync record with failure
      await syncDataManager.recordSyncFailure(
        syncData.id, 
        // @ts-ignore
        error,
        { 
          itemsProcessed: 0, 
          itemsSucceeded: 0, 
          itemsFailed: 1 
        }
      );
    }
  }

  /**
     * @param {{ entityType: string; }} syncData
     * @param {any} payload
     */
  // @ts-ignore
  async retryInboundSync(syncData, payload) {
    console.log(`🔄 Retrying inbound sync for ${syncData.entityType}`);
    
    if (syncData.entityType === 'Product') {
      // For product syncs, trigger a full product sync
      // @ts-ignore
      await SyncManager.syncProductsFromInventory({
        id: 'retry-service',
        username: 'system'
      });
    }
  }

  /**
     * @param {{ entityType: string; }} syncData
     * @param {any} payload
     */
  async retryOutboundSync(syncData, payload) {
    console.log(`🔄 Retrying outbound sync for ${syncData.entityType}`);
    
    if (syncData.entityType === 'Sale') {
      // @ts-ignore
      await this.retrySaleSync(syncData, payload);
    }
  }

  /**
     * @param {{ entityId: any; }} syncData
     * @param {any} payload
     */
  // @ts-ignore
  async retrySaleSync(syncData, payload) {
    const { AppDataSource } = require('../../main/db/dataSource');
    const queryRunner = AppDataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      
      // Get sale data from database
      const sale = await queryRunner.manager.findOne('Sale', {
        where: { id: syncData.entityId },
        relations: ['items', 'items.product']
      });
      
      if (!sale) {
        throw new Error(`❌ Sale ${syncData.entityId} not found`);
      }
      
      // Re-process the inventory update
      await SyncManager.updateInventoryStockFromSale(
        sale, 
        // @ts-ignore
        { id: 'retry-service', username: 'system' }
      );
      
      console.log(`✅ Successfully retried sync for sale ${syncData.entityId}`);
      
    } catch (error) {
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
     * @param {string | number | string[] | import("typeorm").FindOptionsWhere<{ id: unknown; entityType: unknown; entityId: unknown; syncType: unknown; syncDirection: unknown; status: unknown; itemsProcessed: unknown; itemsSucceeded: unknown; itemsFailed: unknown; startedAt: unknown; completedAt: unknown; lastSyncedAt: unknown; payload: unknown; errorMessage: unknown; retryCount: unknown; nextRetryAt: unknown; performedById: unknown; performedByUsername: unknown; createdAt: unknown; updatedAt: unknown; }> | import("typeorm").FindOptionsWhere<{ id: unknown; entityType: unknown; entityId: unknown; syncType: unknown; syncDirection: unknown; status: unknown; itemsProcessed: unknown; itemsSucceeded: unknown; itemsFailed: unknown; startedAt: unknown; completedAt: unknown; lastSyncedAt: unknown; payload: unknown; errorMessage: unknown; retryCount: unknown; nextRetryAt: unknown; performedById: unknown; performedByUsername: unknown; createdAt: unknown; updatedAt: unknown; }>[] | Date | import("typeorm").ObjectId | number[] | Date[] | import("typeorm").ObjectId[] | import("typeorm").FindOptionsWhere<{ id: unknown; entityType: unknown; entityId: unknown; lastSyncedAt: unknown; status: unknown; sync_direction: unknown; payload: unknown; error_message: unknown; retry_count: unknown; next_retry_at: unknown; created_at: unknown; updated_at: unknown; }> | import("typeorm").FindOptionsWhere<{ id: unknown; entityType: unknown; entityId: unknown; lastSyncedAt: unknown; status: unknown; sync_direction: unknown; payload: unknown; error_message: unknown; retry_count: unknown; next_retry_at: unknown; created_at: unknown; updated_at: unknown; }>[]} syncId
     */
  async forceRetry(syncId) {
    const syncData = await syncDataManager.syncDataRepo.findOne({
      where: { id: syncId }
    });
    
    if (!syncData) {
      throw new Error(`❌ Sync record ${syncId} not found`);
    }
    
    // Force retry by setting nextRetryAt to now and status to pending
    await syncDataManager.syncDataRepo.update(syncId, {
      nextRetryAt: new Date(),
      status: 'pending',
      syncType: 'forced',
      updatedAt: new Date()
    });
    
    // Trigger immediate retry
    await this.retrySync(syncData);
    
    return { 
      success: true, 
      message: `✅ Forced retry of sync ${syncId}`,
      syncId 
    };
  }

  async resetAllFailedSyncs(entityType = null) {
    return await syncDataManager.resetFailedSyncs(entityType);
  }
}

module.exports = new SyncRetryService();