/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1771756476658 {
    name = 'InitSchema1771756476658'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "idx_notifications_user_read"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_created"`);
        await queryRunner.query(`CREATE TABLE "temporary_notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "title" varchar(255) NOT NULL, "message" text NOT NULL, "type" varchar CHECK( "type" IN ('info','success','warning','error','purchase','sale') ) NOT NULL DEFAULT ('info'), "isRead" boolean NOT NULL DEFAULT (0), "metadata" text, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_notifications"("id", "userId", "title", "message", "type", "isRead", "metadata", "createdAt", "updatedAt") SELECT "id", "userId", "title", "message", "type", "isRead", "metadata", "createdAt", "updatedAt" FROM "notifications"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`ALTER TABLE "temporary_notifications" RENAME TO "notifications"`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_read" ON "notifications" ("userId", "isRead") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_created" ON "notifications" ("createdAt") `);
        await queryRunner.query(`CREATE TABLE "temporary_sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('initiated','paid','refunded','voided') ) NOT NULL DEFAULT ('initiated'), "paymentMethod" varchar CHECK( "paymentMethod" IN ('cash','card','wallet') ) NOT NULL DEFAULT ('cash'), "totalAmount" real NOT NULL DEFAULT (0), "usedLoyalty" boolean NOT NULL DEFAULT (0), "loyaltyRedeemed" integer NOT NULL DEFAULT (0), "usedDiscount" boolean NOT NULL DEFAULT (0), "totalDiscount" real NOT NULL DEFAULT (0), "usedVoucher" boolean NOT NULL DEFAULT (0), "voucherCode" text, "pointsEarn" real NOT NULL DEFAULT (0), "notes" text, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "customerId" integer, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales"("id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "pointsEarn", "notes", "createdAt", "updatedAt", "customerId") SELECT "id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "pointsEarn", "notes", "createdAt", "updatedAt", "customerId" FROM "sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales" RENAME TO "sales"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_user_read"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_created"`);
        await queryRunner.query(`CREATE TABLE "temporary_notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer, "title" varchar(255) NOT NULL, "message" text NOT NULL, "type" varchar CHECK( "type" IN ('info','success','warning','error','purchase','sale') ) NOT NULL DEFAULT ('info'), "isRead" boolean NOT NULL DEFAULT (0), "metadata" text, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "temporary_notifications"("id", "userId", "title", "message", "type", "isRead", "metadata", "createdAt", "updatedAt") SELECT "id", "userId", "title", "message", "type", "isRead", "metadata", "createdAt", "updatedAt" FROM "notifications"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`ALTER TABLE "temporary_notifications" RENAME TO "notifications"`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_created" ON "notifications" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_read" ON "notifications" ("userId", "isRead") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "idx_notifications_user_read"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_created"`);
        await queryRunner.query(`ALTER TABLE "notifications" RENAME TO "temporary_notifications"`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "title" varchar(255) NOT NULL, "message" text NOT NULL, "type" varchar CHECK( "type" IN ('info','success','warning','error','purchase','sale') ) NOT NULL DEFAULT ('info'), "isRead" boolean NOT NULL DEFAULT (0), "metadata" text, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "notifications"("id", "userId", "title", "message", "type", "isRead", "metadata", "createdAt", "updatedAt") SELECT "id", "userId", "title", "message", "type", "isRead", "metadata", "createdAt", "updatedAt" FROM "temporary_notifications"`);
        await queryRunner.query(`DROP TABLE "temporary_notifications"`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_created" ON "notifications" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_read" ON "notifications" ("userId", "isRead") `);
        await queryRunner.query(`ALTER TABLE "sales" RENAME TO "temporary_sales"`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('initiated','paid','refunded','voided') ) NOT NULL DEFAULT ('initiated'), "paymentMethod" varchar CHECK( "paymentMethod" IN ('cash','card','wallet') ) NOT NULL DEFAULT ('cash'), "totalAmount" real NOT NULL DEFAULT (0), "usedLoyalty" boolean NOT NULL DEFAULT (0), "loyaltyRedeemed" integer NOT NULL DEFAULT (0), "usedDiscount" boolean NOT NULL DEFAULT (0), "totalDiscount" real NOT NULL DEFAULT (0), "usedVoucher" boolean NOT NULL DEFAULT (0), "voucherCode" text, "pointsEarn" real NOT NULL DEFAULT (0), "notes" text, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "customerId" integer, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "sales"("id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "pointsEarn", "notes", "createdAt", "updatedAt", "customerId") SELECT "id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "pointsEarn", "notes", "createdAt", "updatedAt", "customerId" FROM "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "temporary_sales"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_created"`);
        await queryRunner.query(`DROP INDEX "idx_notifications_user_read"`);
        await queryRunner.query(`ALTER TABLE "notifications" RENAME TO "temporary_notifications"`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "title" varchar(255) NOT NULL, "message" text NOT NULL, "type" varchar CHECK( "type" IN ('info','success','warning','error','purchase','sale') ) NOT NULL DEFAULT ('info'), "isRead" boolean NOT NULL DEFAULT (0), "metadata" text, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "notifications"("id", "userId", "title", "message", "type", "isRead", "metadata", "createdAt", "updatedAt") SELECT "id", "userId", "title", "message", "type", "isRead", "metadata", "createdAt", "updatedAt" FROM "temporary_notifications"`);
        await queryRunner.query(`DROP TABLE "temporary_notifications"`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_created" ON "notifications" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_read" ON "notifications" ("userId", "isRead") `);
    }
}
