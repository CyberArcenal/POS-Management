export {};

declare global {
  interface Window {
    backendAPI: {
      // 🔑 Activation
      activation: (payload: any) => Promise<any>;

      // Events
      onActivationCompleted: (callback: (data: any) => void) => void;
      onActivationDeactivated: (callback: () => void) => void;
      onLicenseSynced: (callback: (data: any) => void) => void;

      // ⚙️ SYSTEM CONFIG API
      systemConfig: (payload: { method: string; params?: any }) => Promise<{
        status: boolean;
        message: string;
        data: any;
      }>;

      product: (payload: any) => Promise<any>;
      auditTrail: (payload: any) => Promise<any>;
      inventoryTransaction: (payload: any) => Promise<any>;
      sale: (payload: any) => Promise<any>;
      saleItem: (payload: any) => Promise<any>;
      sync: (payload: any) => Promise<any>;
      // 👤 User & Auth
      user: (payload: any) => Promise<any>;
      userActivity: (payload: any) => Promise<any>;
      priceHistory: (payload: any) => Promise<any>;
      dashboard: (payload: any) => Promise<any>;

      // 🪟 Window controls
      windowControl: (payload: any) => Promise<any>;
      onAppReady: (callback: (...args: any[]) => void) => () => void;

      // Window controls
      minimizeApp: () => Promise<any>;
      maximizeApp: () => Promise<any>;
      closeApp: () => Promise<any>;
      quitApp: () => Promise<any>;

      // Other utilities
      showAbout: () => Promise<any>;

      // Setup specific
      skipSetup: () => Promise<any>;

      // Listeners
      onSetupComplete: (payload: any) => Promise<any>;

      // Database
      getSetupStatus: () => Promise<any>;

      // 🛠️ Logging
      log: {
        info: (message: string, data?: any) => void;
        error: (message: string, error?: any) => void;
        warn: (message: string, warning?: any) => void;
      };
    };
  }
}
