// config/database.js
const path = require("path");
const fs = require("fs");
const { app } = require("electron");

const isDev = process.env.NODE_ENV === "development" || !app?.isPackaged;

function getDatabaseConfig() {
  let databasePath;
  let entitiesPath;
  let migrationsPath;
  
  if (isDev) {
    // Development mode
    databasePath = "App.db";
    entitiesPath = "src/entities/*.js";
    migrationsPath = "src/migrations/*.js";
    console.log(`Development DB path: ${databasePath}`);
  } else {
    // Production mode
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'data');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    databasePath = path.join(dbDir, 'App.db');
    
    // Production paths - use unpacked resources
    const appPath = app.getAppPath();
    const isAsar = appPath.includes('.asar');
    
    if (isAsar) {
      // When packaged in .asar, use unpacked directory
      const unpackedPath = path.dirname(appPath.replace('.asar', '.asar.unpacked'));
      entitiesPath = path.join(unpackedPath, 'src/entities/*.js');
      migrationsPath = path.join(unpackedPath, 'src/migrations/*.js');
    } else {
      // When not packaged
      entitiesPath = path.join(appPath, 'src/entities/*.js');
      migrationsPath = path.join(appPath, 'src/migrations/*.js');
    }
    
    console.log(`Production DB path: ${databasePath}`);
  }
  
  return {
    type: "sqlite",
    database: databasePath,
    synchronize: true, // Change to true for first run
    logging: false,
    entities: [entitiesPath],
    migrations: [migrationsPath],
    subscribers: ["src/subscribers/*.js"],
    cli: {
      entitiesDir: "src/entities",
      migrationsDir: "src/migrations",
      subscribersDir: "src/subscribers",
    },
    // SQLite specific options
    enableWAL: true,
    busyErrorRetry: 100,
  };
}

module.exports = { getDatabaseConfig };