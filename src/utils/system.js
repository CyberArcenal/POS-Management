// systemUtils.js - SHORTENED & CLEANED VERSION
//@ts-check
// @ts-ignore
const path = require("path");
// @ts-ignore
const Decimal = require("decimal.js");
const { logger } = require("./logger");
const { AppDataSource } = require("../main/db/dataSource");
const { SystemSetting, SettingType } = require("../entities/systemSettings");

// ============================================================
// 📊 CORE GETTER FUNCTIONS
// ============================================================

/**
 * Get setting value
 * @param {string} key
 * @param {string} settingType
 */
async function getValue(key, settingType, defaultValue = null) {
  try {
    // console.log(
    //   `[DB DEBUG] getValue called for key: "${key}", type: "${settingType}"`
    // );
    if (typeof key !== "string" || !key.trim()) {
      logger.debug(`[DB] Invalid key: ${key}`);
      return defaultValue;
    }

    const repository = AppDataSource.getRepository(SystemSetting);
    if (!repository) {
      logger.debug(
        `[DB] Repository not available for key: ${key}, using default: ${defaultValue}`
      );
      return defaultValue;
    }

    const query = repository
      .createQueryBuilder("setting")
      .where("setting.key = :key", { key: key.toLowerCase() })
      .andWhere("setting.is_deleted = :is_deleted", { is_deleted: false });

    if (settingType) {
      query.andWhere("setting.setting_type = :settingType", { settingType });
    }

    const setting = await query.getOne();

    // logger.debug(`[DB] Query result for key="${key}":`, {
    //   found: !!setting,
    //   value: setting ? setting.value : "NOT FOUND",
    //   keyInDB: setting ? setting.key : "N/A",
    // });

    if (!setting || setting.value === null || setting.value === undefined) {
      logger.debug(
        `[DB] Setting ${key} not found, using default: ${defaultValue}`
      );
      return defaultValue;
    }

    return String(setting.value).trim();
  } catch (error) {
    logger.warn(
      // @ts-ignore
      `[DB] Error fetching setting ${key}: ${error.message}, using default: ${defaultValue}`
    );
    return defaultValue;
  }
}

/**
 * Get boolean setting
 * @param {string} key
 * @param {string} settingType
 */
async function getBool(key, settingType, defaultValue = false) {
  try {
    const raw = await getValue(
      key,
      settingType,
      // @ts-ignore
      defaultValue ? "true" : "false"
    );
    if (raw === null) {
      return defaultValue;
    }

    const normalized = String(raw).trim().toLowerCase();
    if (
      ["true", "1", "yes", "y", "on", "enabled", "active"].includes(normalized)
    ) {
      return true;
    }
    if (
      ["false", "0", "no", "n", "off", "disabled", "inactive"].includes(
        normalized
      )
    ) {
      return false;
    }

    const num = parseFloat(normalized);
    if (!isNaN(num)) {
      return num > 0;
    }

    logger.warn(
      `Unrecognized boolean for key='${key}': '${raw}' → using default=${defaultValue}`
    );
    return defaultValue;
  } catch (error) {
    logger.error(
      // @ts-ignore
      `Error in getBool for ${key}: ${error.message}, using default: ${defaultValue}`
    );
    return defaultValue;
  }
}

/**
 * Get integer setting
 * @param {string} key
 * @param {string} settingType
 */
async function getInt(key, settingType, defaultValue = 0) {
  try {
    // @ts-ignore
    const raw = await getValue(key, settingType, defaultValue.toString());
    if (raw === null) {
      return defaultValue;
    }

    const result = parseInt(String(raw).trim(), 10);
    return isNaN(result) ? defaultValue : result;
  } catch (error) {
    logger.warn(
      // @ts-ignore
      `Invalid int for key='${key}': '${error.message}' – using default=${defaultValue}`
    );
    return defaultValue;
  }
}

/**
 * Get array setting
 * @param {string} key
 * @param {string} settingType
 */
// @ts-ignore
async function getArray(key, settingType, defaultValue = []) {
  try {
    // @ts-ignore
    const raw = await getValue(key, settingType, JSON.stringify(defaultValue));
    if (raw === null) {
      return defaultValue;
    }

    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return defaultValue;
      }
    }

    return defaultValue;
  } catch (error) {
    logger.warn(
      // @ts-ignore
      `Error getting array setting ${key}: ${error.message}, using default`
    );
    return defaultValue;
  }
}

// ============================================================
// 🏢 GENERAL SETTINGS
// ============================================================

async function companyName() {
  // @ts-ignore
  return getValue("company_name", SettingType.GENERAL, "POS Management");
}

async function timezone() {
  // @ts-ignore
  return getValue("default_timezone", SettingType.GENERAL, "Asia/Manila");
}

async function language() {
  // @ts-ignore
  return getValue("language", SettingType.GENERAL, "en");
}


// ============================================================
// 🔔 NOTIFICATIONS
// ============================================================

async function emailEnabled() {
  return getBool("email_enabled", SettingType.NOTIFICATION, false);
}

async function smtpHost() {
  // @ts-ignore
  return getValue("smtp_host", SettingType.INTEGRATIONS, "smtp.gmail.com");
}

async function smtpPort() {
  return getInt("smtp_port", SettingType.INTEGRATIONS, 587);
}

async function smtpUser() {
  // @ts-ignore
  return getValue("smtp_user", SettingType.INTEGRATIONS, "");
}

async function smtpPass() {
  // @ts-ignore
  return getValue("smtp_password", SettingType.INTEGRATIONS, "");
}

async function sendgridKey() {
  // @ts-ignore
  return getValue("sendgrid_api_key", SettingType.INTEGRATIONS, "");
}

async function smsEnabled() {
  return getBool("sms_enabled", SettingType.NOTIFICATION, false);
}

async function smsGateway() {
  return getValue(
    "sms_gateway_url",
    SettingType.INTEGRATIONS,
    // @ts-ignore
    "https://api.twilio.com/2010-04-01/Accounts/"
  );
}

async function smsApiKey() {
  // @ts-ignore
  return getValue("sms_api_key", SettingType.INTEGRATIONS, "");
}

async function smsSender() {
  // @ts-ignore
  return getValue("sms_sender_id", SettingType.INTEGRATIONS, "");
}

async function remindersEnabled() {
  return getBool("reminders_enabled", SettingType.NOTIFICATION, true);
}

async function reminderTimes() {
  return getArray("reminder_times", SettingType.NOTIFICATION, [24, 2]);
}

async function pushEnabled() {
  return getBool("push_notifications_enabled", SettingType.NOTIFICATION, false);
}

async function browserNotifEnabled() {
  return getBool(
    "browser_notifications_enabled",
    SettingType.NOTIFICATION,
    true
  );
}



// ============================================================
// 🔐 AUDIT & SECURITY
// ============================================================

async function auditLogEnabled() {
  return getBool("audit_log_enabled", SettingType.SECURITY, true);
}

async function logRetentionDays() {
  return getInt("log_retention_days", SettingType.SECURITY, 365);
}

// ============================================================
// 👤 USER SECURITY
// ============================================================

async function maxLoginAttempts() {
  return getInt("max_login_attempts", SettingType.USER_SECURITY, 5);
}

async function lockoutDuration() {
  return getInt("lockout_duration_minutes", SettingType.USER_SECURITY, 30);
}

async function passMinLength() {
  return getInt("password_min_length", SettingType.USER_SECURITY, 8);
}

async function passExpiryDays() {
  return getInt("password_expiry_days", SettingType.USER_SECURITY, 90);
}

async function passRequireUpper() {
  return getBool("password_require_uppercase", SettingType.USER_SECURITY, true);
}

async function passRequireLower() {
  return getBool("password_require_lowercase", SettingType.USER_SECURITY, true);
}

async function passRequireNumbers() {
  return getBool("password_require_numbers", SettingType.USER_SECURITY, true);
}

async function passRequireSymbols() {
  return getBool("password_require_symbols", SettingType.USER_SECURITY, false);
}

async function passHistorySize() {
  return getInt("password_history_size", SettingType.USER_SECURITY, 5);
}


async function sessionTimeout() {
  return getInt("session_timeout_minutes", SettingType.USER_SECURITY, 60);
}

async function allowMultiSession() {
  return getBool("allow_multiple_sessions", SettingType.USER_SECURITY, false);
}

async function sessionEncrypted() {
  return getBool("session_encryption_enabled", SettingType.USER_SECURITY, true);
}

async function autoDeleteInactiveDays() {
  return getInt(
    "auto_delete_inactive_users_days",
    SettingType.USER_SECURITY,
    0
  );
}

module.exports = {


  // Core functions
  getValue,
  getBool,
  getInt,
  getArray,

  // General Settings
  companyName,
  timezone,
  language,

  // Notifications
  emailEnabled,
  smtpHost,
  smtpPort,
  smtpUser,
  smtpPass,
  sendgridKey,
  smsEnabled,
  smsGateway,
  smsApiKey,
  smsSender,
  remindersEnabled,
  reminderTimes,
  pushEnabled,
  browserNotifEnabled,

  // Audit & Security
  auditLogEnabled,
  logRetentionDays,

  // User Security
  maxLoginAttempts,
  lockoutDuration,
  passMinLength,
  passExpiryDays,
  passRequireUpper,
  passRequireLower,
  passRequireNumbers,
  passRequireSymbols,
  passHistorySize,
  sessionTimeout,
  allowMultiSession,
  sessionEncrypted,
  autoDeleteInactiveDays,
};
