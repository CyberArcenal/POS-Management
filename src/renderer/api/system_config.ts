// systemConfigAPI.ts - Comprehensive System Configuration API

export interface PublicSystemSettings {
  general: {
    [key: string]: {
      value: string | number | boolean;
      description: string;
    };
  };
  system: {
    site_name: string;
    currency: string;
    cache_timestamp: string;
  };
}

export interface FrontendSystemInfo {
  site_name: string;
  logo: string;
  currency: string;
  admin_email: string;
  tax_enabled: boolean;
  tax_rate: number;
  shipping_threshold_enabled: boolean;
  system_version: string;
}

// 📊 POS Management Setting Types
export const SettingType = {
  GENERAL: "general",
  USERS_ROLES: "users_roles",
  INVENTORY: "inventory",
  SALES: "sales",
  CASHIER: "cashier",
  NOTIFICATIONS: "notifications",
  DATA_REPORTS: "data_reports",
  INTEGRATIONS: "integrations",
  AUDIT_SECURITY: "audit_security",
  USER_SECURITY: "user_security",
} as const;

export type SettingType = (typeof SettingType)[keyof typeof SettingType];

export interface SystemSettingData {
  id: number;
  key: string;
  value: any;
  setting_type: SettingType;
  description?: string;
  isPublic: boolean;
  is_deleted: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedSettingsData {
  settings: SystemSettingData[];
  grouped_settings: {
    general: GeneralSettings;
    users_roles: UsersRolesSettings;
    inventory: InventorySettings;
    sales: SalesSettings;
    cashier: CashierSettings;
    notifications: NotificationsSettings;
    data_reports: DataReportsSettings;
    integrations: IntegrationsSettings;
    audit_security: AuditSecuritySettings;
    user_security: UserSecuritySettings;
  };
  system_info: SystemInfoData;
}

// 1. GENERAL SETTINGS
export interface GeneralSettings {
  company_name?: string;
  store_location?: string;
  default_timezone?: string;
  currency?: string;
  language?: string;
  receipt_footer_message?: string;
  auto_logout_minutes?: number;
  maintenance_mode?: boolean;
  system_version?: string;
}

// 2. USERS & ROLES SETTINGS
export interface UsersRolesSettings {
  roles?: string[]; // Admin, Cashier, Manager
  permissions?: { [role: string]: string[] };
  default_user_role?: string;
  allow_user_registration?: boolean;
  require_approval_for_new_users?: boolean;
}

// 3. INVENTORY SETTINGS
export interface InventorySettings {
  auto_reorder_enabled?: boolean;
  reorder_level_default?: number;
  reorder_qty_default?: number;
  stock_alert_threshold?: number;
  allow_negative_stock?: boolean;
  inventory_sync_enabled?: boolean;
}

// 4. SALES SETTINGS
export interface SalesSettings {
  tax_rate?: number;
  discount_enabled?: boolean;
  max_discount_percent?: number;
  allow_refunds?: boolean;
  refund_window_days?: number;
  loyalty_points_enabled?: boolean;
  loyalty_points_rate?: number; // points per currency unit
}

// 5. CASHIER SETTINGS
export interface CashierSettings {
  enable_cash_drawer?: boolean;
  drawer_open_code?: string;
  enable_receipt_printing?: boolean;
  receipt_printer_type?: string; // thermal, dot-matrix
  enable_barcode_scanning?: boolean;
  enable_touchscreen_mode?: boolean;
  quick_sale_enabled?: boolean;
}

// 6. NOTIFICATIONS SETTINGS
export interface NotificationsSettings {
  email_enabled?: boolean;
  email_smtp_host?: string;
  email_smtp_port?: number;
  email_from_address?: string;
  sms_enabled?: boolean;
  sms_provider?: string;
  push_notifications_enabled?: boolean;
  low_stock_alert_enabled?: boolean;
  daily_sales_summary_enabled?: boolean;
}

// 7. DATA & REPORTS SETTINGS
export interface DataReportsSettings {
  export_formats?: string[]; // CSV, Excel, PDF
  default_export_format?: string;
  auto_backup_enabled?: boolean;
  backup_schedule?: string;
  backup_location?: string;
  data_retention_days?: number;
}

// 8. INTEGRATIONS SETTINGS
export interface IntegrationsSettings {
  accounting_integration_enabled?: boolean;
  accounting_api_url?: string;
  accounting_api_key?: string;
  payment_gateway_enabled?: boolean;
  payment_gateway_provider?: string;
  payment_gateway_api_key?: string;
  webhooks_enabled?: boolean;
  webhooks?: WebhookSetting[];
}

export interface WebhookSetting {
  url: string;
  events: string[];
  enabled: boolean;
  secret?: string;
}

// 9. AUDIT & SECURITY SETTINGS
export interface AuditSecuritySettings {
  audit_log_enabled?: boolean;
  log_retention_days?: number;
  log_events?: string[];
  force_https?: boolean;
  session_encryption_enabled?: boolean;
  gdpr_compliance_enabled?: boolean;
}

// 10. USER SECURITY SETTINGS
export interface UserSecuritySettings {
  max_login_attempts?: number;
  lockout_duration_minutes?: number;
  password_min_length?: number;
  password_require_uppercase?: boolean;
  password_require_numbers?: boolean;
  enable_two_factor_auth?: boolean;
  session_timeout_minutes?: number;
  allow_multiple_sessions?: boolean;
}

export interface SystemInfoData {
  version: string;
  name: string;
  environment: string;
  debug_mode: boolean;
  timezone: string;
  current_time: string;
  setting_types: string[];
}

// 📊 API Responses
export interface SystemConfigResponse {
  status: boolean;
  message: string;
  data: GroupedSettingsData | null;
}

export interface SystemInfoResponse {
  status: boolean;
  message: string;
  data: SystemInfoData | null;
}

export interface SettingsListResponse {
  status: boolean;
  message: string;
  data: SystemSettingData[];
}

export interface SettingResponse {
  status: boolean;
  message: string;
  data: SystemSettingData | null;
}

export interface OperationResponse {
  status: boolean;
  message: string;
  data: {
    id?: number;
    key?: string;
    count?: number;
    [key: string]: any;
  } | null;
}

export interface SettingsStatsResponse {
  status: boolean;
  message: string;
  data: {
    total: number;
    by_type: Record<string, number>;
    public_count: number;
    private_count: number;
    timestamp: string;
  };
}

export interface BulkOperationResponse {
  status: boolean;
  message: string;
  data: Array<{
    success: boolean;
    id?: number;
    key?: string;
    error?: string;
    action?: string;
  }>;
}

// 📝 Request Payloads
export interface CreateSettingData {
  key: string;
  value: any;
  setting_type: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface UpdateSettingData {
  id: number;
  key?: string;
  value?: any;
  setting_type?: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface SetValueByKeyData {
  key: string;
  value: any;
  setting_type?: SettingType;
  description?: string;
  isPublic?: boolean;
}

export interface BulkUpdateData {
  settingsData: Array<{
    id?: number;
    key: string;
    value: any;
    setting_type: SettingType;
    description?: string;
    isPublic?: boolean;
  }>;
}

export interface UpdateCategorySettingsData {
  [category: string]: Record<string, any>;
}

// 🛠️ API Class
class SystemConfigAPI {
  // 🔧 Core Methods

  /**
   * Get all system configuration grouped by category
   */
  async getGroupedConfig(): Promise<SystemConfigResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getGroupedConfig",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to fetch system configuration",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch system configuration");
    }
  }

  /**
   * Update multiple settings by category
   */
  async updateGroupedConfig(
    configData: UpdateCategorySettingsData,
  ): Promise<SystemConfigResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "updateGroupedConfig",
        params: JSON.stringify(configData),
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to update system configuration",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to update system configuration");
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<SystemInfoResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getSystemInfo",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch system information");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch system information");
    }
  }

  /**
   * Get all settings
   */
  async getAllSettings(): Promise<SettingsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getAllSettings",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch all settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch all settings");
    }
  }

  /**
   * Get public settings only
   */
  async getPublicSettings(): Promise<SettingsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getPublicSettings",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch public settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch public settings");
    }
  }

  /**
   * Get setting by key
   */
  async getSettingByKey(
    key: string,
    settingType?: SettingType,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getSettingByKey",
        params: { key, settingType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch setting");
    }
  }

  /**
   * Create a new setting
   */
  async createSetting(
    settingData: CreateSettingData,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "createSetting",
        params: { settingData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create setting");
    }
  }

  /**
   * Update an existing setting
   */
  async updateSetting(
    id: number,
    settingData: UpdateSettingData,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "updateSetting",
        params: { id, settingData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update setting");
    }
  }

  /**
   * Delete a setting (soft delete)
   */
  async deleteSetting(id: number): Promise<OperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "deleteSetting",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete setting");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete setting");
    }
  }

  /**
   * Get settings by type
   */
  async getByType(settingType: SettingType): Promise<SettingsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getByType",
        params: { settingType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch settings by type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch settings by type");
    }
  }

  /**
   * Get value by key
   */
  async getValueByKey(
    key: string,
    defaultValue?: any,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getValueByKey",
        params: { key, defaultValue },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get value by key");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get value by key");
    }
  }

  /**
   * Set value by key (creates or updates)
   */
  async setValueByKey(
    key: string,
    value: any,
    options?: Partial<SetValueByKeyData>,
  ): Promise<SettingResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "setValueByKey",
        params: { key, value, options },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to set value by key");
    } catch (error: any) {
      throw new Error(error.message || "Failed to set value by key");
    }
  }

  /**
   * Bulk update multiple settings
   */
  async bulkUpdate(
    settingsData: BulkUpdateData["settingsData"],
  ): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "bulkUpdate",
        params: { settingsData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update settings");
    }
  }

  /**
   * Bulk delete settings
   */
  async bulkDelete(ids: number[]): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "bulkDelete",
        params: { ids },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk delete settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk delete settings");
    }
  }

  /**
   * Get settings statistics
   */
  async getSettingsStats(): Promise<SettingsStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getSettingsStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get settings statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get settings statistics");
    }
  }

  // 🎯 Category-Specific Methods

  /**
   * Get general settings
   */
  async getGeneralSettings(): Promise<GeneralSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.general) {
        return config.data.grouped_settings.general;
      }
      return {};
    } catch (error) {
      console.error("Error getting general settings:", error);
      return {};
    }
  }

  async getUserSecuritySettings(): Promise<UserSecuritySettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.user_security) {
        return config.data.grouped_settings.user_security;
      }
      return {};
    } catch (error) {
      console.error("Error getting general settings:", error);
      return {};
    }
  }

  /**
   * Get users and roles settings
   */
  async getUsersRolesSettings(): Promise<UsersRolesSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.users_roles) {
        return config.data.grouped_settings.users_roles;
      }
      return {};
    } catch (error) {
      console.error("Error getting users & roles settings:", error);
      return {};
    }
  }

  /**
   * Get notifications settings
   */
  async getNotificationsSettings(): Promise<NotificationsSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.notifications) {
        return config.data.grouped_settings.notifications;
      }
      return {};
    } catch (error) {
      console.error("Error getting notifications settings:", error);
      return {};
    }
  }

  /**
   * Get data and reports settings
   */
  async getDataReportsSettings(): Promise<DataReportsSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.data_reports) {
        return config.data.grouped_settings.data_reports;
      }
      return {};
    } catch (error) {
      console.error("Error getting data & reports settings:", error);
      return {};
    }
  }

  /**
   * Get integrations settings
   */
  async getIntegrationsSettings(): Promise<IntegrationsSettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.integrations) {
        return config.data.grouped_settings.integrations;
      }
      return {};
    } catch (error) {
      console.error("Error getting integrations settings:", error);
      return {};
    }
  }

  /**
   * Get audit and security settings
   */
  async getAuditSecuritySettings(): Promise<AuditSecuritySettings> {
    try {
      const config = await this.getGroupedConfig();
      if (config.data?.grouped_settings?.audit_security) {
        return config.data.grouped_settings.audit_security;
      }
      return {};
    } catch (error) {
      console.error("Error getting audit & security settings:", error);
      return {};
    }
  }

  /**
   * Update general settings
   */
  async updateGeneralSettings(
    settings: Partial<GeneralSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("general", settings);
  }

  /**
   * Update users and roles settings
   */
  async updateUsersRolesSettings(
    settings: Partial<UsersRolesSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("users_roles", settings);
  }

  /**
   * Update notifications settings
   */
  async updateNotificationsSettings(
    settings: Partial<NotificationsSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("notifications", settings);
  }

  /**
   * Update data and reports settings
   */
  async updateDataReportsSettings(
    settings: Partial<DataReportsSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("data_reports", settings);
  }

  /**
   * Update integrations settings
   */
  async updateIntegrationsSettings(
    settings: Partial<IntegrationsSettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("integrations", settings);
  }

  /**
   * Update audit and security settings
   */
  async updateAuditSecuritySettings(
    settings: Partial<AuditSecuritySettings>,
  ): Promise<SystemConfigResponse> {
    return this.updateCategorySettings("audit_security", settings);
  }

  /**
   * Update settings for a specific category
   */
  async updateCategorySettings(
    category: string,
    settings: Record<string, any>,
  ): Promise<SystemConfigResponse> {
    const configData = {
      [category]: settings,
    };
    return this.updateGroupedConfig(configData);
  }

  // 🔧 Utility Methods

  /**
   * Get all settings as a flat object
   */
  async getAllSettingsAsObject(): Promise<Record<string, any>> {
    try {
      const settings = await this.getAllSettings();
      const result: Record<string, any> = {};

      if (settings.data) {
        settings.data.forEach((setting) => {
          result[`${setting.setting_type}.${setting.key}`] = setting.value;
        });
      }

      return result;
    } catch (error) {
      console.error("Error getting all settings as object:", error);
      return {};
    }
  }

  /**
   * Get setting value by category and key
   */
  async getSetting(
    category: string,
    key: string,
    defaultValue?: any,
  ): Promise<any> {
    try {
      const fullKey = `${category}.${key}`;
      const settings = await this.getAllSettingsAsObject();
      return settings[fullKey] ?? defaultValue;
    } catch (error) {
      console.error(`Error getting setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Set setting value by category and key
   */
  async setSetting(
    category: string,
    key: string,
    value: any,
    description?: string,
  ): Promise<SettingResponse> {
    const options = {
      setting_type: category as SettingType,
      description: description || `Setting for ${category}.${key}`,
      isPublic: false,
    };

    return this.setValueByKey(key, value, options);
  }

  /**
   * Check if a setting exists
   */
  async settingExists(
    key: string,
    settingType?: SettingType,
  ): Promise<boolean> {
    try {
      const response = await this.getSettingByKey(key, settingType);
      return response.status && response.data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get boolean setting value
   */
  async getBooleanSetting(
    category: string,
    key: string,
    defaultValue: boolean = false,
  ): Promise<boolean> {
    try {
      const value = await this.getSetting(category, key, defaultValue);

      if (typeof value === "boolean") return value;
      if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
      }
      if (typeof value === "number") {
        return value === 1;
      }

      return defaultValue;
    } catch (error) {
      console.error(`Error getting boolean setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get numeric setting value
   */
  async getNumberSetting(
    category: string,
    key: string,
    defaultValue: number = 0,
  ): Promise<number> {
    try {
      const value = await this.getSetting(category, key, defaultValue);
      const num = parseFloat(value);
      return isNaN(num) ? defaultValue : num;
    } catch (error) {
      console.error(`Error getting number setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get string setting value
   */
  async getStringSetting(
    category: string,
    key: string,
    defaultValue: string = "",
  ): Promise<string> {
    try {
      const value = await this.getSetting(category, key, defaultValue);
      return String(value);
    } catch (error) {
      console.error(`Error getting string setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get array setting value
   */
  async getArraySetting(
    category: string,
    key: string,
    defaultValue: any[] = [],
  ): Promise<any[]> {
    try {
      const value = await this.getSetting(category, key, defaultValue);

      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return defaultValue;
        }
      }

      return defaultValue;
    } catch (error) {
      console.error(`Error getting array setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Get object setting value
   */
  async getObjectSetting(
    category: string,
    key: string,
    defaultValue: object = {},
  ): Promise<object> {
    try {
      const value = await this.getSetting(category, key, defaultValue);

      if (typeof value === "object" && value !== null && !Array.isArray(value))
        return value;
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            !Array.isArray(parsed)
          ) {
            return parsed;
          }
        } catch {
          return defaultValue;
        }
      }

      return defaultValue;
    } catch (error) {
      console.error(`Error getting object setting ${category}.${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaultSettings(): Promise<void> {
    try {
      // Default general settings
      const defaultSettings = [
        {
          key: "company_name",
          value: "POS Management",
          setting_type: SettingType.GENERAL,
          description: "Company name",
        },
        {
          key: "default_timezone",
          value: "Asia/Manila",
          setting_type: SettingType.GENERAL,
          description: "Default timezone",
        },
      ];

      for (const setting of defaultSettings) {
        const exists = await this.settingExists(
          setting.key,
          setting.setting_type,
        );
        if (!exists) {
          await this.createSetting({
            key: setting.key,
            value: setting.value,
            setting_type: setting.setting_type,
            description: setting.description,
            isPublic: false,
          });
        }
      }
    } catch (error) {
      console.error("Error initializing default settings:", error);
    }
  }

  /**
   * Export settings to JSON file
   */
  async exportSettingsToFile(): Promise<string> {
    try {
      const config = await this.getGroupedConfig();
      const jsonStr = JSON.stringify(config.data, null, 2);

      // In a real implementation, you would use the file system API
      // For now, we'll return the JSON string
      return jsonStr;
    } catch (error) {
      console.error("Error exporting settings:", error);
      throw error;
    }
  }

  /**
   * Import settings from JSON file
   */
  async importSettingsFromFile(
    jsonData: string,
  ): Promise<SystemConfigResponse> {
    try {
      const configData = JSON.parse(jsonData);
      return this.updateGroupedConfig(configData);
    } catch (error) {
      console.error("Error importing settings:", error);
      throw error;
    }
  }

  /**
   * Reset settings to default values
   */
  async resetToDefaults(): Promise<SystemConfigResponse> {
    try {
      // Clear all existing settings
      const allSettings = await this.getAllSettings();
      const ids = allSettings.data?.map((setting) => setting.id) || [];

      if (ids.length > 0) {
        await this.bulkDelete(ids);
      }

      // Initialize default settings
      await this.initializeDefaultSettings();

      // Return updated configuration
      return this.getGroupedConfig();
    } catch (error) {
      console.error("Error resetting settings to defaults:", error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<{
    settings_count: number;
    last_updated: string;
    has_errors: boolean;
    categories: string[];
  }> {
    try {
      const stats = await this.getSettingsStats();
      const config = await this.getGroupedConfig();

      return {
        settings_count: stats.data?.total || 0,
        last_updated:
          config.data?.system_info?.current_time || new Date().toISOString(),
        has_errors: false,
        categories: config.data?.system_info?.setting_types || [],
      };
    } catch (error) {
      console.error("Error getting system health:", error);
      return {
        settings_count: 0,
        last_updated: new Date().toISOString(),
        has_errors: true,
        categories: [],
      };
    }
  }

  /**
   * Validate settings configuration
   */
  async validateSettings(): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const config = await this.getGroupedConfig();
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (!config.data) {
        errors.push("No configuration data found");
        return { valid: false, errors, warnings };
      }

      const settings = config.data.settings || [];

      // Check for required settings
      const requiredSettings = [
        { category: "general", key: "company_name" },
        { category: "general", key: "default_timezone" },
        { category: "booking_rules", key: "default_appointment_duration" },
      ];

      for (const required of requiredSettings) {
        const exists = settings.some(
          (s) =>
            s.setting_type === required.category &&
            s.key === required.key &&
            !s.is_deleted,
        );

        if (!exists) {
          warnings.push(
            `Missing setting: ${required.category}.${required.key}`,
          );
        }
      }

      // Validate email settings if email is enabled
      const emailEnabled = await this.getBooleanSetting(
        "notifications",
        "email_enabled",
      );
      if (emailEnabled) {
        const emailSettings = [
          "email_smtp_host",
          "email_smtp_port",
          "email_from_address",
        ];
        for (const setting of emailSettings) {
          const value = await this.getStringSetting("notifications", setting);
          if (!value) {
            warnings.push(
              `Email setting ${setting} is empty but email is enabled`,
            );
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      console.error("Error validating settings:", error);
      return {
        valid: false,
        errors: [`Validation error: ${error}`],
        warnings: [],
      };
    }
  }

  async getPublicSystemSettings(): Promise<PublicSystemSettings> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getPublicSystemSettings",
        params: {},
      });

      if (response.status) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch public settings");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch public settings");
    }
  }

  async getSystemInfoForFrontend(): Promise<{
    system_info: FrontendSystemInfo;
    public_settings: any;
    cache_timestamp: string;
  }> {
    try {
      if (!window.backendAPI || !window.backendAPI.systemConfig) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.systemConfig({
        method: "getSystemInfoForFrontend",
        params: {},
      });

      if (response.status) {
        return response.data;
      }
      throw new Error(response.message || "Failed to fetch system info");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch system info");
    }
  }
}

const systemConfigAPI = new SystemConfigAPI();

export default systemConfigAPI;
