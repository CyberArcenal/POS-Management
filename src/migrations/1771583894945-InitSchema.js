/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1771583894945 {
    name = 'InitSchema1771583894945'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "temporary_sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('initiated','paid','refunded','voided') ) NOT NULL DEFAULT ('initiated'), "paymentMethod" varchar CHECK( "paymentMethod" IN ('cash','card','wallet') ) NOT NULL DEFAULT ('cash'), "totalAmount" decimal NOT NULL DEFAULT (0), "usedLoyalty" boolean NOT NULL DEFAULT (0), "loyaltyRedeemed" integer NOT NULL DEFAULT (0), "usedDiscount" boolean NOT NULL DEFAULT (0), "totalDiscount" integer NOT NULL DEFAULT (0), "usedVoucher" boolean NOT NULL DEFAULT (0), "voucherCode" varchar, "notes" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "customerId" integer, "pointsEarn" real NOT NULL DEFAULT (0), CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales"("id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "notes", "createdAt", "updatedAt", "customerId") SELECT "id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "notes", "createdAt", "updatedAt", "customerId" FROM "sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales" RENAME TO "sales"`);
        await queryRunner.query(`CREATE TABLE "temporary_sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('initiated','paid','refunded','voided') ) NOT NULL DEFAULT ('initiated'), "paymentMethod" varchar CHECK( "paymentMethod" IN ('cash','card','wallet') ) NOT NULL DEFAULT ('cash'), "totalAmount" real NOT NULL DEFAULT (0), "usedLoyalty" boolean NOT NULL DEFAULT (0), "loyaltyRedeemed" integer NOT NULL DEFAULT (0), "usedDiscount" boolean NOT NULL DEFAULT (0), "totalDiscount" real NOT NULL DEFAULT (0), "usedVoucher" boolean NOT NULL DEFAULT (0), "voucherCode" text, "notes" text, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "customerId" integer, "pointsEarn" real NOT NULL DEFAULT (0), CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_sales"("id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "notes", "createdAt", "updatedAt", "customerId", "pointsEarn") SELECT "id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "notes", "createdAt", "updatedAt", "customerId", "pointsEarn" FROM "sales"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`ALTER TABLE "temporary_sales" RENAME TO "sales"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sales" RENAME TO "temporary_sales"`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('initiated','paid','refunded','voided') ) NOT NULL DEFAULT ('initiated'), "paymentMethod" varchar CHECK( "paymentMethod" IN ('cash','card','wallet') ) NOT NULL DEFAULT ('cash'), "totalAmount" decimal NOT NULL DEFAULT (0), "usedLoyalty" boolean NOT NULL DEFAULT (0), "loyaltyRedeemed" integer NOT NULL DEFAULT (0), "usedDiscount" boolean NOT NULL DEFAULT (0), "totalDiscount" integer NOT NULL DEFAULT (0), "usedVoucher" boolean NOT NULL DEFAULT (0), "voucherCode" varchar, "notes" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "customerId" integer, "pointsEarn" real NOT NULL DEFAULT (0), CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "sales"("id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "notes", "createdAt", "updatedAt", "customerId", "pointsEarn") SELECT "id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "notes", "createdAt", "updatedAt", "customerId", "pointsEarn" FROM "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "temporary_sales"`);
        await queryRunner.query(`ALTER TABLE "sales" RENAME TO "temporary_sales"`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "status" varchar CHECK( "status" IN ('initiated','paid','refunded','voided') ) NOT NULL DEFAULT ('initiated'), "paymentMethod" varchar CHECK( "paymentMethod" IN ('cash','card','wallet') ) NOT NULL DEFAULT ('cash'), "totalAmount" decimal NOT NULL DEFAULT (0), "usedLoyalty" boolean NOT NULL DEFAULT (0), "loyaltyRedeemed" integer NOT NULL DEFAULT (0), "usedDiscount" boolean NOT NULL DEFAULT (0), "totalDiscount" integer NOT NULL DEFAULT (0), "usedVoucher" boolean NOT NULL DEFAULT (0), "voucherCode" varchar, "notes" varchar, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "customerId" integer, CONSTRAINT "FK_3a92cf6add00043cef9833db1cd" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "sales"("id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "notes", "createdAt", "updatedAt", "customerId") SELECT "id", "timestamp", "status", "paymentMethod", "totalAmount", "usedLoyalty", "loyaltyRedeemed", "usedDiscount", "totalDiscount", "usedVoucher", "voucherCode", "notes", "createdAt", "updatedAt", "customerId" FROM "temporary_sales"`);
        await queryRunner.query(`DROP TABLE "temporary_sales"`);
    }
}
