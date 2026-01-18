
// inventoryConfig.js - FIXED VERSION WITH CORRECT SETTING_TYPE
//@ts-check

const { SystemSetting, SettingType } = require("../../entities/systemSettings");
const { AppDataSource } = require("../../main/db/dataSource");

class InventoryConfig {
  constructor() {
    this.settings = {};
  }

  async loadSettings() {
    try {
      const settingRepo = AppDataSource.getRepository(SystemSetting);
      const allSettings = await settingRepo.find();
      
      this.settings = {};
      allSettings.forEach(setting => {
        // @ts-ignore
        this.settings[setting.key] = setting.value;
      });
      
      return this.settings;
    } catch (error) {
      console.error('Failed to load inventory settings:', error);
      return {};
    }
  }

  /**
   * @param {string} key
   */
  async getSetting(key, defaultValue = null) {
    if (Object.keys(this.settings).length === 0) {
      await this.loadSettings();
    }
    
    // @ts-ignore
    return this.settings[key] || defaultValue;
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  async updateSetting(key, value, description = null) {
    try {
      const settingRepo = AppDataSource.getRepository(SystemSetting);
      
      let setting = await settingRepo.findOne({ where: { key } });
      
      if (setting) {
        setting.value = value;
        if (description) setting.description = description;
        setting.updated_at = new Date();
      } else {
        // Create new setting with correct setting_type
        setting = settingRepo.create({
          key,
          value,
          setting_type: SettingType.INTEGRATIONS, // DAPAT MAY SETTING_TYPE
          description: description || `Setting for ${key}`,
          is_public: false,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
      
      await settingRepo.save(setting);
      // @ts-ignore
      this.settings[key] = value;
      
      return setting;
    } catch (error) {
      console.error(`Failed to update setting ${key}:`, error);
      throw error;
    }
  }

  async getSyncConfig() {
    const settings = await this.loadSettings();
    
    return {
      // @ts-ignore
      enabled: settings.inventory_sync_enabled === 'true',
      // @ts-ignore
      autoUpdateOnSale: settings.inventory_auto_update_on_sale === 'true',
      // @ts-ignore
      syncInterval: parseInt(settings.inventory_sync_interval) || 300000,
      // @ts-ignore
      lastSync: settings.inventory_last_sync || null
    };
  }

  async updateLastSync(timestamp = new Date().toISOString()) {
    return await this.updateSetting(
      'inventory_last_sync', 
      timestamp,
      // @ts-ignore
      'Last successful inventory sync timestamp'
    );
  }

  /**
   * @param {any} enabled
   */
  async setSyncEnabled(enabled) {
    return await this.updateSetting(
      'inventory_sync_enabled',
      enabled ? 'true' : 'false',
      // @ts-ignore
      'Enable/disable inventory sync'
    );
  }

  /**
   * @param {any} enabled
   */
  async setAutoUpdateOnSale(enabled) {
    return await this.updateSetting(
      'inventory_auto_update_on_sale',
      enabled ? 'true' : 'false',
      // @ts-ignore
      'Automatically update inventory stock on POS sale'
    );
  }

  /**
   * @param {{ toString: () => any; }} intervalMs
   */
  async setSyncInterval(intervalMs) {
    return await this.updateSetting(
      'inventory_sync_interval',
      intervalMs.toString(),
      // @ts-ignore
      'Sync interval in milliseconds'
    );
  }

  async getFullConfig() {
    const settings = await this.loadSettings();
    
    return {
      // @ts-ignore
      enabled: settings.inventory_sync_enabled === 'true',
      // @ts-ignore
      autoUpdateOnSale: settings.inventory_auto_update_on_sale === 'true',
      // @ts-ignore
      syncInterval: parseInt(settings.inventory_sync_interval) || 300000,
      // @ts-ignore
      lastSync: settings.inventory_last_sync,
      // @ts-ignore
      connectionStatus: settings.inventory_connection_status || 'not_checked',
      allSettings: settings
    };
  }

  async initializeDefaultSettings() {
    const defaultSettings = [
      {
        key: 'inventory_sync_enabled',
        value: 'true',
        description: 'Enable automatic inventory sync',
        setting_type: SettingType.INTEGRATIONS, // DAPAT MAY SETTING_TYPE
        is_public: false
      },
      {
        key: 'inventory_auto_update_on_sale',
        value: 'true',
        description: 'Automatically update inventory stock on POS sale',
        setting_type: SettingType.INTEGRATIONS,
        is_public: false
      },
      {
        key: 'inventory_sync_interval',
        value: '300000',
        description: 'Sync interval in milliseconds (5 minutes)',
        setting_type: SettingType.INTEGRATIONS,
        is_public: false
      },
      {
        key: 'inventory_last_sync',
        value: null,
        description: 'Last successful inventory sync timestamp',
        setting_type: SettingType.INTEGRATIONS,
        is_public: false
      },
      {
        key: 'inventory_connection_status',
        value: 'not_checked',
        description: 'Inventory database connection status',
        setting_type: SettingType.INTEGRATIONS,
        is_public: false
      }
    ];

    const settingRepo = AppDataSource.getRepository(SystemSetting);
    
    for (const defaultSetting of defaultSettings) {
      const existing = await settingRepo.findOne({ 
        where: { key: defaultSetting.key } 
      });
      
      if (!existing) {
        const setting = settingRepo.create({
          ...defaultSetting,
          created_at: new Date(),
          updated_at: new Date()
        });
        
        await settingRepo.save(setting);
        console.log(`Created default setting: ${defaultSetting.key}`);
      }
    }
  }
}

module.exports = new InventoryConfig();