// src/renderer/pages/Settings/hooks/useSettings.ts
import { useState, useEffect, useCallback } from "react";
import systemConfigAPI, {
  type GroupedSettingsData,
  type SystemInfoData,
  type GeneralSettings,
  type UsersRolesSettings,
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

// Default values for every category (prevents empty forms)
const DEFAULTS = {
  general: {} as GeneralSettings,
  users_roles: {} as UsersRolesSettings,
  inventory: {} as InventorySettings,
  sales: {} as SalesSettings,
  cashier: {} as CashierSettings,
  notifications: {} as NotificationsSettings,
  data_reports: {} as DataReportsSettings,
  integrations: {} as IntegrationsSettings,
  audit_security: {} as AuditSecuritySettings,
  user_security: {} as UserSecuritySettings,
};

export const useSettings = () => {
  const [groupedConfig, setGroupedConfig] = useState<
    GroupedSettingsData["grouped_settings"]
  >(DEFAULTS);
  const [systemInfo, setSystemInfo] = useState<SystemInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch settings on mount
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
          users_roles: { ...DEFAULTS.users_roles, ...apiSettings.users_roles },
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
  const updateUsersRoles = (field: keyof UsersRolesSettings, value: any) =>
    updateCategoryField("users_roles", field, value);
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

  // Save all categories (only changed ones are sent via API)
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const categories = Object.keys(groupedConfig) as Array<keyof typeof DEFAULTS>;
      for (const category of categories) {
        await systemConfigAPI.updateGroupedConfig({
          [category]: groupedConfig[category],
        });
      }
      setSuccessMessage("Settings saved successfully");
      fetchSettings(); // refresh to get latest timestamps
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
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

  // Test functions (example for SMTP/SMS)
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
    updateUsersRoles,
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