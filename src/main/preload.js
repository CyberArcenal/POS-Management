// preload.js placeholder
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("backendAPI", {
  // 🪟 Window controls
  barcode: (payload) => ipcRenderer.invoke("barcode", payload),
  onBarcodeScanned: (callback) => {
    ipcRenderer.on("barcode-scanned", (event, barcode) => callback(barcode));
  },
  offBarcodeScanned: (callback) => {
    ipcRenderer.removeListener("barcode-scanned", callback);
  },

  windowControl: (payload) => ipcRenderer.invoke("window-control", payload),
  activation: (payload) => ipcRenderer.invoke("activation", payload),
  systemConfig: (payload) => ipcRenderer.invoke("systemConfig", payload),
  product: (payload) => ipcRenderer.invoke("product", payload),
  auditLog: (payload) => ipcRenderer.invoke("auditLog", payload),
  inventory: (payload) => ipcRenderer.invoke("inventory", payload),
  sale: (payload) => ipcRenderer.invoke("sale", payload),
  saleItem: (payload) => ipcRenderer.invoke("sale-item", payload),
  // 👤 User & Auth
  user: (payload) => ipcRenderer.invoke("user", payload),
  sync: (payload) => ipcRenderer.invoke("sync", payload),
  priceHistory: (payload) => ipcRenderer.invoke("price-history", payload),
  dashboard: (payload) => ipcRenderer.invoke("dashboard", payload),

  customer: (payload) => ipcRenderer.invoke("customer", payload),
  loyalty: (payload) => ipcRenderer.invoke("loyalty", payload),

  category: (payload) => ipcRenderer.invoke("category", payload),
  notificationLog: (payload) => ipcRenderer.invoke("notificationLog", payload),
  notification: (payload) => ipcRenderer.invoke("notification", payload),
  supplier: (payload) => ipcRenderer.invoke("supplier", payload),
  purchase: (payload) => ipcRenderer.invoke("purchase", payload),
  returnRefund: (payload) => ipcRenderer.invoke("returnRefund", payload),

  customerInsights: (payload) =>
    ipcRenderer.invoke("customerInsights", payload),
  dailySales: (payload) => ipcRenderer.invoke("dailySales", payload),
  financialReports: (payload) =>
    ipcRenderer.invoke("financialReports", payload),
  inventoryReports: (payload) =>
    ipcRenderer.invoke("inventoryReports", payload),
  salesReport: (payload) => ipcRenderer.invoke("salesReport", payload),
  returnRefundReports: (payload) =>
    ipcRenderer.invoke("returnRefundReports", payload),

  // 🎯 Event listeners
  onAppReady: (callback) => {
    ipcRenderer.on("app-ready", callback);
    return () => ipcRenderer.removeListener("app-ready", callback);
  },
  on: (event, callback) => {
    ipcRenderer.on(event, callback);
    return () => ipcRenderer.removeListener(event, callback);
  },

  windowControl: (payload) => ipcRenderer.invoke("window-control", payload),
  onWindowMaximized: (callback) =>
    ipcRenderer.on("window:maximized", () => callback()),
  onWindowRestored: (callback) =>
    ipcRenderer.on("window:restored", () => callback()),
  onWindowMinimized: (callback) =>
    ipcRenderer.on("window:minimized", () => callback()),
  onWindowClosed: (callback) =>
    ipcRenderer.on("window:closed", () => callback()),
  onWindowResized: (callback) =>
    ipcRenderer.on("window:resized", (event, bounds) => callback(bounds)),
  onWindowMoved: (callback) =>
    ipcRenderer.on("window:moved", (event, position) => callback(position)),

  printerReload: () => ipcRenderer.invoke("printer:reload"),
  cashDrawerReload: () => ipcRenderer.invoke("cashDrawer:reload"),

  printerStatus: () => ipcRenderer.invoke("printer:get-status"),
  printerAvailable: () => ipcRenderer.invoke("printer:is-available"),
  cashDrawerStatus: () => ipcRenderer.invoke("cashDrawer:get-status"),
  cashDrawerAvailable: () => ipcRenderer.invoke("cashDrawer:is-available"),
  printerPrint: (sale) => ipcRenderer.invoke("printer:print", sale),
  cashDrawerOpen: (reason = "sale") =>
    ipcRenderer.invoke("cashDrawer:open", reason),
  printerTestPrint: () => ipcRenderer.invoke("printer:test-print"),

  // 🛠️ Logging
  log: {
    info: (message, data) => console.log("[Renderer]", message, data),
    error: (message, error) => console.error("[Renderer]", message, error),
    warn: (message, warning) => console.warn("[Renderer]", message, warning),
  },
});
