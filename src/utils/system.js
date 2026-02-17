//@ts-check
// @ts-ignore
const path = require("path");
// @ts-ignore
const Decimal = require("decimal.js");
const { logger } = require("./logger");
const { SystemSetting, SettingType } = require("../entities/systemSettings");
const { AppDataSource } = require("../main/db/datasource");

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
        `[DB] Repository not available for key: ${key}, using default: ${defaultValue}`,
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
        `[DB] Setting ${key} not found, using default: ${defaultValue}`,
      );
      return defaultValue;
    }

    return String(setting.value).trim();
  } catch (error) {
    logger.warn(
      // @ts-ignore
      `[DB] Error fetching setting ${key}: ${error.message}, using default: ${defaultValue}`,
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
      defaultValue ? "true" : "false",
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
        normalized,
      )
    ) {
      return false;
    }

    const num = parseFloat(normalized);
    if (!isNaN(num)) {
      return num > 0;
    }

    logger.warn(
      `Unrecognized boolean for key='${key}': '${raw}' → using default=${defaultValue}`,
    );
    return defaultValue;
  } catch (error) {
    logger.error(
      // @ts-ignore
      `Error in getBool for ${key}: ${error.message}, using default: ${defaultValue}`,
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
      `Invalid int for key='${key}': '${error.message}' – using default=${defaultValue}`,
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
      `Error getting array setting ${key}: ${error.message}, using default`,
    );
    return defaultValue;
  }
}

// ============================================================
// 🏢 GENERAL SETTINGS
// ============================================================

// ============================================================
// 🏢 GENERAL SETTINGS
// ============================================================

async function companyName() {
  return getValue(
    "company_name",
    SettingType.GENERAL,
    // @ts-ignore
    "Hotel Management",
  );
}

// ✅ RENAME: from 'timezone' to 'defaultTimezone' (para hindi malito)
async function defaultTimezone() {
  // @ts-ignore
  return getValue("default_timezone", SettingType.GENERAL, "Asia/Manila");
}

async function language() {
  // @ts-ignore
  return getValue("language", SettingType.GENERAL, "en");
}

// ✅ NEW: para sa actual na "timezone" key (id 11)
async function timezone() {
  // @ts-ignore
  return getValue("timezone", SettingType.GENERAL, "Asia/Manila");
}

// ============================================================
// 🔔 NOTIFICATION SETTINGS
// ============================================================

async function enableEmailAlerts() {
  // @ts-ignore
  return getValue("enable_email_alerts", SettingType.NOTIFICATION, "false");
}

async function enableSmsAlerts() {
  // @ts-ignore
  return getValue("enable_sms_alerts", SettingType.NOTIFICATION, "false");
}

async function adminAlerts() {
  // @ts-ignore
  return getValue("admin_alerts", SettingType.NOTIFICATION, "false");
}

async function reminderIntervalHours() {
  // @ts-ignore
  return getValue("reminder_interval_hours", SettingType.NOTIFICATION, "24");
}

async function smtpHost() {
  // @ts-ignore
  return getValue("smtp_host", SettingType.NOTIFICATION, "smtp.gmail.com");
}

async function smtpPort() {
  return getInt("smtp_port", SettingType.NOTIFICATION, 587);
}

async function smtpUsername() {
  // @ts-ignore
  return getValue("smtp_username", SettingType.NOTIFICATION, "");
}

async function smtpPassword() {
  // @ts-ignore
  return getValue("smtp_password", SettingType.NOTIFICATION, "");
}

async function smtpUseSsl() {
  // @ts-ignore
  return getValue("smtp_use_ssl", SettingType.NOTIFICATION, "true");
}

async function smtpFromEmail() {
  // @ts-ignore
  return getValue("smtp_from_email", SettingType.NOTIFICATION, "");
}

async function smtpFromName() {
  // @ts-ignore
  return getValue("smtp_from_name", SettingType.NOTIFICATION, "");
}

// 📱 TWILIO SMS SETTINGS (NEW)
async function twilioAccountSid() {
  // @ts-ignore
  return getValue("twilio_account_sid", SettingType.NOTIFICATION, "");
}

async function twilioAuthToken() {
  // @ts-ignore
  return getValue("twilio_auth_token", SettingType.NOTIFICATION, "");
}

async function twilioPhoneNumber() {
  // @ts-ignore
  return getValue("twilio_phone_number", SettingType.NOTIFICATION, "");
}

async function twilioMessagingServiceSid() {
  // @ts-ignore
  return getValue("twilio_messaging_service_sid", SettingType.NOTIFICATION, "");
}

async function getSmtpConfig() {
  const [host, port, username, password, useSsl, fromEmail, fromName] =
    await Promise.all([
      smtpHost(),
      smtpPort(),
      smtpUsername(),
      smtpPassword(),
      smtpUseSsl(),
      smtpFromEmail(),
      smtpFromName(),
    ]);

  return {
    host,
    // @ts-ignore
    port: parseInt(port, 10),
    username,
    password,
    secure: useSsl === "true" || useSsl === "1" || useSsl === "yes",
    from: {
      email: fromEmail,
      name: fromName,
    },
  };
}

async function getTwilioConfig() {
  const [accountSid, authToken, phoneNumber, messagingServiceSid] =
    await Promise.all([
      twilioAccountSid(),
      twilioAuthToken(),
      twilioPhoneNumber(),
      twilioMessagingServiceSid(),
    ]);

  return {
    accountSid,
    authToken,
    phoneNumber,
    messagingServiceSid,
  };
}

// ============================================================
// ⚙️ SYSTEM SETTINGS
// ============================================================

async function debugMode() {
  // @ts-ignore
  return getValue("debug_mode", SettingType.SYSTEM, "false");
}

async function environment() {
  // @ts-ignore
  return getValue("environment", SettingType.SYSTEM, "development");
}

async function auditTrailEnabled() {
  // @ts-ignore
  return getValue("audit_trail_enabled", SettingType.SYSTEM, "true");
}






async function getLoyaltyPointRate(){
  return getInt("loyalty_points_rate", SettingType.SALE, 20)
}

// ============================================================
// 📤 EXPORT ALL FUNCTIONS
// ============================================================

module.exports = {
  getLoyaltyPointRate,
  // Core getters
  getValue,
  getBool,
  getInt,
  getArray,

  // General settings
  companyName,
  defaultTimezone, // ✅ pinalitan mula sa dating 'timezone'
  language,
  timezone, // ✅ bago – para sa "timezone" key

  // Notification settings
  enableEmailAlerts,
  enableSmsAlerts,
  adminAlerts,
  reminderIntervalHours,

  // 📧 SMTP Settings (NEW)
  smtpHost,
  smtpPort,
  smtpUsername,
  smtpPassword,
  smtpUseSsl,
  smtpFromEmail,
  smtpFromName,
  getSmtpConfig, // ✅ Convenience function

  // 📱 TWILIO SETTINGS (NEW)
  twilioAccountSid,
  twilioAuthToken,
  twilioPhoneNumber,
  twilioMessagingServiceSid,
  getTwilioConfig, // ✅ Convenience function

  // System settings
  debugMode,
  environment,
  auditTrailEnabled,
};
