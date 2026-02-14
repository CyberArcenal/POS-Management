// src/utils/migrationManager.js
//@ts-check
class MigrationManager {
  /**
   * @param {import("typeorm").DataSource} dataSource
   */
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Simple migration status
   */
  async getMigrationStatus() {
    try {
      // Check if migrations table exists
      const tableExists = await this.dataSource.query("SELECT 1 FROM migrations LIMIT 1")
        .then(() => true)
        .catch(() => false);

      if (!tableExists) {
        return { needsMigration: true, pending: 0, executed: 0 };
      }

      const pending = await this.dataSource.showMigrations();
      const executedCount = await this.dataSource.query("SELECT COUNT(*) as count FROM migrations")
        .then(rows => rows[0].count)
        .catch(() => 0);

      return {
        // @ts-ignore
        needsMigration: pending.length > 0,
        // @ts-ignore
        pending: pending.length,
        executed: executedCount,
      };
    } catch (err) {
      console.warn("Migration status check failed:", err);
      return { needsMigration: true, pending: 0, executed: 0 };
    }
  }

  /**
   * **SIMPLE MIGRATION ONLY** — no backup, no restore
   */
  async runMigrations() {
    try {
      console.log("🚀 Running migrations...");

      const result = await this.dataSource.runMigrations({
        transaction: "all", // lahat sa isang transaction para safe
      });

      console.log(`✅ Migration complete! Applied ${result.length} migration(s)`);
      return {
        success: true,
        applied: result.length,
        message: "Database updated successfully"
      };
    } catch (error) {
      // @ts-ignore
      console.error("❌ Migration failed:", error.message);

      // === LIGHT REPAIR: "table already exists" case ===
      // @ts-ignore
      if (error.message.includes("already exists")) {
        console.log("🔧 Detected 'already exists' error. Marking migration as done...");

        try {
          // Kunin yung latest pending migration
          const pending = await this.dataSource.showMigrations();
          // @ts-ignore
          if (pending.length > 0) {
            // @ts-ignore
            const lastPending = pending[pending.length - 1];

            // Manually insert sa migrations table para hindi na ulit
            await this.dataSource.query(`
              INSERT INTO migrations (timestamp, name)
              VALUES (${Date.now()}, '${lastPending.name}')
            `);

            console.log(`✅ Marked "${lastPending.name}" as executed.`);
          }

          return {
            success: true,
            repaired: true,
            message: "Schema already exists. Migration marked as complete."
          };
        } catch (repairErr) {
          console.error("Repair failed:", repairErr);
        }
      }

      return {
        success: false,
        // @ts-ignore
        error: error.message,
        message: "Migration failed. Check console/logs."
      };
    }
  }
}

module.exports = MigrationManager;