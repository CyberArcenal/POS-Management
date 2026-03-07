// utils/subscriberRegistry.js
const fs = require("fs");
const path = require("path");
const { logger } = require("../logger");

// Lazy load auditLogger para maiwasan ang circular dependency
let auditLogger = null;

function loadSubscribers() {
  const dir = path.join(__dirname, "../../subscribers");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".js"));

  const subscribers = [];
  for (const file of files) {
    try {
      const mod = require(path.join(dir, file));
      const cls = typeof mod === "function" ? mod : Object.values(mod)[0];
      if (cls) {
        subscribers.push(new cls());
        logger.debug(`Subscriber loaded: ${cls.name} from ${file}`);
      } else {
        logger.warn(`No class found in subscriber file: ${file}`);
      }
    } catch (err) {
      logger.error(`Failed to load subscriber from ${file}:`, err);
      
      // Subukang i-log sa audit kung available na
      if (!auditLogger) {
        try {
          auditLogger = require("./auditLogger");
        } catch {
          // auditLogger hindi pa available, skip
        }
      }
      if (auditLogger && auditLogger.log) {
        auditLogger.log({
          action: "SUBSCRIBER_LOAD_FAILED",
          entity: "System",
          description: `Failed to load subscriber from ${file}: ${err.message}`,
        }).catch(() => {}); // ignore kung mag-fail
      }
    }
  }
  return subscribers;
}

module.exports = { loadSubscribers };