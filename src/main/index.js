// index.js placeholder
// src/main/app.js
//@ts-check

const { app, BrowserWindow, ipcMain, screen, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
require("reflect-metadata");
const User = require("../entities/User");
const { AppDataSource } = require("./db/dataSource");
const MigrationManager = require("../utils/migrationManager");
const {
  registerIpcHandlers,
  registerSyncIpcHandlers,
} = require("./reg.handler");
// @ts-ignore
const { remindersEnabled, auditLogEnabled } = require("../utils/system");
const AuditTrailCleanupScheduler = require("../scheduler/auditTrailCleanupScheduler");

// ===================== INVENTORY SYNC IMPORTS =====================
// NEW: Complete sync imports
const inventoryConfig = require("../services/inventory_sync/inventoryConfig");
const syncRetryService = require("../services/inventory_sync/syncRetryService");
const SyncManager = require("../services/inventory_sync/syncManager"); // NEW IMPORT
const syncDataManager = require("../services/inventory_sync/syncDataManager"); // NEW IMPORT
const saleCompletionHandler = require("../services/inventory_sync/saleCompletionHandler"); // NEW IMPORT
const { registerWindowControlHandlers } = require("./ipc/windows_control.ipc");

// ===================== REMOVE THESE UNUSED IMPORTS =====================
// DELETE THESE LINES (if they exist):
// const { getSyncConfig } = require("../services/inventory_sync/inventoryConfig");
// const registerSyncIpcHandlers = require("./registerSyncIpcHandler");

// ===================== CONFIGURATION =====================
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

// ===================== LOGGING UTILITY =====================
/**
 * @param {string} level
 * @param {string} message
 * @param {any} data
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [POS ${level}] ${message}`;
  console.log(logMessage);
  if (data) console.log(`[${timestamp}] [POS DATA]`, data);
}

// ===================== GLOBAL WINDOW REFERENCES =====================
/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {BrowserWindow | null} */
let splashWindow = null;
let dbClosed = false;
/**
 * @type {{ getMigrationStatus: () => any; runMigrationsWithBackup: () => any; backupDatabase: () => any; restoreFromLatestBackup: () => any; restoreFromBackup: (arg0: any) => any; listBackups: () => any; getDatabaseInfo: () => any; cleanupOldBackups: (arg0: any) => any; } | null}
 */
let migrationManager = null;

function safeCloseDB() {
  if (AppDataSource.isInitialized && !dbClosed) {
    dbClosed = true;
    AppDataSource.destroy()
      .then(() => log("INFO", "Database connection closed"))
      .catch((/** @type {string} */ err) => log("ERROR", "Error closing DB: " + err));
  }
}

// ===================== DATABASE FUNCTIONS WITH MIGRATION MANAGER =====================
async function initializeDatabase() {
  try {
    log("INFO", "Initializing database connection...");

    // Get database path for logging
    const dbPath = AppDataSource.options.database;
    log("INFO", `Database path: ${dbPath}`);

    // Initialize the data source
    await AppDataSource.initialize();
    log("SUCCESS", "Database connected successfully!");

    await ensureDatabaseTables();

    // Initialize Migration Manager
    migrationManager = new MigrationManager(AppDataSource);
    log("INFO", "Migration Manager initialized");

    // Check migration status
    const migrationStatus = await migrationManager.getMigrationStatus();
    log("INFO", "Migration status checked", {
      pendingMigrations: migrationStatus.pendingMigrations,
      executedCount: migrationStatus.executedMigrations.length,
      lastMigration: migrationStatus.lastMigration,
    });

    // If there are pending migrations
    if (migrationStatus.pendingMigrations) {
      log("INFO", "Pending migrations found. Starting migration process...");

      // Show migration status in splash window if available
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send("migration:start", {
          message: "Updating database...",
          pendingCount: migrationStatus.pendingMigrations,
        });
      }

      // Run migrations with backup and recovery
      const migrationResult = await migrationManager.runMigrationsWithBackup();

      if (migrationResult.success) {
        log(
          "SUCCESS",
          `Applied ${migrationResult.migrationsApplied} migrations successfully`,
        );

        // Log each applied migration
        if (
          migrationResult.migrations &&
          migrationResult.migrations.length > 0
        ) {
          migrationResult.migrations.forEach(
            (/** @type {any} */ migration, /** @type {number} */ index) => {
              log("INFO", `  ${index + 1}. ${migration}`);
            },
          );
        }

        // Update splash window
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.webContents.send("migration:complete", {
            message: "Database updated successfully",
            appliedCount: migrationResult.migrationsApplied,
          });
        }
      } else {
        log("ERROR", "Migration failed", migrationResult);

        if (migrationResult.restoredFromBackup) {
          log("WARN", "Database restored from backup after failed migration");

          // Show warning to user
          if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.webContents.send("migration:failed", {
              message: "Database update failed. Restored from backup.",
              error: migrationResult.error,
            });
          }
        } else {
          throw new Error(`Migration failed: ${migrationResult.error}`);
        }
      }
    } else {
      log("INFO", "No pending migrations. Database is up to date.");

      // Still create a backup for safety
      if (!isDev) {
        try {
          await migrationManager.backupDatabase();
          log("INFO", "Created database backup (no migrations needed)");
        } catch (backupError) {
          log(
            "WARN",
            "Backup creation failed (non-critical)",
            // @ts-ignore
            backupError.message,
          );
        }
      }
    }

    // Test connection with a simple query
    await AppDataSource.query("SELECT 1");
    log("SUCCESS", "Database connection test passed!");

    return {
      success: true,
      message: "Database initialized successfully",
      migrationStatus: migrationStatus,
    };
  } catch (error) {
    log("ERROR", "Database initialization failed:", error);

    // Try to recover using migration manager if it's initialized
    if (migrationManager) {
      try {
        log("INFO", "Attempting database recovery...");
        const recovered = await migrationManager.restoreFromLatestBackup();

        if (recovered) {
          log("WARN", "Database recovered from backup");
          return {
            success: true,
            message: "Database recovered from backup",
            recovered: true,
          };
        }
      } catch (recoveryError) {
        log("ERROR", "Database recovery also failed:", recoveryError);
      }
    }

    // Check specific error types
    if (
      // @ts-ignore
      error.code === "SQLITE_CANTOPEN" ||
      // @ts-ignore
      error.message?.includes("unable to open database")
    ) {
      log(
        "ERROR",
        "Cannot open database file. Check permissions or disk space.",
      );

      // Try to create directory if it doesn't exist
      try {
        const dbPath = AppDataSource.options.database;
        // @ts-ignore
        const dbDir = path.dirname(dbPath);

        if (!fs.existsSync(dbDir)) {
          fs.mkdirSync(dbDir, { recursive: true });
          log("INFO", `Created database directory: ${dbDir}`);
        }
      } catch (dirError) {
        log("ERROR", "Failed to create database directory:", dirError);
      }
    }

    return {
      success: false,
      // @ts-ignore
      message: error.message || "Unknown database error",
      error: error,
    };
  }
}

// ===================== WINDOW CREATION FUNCTIONS =====================
async function createSplashWindow() {
  try {
    log("INFO", "Creating splash window...");
    splashWindow = new BrowserWindow({
      width: 500,
      height: 400,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      center: true,
      resizable: false,
      movable: true,
      fullscreenable: false,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "preload.js"),
      },
    });

    const splashPath = path.join(__dirname, "splash.html");
    await splashWindow.loadFile(splashPath);
    splashWindow.show();
    log("SUCCESS", "Splash window created");
    return splashWindow;
  } catch (error) {
    log("ERROR", "Failed to create splash window", error);
    return null;
  }
}

function getAppUrl() {
  if (isDev) {
    const devServerURL = "http://localhost:5173";
    log("INFO", `Development mode - URL: ${devServerURL}`);
    return devServerURL;
  } else {
    // Direct approach - simpler and more reliable
    const prodPath = path.join(__dirname, "..", "..", "dist", "index.html");

    // Check if file exists
    if (!fs.existsSync(prodPath)) {
      // Try alternative paths if the first one doesn't work
      const possiblePaths = [
        prodPath,
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "dist",
          "index.html",
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "dist",
          "renderer",
          "index.html",
        ),
        path.join(
          process.resourcesPath,
          "app.asar.unpacked",
          "..",
          "dist",
          "renderer",
          "index.html",
        ),
        path.join(process.resourcesPath, "dist", "index.html"),
        path.join(app.getAppPath(), "dist", "index.html"),
        path.join(app.getAppPath(), "dist", "renderer", "index.html"),
        path.join(app.getAppPath(), "..", "dist", "renderer", "index.html"),
        path.join(app.getAppPath(), "..", "dist", "index.html"),
      ];

      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          log("INFO", `Found production build at: ${p}`);
          return `file://${p}`;
        }
      }

      throw new Error(
        `Production build not found. Checked: ${possiblePaths.join(", ")}`,
      );
    }

    log("INFO", `Production mode - file: ${prodPath}`);
    return `file://${prodPath}`;
  }
}

function getIconPath() {
  const platform = process.platform;
  if (isDev) {
    const devIconDir = path.resolve(__dirname, "..", "..", "assets");
    if (platform === "win32") return path.join(devIconDir, "icon.ico");
    if (platform === "darwin") return path.join(devIconDir, "icon.icns");
    return path.join(devIconDir, "icon.png");
  } else {
    const resourcesPath = process.resourcesPath;
    if (platform === "win32")
      return path.join(resourcesPath, "build", "icon.ico");
    if (platform === "darwin") return path.join(resourcesPath, "icon.icns");
    return path.join(resourcesPath, "build", "icon.png");
  }
}

async function createMainWindow() {
  try {
    log("INFO", "Creating main window...");

    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    const windowWidth = 1366,
      windowHeight = 768;
    const x = Math.max(0, Math.floor((width - windowWidth) / 2));
    const y = Math.max(0, Math.floor((height - windowHeight) / 2));

    mainWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      x,
      y,
      minWidth: 1024,
      minHeight: 768,
      show: false,
      frame: true,
      titleBarStyle: "default",
      backgroundColor: "#f5f5f7",
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: !isDev,
        allowRunningInsecureContent: isDev,
      },
    });

    mainWindow.setMenu(null);
    mainWindow.setTitle("POS Management System");

    const iconPath = getIconPath();
    if (fs.existsSync(iconPath)) mainWindow.setIcon(iconPath);
    else log("WARN", `Icon not found: ${iconPath}`);

    // Window event listeners
    mainWindow.on("ready-to-show", () => {
      log("INFO", "Main window ready to show");
      if (splashWindow && !splashWindow.isDestroyed()) {
        setTimeout(() => {
          // @ts-ignore
          splashWindow.close();
          splashWindow = null;
        }, 300);
      }
      // @ts-ignore
      mainWindow.show();
      // @ts-ignore
      mainWindow.focus();
      // @ts-ignore
      mainWindow.center();
      // @ts-ignore
      mainWindow.webContents.send("app-ready");
    });

    ["maximize", "unmaximize", "minimize", "restore"].forEach((event) => {
      // @ts-ignore
      mainWindow.on(event, () => {
        // @ts-ignore
        mainWindow.webContents.send("window-state-changed", event);
      });
    });

    const appUrl = getAppUrl();
    log("INFO", `Loading URL: ${appUrl}`);

    try {
      if (!isDev) {
        await mainWindow.loadURL(appUrl);
      } else {
        await mainWindow.loadURL(appUrl);
        mainWindow.webContents.openDevTools({ mode: "detach" });
      }
      log("SUCCESS", "Main window loaded successfully");
    } catch (error) {
      const errorMessage = isDev
        ? "Dev server not running. Run 'npm run dev' first."
        : "Production build not found or corrupted.";
      showErrorPage(mainWindow, errorMessage);
      throw error;
    }

    return mainWindow;
  } catch (error) {
    log("ERROR", "Failed to create main window", error);
    throw error;
  }
}

// ===================== UTILITY FUNCTIONS =====================
/**
 * @param {BrowserWindow} window
 * @param {string} message
 */
function showErrorPage(window, message) {
  const errorHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 40px;
        }
        .error-container {
          max-width: 500px;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 20px; font-size: 24px; }
        code {
          background: rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 10px;
          display: block;
          margin: 20px 0;
          font-family: monospace;
        }
        .retry-btn {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          transition: transform 0.2s;
        }
        .retry-btn:hover { transform: scale(1.05); }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>⚠️ Application Error</h1>
        <p>${message}</p>
        <code>${isDev ? "http://localhost:5173" : "Production Build"}</code>
        <button class="retry-btn" onclick="location.reload()">Retry</button>
        <p style="margin-top: 20px; font-size: 14px; opacity: 0.8;">
          ${
            isDev
              ? "Make sure your development server is running"
              : "Please check if the application is properly installed"
          }
        </p>
      </div>
    </body>
    </html>
  `;

  window.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`,
  );
}

async function continueNormalStartup() {
  try {
    log("INFO", "Starting main window creation...");

    // Get the app URL (this will throw if not found in production)
    const appUrl = getAppUrl();
    log("INFO", `App URL to load: ${appUrl}`);

    // In production, verify the file exists before loading
    if (!isDev) {
      const filePath = appUrl.replace("file://", "");
      if (!fs.existsSync(filePath)) {
        const errorMsg = `Cannot find application files at: ${filePath}\n\nPlease reinstall the application.`;
        log("ERROR", errorMsg);

        // Show error dialog
        dialog.showErrorBox("File Not Found", errorMsg);

        // Also show in error page
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.close();
        }

        // Create a minimal window to show error
        const errorWindow = new BrowserWindow({
          width: 800,
          height: 600,
          show: false,
          frame: true,
          webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
          },
        });

        showErrorPage(
          errorWindow,
          `Production build not found at: ${filePath}`,
        );
        errorWindow.show();
        return;
      }
    }

    // Create main window
    await createMainWindow();

    log("SUCCESS", "✅ POS System started successfully");
  } catch (error) {
    log("ERROR", "Failed to continue startup", error);

    // Show error message
    // @ts-ignore
    const errorMessage = error && error.message ? error.message : String(error);
    dialog.showErrorBox(
      "Startup Error",
      `Failed to start POS system:\n\n${errorMessage}`,
    );

    app.quit();
  }
}

// ===================== SYNC SERVICES FUNCTIONS =====================
/**
 * Initialize and start all sync services
 */
async function startSyncServices() {
  try {
    log("INFO", "Starting inventory sync services...");

    // 1. Initialize default settings
    await inventoryConfig.initializeDefaultSettings();
    log("INFO", "Inventory sync configuration initialized");

    // 2. Start the sync manager
    await SyncManager.start();
    log("INFO", "Sync manager started");

    // 3. Start retry service for failed syncs
    syncRetryService.start();
    log("INFO", "Sync retry service started");

    // 4. Test connection to inventory database
    const connectionResult = await SyncManager.testConnection();
    log(
      "INFO",
      `Inventory connection test: ${connectionResult.connected ? "✅ Connected" : "❌ Failed"}`,
    );
  } catch (error) {
    log("ERROR", "Failed to start sync services:", error);
  }
}

// ===================== MAIN STARTUP FLOW =====================
app.on("ready", async () => {
  try {
    log("INFO", "🚀 Starting POS Management System...");
    log("INFO", `Version: ${app.getVersion()}`);
    log("INFO", `Environment: ${isDev ? "Development" : "Production"}`);

    // 1. Create splash window
    await createSplashWindow();

    // 2. Initialize database with Migration Manager
    log("INFO", "Starting database initialization with Migration Manager...");
    const dbResult = await initializeDatabase();

    if (!dbResult.success) {
      log("ERROR", `Database initialization failed: ${dbResult.message}`);

      // Show error dialog with options
      const dialogResult = dialog.showMessageBoxSync({
        type: "warning",
        title: "Database Warning",
        message: "Database initialization failed",
        detail: `Error: ${dbResult.message}\n\nThe application may not function properly.`,
        buttons: ["Continue Anyway", "Quit"],
        defaultId: 0,
        cancelId: 1,
      });

      if (dialogResult === 1) {
        // Quit button
        app.quit();
        return;
      }

      log(
        "WARN",
        "Continuing with limited functionality due to database issues",
      );
    } else {
      log("SUCCESS", "Database initialized successfully");

      // Only seed if database is healthy
      if (!dbResult.recovered) {
        // await seedDefaultRoles();
      } else {
        log("WARN", "Skipping seed because database was recovered from backup");
      }
    }

    // 3. Register IPC handlers and signals
    registerIpcHandlers();
    registerWindowControlHandlers();

    // 4. Register migration-related IPC handlers
    registerMigrationIpcHandlers();

    // 5. Register sync-related IPC handlers
    registerSyncIpcHandlers(); // LOCAL FUNCTION, NOT IMPORTED

    // 6. Continue with normal startup
    await continueNormalStartup();

    // 7. Start schedulers
    await startSchedulers();

    // 8. Start sync services
    await startSyncServices();

    log("SUCCESS", "✅ POS Management System started successfully");
  } catch (error) {
    log("ERROR", "❌ Startup failed", {
      // @ts-ignore
      error: error.message,
      // @ts-ignore
      stack: error.stack,
    });

    if (splashWindow && !splashWindow.isDestroyed()) splashWindow.close();

    dialog.showErrorBox(
      "Application Startup Error",
      // @ts-ignore
      `Failed to start POS Management System:\n\n${error.message}\n\nPlease check the logs for details.`,
    );

    app.quit();
  }
});

function registerMigrationIpcHandlers() {
  // Get migration status
  ipcMain.handle("migration:get-status", async () => {
    try {
      if (migrationManager) {
        return await migrationManager.getMigrationStatus();
      }
      return { error: "Migration manager not initialized" };
    } catch (error) {
      log("ERROR", "Failed to get migration status", error);
      // @ts-ignore
      return { error: error.message };
    }
  });

  // Run migrations manually
  ipcMain.handle("migration:run-manual", async () => {
    try {
      if (migrationManager) {
        const result = await migrationManager.runMigrationsWithBackup();
        return result;
      }
      return { success: false, error: "Migration manager not initialized" };
    } catch (error) {
      log("ERROR", "Failed to run migrations manually", error);
      // @ts-ignore
      return { success: false, error: error.message };
    }
  });

  // Create backup
  ipcMain.handle("migration:create-backup", async () => {
    try {
      if (migrationManager) {
        const backupPath = await migrationManager.backupDatabase();
        return { success: true, backupPath };
      }
      return { success: false, error: "Migration manager not initialized" };
    } catch (error) {
      log("ERROR", "Failed to create backup", error);
      // @ts-ignore
      return { success: false, error: error.message };
    }
  });

  // Restore from specific backup
  // @ts-ignore
  ipcMain.handle("migration:restore-backup", async (event, backupName) => {
    try {
      if (migrationManager) {
        const restored = await migrationManager.restoreFromBackup(backupName);
        return { success: restored };
      }
      return { success: false, error: "Migration manager not initialized" };
    } catch (error) {
      log("ERROR", "Failed to restore from backup", error);
      // @ts-ignore
      return { success: false, error: error.message };
    }
  });

  // Restore from latest backup
  ipcMain.handle("migration:restore-latest", async () => {
    try {
      if (migrationManager) {
        const restored = await migrationManager.restoreFromLatestBackup();
        return { success: restored };
      }
      return { success: false, error: "Migration manager not initialized" };
    } catch (error) {
      log("ERROR", "Failed to restore from latest backup", error);
      // @ts-ignore
      return { success: false, error: error.message };
    }
  });

  // Get list of backups
  ipcMain.handle("migration:list-backups", async () => {
    try {
      if (migrationManager) {
        const backups = await migrationManager.listBackups();
        return { success: true, backups };
      }
      return { success: false, error: "Migration manager not initialized" };
    } catch (error) {
      log("ERROR", "Failed to list backups", error);
      // @ts-ignore
      return { success: false, error: error.message };
    }
  });

  // Get database info
  ipcMain.handle("migration:database-info", async () => {
    try {
      if (migrationManager) {
        const info = await migrationManager.getDatabaseInfo();
        return { success: true, info };
      }
      return { success: false, error: "Migration manager not initialized" };
    } catch (error) {
      log("ERROR", "Failed to get database info", error);
      // @ts-ignore
      return { success: false, error: error.message };
    }
  });

  // Cleanup old backups
  // @ts-ignore
  ipcMain.handle("migration:cleanup-backups", async (event, keepCount = 5) => {
    try {
      if (migrationManager) {
        const result = await migrationManager.cleanupOldBackups(keepCount);
        return result;
      }
      return { success: false, error: "Migration manager not initialized" };
    } catch (error) {
      log("ERROR", "Failed to cleanup backups", error);
      // @ts-ignore
      return { success: false, error: error.message };
    }
  });
}

async function ensureDatabaseTables() {
  try {
    log("INFO", "Ensuring database tables exist...");

    // Try to query the roles table
    const tableCheck = await AppDataSource.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='roles'
    `);

    if (tableCheck.length === 0) {
      log("WARN", "Roles table doesn't exist. Creating tables...");

      // If roles table doesn't exist, synchronize the database
      await AppDataSource.synchronize();
      log("SUCCESS", "Database tables created successfully");

      return { created: true, message: "Tables created and seeded" };
    }

    log("INFO", "Database tables already exist");
    return { created: false, message: "Tables already exist" };
  } catch (error) {
    log("ERROR", "Failed to ensure database tables:", error);
    throw error;
  }
}

// Function to start schedulers for POS system
async function startSchedulers() {
  try {
    // Start the unified reminder scheduler
    // if (await remindersEnabled()) {
    //   const scheduler = new UnifiedReminderScheduler();
    //   await scheduler.start();
    //   log("INFO", "Unified reminder scheduler started");
    // } else {
    //   log("INFO", "Reminders are disabled in settings");
    // }

    if (await auditLogEnabled()) {
      const auditCleanupScheduler = new AuditTrailCleanupScheduler();
      await auditCleanupScheduler.start();
      log("INFO", "Audit trail cleanup scheduler started");
    } else {
      log("INFO", "Audit log is disabled, cleanup scheduler not started");
    }

    // Start inventory check scheduler
    // const inventoryScheduler = new InventoryCheckScheduler();
    // await inventoryScheduler.start();
    // log("INFO", "Inventory check scheduler started");

    // Start daily sales report scheduler
    // const salesReportScheduler = new DailySalesReportScheduler();
    // await salesReportScheduler.start();
    // log("INFO", "Daily sales report scheduler started");
  } catch (error) {
    log("ERROR", "Failed to start schedulers", error);
  }
}

// ===================== APPLICATION EVENT HANDLERS =====================
app.on("window-all-closed", () => {
  log("INFO", "All windows closed, closing database connection...");
  safeCloseDB();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", async () => {
  log("INFO", "Application activated");
  if (BrowserWindow.getAllWindows().length === 0) {
    await createMainWindow();
  }
});

app.on("before-quit", () => {
  log("INFO", "Application quitting...");

  // Stop sync services gracefully
  SyncManager.stop().catch((err) => {
    log("WARN", "Failed to stop sync manager:", err);
  });
  syncRetryService.stop();
});

app.on("will-quit", () => {
  log("INFO", "Application will quit");
  safeCloseDB();
});

app.on("quit", () => {
  log("INFO", "Application quit");
});

// ===================== ERROR HANDLING =====================
process.on("uncaughtException", (error) => {
  log("ERROR", "Uncaught exception", {
    error: error.message,
    stack: error.stack,
  });
});

process.on("unhandledRejection", (reason, promise) => {
  log("ERROR", "Unhandled promise rejection", {
    // @ts-ignore
    reason: reason?.message || reason,
    promise,
  });
});

// ===================== WINDOW CONTROL HANDLERS =====================
ipcMain.on("window-minimize", () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on("window-close", () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on("app-quit", () => {
  app.quit();
});

ipcMain.on("show-about", () => {
  dialog.showMessageBox({
    type: "info",
    title: "About POS Management System",
    message: "POS Management System",
    detail: `Version: ${app.getVersion()}\nPoint of Sale Management\n© ${new Date().getFullYear()} Your Company`,
    buttons: ["OK"],
  });
});

// Setup status handler
ipcMain.handle("get-setup-status", async () => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const count = await userRepo.count();
    return { hasUsers: count > 0, requiresSetup: count === 0 };
  } catch (error) {
    return { hasUsers: false, requiresSetup: true };
  }
});

// Migration status handler for renderer
ipcMain.handle("get-migration-status", async () => {
  try {
    if (migrationManager) {
      const status = await migrationManager.getMigrationStatus();
      return {
        success: true,
        pendingMigrations: status.pendingMigrations,
        executedCount: status.executedMigrations.length,
        lastMigration: status.lastMigration,
      };
    }
    return { success: false, error: "Migration manager not available" };
  } catch (error) {
    // @ts-ignore
    return { success: false, error: error.message };
  }
});

// Export for potential module usage
module.exports = { mainWindow, AppDataSource, migrationManager };
