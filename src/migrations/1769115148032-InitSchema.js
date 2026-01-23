/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1769115148032 {
    name = 'InitSchema1769115148032'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_3ed645824628b3afd63547ee15"`);
        await queryRunner.query(`DROP INDEX "IDX_29ae22b048be608093f3ab6242"`);
        await queryRunner.query(`DROP INDEX "IDX_c1106c1915ed1f62fb60089f56"`);
        await queryRunner.query(`DROP INDEX "IDX_1329766ac63d8fc7762f9950a7"`);
        await queryRunner.query(`DROP INDEX "IDX_fc223018cc3de95a49abcf72e9"`);
        await queryRunner.query(`DROP INDEX "IDX_8a9b2f2f77d3ded5bec7b94791"`);
        await queryRunner.query(`DROP INDEX "IDX_d40ef8583255ebc800f1f3502e"`);
        await queryRunner.query(`DROP INDEX "IDX_182c40c3bc2513838e9df5ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_b9dbc3cf2f94af2903c2eda41c"`);
        await queryRunner.query(`DROP INDEX "IDX_51026a47ea78d0b6c5d57246a3"`);
        await queryRunner.query(`DROP INDEX "IDX_9c586a93dd02521c448b062df9"`);
        await queryRunner.query(`DROP INDEX "IDX_246696159bea962ad89957763d"`);
        await queryRunner.query(`DROP INDEX "IDX_849fb700ab21aa6f03a5cfe29f"`);
        await queryRunner.query(`DROP INDEX "IDX_c73940c1ca00c65ae334c2f4a5"`);
        await queryRunner.query(`CREATE TABLE "temporary_pos_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT (0), "min_stock" integer NOT NULL DEFAULT (0), "stock_item_id" varchar, "category_name" varchar, "supplier_name" varchar, "barcode" varchar, "description" text, "cost_price" integer, "is_active" boolean NOT NULL DEFAULT (1), "reorder_quantity" integer NOT NULL DEFAULT (0), "last_reorder_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "is_deleted" boolean NOT NULL DEFAULT (0), "last_price_change" datetime, "original_price" integer, "parent_product_id" varchar, "sync_id" varchar, "warehouse_id" varchar, "warehouse_name" varchar, "is_variant" boolean NOT NULL DEFAULT (0), "variant_name" varchar, "item_type" varchar DEFAULT ('product'), "sync_status" varchar NOT NULL DEFAULT ('synced'), "last_sync_at" datetime, CONSTRAINT "UQ_0eadef354ccad0642046e8ca5cc" UNIQUE ("sync_id"), CONSTRAINT "UQ_9c586a93dd02521c448b062df97" UNIQUE ("barcode"), CONSTRAINT "UQ_c73940c1ca00c65ae334c2f4a56" UNIQUE ("sku"), CONSTRAINT "UQ_379500a11ca85932df21f0d037a" UNIQUE ("stock_item_id"))`);
        await queryRunner.query(`INSERT INTO "temporary_pos_products"("id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id", "sync_id", "warehouse_id", "warehouse_name", "is_variant", "variant_name", "item_type", "sync_status", "last_sync_at") SELECT "id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id", "sync_id", "warehouse_id", "warehouse_name", "is_variant", "variant_name", "item_type", "sync_status", "last_sync_at" FROM "pos_products"`);
        await queryRunner.query(`DROP TABLE "pos_products"`);
        await queryRunner.query(`ALTER TABLE "temporary_pos_products" RENAME TO "pos_products"`);
        await queryRunner.query(`CREATE INDEX "IDX_3ed645824628b3afd63547ee15" ON "pos_products" ("warehouse_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_29ae22b048be608093f3ab6242" ON "pos_products" ("parent_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1106c1915ed1f62fb60089f56" ON "pos_products" ("is_variant") `);
        await queryRunner.query(`CREATE INDEX "IDX_1329766ac63d8fc7762f9950a7" ON "pos_products" ("sync_status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fc223018cc3de95a49abcf72e9" ON "pos_products" ("sync_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a9b2f2f77d3ded5bec7b94791" ON "pos_products" ("supplier_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_d40ef8583255ebc800f1f3502e" ON "pos_products" ("category_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_182c40c3bc2513838e9df5ecad" ON "pos_products" ("stock") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9dbc3cf2f94af2903c2eda41c" ON "pos_products" ("is_deleted") `);
        await queryRunner.query(`CREATE INDEX "IDX_51026a47ea78d0b6c5d57246a3" ON "pos_products" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c586a93dd02521c448b062df9" ON "pos_products" ("barcode") `);
        await queryRunner.query(`CREATE INDEX "IDX_246696159bea962ad89957763d" ON "pos_products" ("stock_item_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_849fb700ab21aa6f03a5cfe29f" ON "pos_products" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c73940c1ca00c65ae334c2f4a5" ON "pos_products" ("sku") `);
        await queryRunner.query(`DROP INDEX "IDX_3ed645824628b3afd63547ee15"`);
        await queryRunner.query(`DROP INDEX "IDX_29ae22b048be608093f3ab6242"`);
        await queryRunner.query(`DROP INDEX "IDX_c1106c1915ed1f62fb60089f56"`);
        await queryRunner.query(`DROP INDEX "IDX_1329766ac63d8fc7762f9950a7"`);
        await queryRunner.query(`DROP INDEX "IDX_fc223018cc3de95a49abcf72e9"`);
        await queryRunner.query(`DROP INDEX "IDX_8a9b2f2f77d3ded5bec7b94791"`);
        await queryRunner.query(`DROP INDEX "IDX_d40ef8583255ebc800f1f3502e"`);
        await queryRunner.query(`DROP INDEX "IDX_182c40c3bc2513838e9df5ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_b9dbc3cf2f94af2903c2eda41c"`);
        await queryRunner.query(`DROP INDEX "IDX_51026a47ea78d0b6c5d57246a3"`);
        await queryRunner.query(`DROP INDEX "IDX_9c586a93dd02521c448b062df9"`);
        await queryRunner.query(`DROP INDEX "IDX_246696159bea962ad89957763d"`);
        await queryRunner.query(`DROP INDEX "IDX_849fb700ab21aa6f03a5cfe29f"`);
        await queryRunner.query(`DROP INDEX "IDX_c73940c1ca00c65ae334c2f4a5"`);
        await queryRunner.query(`CREATE TABLE "temporary_pos_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT (0), "min_stock" integer NOT NULL DEFAULT (0), "stock_item_id" varchar, "category_name" varchar, "supplier_name" varchar, "barcode" varchar, "description" text, "cost_price" integer, "is_active" boolean NOT NULL DEFAULT (1), "reorder_quantity" integer NOT NULL DEFAULT (0), "last_reorder_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "is_deleted" boolean NOT NULL DEFAULT (0), "last_price_change" datetime, "original_price" integer, "parent_product_id" varchar, "sync_id" varchar, "warehouse_id" varchar, "warehouse_name" varchar, "is_variant" boolean NOT NULL DEFAULT (0), "variant_name" varchar, "item_type" varchar DEFAULT ('product'), "sync_status" varchar NOT NULL DEFAULT ('synced'), "last_sync_at" datetime, CONSTRAINT "UQ_0eadef354ccad0642046e8ca5cc" UNIQUE ("sync_id"), CONSTRAINT "UQ_9c586a93dd02521c448b062df97" UNIQUE ("barcode"), CONSTRAINT "UQ_c73940c1ca00c65ae334c2f4a56" UNIQUE ("sku"), CONSTRAINT "UQ_379500a11ca85932df21f0d037a" UNIQUE ("stock_item_id"))`);
        await queryRunner.query(`INSERT INTO "temporary_pos_products"("id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id", "sync_id", "warehouse_id", "warehouse_name", "is_variant", "variant_name", "item_type", "sync_status", "last_sync_at") SELECT "id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id", "sync_id", "warehouse_id", "warehouse_name", "is_variant", "variant_name", "item_type", "sync_status", "last_sync_at" FROM "pos_products"`);
        await queryRunner.query(`DROP TABLE "pos_products"`);
        await queryRunner.query(`ALTER TABLE "temporary_pos_products" RENAME TO "pos_products"`);
        await queryRunner.query(`CREATE INDEX "IDX_3ed645824628b3afd63547ee15" ON "pos_products" ("warehouse_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_29ae22b048be608093f3ab6242" ON "pos_products" ("parent_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1106c1915ed1f62fb60089f56" ON "pos_products" ("is_variant") `);
        await queryRunner.query(`CREATE INDEX "IDX_1329766ac63d8fc7762f9950a7" ON "pos_products" ("sync_status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fc223018cc3de95a49abcf72e9" ON "pos_products" ("sync_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8a9b2f2f77d3ded5bec7b94791" ON "pos_products" ("supplier_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_d40ef8583255ebc800f1f3502e" ON "pos_products" ("category_name") `);
        await queryRunner.query(`CREATE INDEX "IDX_182c40c3bc2513838e9df5ecad" ON "pos_products" ("stock") `);
        await queryRunner.query(`CREATE INDEX "IDX_b9dbc3cf2f94af2903c2eda41c" ON "pos_products" ("is_deleted") `);
        await queryRunner.query(`CREATE INDEX "IDX_51026a47ea78d0b6c5d57246a3" ON "pos_products" ("is_active") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9c586a93dd02521c448b062df9" ON "pos_products" ("barcode") `);
        await queryRunner.query(`CREATE INDEX "IDX_246696159bea962ad89957763d" ON "pos_products" ("stock_item_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_849fb700ab21aa6f03a5cfe29f" ON "pos_products" ("name") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c73940c1ca00c65ae334c2f4a5" ON "pos_products" ("sku") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_c73940c1ca00c65ae334c2f4a5"`);
        await queryRunner.query(`DROP INDEX "IDX_849fb700ab21aa6f03a5cfe29f"`);
        await queryRunner.query(`DROP INDEX "IDX_246696159bea962ad89957763d"`);
        await queryRunner.query(`DROP INDEX "IDX_9c586a93dd02521c448b062df9"`);
        await queryRunner.query(`DROP INDEX "IDX_51026a47ea78d0b6c5d57246a3"`);
        await queryRunner.query(`DROP INDEX "IDX_b9dbc3cf2f94af2903c2eda41c"`);
        await queryRunner.query(`DROP INDEX "IDX_182c40c3bc2513838e9df5ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_d40ef8583255ebc800f1f3502e"`);
        await queryRunner.query(`DROP INDEX "IDX_8a9b2f2f77d3ded5bec7b94791"`);
        await queryRunner.query(`DROP INDEX "IDX_fc223018cc3de95a49abcf72e9"`);
        await queryRunner.query(`DROP INDEX "IDX_1329766ac63d8fc7762f9950a7"`);
        await queryRunner.query(`DROP INDEX "IDX_c1106c1915ed1f62fb60089f56"`);
        await queryRunner.query(`DROP INDEX "IDX_29ae22b048be608093f3ab6242"`);
        await queryRunner.query(`DROP INDEX "IDX_3ed645824628b3afd63547ee15"`);
        await queryRunner.query(`ALTER TABLE "pos_products" RENAME TO "temporary_pos_products"`);
        await queryRunner.query(`CREATE TABLE "pos_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT (0), "min_stock" integer NOT NULL DEFAULT (0), "stock_item_id" varchar, "category_name" varchar, "supplier_name" varchar, "barcode" varchar, "description" text, "cost_price" integer, "is_active" boolean NOT NULL DEFAULT (1), "reorder_quantity" integer NOT NULL DEFAULT (0), "last_reorder_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "is_deleted" boolean NOT NULL DEFAULT (0), "last_price_change" datetime, "original_price" integer, "parent_product_id" varchar, "sync_id" varchar, "warehouse_id" varchar, "warehouse_name" varchar, "is_variant" boolean NOT NULL DEFAULT (0), "variant_name" varchar, "item_type" varchar DEFAULT ('product'), "sync_status" varchar NOT NULL DEFAULT ('synced'), "last_sync_at" datetime, CONSTRAINT "UQ_0eadef354ccad0642046e8ca5cc" UNIQUE ("sync_id"), CONSTRAINT "UQ_9c586a93dd02521c448b062df97" UNIQUE ("barcode"), CONSTRAINT "UQ_c73940c1ca00c65ae334c2f4a56" UNIQUE ("sku"), CONSTRAINT "UQ_379500a11ca85932df21f0d037a" UNIQUE ("stock_item_id"))`);
        await queryRunner.query(`INSERT INTO "pos_products"("id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id", "sync_id", "warehouse_id", "warehouse_name", "is_variant", "variant_name", "item_type", "sync_status", "last_sync_at") SELECT "id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id", "sync_id", "warehouse_id", "warehouse_name", "is_variant", "variant_name", "item_type", "sync_status", "last_sync_at" FROM "temporary_pos_products"`);
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
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fc223018cc3de95a49abcf72e9" ON "pos_products" ("sync_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1329766ac63d8fc7762f9950a7" ON "pos_products" ("sync_status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1106c1915ed1f62fb60089f56" ON "pos_products" ("is_variant") `);
        await queryRunner.query(`CREATE INDEX "IDX_29ae22b048be608093f3ab6242" ON "pos_products" ("parent_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ed645824628b3afd63547ee15" ON "pos_products" ("warehouse_id") `);
        await queryRunner.query(`DROP INDEX "IDX_c73940c1ca00c65ae334c2f4a5"`);
        await queryRunner.query(`DROP INDEX "IDX_849fb700ab21aa6f03a5cfe29f"`);
        await queryRunner.query(`DROP INDEX "IDX_246696159bea962ad89957763d"`);
        await queryRunner.query(`DROP INDEX "IDX_9c586a93dd02521c448b062df9"`);
        await queryRunner.query(`DROP INDEX "IDX_51026a47ea78d0b6c5d57246a3"`);
        await queryRunner.query(`DROP INDEX "IDX_b9dbc3cf2f94af2903c2eda41c"`);
        await queryRunner.query(`DROP INDEX "IDX_182c40c3bc2513838e9df5ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_d40ef8583255ebc800f1f3502e"`);
        await queryRunner.query(`DROP INDEX "IDX_8a9b2f2f77d3ded5bec7b94791"`);
        await queryRunner.query(`DROP INDEX "IDX_fc223018cc3de95a49abcf72e9"`);
        await queryRunner.query(`DROP INDEX "IDX_1329766ac63d8fc7762f9950a7"`);
        await queryRunner.query(`DROP INDEX "IDX_c1106c1915ed1f62fb60089f56"`);
        await queryRunner.query(`DROP INDEX "IDX_29ae22b048be608093f3ab6242"`);
        await queryRunner.query(`DROP INDEX "IDX_3ed645824628b3afd63547ee15"`);
        await queryRunner.query(`ALTER TABLE "pos_products" RENAME TO "temporary_pos_products"`);
        await queryRunner.query(`CREATE TABLE "pos_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "price" integer NOT NULL, "stock" integer NOT NULL DEFAULT (0), "min_stock" integer NOT NULL DEFAULT (0), "stock_item_id" varchar, "category_name" varchar, "supplier_name" varchar, "barcode" varchar, "description" text, "cost_price" integer, "is_active" boolean NOT NULL DEFAULT (1), "reorder_quantity" integer NOT NULL DEFAULT (0), "last_reorder_date" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), "is_deleted" boolean NOT NULL DEFAULT (0), "last_price_change" datetime, "original_price" integer, "parent_product_id" varchar, "sync_id" varchar, "warehouse_id" varchar, "warehouse_name" varchar, "is_variant" boolean NOT NULL DEFAULT (0), "variant_name" varchar, "item_type" varchar DEFAULT ('product'), "sync_status" varchar NOT NULL DEFAULT ('synced'), "last_sync_at" datetime, CONSTRAINT "UQ_0eadef354ccad0642046e8ca5cc" UNIQUE ("sync_id"), CONSTRAINT "UQ_9c586a93dd02521c448b062df97" UNIQUE ("barcode"), CONSTRAINT "UQ_c73940c1ca00c65ae334c2f4a56" UNIQUE ("sku"), CONSTRAINT "UQ_379500a11ca85932df21f0d037a" UNIQUE ("stock_item_id"))`);
        await queryRunner.query(`INSERT INTO "pos_products"("id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id", "sync_id", "warehouse_id", "warehouse_name", "is_variant", "variant_name", "item_type", "sync_status", "last_sync_at") SELECT "id", "sku", "name", "price", "stock", "min_stock", "stock_item_id", "category_name", "supplier_name", "barcode", "description", "cost_price", "is_active", "reorder_quantity", "last_reorder_date", "created_at", "updated_at", "is_deleted", "last_price_change", "original_price", "parent_product_id", "sync_id", "warehouse_id", "warehouse_name", "is_variant", "variant_name", "item_type", "sync_status", "last_sync_at" FROM "temporary_pos_products"`);
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
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fc223018cc3de95a49abcf72e9" ON "pos_products" ("sync_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_1329766ac63d8fc7762f9950a7" ON "pos_products" ("sync_status") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1106c1915ed1f62fb60089f56" ON "pos_products" ("is_variant") `);
        await queryRunner.query(`CREATE INDEX "IDX_29ae22b048be608093f3ab6242" ON "pos_products" ("parent_product_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ed645824628b3afd63547ee15" ON "pos_products" ("warehouse_id") `);
    }
}
