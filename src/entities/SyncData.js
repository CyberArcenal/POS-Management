const { EntitySchema } = require("typeorm");

const SyncData = new EntitySchema({
  name: "SyncData",
  tableName: "pos_sync_data",
  columns: {
    id: { type: "int", primary: true, generated: true },
    
    // Entity info
    entityType: { 
      type: "varchar", 
      nullable: false 
    }, // 'Product', 'Sale', 'SaleItem', 'ProductBatch', 'System'
    entityId: { 
      type: "varchar", 
      nullable: false 
    }, // ID ng record sa entity
    
    // Sync metadata
    syncType: {
      type: "varchar",
      default: "auto"
    }, // 'auto', 'manual', 'retry', 'forced'
    syncDirection: {
      type: "varchar",
      default: "inbound"
    }, // 'inbound' (from inventory), 'outbound' (to inventory)
    
    // Status tracking
    status: { 
      type: "varchar", 
      default: "pending" 
    }, // 'pending', 'processing', 'success', 'failed', 'partial'
    
    // Performance metrics
    itemsProcessed: { type: "int", default: 0 },
    itemsSucceeded: { type: "int", default: 0 },
    itemsFailed: { type: "int", default: 0 },
    
    // Timing
    startedAt: { type: "datetime", nullable: true },
    completedAt: { type: "datetime", nullable: true },
    lastSyncedAt: { type: "datetime", nullable: true },
    
    // Data and errors
    payload: { type: "text", nullable: true }, // JSON data that was synced
    errorMessage: { type: "text", nullable: true },
    retryCount: { type: "int", default: 0 },
    nextRetryAt: { type: "datetime", nullable: true },
    
    // User info
    performedById: { type: "varchar", nullable: true }, // User ID who triggered sync
    performedByUsername: { type: "varchar", nullable: true },
    
    // Timestamps
    createdAt: { type: "datetime", createDate: true },
    updatedAt: { type: "datetime", updateDate: true },
  },
  
  // TANGGALIN ANG RELATIONS PARA WALANG FOREIGN KEY CONSTRAINT
  // Ang SyncData ay para lang sa logging, hindi kailangan ng FK
  
  indices: [
    { columns: ["entityType", "entityId"] },
    { columns: ["status"] },
    { columns: ["syncDirection"] },
    { columns: ["syncType"] },
    { columns: ["createdAt"] },
    { columns: ["completedAt"] },
    { columns: ["performedById"] },
  ],
});

module.exports = SyncData;