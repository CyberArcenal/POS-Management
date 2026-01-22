/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1769000957065 {
    name = 'InitSchema1769000957065'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_6c1adb6efbbd96f93a15fa6031"`);
        await queryRunner.query(`DROP INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0"`);
        await queryRunner.query(`DROP INDEX "IDX_2dcead3cbafc2412413cfcb8a8"`);
        await queryRunner.query(`DROP INDEX "IDX_d751e592062326fca40eacc7dc"`);
        await queryRunner.query(`DROP INDEX "IDX_c94cba9c28b82de9f08b3dc0af"`);
        await queryRunner.query(`DROP INDEX "IDX_261e069f0d53506c90c449bb97"`);
        await queryRunner.query(`DROP INDEX "IDX_16f93c1ce5b61e7ec7b74f5225"`);
        await queryRunner.query(`CREATE TABLE "temporary_pos_sync_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entityType" varchar NOT NULL, "entityId" integer NOT NULL, "syncType" varchar NOT NULL DEFAULT ('auto'), "syncDirection" varchar NOT NULL DEFAULT ('inbound'), "status" varchar NOT NULL DEFAULT ('pending'), "itemsProcessed" integer NOT NULL DEFAULT (0), "itemsSucceeded" integer NOT NULL DEFAULT (0), "itemsFailed" integer NOT NULL DEFAULT (0), "startedAt" datetime, "completedAt" datetime, "lastSyncedAt" datetime, "payload" text, "errorMessage" text, "retryCount" integer NOT NULL DEFAULT (0), "nextRetryAt" datetime, "performedById" varchar, "performedByUsername" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_pos_sync_data"("id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt") SELECT "id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt" FROM "pos_sync_data"`);
        await queryRunner.query(`DROP TABLE "pos_sync_data"`);
        await queryRunner.query(`ALTER TABLE "temporary_pos_sync_data" RENAME TO "pos_sync_data"`);
        await queryRunner.query(`CREATE INDEX "IDX_6c1adb6efbbd96f93a15fa6031" ON "pos_sync_data" ("performedById") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0" ON "pos_sync_data" ("completedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dcead3cbafc2412413cfcb8a8" ON "pos_sync_data" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_d751e592062326fca40eacc7dc" ON "pos_sync_data" ("syncType") `);
        await queryRunner.query(`CREATE INDEX "IDX_c94cba9c28b82de9f08b3dc0af" ON "pos_sync_data" ("syncDirection") `);
        await queryRunner.query(`CREATE INDEX "IDX_261e069f0d53506c90c449bb97" ON "pos_sync_data" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_16f93c1ce5b61e7ec7b74f5225" ON "pos_sync_data" ("entityType", "entityId") `);
        await queryRunner.query(`DROP INDEX "IDX_8a9b2f2f77d3ded5bec7b94791"`);
        await queryRunner.query(`DROP INDEX "IDX_d40ef8583255ebc800f1f3502e"`);
        await queryRunner.query(`DROP INDEX "IDX_182c40c3bc2513838e9df5ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_b9dbc3cf2f94af2903c2eda41c"`);
        await queryRunner.query(`DROP INDEX "IDX_51026a47ea78d0b6c5d57246a3"`);
        await queryRunner.query(`DROP INDEX "IDX_9c586a93dd02521c448b062df9"`);
        await queryRunner.query(`DROP INDEX "IDX_246696159bea962ad89957763d"`);
        await queryRunner.query(`DROP INDEX "IDX_849fb700ab21aa6f03a5cfe29f"`);
        await queryRunner.query(`DROP INDEX "IDX_c73940c1ca00c65ae334c2f4a5"`);
        await queryRunner.query(`CREATE TABLE "temporary_pos_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT (0), "min_stock" integer NOT NULL DEFAULT (0), "stock_item_id" varchar, "category_name" varchar, "supplier_name" varchar, "barcode" varchar, "description" text, "cost_price" integer, "is_active" boolean NOT NULL DEFAULT (1), "reorder_quantity" integer NOT NULL DEFAULT (0), "last_reorder_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "is_deleted" boolean NOT NULL DEFAULT (0), "last_price_change" datetime, "original_price" integer, "parent_product_id" integer, CONSTRAINT "UQ_9c586a93dd02521c448b062df97" UNIQUE ("barcode"), CONSTRAINT "UQ_c73940c1ca00c65ae334c2f4a56" UNIQUE ("sku"), CONSTRAINT "FK_29ae22b048be608093f3ab6242a" FOREIGN KEY ("parent_product_id") REFERENCES "pos_products" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_pos_products"("id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id") SELECT "id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id" FROM "pos_products"`);
        await queryRunner.query(`DROP TABLE "pos_products"`);
        await queryRunner.query(`ALTER TABLE "temporary_pos_products" RENAME TO "pos_products"`);
        await queryRunner.query(`CREATE INDEX "IDX_8a9b2f2f77d3ded5bec7b94791" ON "pos_products" ("supplier_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_d40ef8583255ebc800f1f3502e" ON "pos_products" ("category_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_182c40c3bc2513838e9df5ecad" ON "pos_products" ("stock") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9dbc3cf2f94af2903c2eda41c" ON "pos_products" ("is_deleted") `);
        await queryRunner.query(`CREATE INDEX "IDX_51026a47ea78d0b6c5d57246a3" ON "pos_products" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c586a93dd02521c448b062df9" ON "pos_products" ("barcode") `);
        await queryRunner.query(`CREATE INDEX "IDX_246696159bea962ad89957763d" ON "pos_products" ("stock_item_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_849fb700ab21aa6f03a5cfe29f" ON "pos_products" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c73940c1ca00c65ae334c2f4a5" ON "pos_products" ("sku") `);
        await queryRunner.query(`DROP INDEX "IDX_6c1adb6efbbd96f93a15fa6031"`);
        await queryRunner.query(`DROP INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0"`);
        await queryRunner.query(`DROP INDEX "IDX_2dcead3cbafc2412413cfcb8a8"`);
        await queryRunner.query(`DROP INDEX "IDX_d751e592062326fca40eacc7dc"`);
        await queryRunner.query(`DROP INDEX "IDX_c94cba9c28b82de9f08b3dc0af"`);
        await queryRunner.query(`DROP INDEX "IDX_261e069f0d53506c90c449bb97"`);
        await queryRunner.query(`DROP INDEX "IDX_16f93c1ce5b61e7ec7b74f5225"`);
        await queryRunner.query(`CREATE TABLE "temporary_pos_sync_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entityType" varchar NOT NULL, "entityId" integer NOT NULL, "syncType" varchar NOT NULL DEFAULT ('auto'), "syncDirection" varchar NOT NULL DEFAULT ('inbound'), "status" varchar NOT NULL DEFAULT ('pending'), "itemsProcessed" integer NOT NULL DEFAULT (0), "itemsSucceeded" integer NOT NULL DEFAULT (0), "itemsFailed" integer NOT NULL DEFAULT (0), "startedAt" datetime, "completedAt" datetime, "lastSyncedAt" datetime, "payload" text, "errorMessage" text, "retryCount" integer NOT NULL DEFAULT (0), "nextRetryAt" datetime, "performedById" varchar, "performedByUsername" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_pos_sync_data"("id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt") SELECT "id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt" FROM "pos_sync_data"`);
        await queryRunner.query(`DROP TABLE "pos_sync_data"`);
        await queryRunner.query(`ALTER TABLE "temporary_pos_sync_data" RENAME TO "pos_sync_data"`);
        await queryRunner.query(`CREATE INDEX "IDX_6c1adb6efbbd96f93a15fa6031" ON "pos_sync_data" ("performedById") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0" ON "pos_sync_data" ("completedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dcead3cbafc2412413cfcb8a8" ON "pos_sync_data" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_d751e592062326fca40eacc7dc" ON "pos_sync_data" ("syncType") `);
        await queryRunner.query(`CREATE INDEX "IDX_c94cba9c28b82de9f08b3dc0af" ON "pos_sync_data" ("syncDirection") `);
        await queryRunner.query(`CREATE INDEX "IDX_261e069f0d53506c90c449bb97" ON "pos_sync_data" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_16f93c1ce5b61e7ec7b74f5225" ON "pos_sync_data" ("entityType", "entityId") `);
        await queryRunner.query(`DROP INDEX "IDX_8a9b2f2f77d3ded5bec7b94791"`);
        await queryRunner.query(`DROP INDEX "IDX_d40ef8583255ebc800f1f3502e"`);
        await queryRunner.query(`DROP INDEX "IDX_182c40c3bc2513838e9df5ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_b9dbc3cf2f94af2903c2eda41c"`);
        await queryRunner.query(`DROP INDEX "IDX_51026a47ea78d0b6c5d57246a3"`);
        await queryRunner.query(`DROP INDEX "IDX_9c586a93dd02521c448b062df9"`);
        await queryRunner.query(`DROP INDEX "IDX_246696159bea962ad89957763d"`);
        await queryRunner.query(`DROP INDEX "IDX_849fb700ab21aa6f03a5cfe29f"`);
        await queryRunner.query(`DROP INDEX "IDX_c73940c1ca00c65ae334c2f4a5"`);
        await queryRunner.query(`CREATE TABLE "temporary_pos_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT (0), "min_stock" integer NOT NULL DEFAULT (0), "stock_item_id" varchar, "category_name" varchar, "supplier_name" varchar, "barcode" varchar, "description" text, "cost_price" integer, "is_active" boolean NOT NULL DEFAULT (1), "reorder_quantity" integer NOT NULL DEFAULT (0), "last_reorder_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "is_deleted" boolean NOT NULL DEFAULT (0), "last_price_change" datetime, "original_price" integer, "parent_product_id" integer, CONSTRAINT "UQ_9c586a93dd02521c448b062df97" UNIQUE ("barcode"), CONSTRAINT "UQ_c73940c1ca00c65ae334c2f4a56" UNIQUE ("sku"), CONSTRAINT "UQ_379500a11ca85932df21f0d037a" UNIQUE ("stock_item_id"), CONSTRAINT "FK_29ae22b048be608093f3ab6242a" FOREIGN KEY ("parent_product_id") REFERENCES "pos_products" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_pos_products"("id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id") SELECT "id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id" FROM "pos_products"`);
        await queryRunner.query(`DROP TABLE "pos_products"`);
        await queryRunner.query(`ALTER TABLE "temporary_pos_products" RENAME TO "pos_products"`);
        await queryRunner.query(`CREATE INDEX "IDX_8a9b2f2f77d3ded5bec7b94791" ON "pos_products" ("supplier_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_d40ef8583255ebc800f1f3502e" ON "pos_products" ("category_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_182c40c3bc2513838e9df5ecad" ON "pos_products" ("stock") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9dbc3cf2f94af2903c2eda41c" ON "pos_products" ("is_deleted") `);
        await queryRunner.query(`CREATE INDEX "IDX_51026a47ea78d0b6c5d57246a3" ON "pos_products" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c586a93dd02521c448b062df9" ON "pos_products" ("barcode") `);
        await queryRunner.query(`CREATE INDEX "IDX_246696159bea962ad89957763d" ON "pos_products" ("stock_item_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_849fb700ab21aa6f03a5cfe29f" ON "pos_products" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c73940c1ca00c65ae334c2f4a5" ON "pos_products" ("sku") `);
        await queryRunner.query(`DROP INDEX "IDX_16f93c1ce5b61e7ec7b74f5225"`);
        await queryRunner.query(`DROP INDEX "IDX_6c1adb6efbbd96f93a15fa6031"`);
        await queryRunner.query(`DROP INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0"`);
        await queryRunner.query(`DROP INDEX "IDX_2dcead3cbafc2412413cfcb8a8"`);
        await queryRunner.query(`DROP INDEX "IDX_d751e592062326fca40eacc7dc"`);
        await queryRunner.query(`DROP INDEX "IDX_c94cba9c28b82de9f08b3dc0af"`);
        await queryRunner.query(`DROP INDEX "IDX_261e069f0d53506c90c449bb97"`);
        await queryRunner.query(`CREATE TABLE "temporary_pos_sync_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entityType" varchar NOT NULL, "entityId" varchar NOT NULL, "syncType" varchar NOT NULL DEFAULT ('auto'), "syncDirection" varchar NOT NULL DEFAULT ('inbound'), "status" varchar NOT NULL DEFAULT ('pending'), "itemsProcessed" integer NOT NULL DEFAULT (0), "itemsSucceeded" integer NOT NULL DEFAULT (0), "itemsFailed" integer NOT NULL DEFAULT (0), "startedAt" datetime, "completedAt" datetime, "lastSyncedAt" datetime, "payload" text, "errorMessage" text, "retryCount" integer NOT NULL DEFAULT (0), "nextRetryAt" datetime, "performedById" varchar, "performedByUsername" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_pos_sync_data"("id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt") SELECT "id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt" FROM "pos_sync_data"`);
        await queryRunner.query(`DROP TABLE "pos_sync_data"`);
        await queryRunner.query(`ALTER TABLE "temporary_pos_sync_data" RENAME TO "pos_sync_data"`);
        await queryRunner.query(`CREATE INDEX "IDX_6c1adb6efbbd96f93a15fa6031" ON "pos_sync_data" ("performedById") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0" ON "pos_sync_data" ("completedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dcead3cbafc2412413cfcb8a8" ON "pos_sync_data" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_d751e592062326fca40eacc7dc" ON "pos_sync_data" ("syncType") `);
        await queryRunner.query(`CREATE INDEX "IDX_c94cba9c28b82de9f08b3dc0af" ON "pos_sync_data" ("syncDirection") `);
        await queryRunner.query(`CREATE INDEX "IDX_261e069f0d53506c90c449bb97" ON "pos_sync_data" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_16f93c1ce5b61e7ec7b74f5225" ON "pos_sync_data" ("entityType", "entityId") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_16f93c1ce5b61e7ec7b74f5225"`);
        await queryRunner.query(`DROP INDEX "IDX_261e069f0d53506c90c449bb97"`);
        await queryRunner.query(`DROP INDEX "IDX_c94cba9c28b82de9f08b3dc0af"`);
        await queryRunner.query(`DROP INDEX "IDX_d751e592062326fca40eacc7dc"`);
        await queryRunner.query(`DROP INDEX "IDX_2dcead3cbafc2412413cfcb8a8"`);
        await queryRunner.query(`DROP INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0"`);
        await queryRunner.query(`DROP INDEX "IDX_6c1adb6efbbd96f93a15fa6031"`);
        await queryRunner.query(`ALTER TABLE "pos_sync_data" RENAME TO "temporary_pos_sync_data"`);
        await queryRunner.query(`CREATE TABLE "pos_sync_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entityType" varchar NOT NULL, "entityId" integer NOT NULL, "syncType" varchar NOT NULL DEFAULT ('auto'), "syncDirection" varchar NOT NULL DEFAULT ('inbound'), "status" varchar NOT NULL DEFAULT ('pending'), "itemsProcessed" integer NOT NULL DEFAULT (0), "itemsSucceeded" integer NOT NULL DEFAULT (0), "itemsFailed" integer NOT NULL DEFAULT (0), "startedAt" datetime, "completedAt" datetime, "lastSyncedAt" datetime, "payload" text, "errorMessage" text, "retryCount" integer NOT NULL DEFAULT (0), "nextRetryAt" datetime, "performedById" varchar, "performedByUsername" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "pos_sync_data"("id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt") SELECT "id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt" FROM "temporary_pos_sync_data"`);
        await queryRunner.query(`DROP TABLE "temporary_pos_sync_data"`);
        await queryRunner.query(`CREATE INDEX "IDX_261e069f0d53506c90c449bb97" ON "pos_sync_data" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c94cba9c28b82de9f08b3dc0af" ON "pos_sync_data" ("syncDirection") `);
        await queryRunner.query(`CREATE INDEX "IDX_d751e592062326fca40eacc7dc" ON "pos_sync_data" ("syncType") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dcead3cbafc2412413cfcb8a8" ON "pos_sync_data" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0" ON "pos_sync_data" ("completedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_6c1adb6efbbd96f93a15fa6031" ON "pos_sync_data" ("performedById") `);
        await queryRunner.query(`CREATE INDEX "IDX_16f93c1ce5b61e7ec7b74f5225" ON "pos_sync_data" ("entityType", "entityId") `);
        await queryRunner.query(`DROP INDEX "IDX_c73940c1ca00c65ae334c2f4a5"`);
        await queryRunner.query(`DROP INDEX "IDX_849fb700ab21aa6f03a5cfe29f"`);
        await queryRunner.query(`DROP INDEX "IDX_246696159bea962ad89957763d"`);
        await queryRunner.query(`DROP INDEX "IDX_9c586a93dd02521c448b062df9"`);
        await queryRunner.query(`DROP INDEX "IDX_51026a47ea78d0b6c5d57246a3"`);
        await queryRunner.query(`DROP INDEX "IDX_b9dbc3cf2f94af2903c2eda41c"`);
        await queryRunner.query(`DROP INDEX "IDX_182c40c3bc2513838e9df5ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_d40ef8583255ebc800f1f3502e"`);
        await queryRunner.query(`DROP INDEX "IDX_8a9b2f2f77d3ded5bec7b94791"`);
        await queryRunner.query(`ALTER TABLE "pos_products" RENAME TO "temporary_pos_products"`);
        await queryRunner.query(`CREATE TABLE "pos_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT (0), "min_stock" integer NOT NULL DEFAULT (0), "stock_item_id" varchar, "category_name" varchar, "supplier_name" varchar, "barcode" varchar, "description" text, "cost_price" integer, "is_active" boolean NOT NULL DEFAULT (1), "reorder_quantity" integer NOT NULL DEFAULT (0), "last_reorder_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "is_deleted" boolean NOT NULL DEFAULT (0), "last_price_change" datetime, "original_price" integer, "parent_product_id" integer, CONSTRAINT "UQ_9c586a93dd02521c448b062df97" UNIQUE ("barcode"), CONSTRAINT "UQ_c73940c1ca00c65ae334c2f4a56" UNIQUE ("sku"), CONSTRAINT "FK_29ae22b048be608093f3ab6242a" FOREIGN KEY ("parent_product_id") REFERENCES "pos_products" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "pos_products"("id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id") SELECT "id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id" FROM "temporary_pos_products"`);
        await queryRunner.query(`DROP TABLE "temporary_pos_products"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c73940c1ca00c65ae334c2f4a5" ON "pos_products" ("sku") `);
        await queryRunner.query(`CREATE INDEX "IDX_849fb700ab21aa6f03a5cfe29f" ON "pos_products" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_246696159bea962ad89957763d" ON "pos_products" ("stock_item_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c586a93dd02521c448b062df9" ON "pos_products" ("barcode") `);
        await queryRunner.query(`CREATE INDEX "IDX_51026a47ea78d0b6c5d57246a3" ON "pos_products" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9dbc3cf2f94af2903c2eda41c" ON "pos_products" ("is_deleted") `);
        await queryRunner.query(`CREATE INDEX "IDX_182c40c3bc2513838e9df5ecad" ON "pos_products" ("stock") `);
        await queryRunner.query(`CREATE INDEX "IDX_d40ef8583255ebc800f1f3502e" ON "pos_products" ("category_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a9b2f2f77d3ded5bec7b94791" ON "pos_products" ("supplier_name") `);
        await queryRunner.query(`DROP INDEX "IDX_16f93c1ce5b61e7ec7b74f5225"`);
        await queryRunner.query(`DROP INDEX "IDX_261e069f0d53506c90c449bb97"`);
        await queryRunner.query(`DROP INDEX "IDX_c94cba9c28b82de9f08b3dc0af"`);
        await queryRunner.query(`DROP INDEX "IDX_d751e592062326fca40eacc7dc"`);
        await queryRunner.query(`DROP INDEX "IDX_2dcead3cbafc2412413cfcb8a8"`);
        await queryRunner.query(`DROP INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0"`);
        await queryRunner.query(`DROP INDEX "IDX_6c1adb6efbbd96f93a15fa6031"`);
        await queryRunner.query(`ALTER TABLE "pos_sync_data" RENAME TO "temporary_pos_sync_data"`);
        await queryRunner.query(`CREATE TABLE "pos_sync_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entityType" varchar NOT NULL, "entityId" integer NOT NULL, "syncType" varchar NOT NULL DEFAULT ('auto'), "syncDirection" varchar NOT NULL DEFAULT ('inbound'), "status" varchar NOT NULL DEFAULT ('pending'), "itemsProcessed" integer NOT NULL DEFAULT (0), "itemsSucceeded" integer NOT NULL DEFAULT (0), "itemsFailed" integer NOT NULL DEFAULT (0), "startedAt" datetime, "completedAt" datetime, "lastSyncedAt" datetime, "payload" text, "errorMessage" text, "retryCount" integer NOT NULL DEFAULT (0), "nextRetryAt" datetime, "performedById" varchar, "performedByUsername" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "pos_sync_data"("id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt") SELECT "id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt" FROM "temporary_pos_sync_data"`);
        await queryRunner.query(`DROP TABLE "temporary_pos_sync_data"`);
        await queryRunner.query(`CREATE INDEX "IDX_16f93c1ce5b61e7ec7b74f5225" ON "pos_sync_data" ("entityType", "entityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_261e069f0d53506c90c449bb97" ON "pos_sync_data" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c94cba9c28b82de9f08b3dc0af" ON "pos_sync_data" ("syncDirection") `);
        await queryRunner.query(`CREATE INDEX "IDX_d751e592062326fca40eacc7dc" ON "pos_sync_data" ("syncType") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dcead3cbafc2412413cfcb8a8" ON "pos_sync_data" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0" ON "pos_sync_data" ("completedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_6c1adb6efbbd96f93a15fa6031" ON "pos_sync_data" ("performedById") `);
        await queryRunner.query(`DROP INDEX "IDX_c73940c1ca00c65ae334c2f4a5"`);
        await queryRunner.query(`DROP INDEX "IDX_849fb700ab21aa6f03a5cfe29f"`);
        await queryRunner.query(`DROP INDEX "IDX_246696159bea962ad89957763d"`);
        await queryRunner.query(`DROP INDEX "IDX_9c586a93dd02521c448b062df9"`);
        await queryRunner.query(`DROP INDEX "IDX_51026a47ea78d0b6c5d57246a3"`);
        await queryRunner.query(`DROP INDEX "IDX_b9dbc3cf2f94af2903c2eda41c"`);
        await queryRunner.query(`DROP INDEX "IDX_182c40c3bc2513838e9df5ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_d40ef8583255ebc800f1f3502e"`);
        await queryRunner.query(`DROP INDEX "IDX_8a9b2f2f77d3ded5bec7b94791"`);
        await queryRunner.query(`ALTER TABLE "pos_products" RENAME TO "temporary_pos_products"`);
        await queryRunner.query(`CREATE TABLE "pos_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT (0), "min_stock" integer NOT NULL DEFAULT (0), "stock_item_id" varchar, "category_name" varchar, "supplier_name" varchar, "barcode" varchar, "description" text, "cost_price" integer, "is_active" boolean NOT NULL DEFAULT (1), "reorder_quantity" integer NOT NULL DEFAULT (0), "last_reorder_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "is_deleted" boolean NOT NULL DEFAULT (0), "last_price_change" datetime, "original_price" integer, "parent_product_id" integer, CONSTRAINT "UQ_9c586a93dd02521c448b062df97" UNIQUE ("barcode"), CONSTRAINT "UQ_c73940c1ca00c65ae334c2f4a56" UNIQUE ("sku"), CONSTRAINT "FK_29ae22b048be608093f3ab6242a" FOREIGN KEY ("parent_product_id") REFERENCES "pos_products" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "pos_products"("id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id") SELECT "id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id" FROM "temporary_pos_products"`);
        await queryRunner.query(`DROP TABLE "temporary_pos_products"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c73940c1ca00c65ae334c2f4a5" ON "pos_products" ("sku") `);
        await queryRunner.query(`CREATE INDEX "IDX_849fb700ab21aa6f03a5cfe29f" ON "pos_products" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_246696159bea962ad89957763d" ON "pos_products" ("stock_item_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c586a93dd02521c448b062df9" ON "pos_products" ("barcode") `);
        await queryRunner.query(`CREATE INDEX "IDX_51026a47ea78d0b6c5d57246a3" ON "pos_products" ("is_active") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9dbc3cf2f94af2903c2eda41c" ON "pos_products" ("is_deleted") `);
        await queryRunner.query(`CREATE INDEX "IDX_182c40c3bc2513838e9df5ecad" ON "pos_products" ("stock") `);
        await queryRunner.query(`CREATE INDEX "IDX_d40ef8583255ebc800f1f3502e" ON "pos_products" ("category_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a9b2f2f77d3ded5bec7b94791" ON "pos_products" ("supplier_name") `);
        await queryRunner.query(`DROP INDEX "IDX_16f93c1ce5b61e7ec7b74f5225"`);
        await queryRunner.query(`DROP INDEX "IDX_261e069f0d53506c90c449bb97"`);
        await queryRunner.query(`DROP INDEX "IDX_c94cba9c28b82de9f08b3dc0af"`);
        await queryRunner.query(`DROP INDEX "IDX_d751e592062326fca40eacc7dc"`);
        await queryRunner.query(`DROP INDEX "IDX_2dcead3cbafc2412413cfcb8a8"`);
        await queryRunner.query(`DROP INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0"`);
        await queryRunner.query(`DROP INDEX "IDX_6c1adb6efbbd96f93a15fa6031"`);
        await queryRunner.query(`ALTER TABLE "pos_sync_data" RENAME TO "temporary_pos_sync_data"`);
        await queryRunner.query(`CREATE TABLE "pos_sync_data" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "entityType" varchar NOT NULL, "entityId" integer NOT NULL, "syncType" varchar NOT NULL DEFAULT ('auto'), "syncDirection" varchar NOT NULL DEFAULT ('inbound'), "status" varchar NOT NULL DEFAULT ('pending'), "itemsProcessed" integer NOT NULL DEFAULT (0), "itemsSucceeded" integer NOT NULL DEFAULT (0), "itemsFailed" integer NOT NULL DEFAULT (0), "startedAt" datetime, "completedAt" datetime, "lastSyncedAt" datetime, "payload" text, "errorMessage" text, "retryCount" integer NOT NULL DEFAULT (0), "nextRetryAt" datetime, "performedById" varchar, "performedByUsername" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_10e34fc821b0f52f7ad6a4d95e6" FOREIGN KEY ("entityId") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_10e34fc821b0f52f7ad6a4d95e6" FOREIGN KEY ("entityId") REFERENCES "pos_products" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "pos_sync_data"("id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt") SELECT "id", "entityType", "entityId", "syncType", "syncDirection", "status", "itemsProcessed", "itemsSucceeded", "itemsFailed", "startedAt", "completedAt", "lastSyncedAt", "payload", "errorMessage", "retryCount", "nextRetryAt", "performedById", "performedByUsername", "createdAt", "updatedAt" FROM "temporary_pos_sync_data"`);
        await queryRunner.query(`DROP TABLE "temporary_pos_sync_data"`);
        await queryRunner.query(`CREATE INDEX "IDX_16f93c1ce5b61e7ec7b74f5225" ON "pos_sync_data" ("entityType", "entityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_261e069f0d53506c90c449bb97" ON "pos_sync_data" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c94cba9c28b82de9f08b3dc0af" ON "pos_sync_data" ("syncDirection") `);
        await queryRunner.query(`CREATE INDEX "IDX_d751e592062326fca40eacc7dc" ON "pos_sync_data" ("syncType") `);
        await queryRunner.query(`CREATE INDEX "IDX_2dcead3cbafc2412413cfcb8a8" ON "pos_sync_data" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfbe1b4bf4f56f61199c52f5c0" ON "pos_sync_data" ("completedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_6c1adb6efbbd96f93a15fa6031" ON "pos_sync_data" ("performedById") `);
    }
}
