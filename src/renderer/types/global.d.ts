import type { Sale } from "../api/sale";

export {};

declare global {
  interface Window {
    backendAPI: {
      customerInsights: (payload: any) => Promise<any>;
      dailySales: (payload: any) => Promise<any>;
      financialReports: (payload: any) => Promise<any>;
      inventoryReports: (payload: any) => Promise<any>;
      salesReport: (payload: any) => Promise<any>;
      returnRefundReports: (payload: any) => Promise<any>;
      // 🔑 Activation
      activation: (payload: any) => Promise<any>;
      category: (payload: any) => Promise<any>;
      notification: (payload: any) => Promise<any>;
      notificationLog: (payload: any) => Promise<any>;
      supplier: (payload: any) => Promise<any>;
      purchase: (payload: any) => Promise<any>;
      returnRefund: (payload: any) => Promise<any>;

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
      auditLog: (payload: any) => Promise<any>;
      inventory: (payload: any) => Promise<any>;
      sale: (payload: any) => Promise<any>;
      saleItem: (payload: any) => Promise<any>;
      sync: (payload: any) => Promise<any>;
      // 👤 User & Auth
      user: (payload: any) => Promise<any>;
      userActivity: (payload: any) => Promise<any>;
      priceHistory: (payload: any) => Promise<any>;
      dashboard: (payload: any) => Promise<any>;
      customer: (payload: any) => Promise<any>;
      onCustomerCreated: (callback: (payload: any) => void) => void;
      onCustomerUpdated: (callback: (payload: any) => void) => void;
      onCustomerDeleted: (callback: (payload: any) => void) => void;
      onCustomerBalanceUpdated: (callback: (payload: any) => void) => void;
      loyalty: (payload: any) => Promise<any>;
      // 🪟 Window controls
      windowControl?: (payload: {
        method: string;
        params?: Record<string, any>;
      }) => Promise<{
        status: boolean;
        message: string;
        data?: any;
      }>;
      onWindowMaximized?: (callback: () => void) => void;
      onWindowRestored?: (callback: () => void) => void;
      onWindowMinimized?: (callback: () => void) => void;
      onWindowClosed?: (callback: () => void) => void;
      onWindowResized?: (callback: (bounds: any) => void) => void;
      onWindowMoved?: (callback: (position: any) => void) => void;

      printerPrint: (saleId: number) => Promise<boolean>;
      cashDrawerOpen: (reason?: string) => Promise<boolean>;
      printerTestPrint: () => Promise<boolean>;
      printerReload: () => Promise<{ driverLoaded: boolean; isReady: boolean }>;
      cashDrawerReload: () => Promise<{
        driverLoaded: boolean;
        isOpen: boolean;
      }>;

      printerStatus: () => Promise<{ driverLoaded: boolean; isReady: boolean }>;
      printerAvailable: () => Promise<boolean>;
      cashDrawerStatus: () => Promise<{
        driverLoaded: boolean;
        isOpen: boolean;
      }>;
      cashDrawerAvailable: () => Promise;

      // In global.d.ts, inside Window.backendAPI add:
      barcode: (payload: {
        method: string;
        params?: any;
      }) => Promise<{ status: boolean; message?: string }>;
      onBarcodeScanned: (callback: (barcode: string) => void) => void;

      // 🛠️ Logging
      log: {
        info: (message: string, data?: any) => void;
        error: (message: string, error?: any) => void;
        warn: (message: string, warning?: any) => void;
      };
    };
  }
}
