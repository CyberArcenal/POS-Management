/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1771350783550 {
    name = 'InitSchema1771350783550'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "temporary_inventory_movements" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "movementType" varchar CHECK( "movementType" IN ('sale','refund','adjustment','purchase') ) NOT NULL DEFAULT ('sale'), "qtyChange" integer NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "notes" varchar, "updatedAt" datetime, "productId" integer, "saleId" integer, CONSTRAINT "FK_6f1f9c640e9a68b047482881eba" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_05715a7ea47e49653f164c0dd8c" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_inventory_movements"("id", "movementType", "qtyChange", "timestamp", "notes", "updatedAt", "productId", "saleId") SELECT "id", "movementType", "qtyChange", "timestamp", "notes", "updatedAt", "productId", "saleId" FROM "inventory_movements"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
        await queryRunner.query(`ALTER TABLE "temporary_inventory_movements" RENAME TO "inventory_movements"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "inventory_movements" RENAME TO "temporary_inventory_movements"`);
        await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "movementType" varchar CHECK( "movementType" IN ('sale','refund','adjustment') ) NOT NULL DEFAULT ('sale'), "qtyChange" integer NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "notes" varchar, "updatedAt" datetime, "productId" integer, "saleId" integer, CONSTRAINT "FK_6f1f9c640e9a68b047482881eba" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_05715a7ea47e49653f164c0dd8c" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "inventory_movements"("id", "movementType", "qtyChange", "timestamp", "notes", "updatedAt", "productId", "saleId") SELECT "id", "movementType", "qtyChange", "timestamp", "notes", "updatedAt", "productId", "saleId" FROM "temporary_inventory_movements"`);
        await queryRunner.query(`DROP TABLE "temporary_inventory_movements"`);
    }
}
