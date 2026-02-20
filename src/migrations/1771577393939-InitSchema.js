/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1771577393939 {
    name = 'InitSchema1771577393939'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "temporary_suppliers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "contactInfo" varchar, "address" varchar, "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime, "email" varchar, "phone" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_suppliers"("id", "name", "contactInfo", "address", "isActive", "createdAt", "updatedAt") SELECT "id", "name", "contactInfo", "address", "isActive", "createdAt", "updatedAt" FROM "suppliers"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
        await queryRunner.query(`ALTER TABLE "temporary_suppliers" RENAME TO "suppliers"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "suppliers" RENAME TO "temporary_suppliers"`);
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "contactInfo" varchar, "address" varchar, "isActive" boolean NOT NULL DEFAULT (1), "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "suppliers"("id", "name", "contactInfo", "address", "isActive", "createdAt", "updatedAt") SELECT "id", "name", "contactInfo", "address", "isActive", "createdAt", "updatedAt" FROM "temporary_suppliers"`);
        await queryRunner.query(`DROP TABLE "temporary_suppliers"`);
    }
}
