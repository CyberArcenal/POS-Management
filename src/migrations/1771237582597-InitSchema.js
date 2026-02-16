/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1771237582597 {
    name = 'InitSchema1771237582597'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "categories" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" varchar, "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime)`);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "recipient_email" varchar NOT NULL, "subject" varchar, "payload" text, "status" varchar(20) NOT NULL DEFAULT ('queued'), "error_message" text, "retry_count" integer NOT NULL DEFAULT (0), "resend_count" integer NOT NULL DEFAULT (0), "sent_at" datetime, "last_error_at" datetime, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "IDX_notification_status" ON "notification_logs" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_notification_recipient" ON "notification_logs" ("recipient_email") `);
        await queryRunner.query(`CREATE INDEX "IDX_notification_status_created" ON "notification_logs" ("status", "created_at") `);
        await queryRunner.query(`CREATE TABLE "purchases" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "referenceNo" varchar NOT NULL, "orderDate" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('pending','completed','cacelled') ) NOT NULL DEFAULT ('pending'), "totalAmount" decimal NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "supplierId" integer)`);
        await queryRunner.query(`CREATE TABLE "purchase_items" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL, "unitPrice" decimal NOT NULL, "subtotal" decimal NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "purchaseId" integer, "productId" integer)`);
        await queryRunner.query(`CREATE TABLE "return_refunds" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "referenceNo" varchar NOT NULL, "reason" varchar, "refundMethod" varchar NOT NULL, "totalAmount" decimal NOT NULL DEFAULT (0), "status" varchar CHECK( "status" IN ('processed','pending','cancelled') ) NOT NULL DEFAULT ('processed'), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "saleId" integer, "customerId" integer, CONSTRAINT "UQ_c6ae8a21cd5e6958819540e7b46" UNIQUE ("referenceNo"))`);
        await queryRunner.query(`CREATE TABLE "return_refund_items" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL, "unitPrice" decimal NOT NULL, "subtotal" decimal NOT NULL, "reason" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "returnRefundId" integer, "productId" integer)`);
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "contactInfo" varchar, "address" varchar, "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime)`);
        await queryRunner.query(`CREATE TABLE "temporary_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "description" varchar, "price" decimal NOT NULL, "stockQty" integer NOT NULL DEFAULT (0), "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "reorderLevel" integer NOT NULL DEFAULT (0), "reorderQty" integer NOT NULL DEFAULT (0), "categoryId" integer, "supplierId" integer)`);
        await queryRunner.query(`INSERT INTO "temporary_products"("id", "sku", "name", "description", "price", "stockQty", "isActive", "createdAt", "updatedAt") SELECT "id", "sku", "name", "description", "price", "stockQty", "isActive", "createdAt", "updatedAt" FROM "products"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`ALTER TABLE "temporary_products" RENAME TO "products"`);
        await queryRunner.query(`CREATE TABLE "temporary_products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "description" varchar, "price" decimal NOT NULL, "stockQty" integer NOT NULL DEFAULT (0), "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "reorderLevel" integer NOT NULL DEFAULT (0), "reorderQty" integer NOT NULL DEFAULT (0), "categoryId" integer, "supplierId" integer, CONSTRAINT "FK_ff56834e735fa78a15d0cf21926" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_c143cbc0299e1f9220c4b5debd8" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_products"("id", "sku", "name", "description", "price", "stockQty", "isActive", "createdAt", "updatedAt", "reorderLevel", "reorderQty", "categoryId", "supplierId") SELECT "id", "sku", "name", "description", "price", "stockQty", "isActive", "createdAt", "updatedAt", "reorderLevel", "reorderQty", "categoryId", "supplierId" FROM "products"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`ALTER TABLE "temporary_products" RENAME TO "products"`);
        await queryRunner.query(`CREATE TABLE "temporary_purchases" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "referenceNo" varchar NOT NULL, "orderDate" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('pending','completed','cacelled') ) NOT NULL DEFAULT ('pending'), "totalAmount" decimal NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "supplierId" integer, CONSTRAINT "FK_77980c752fdeb3689e318fde424" FOREIGN KEY ("supplierId") REFERENCES "suppliers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_purchases"("id", "referenceNo", "orderDate", "status", "totalAmount", "createdAt", "updatedAt", "supplierId") SELECT "id", "referenceNo", "orderDate", "status", "totalAmount", "createdAt", "updatedAt", "supplierId" FROM "purchases"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`ALTER TABLE "temporary_purchases" RENAME TO "purchases"`);
        await queryRunner.query(`CREATE TABLE "temporary_purchase_items" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL, "unitPrice" decimal NOT NULL, "subtotal" decimal NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "purchaseId" integer, "productId" integer, CONSTRAINT "FK_8bafbb5d45827a5d25f5cd3c6f3" FOREIGN KEY ("purchaseId") REFERENCES "purchases" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_5b31a541ce1fc1f428db518efa4" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_purchase_items"("id", "quantity", "unitPrice", "subtotal", "createdAt", "purchaseId", "productId") SELECT "id", "quantity", "unitPrice", "subtotal", "createdAt", "purchaseId", "productId" FROM "purchase_items"`);
        await queryRunner.query(`DROP TABLE "purchase_items"`);
        await queryRunner.query(`ALTER TABLE "temporary_purchase_items" RENAME TO "purchase_items"`);
        await queryRunner.query(`CREATE TABLE "temporary_return_refunds" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "referenceNo" varchar NOT NULL, "reason" varchar, "refundMethod" varchar NOT NULL, "totalAmount" decimal NOT NULL DEFAULT (0), "status" varchar CHECK( "status" IN ('processed','pending','cancelled') ) NOT NULL DEFAULT ('processed'), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "saleId" integer, "customerId" integer, CONSTRAINT "UQ_c6ae8a21cd5e6958819540e7b46" UNIQUE ("referenceNo"), CONSTRAINT "FK_945556a9c8242f21ccace3873aa" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_3512958c9740459e0da88a814ca" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_return_refunds"("id", "referenceNo", "reason", "refundMethod", "totalAmount", "status", "createdAt", "updatedAt", "saleId", "customerId") SELECT "id", "referenceNo", "reason", "refundMethod", "totalAmount", "status", "createdAt", "updatedAt", "saleId", "customerId" FROM "return_refunds"`);
        await queryRunner.query(`DROP TABLE "return_refunds"`);
        await queryRunner.query(`ALTER TABLE "temporary_return_refunds" RENAME TO "return_refunds"`);
        await queryRunner.query(`CREATE TABLE "temporary_return_refund_items" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL, "unitPrice" decimal NOT NULL, "subtotal" decimal NOT NULL, "reason" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "returnRefundId" integer, "productId" integer, CONSTRAINT "FK_a35d0ba51c2a19393872844a225" FOREIGN KEY ("returnRefundId") REFERENCES "return_refunds" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_b18ebdb3b2f41793f702769f277" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_return_refund_items"("id", "quantity", "unitPrice", "subtotal", "reason", "createdAt", "returnRefundId", "productId") SELECT "id", "quantity", "unitPrice", "subtotal", "reason", "createdAt", "returnRefundId", "productId" FROM "return_refund_items"`);
        await queryRunner.query(`DROP TABLE "return_refund_items"`);
        await queryRunner.query(`ALTER TABLE "temporary_return_refund_items" RENAME TO "return_refund_items"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "return_refund_items" RENAME TO "temporary_return_refund_items"`);
        await queryRunner.query(`CREATE TABLE "return_refund_items" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL, "unitPrice" decimal NOT NULL, "subtotal" decimal NOT NULL, "reason" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "returnRefundId" integer, "productId" integer)`);
        await queryRunner.query(`INSERT INTO "return_refund_items"("id", "quantity", "unitPrice", "subtotal", "reason", "createdAt", "returnRefundId", "productId") SELECT "id", "quantity", "unitPrice", "subtotal", "reason", "createdAt", "returnRefundId", "productId" FROM "temporary_return_refund_items"`);
        await queryRunner.query(`DROP TABLE "temporary_return_refund_items"`);
        await queryRunner.query(`ALTER TABLE "return_refunds" RENAME TO "temporary_return_refunds"`);
        await queryRunner.query(`CREATE TABLE "return_refunds" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "referenceNo" varchar NOT NULL, "reason" varchar, "refundMethod" varchar NOT NULL, "totalAmount" decimal NOT NULL DEFAULT (0), "status" varchar CHECK( "status" IN ('processed','pending','cancelled') ) NOT NULL DEFAULT ('processed'), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "saleId" integer, "customerId" integer, CONSTRAINT "UQ_c6ae8a21cd5e6958819540e7b46" UNIQUE ("referenceNo"))`);
        await queryRunner.query(`INSERT INTO "return_refunds"("id", "referenceNo", "reason", "refundMethod", "totalAmount", "status", "createdAt", "updatedAt", "saleId", "customerId") SELECT "id", "referenceNo", "reason", "refundMethod", "totalAmount", "status", "createdAt", "updatedAt", "saleId", "customerId" FROM "temporary_return_refunds"`);
        await queryRunner.query(`DROP TABLE "temporary_return_refunds"`);
        await queryRunner.query(`ALTER TABLE "purchase_items" RENAME TO "temporary_purchase_items"`);
        await queryRunner.query(`CREATE TABLE "purchase_items" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "quantity" integer NOT NULL, "unitPrice" decimal NOT NULL, "subtotal" decimal NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "purchaseId" integer, "productId" integer)`);
        await queryRunner.query(`INSERT INTO "purchase_items"("id", "quantity", "unitPrice", "subtotal", "createdAt", "purchaseId", "productId") SELECT "id", "quantity", "unitPrice", "subtotal", "createdAt", "purchaseId", "productId" FROM "temporary_purchase_items"`);
        await queryRunner.query(`DROP TABLE "temporary_purchase_items"`);
        await queryRunner.query(`ALTER TABLE "purchases" RENAME TO "temporary_purchases"`);
        await queryRunner.query(`CREATE TABLE "purchases" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "referenceNo" varchar NOT NULL, "orderDate" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('pending','completed','cacelled') ) NOT NULL DEFAULT ('pending'), "totalAmount" decimal NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "supplierId" integer)`);
        await queryRunner.query(`INSERT INTO "purchases"("id", "referenceNo", "orderDate", "status", "totalAmount", "createdAt", "updatedAt", "supplierId") SELECT "id", "referenceNo", "orderDate", "status", "totalAmount", "createdAt", "updatedAt", "supplierId" FROM "temporary_purchases"`);
        await queryRunner.query(`DROP TABLE "temporary_purchases"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME TO "temporary_products"`);
        await queryRunner.query(`CREATE TABLE "products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "description" varchar, "price" decimal NOT NULL, "stockQty" integer NOT NULL DEFAULT (0), "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "reorderLevel" integer NOT NULL DEFAULT (0), "reorderQty" integer NOT NULL DEFAULT (0), "categoryId" integer, "supplierId" integer)`);
        await queryRunner.query(`INSERT INTO "products"("id", "sku", "name", "description", "price", "stockQty", "isActive", "createdAt", "updatedAt", "reorderLevel", "reorderQty", "categoryId", "supplierId") SELECT "id", "sku", "name", "description", "price", "stockQty", "isActive", "createdAt", "updatedAt", "reorderLevel", "reorderQty", "categoryId", "supplierId" FROM "temporary_products"`);
        await queryRunner.query(`DROP TABLE "temporary_products"`);
        await queryRunner.query(`ALTER TABLE "products" RENAME TO "temporary_products"`);
        await queryRunner.query(`CREATE TABLE "products" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "sku" varchar NOT NULL, "name" varchar NOT NULL, "description" varchar, "price" decimal NOT NULL, "stockQty" integer NOT NULL DEFAULT (0), "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "products"("id", "sku", "name", "description", "price", "stockQty", "isActive", "createdAt", "updatedAt") SELECT "id", "sku", "name", "description", "price", "stockQty", "isActive", "createdAt", "updatedAt" FROM "temporary_products"`);
        await queryRunner.query(`DROP TABLE "temporary_products"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`DROP TABLE "return_refund_items"`);
        await queryRunner.query(`DROP TABLE "return_refunds"`);
        await queryRunner.query(`DROP TABLE "purchase_items"`);
        await queryRunner.query(`DROP TABLE "purchases"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_status_created"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_recipient"`);
        await queryRunner.query(`DROP INDEX "IDX_notification_status"`);
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }
}
