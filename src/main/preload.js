// preload.js placeholder
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("backendAPI", {
  // 🪟 Window controls
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
  notification: (payload) => ipcRenderer.invoke("notification", payload),
  supplier: (payload) => ipcRenderer.invoke("supplier", payload),
  purchase: (payload) => ipcRenderer.invoke("purchase", payload),
  returnRefund: (payload) => ipcRenderer.invoke("returnRefund", payload),

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

  // Other utilities
  showAbout: () => ipcRenderer.send("show-about"),

  // Setup specific
  skipSetup: () => ipcRenderer.send("skip-setup"),

  // Listeners
  onSetupComplete: (callback) => ipcRenderer.on("setup-complete", callback),

  // Database
  getSetupStatus: () => ipcRenderer.invoke("get-setup-status"),

  // 🛠️ Logging
  log: {
    info: (message, data) => console.log("[Renderer]", message, data),
    error: (message, error) => console.error("[Renderer]", message, error),
    warn: (message, warning) => console.warn("[Renderer]", message, warning),
  },
});
