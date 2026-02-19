import { useState, useEffect, useCallback } from "react";
import systemConfigAPI, {
  type GroupedSettingsData,
  type SystemInfoData,
  type GeneralSettings,
  type InventorySettings,
  type SalesSettings,
  type CashierSettings,
  type NotificationsSettings,
  type DataReportsSettings,
  type IntegrationsSettings,
  type AuditSecuritySettings,
  type UserSecuritySettings,
} from "../../../api/system_config";
import { dialogs } from "../../../utils/dialogs";

// ========== Default values for every category ==========
const DEFAULT_GENERAL: GeneralSettings = {
  company_name: "POS Management",
  store_location: "",
  default_timezone: "Asia/Manila",
  currency: "USD",
  language: "en",
  receipt_footer_message: "Thank you for your purchase!",
  auto_logout_minutes: 30,
};

const DEFAULT_INVENTORY: InventorySettings = {
  auto_reorder_enabled: false,
  reorder_level_default: 10,
  reorder_qty_default: 20,
  stock_alert_threshold: 5,
  allow_negative_stock: false,
  inventory_sync_enabled: false,
};

const DEFAULT_SALES: SalesSettings = {
  tax_rate: 0,
  discount_enabled: true,
  max_discount_percent: 50,
  allow_refunds: true,
  refund_window_days: 7,
  loyalty_points_enabled: false,
  loyalty_points_rate: 1,
};

const DEFAULT_CASHIER: CashierSettings = {
  enable_cash_drawer: false,
  drawer_open_code: "",
  enable_receipt_printing: true,
  receipt_printer_type: "thermal",
  enable_barcode_scanning: true,
  enable_touchscreen_mode: false,
  quick_sale_enabled: false,
};

const DEFAULT_NOTIFICATIONS: NotificationsSettings = {
  email_enabled: false,
  email_smtp_host: "",
  email_smtp_port: 587,
  email_from_address: "",
  sms_enabled: false,
  sms_provider: "twilio",
  push_notifications_enabled: false,
  low_stock_alert_enabled: true,
  daily_sales_summary_enabled: false,
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_phone_number: "",
  twilio_messaging_service_sid: "",
};

const DEFAULT_DATA_REPORTS: DataReportsSettings = {
  export_formats: ["CSV", "Excel", "PDF"],
  default_export_format: "CSV",
  auto_backup_enabled: false,
  backup_schedule: "0 2 * * *",
  backup_location: "./backups",
  data_retention_days: 365,
};

const DEFAULT_INTEGRATIONS: IntegrationsSettings = {
  accounting_integration_enabled: false,
  accounting_api_url: "",
  accounting_api_key: "",
  payment_gateway_enabled: false,
  payment_gateway_provider: "",
  payment_gateway_api_key: "",
  webhooks_enabled: false,
  webhooks: [],
};

const DEFAULT_AUDIT_SECURITY: AuditSecuritySettings = {
  audit_log_enabled: true,
  log_retention_days: 30,
  log_events: ["login", "logout", "create", "update", "delete"],
  force_https: false,
  session_encryption_enabled: true,
  gdpr_compliance_enabled: false,
};

const DEFAULT_USER_SECURITY: UserSecuritySettings = {
  max_login_attempts: 5,
  lockout_duration_minutes: 15,
  password_min_length: 8,
  password_require_uppercase: true,
  password_require_numbers: true,
  enable_two_factor_auth: false,
  session_timeout_minutes: 30,
  allow_multiple_sessions: false,
};

// Combined defaults
const DEFAULTS = {
  general: DEFAULT_GENERAL,
  inventory: DEFAULT_INVENTORY,
  sales: DEFAULT_SALES,
  cashier: DEFAULT_CASHIER,
  notifications: DEFAULT_NOTIFICATIONS,
  data_reports: DEFAULT_DATA_REPORTS,
  integrations: DEFAULT_INTEGRATIONS,
  audit_security: DEFAULT_AUDIT_SECURITY,
  user_security: DEFAULT_USER_SECURITY,
};

// Allowed keys per category – derived from the interfaces
const ALLOWED_KEYS: Record<keyof typeof DEFAULTS, string[]> = {
  general: [
    "company_name", "store_location", "default_timezone", "currency",
    "language", "receipt_footer_message", "auto_logout_minutes"
  ],
  inventory: ["auto_reorder_enabled", "reorder_level_default", "reorder_qty_default", "stock_alert_threshold", "allow_negative_stock", "inventory_sync_enabled"],
  sales: ["tax_rate", "discount_enabled", "max_discount_percent", "allow_refunds", "refund_window_days", "loyalty_points_enabled", "loyalty_points_rate"],
  cashier: ["enable_cash_drawer", "drawer_open_code", "enable_receipt_printing", "receipt_printer_type", "enable_barcode_scanning", "enable_touchscreen_mode", "quick_sale_enabled"],
  notifications: [
    "email_enabled", "email_smtp_host", "email_smtp_port", "email_from_address",
    "sms_enabled", "sms_provider", "push_notifications_enabled", "low_stock_alert_enabled",
    "daily_sales_summary_enabled", "twilio_account_sid", "twilio_auth_token",
    "twilio_phone_number", "twilio_messaging_service_sid"
  ],
  data_reports: ["export_formats", "default_export_format", "auto_backup_enabled", "backup_schedule", "backup_location", "data_retention_days"],
  integrations: ["accounting_integration_enabled", "accounting_api_url", "accounting_api_key", "payment_gateway_enabled", "payment_gateway_provider", "payment_gateway_api_key", "webhooks_enabled", "webhooks"],
  audit_security: ["audit_log_enabled", "log_retention_days", "log_events", "force_https", "session_encryption_enabled", "gdpr_compliance_enabled"],
  user_security: ["max_login_attempts", "lockout_duration_minutes", "password_min_length", "password_require_uppercase", "password_require_numbers", "enable_two_factor_auth", "session_timeout_minutes", "allow_multiple_sessions"],
};

// Helper to sanitize an object to only allowed keys
function sanitizeSettings<T extends Record<string, any>>(
  obj: T,
  allowedKeys: string[]
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of allowedKeys) {
    if (key in obj) {
      result[key as keyof T] = obj[key];
    }
  }
  return result;
}

export const useSettings = () => {
  const [groupedConfig, setGroupedConfig] = useState(DEFAULTS);
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const configRes = await systemConfigAPI.getGroupedConfig();
      if (configRes.status && configRes.data) {
        const apiSettings = configRes.data.grouped_settings;
        setGroupedConfig({
          general: { ...DEFAULTS.general, ...apiSettings.general },
          inventory: { ...DEFAULTS.inventory, ...apiSettings.inventory },
          sales: { ...DEFAULTS.sales, ...apiSettings.sales },
          cashier: { ...DEFAULTS.cashier, ...apiSettings.cashier },
          notifications: { ...DEFAULTS.notifications, ...apiSettings.notifications },
          data_reports: { ...DEFAULTS.data_reports, ...apiSettings.data_reports },
          integrations: { ...DEFAULTS.integrations, ...apiSettings.integrations },
          audit_security: { ...DEFAULTS.audit_security, ...apiSettings.audit_security },
          user_security: { ...DEFAULTS.user_security, ...apiSettings.user_security },
        });
      }
      const infoRes = await systemConfigAPI.getSystemInfo();
      if (infoRes.status && infoRes.data) {
        setSystemInfo(infoRes.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  // Generic field updater
  const updateCategoryField = useCallback(
    <C extends keyof typeof DEFAULTS>(
      category: C,
      field: keyof (typeof DEFAULTS)[C],
      value: any
    ) => {
      setGroupedConfig((prev) => ({
        ...prev,
        [category]: {
          ...prev[category],
          [field]: value,
        },
      }));
    },
    []
  );

  // Category-specific updaters
  const updateGeneral = (field: keyof GeneralSettings, value: any) =>
    updateCategoryField("general", field, value);
  const updateInventory = (field: keyof InventorySettings, value: any) =>
    updateCategoryField("inventory", field, value);
  const updateSales = (field: keyof SalesSettings, value: any) =>
    updateCategoryField("sales", field, value);
  const updateCashier = (field: keyof CashierSettings, value: any) =>
    updateCategoryField("cashier", field, value);
  const updateNotifications = (field: keyof NotificationsSettings, value: any) =>
    updateCategoryField("notifications", field, value);
  const updateDataReports = (field: keyof DataReportsSettings, value: any) =>
    updateCategoryField("data_reports", field, value);
  const updateIntegrations = (field: keyof IntegrationsSettings, value: any) =>
    updateCategoryField("integrations", field, value);
  const updateAuditSecurity = (field: keyof AuditSecuritySettings, value: any) =>
    updateCategoryField("audit_security", field, value);
  const updateUserSecurity = (field: keyof UserSecuritySettings, value: any) =>
    updateCategoryField("user_security", field, value);

  // Save settings: send each category individually, but only the allowed fields
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const categories = Object.keys(groupedConfig) as Array<keyof typeof DEFAULTS>;
    const results = await Promise.allSettled(
      categories.map(async (category) => {
        const dataToSend = sanitizeSettings(groupedConfig[category], ALLOWED_KEYS[category]);
        return systemConfigAPI.updateGroupedConfig({
          [category]: dataToSend,
        });
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      const errors = failed.map((f) => (f as PromiseRejectedResult).reason?.message || "Unknown error");
      setError(`Failed to save ${failed.length} category(s): ${errors.join("; ")}`);
    } else {
      setSuccessMessage("All settings saved successfully");
      fetchSettings(); // refresh to get latest timestamps
    }

    setSaving(false);
  };

  const resetToDefaults = async () => {
    if (
      !(await dialogs.confirm({
        message:
          "Are you sure you want to reset all settings to default values? This cannot be undone.",
        title: "Reset Settings",
      }))
    )
      return;
    setLoading(true);
    try {
      await systemConfigAPI.resetToDefaults();
      setSuccessMessage("Settings reset to defaults");
      fetchSettings();
    } catch (err: any) {
      setError(err.message || "Failed to reset settings");
    } finally {
      setLoading(false);
    }
  };

  const exportSettings = async () => {
    try {
      const jsonStr = await systemConfigAPI.exportSettingsToFile();
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMessage("Settings exported successfully");
    } catch (err: any) {
      setError(err.message || "Failed to export settings");
    }
  };

  const importSettings = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await systemConfigAPI.importSettingsFromFile(content);
        setSuccessMessage("Settings imported successfully");
        fetchSettings();
      } catch (err: any) {
        setError(err.message || "Failed to import settings");
      }
    };
    reader.readAsText(file);
  };

  const testSmtpConnection = async () => {
    try {
      if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
      const response = await window.backendAPI.systemConfig({
        method: "testSmtpConnection",
        params: { settings: groupedConfig.notifications },
      });
      if (response.status) setSuccessMessage("SMTP connection successful");
      else setError(response.message || "SMTP connection failed");
    } catch (err: any) {
      setError(err.message || "Failed to test SMTP connection");
    }
  };

  const testSmsConnection = async () => {
    try {
      if (!window.backendAPI?.systemConfig) throw new Error("Electron API not available");
      const response = await window.backendAPI.systemConfig({
        method: "testSmsConnection",
        params: { settings: groupedConfig.notifications },
      });
      if (response.status) setSuccessMessage("SMS (Twilio) connection successful");
      else setError(response.message || "SMS connection failed");
    } catch (err: any) {
      setError(err.message || "Failed to test SMS connection");
    }
  };

  return {
    groupedConfig,
    systemInfo,
    loading,
    saving,
    error,
    successMessage,
    setError,
    setSuccessMessage,
    updateGeneral,
    updateInventory,
    updateSales,
    updateCashier,
    updateNotifications,
    updateDataReports,
    updateIntegrations,
    updateAuditSecurity,
    updateUserSecurity,
    saveSettings,
    resetToDefaults,
    exportSettings,
    importSettings,
    refetch: fetchSettings,
    testSmtpConnection,
    testSmsConnection,
  };
};