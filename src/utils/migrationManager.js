// src/utils/migrationManager.js
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class MigrationManager {
  constructor(dataSource) {
    this.dataSource = dataSource;
    this.backupDir = path.join(app.getPath('userData'), 'backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }
  
  /**
   * Create a backup of the current database
   * @returns {Promise<string|null>} Path to the backup file or null if failed
   */
  async backupDatabase() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
      
      const dbPath = this.dataSource.options.database;
      
      // Check if database file exists
      if (!fs.existsSync(dbPath)) {
        console.log('Database file does not exist yet, skipping backup');
        return null;
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(
        this.backupDir, 
        `backup_${timestamp}.db`
      );
      
      // Copy database file
      fs.copyFileSync(dbPath, backupPath);
      
      // Also create a metadata file
      const metadata = {
        timestamp: new Date().toISOString(),
        originalPath: dbPath,
        backupPath: backupPath,
        size: fs.statSync(backupPath).size,
        appVersion: app.getVersion()
      };
      
      const metadataPath = backupPath.replace('.db', '.json');
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      
      console.log(`Database backed up to: ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error('Backup failed:', error);
      return null;
    }
  }
  
  /**
   * Run migrations with backup protection
   * @returns {Promise<Object>} Migration result
   */
  async runMigrationsWithBackup() {
    try {
      // Create backup before migration
      const backupPath = await this.backupDatabase();
      
      if (!backupPath) {
        console.warn('Backup failed, but continuing with migration');
      }
      
      // Run migrations
      const migrations = await this.dataSource.runMigrations();
      
      return {
        success: true,
        migrationsApplied: migrations.length,
        migrations: migrations.map(m => m.name),
        backupCreated: !!backupPath,
        backupPath: backupPath
      };
    } catch (error) {
      console.error('Migration failed:', error);
      
      // Try to restore from backup if available
      let restored = false;
      if (await this.hasBackups()) {
        restored = await this.restoreFromLatestBackup();
      }
      
      return {
        success: false,
        error: error.message,
        restoredFromBackup: restored,
        message: restored ? 
          'Migration failed, but database was restored from backup.' :
          'Migration failed and no backup was available for restore.'
      };
    }
  }
  
  /**
   * Restore from the latest backup
   * @returns {Promise<boolean>} True if restore was successful
   */
  async restoreFromLatestBackup() {
    try {
      const backups = await this.listBackups();
      
      if (backups.length === 0) {
        console.error('No backups available for restore');
        return false;
      }
      
      const latestBackup = backups[0]; // Sorted by date descending
      return await this.restoreFromBackup(latestBackup.name);
    } catch (error) {
      console.error('Restore from latest backup failed:', error);
      return false;
    }
  }
  
  /**
   * Restore from a specific backup
   * @param {string} backupName - Name of the backup file (without path)
   * @returns {Promise<boolean>} True if restore was successful
   */
  async restoreFromBackup(backupName) {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      if (!fs.existsSync(backupPath)) {
        console.error(`Backup file not found: ${backupPath}`);
        return false;
      }
      
      const dbPath = this.dataSource.options.database;
      
      // Check if we can write to the database path
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // Close database connection if it's open
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
      }
      
      // Copy backup to database location
      fs.copyFileSync(backupPath, dbPath);
      
      console.log(`Restored database from: ${backupPath}`);
      
      // Reinitialize the data source
      await this.dataSource.initialize();
      
      // Check for metadata file
      const metadataPath = backupPath.replace('.db', '.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        console.log(`Restored from backup created: ${metadata.timestamp}`);
      }
      
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }
  
  /**
   * List all available backups
   * @returns {Promise<Array>} List of backup files with metadata
   */
  async listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }
      
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.db'))
        .map(f => {
          const filePath = path.join(this.backupDir, f);
          const stats = fs.statSync(filePath);
          
          // Try to get metadata
          let metadata = {};
          const metadataPath = filePath.replace('.db', '.json');
          if (fs.existsSync(metadataPath)) {
            try {
              metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            } catch (e) {
              console.warn(`Failed to read metadata for ${f}:`, e);
            }
          }
          
          return {
            name: f,
            path: filePath,
            size: stats.size,
            date: stats.mtime,
            formattedDate: stats.mtime.toLocaleString(),
            metadata: metadata
          };
        })
        .sort((a, b) => b.date - a.date); // newest first
      
      return files;
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }
  
  /**
   * Check if any backups exist
   * @returns {Promise<boolean>} True if backups exist
   */
  async hasBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return false;
      }
      
      const backups = fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.db'));
      
      return backups.length > 0;
    } catch (error) {
      console.error('Error checking backups:', error);
      return false;
    }
  }
  
  /**
   * Get migration status
   * @returns {Promise<Object>} Migration status information
   */
  async getMigrationStatus() {
    try {
      // Check if migrations table exists
      let executedMigrations = [];
      let pendingMigrations = false;
      let lastMigration = null;
      
      try {
        // Try to query migrations table
        executedMigrations = await this.dataSource.query(
          "SELECT * FROM migrations ORDER BY id DESC"
        );
        
        // Check for pending migrations
        pendingMigrations = await this.dataSource.showMigrations();
        
        lastMigration = executedMigrations[0] || null;
      } catch (error) {
        // If migrations table doesn't exist yet, all migrations are pending
        if (error.message.includes('no such table') || error.message.includes('migrations')) {
          pendingMigrations = true;
          console.log('Migrations table does not exist yet');
        } else {
          throw error;
        }
      }
      
      return {
        executedMigrations: executedMigrations,
        pendingMigrations: pendingMigrations,
        lastMigration: lastMigration,
        totalExecuted: executedMigrations.length,
        needsMigration: pendingMigrations
      };
    } catch (error) {
      console.error('Failed to get migration status:', error);
      return {
        executedMigrations: [],
        pendingMigrations: false,
        lastMigration: null,
        totalExecuted: 0,
        needsMigration: false,
        error: error.message
      };
    }
  }
  
  /**
   * Clean up old backups (keep only the last N backups)
   * @param {number} keepCount - Number of backups to keep
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldBackups(keepCount = 5) {
    try {
      const backups = await this.listBackups();
      
      if (backups.length <= keepCount) {
        return {
          success: true,
          kept: backups.length,
          deleted: 0,
          message: `No cleanup needed. Keeping all ${backups.length} backups.`
        };
      }
      
      const backupsToKeep = backups.slice(0, keepCount);
      const backupsToDelete = backups.slice(keepCount);
      
      let deletedCount = 0;
      let errors = [];
      
      for (const backup of backupsToDelete) {
        try {
          // Delete database file
          fs.unlinkSync(backup.path);
          
          // Delete metadata file if it exists
          const metadataPath = backup.path.replace('.db', '.json');
          if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
          }
          
          deletedCount++;
        } catch (error) {
          errors.push(`Failed to delete ${backup.name}: ${error.message}`);
        }
      }
      
      return {
        success: errors.length === 0,
        kept: backupsToKeep.length,
        deleted: deletedCount,
        totalBackups: backups.length,
        errors: errors
      };
    } catch (error) {
      console.error('Backup cleanup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get database information
   * @returns {Promise<Object>} Database info
   */
  async getDatabaseInfo() {
    try {
      const dbPath = this.dataSource.options.database;
      const exists = fs.existsSync(dbPath);
      
      let size = 0;
      let tables = [];
      
      if (exists) {
        const stats = fs.statSync(dbPath);
        size = stats.size;
        
        // Get list of tables
        try {
          const tableResult = await this.dataSource.query(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
          );
          tables = tableResult.map(row => row.name);
        } catch (error) {
          console.warn('Could not get table list:', error);
        }
      }
      
      return {
        path: dbPath,
        exists: exists,
        size: size,
        sizeMB: (size / (1024 * 1024)).toFixed(2),
        tables: tables,
        tableCount: tables.length
      };
    } catch (error) {
      console.error('Failed to get database info:', error);
      return {
        path: this.dataSource.options.database,
        exists: false,
        size: 0,
        error: error.message
      };
    }
  }
}

module.exports = MigrationManager;