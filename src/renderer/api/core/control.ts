// src/renderer/api/control.ts

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DisplayInfo {
  id: number;
  bounds: WindowBounds;
  workArea: WindowBounds;
  scaleFactor: number;
  size: { width: number; height: number };
}

export interface WindowState {
  bounds: WindowBounds;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
  timestamp: number;
}

export interface WindowControlResponse {
  status: boolean;
  message: string;
  data?: any;
}

export interface WindowControlPayload {
  method: string;
  params?: Record<string, any>;
}

class WindowControlAPI {
  // 🔧 BASIC WINDOW CONTROLS
  async minimize(): Promise<WindowControlResponse> {
    return await this.sendRequest("minimize");
  }

  async maximize(): Promise<WindowControlResponse> {
    return await this.sendRequest("maximize");
  }

  async restore(): Promise<WindowControlResponse> {
    return await this.sendRequest("restore");
  }

  async close(): Promise<WindowControlResponse> {
    return await this.sendRequest("close");
  }

  async toggleMaximize(): Promise<WindowControlResponse> {
    return await this.sendRequest("toggleMaximize");
  }

  // 📍 POSITION & SIZE
  async setPosition(x: number, y: number): Promise<WindowControlResponse> {
    return await this.sendRequest("setPosition", { x, y });
  }

  async setSize(width: number, height: number): Promise<WindowControlResponse> {
    return await this.sendRequest("setSize", { width, height });
  }

  async getBounds(): Promise<WindowBounds> {
    const response = await this.sendRequest("getBounds");
    return response.data;
  }

  async center(): Promise<WindowControlResponse> {
    return await this.sendRequest("center");
  }

  // 👁️ VISIBILITY
  async show(): Promise<WindowControlResponse> {
    return await this.sendRequest("show");
  }

  async hide(): Promise<WindowControlResponse> {
    return await this.sendRequest("hide");
  }

  async toggleVisibility(): Promise<WindowControlResponse> {
    return await this.sendRequest("toggleVisibility");
  }

  // 🎯 FOCUS
  async focus(): Promise<WindowControlResponse> {
    return await this.sendRequest("focus");
  }

  async blur(): Promise<WindowControlResponse> {
    return await this.sendRequest("blur");
  }

  async isFocused(): Promise<boolean> {
    const response = await this.sendRequest("isFocused");
    return response.data?.isFocused || false;
  }

  // 🚫 ALWAYS ON TOP
  async setAlwaysOnTop(flag: boolean, level: string = "normal"): Promise<WindowControlResponse> {
    return await this.sendRequest("setAlwaysOnTop", { flag, level });
  }

  async getAlwaysOnTop(): Promise<boolean> {
    const response = await this.sendRequest("getAlwaysOnTop");
    return response.data?.isAlwaysOnTop || false;
  }

  // 📊 STATE INFO
  async isMaximized(): Promise<boolean> {
    const response = await this.sendRequest("isMaximized");
    return response.data?.isMaximized || false;
  }

  async isMinimized(): Promise<boolean> {
    const response = await this.sendRequest("isMinimized");
    return response.data?.isMinimized || false;
  }

  async isNormal(): Promise<boolean> {
    const response = await this.sendRequest("isNormal");
    return response.data?.isNormal || false;
  }

  // 🔧 ADVANCED CONTROLS
  async setResizable(resizable: boolean): Promise<WindowControlResponse> {
    return await this.sendRequest("setResizable", { resizable });
  }

  async setMovable(movable: boolean): Promise<WindowControlResponse> {
    return await this.sendRequest("setMovable", { movable });
  }

  async setMinimizable(minimizable: boolean): Promise<WindowControlResponse> {
    return await this.sendRequest("setMinimizable", { minimizable });
  }

  async setClosable(closable: boolean): Promise<WindowControlResponse> {
    return await this.sendRequest("setClosable", { closable });
  }

  async setFullScreenable(fullScreenable: boolean): Promise<WindowControlResponse> {
    return await this.sendRequest("setFullScreenable", { fullScreenable });
  }

  async setFullScreen(fullscreen: boolean): Promise<WindowControlResponse> {
    return await this.sendRequest("setFullScreen", { fullscreen });
  }

  // 🖥️ MULTI-MONITOR
  async getDisplayInfo(): Promise<DisplayInfo> {
    const response = await this.sendRequest("getDisplayInfo");
    return response.data;
  }

  async moveToDisplay(displayId: number): Promise<WindowControlResponse> {
    return await this.sendRequest("moveToDisplay", { displayId });
  }

  // 💾 STATE PERSISTENCE
  async saveWindowState(): Promise<WindowState> {
    const response = await this.sendRequest("saveWindowState");
    return response.data;
  }

  async loadWindowState(): Promise<WindowControlResponse> {
    return await this.sendRequest("loadWindowState");
  }

  // 🔄 UTILITY METHODS
  async sendRequest(method: string, params?: Record<string, any>): Promise<WindowControlResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.windowControl) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.windowControl({
        method,
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || `Failed to execute ${method}`);
    } catch (error: any) {
      throw new Error(error.message || `Failed to execute ${method}`);
    }
  }

  // 🎯 QUICK ACTIONS (Common combinations)
  async quickMinimize(): Promise<void> {
    await this.minimize();
  }

  async quickMaximizeRestore(): Promise<boolean> {
    const response = await this.toggleMaximize();
    return response.data?.isMaximized || false;
  }

  async toggleFullScreen(): Promise<boolean> {
    const isFullScreen = await this.isFullScreen();
    await this.setFullScreen(!isFullScreen);
    return !isFullScreen;
  }

  async isFullScreen(): Promise<boolean> {
    // You might need to implement this based on your needs
    const bounds = await this.getBounds();
    const display = await this.getDisplayInfo();
    return bounds.width === display.bounds.width && bounds.height === display.bounds.height;
  }

  async snapToLeft(): Promise<void> {
    const display = await this.getDisplayInfo();
    const bounds = await this.getBounds();
    await this.setPosition(display.bounds.x, bounds.y);
    await this.setSize(display.bounds.width / 2, bounds.height);
  }

  async snapToRight(): Promise<void> {
    const display = await this.getDisplayInfo();
    const bounds = await this.getBounds();
    await this.setPosition(display.bounds.x + display.bounds.width / 2, bounds.y);
    await this.setSize(display.bounds.width / 2, bounds.height);
  }

  // 📝 EVENT LISTENERS
  onWindowMaximized(callback: () => void) {
    if (window.backendAPI && window.backendAPI.onWindowMaximized) {
      window.backendAPI.onWindowMaximized(callback);
    }
  }

  onWindowRestored(callback: () => void) {
    if (window.backendAPI && window.backendAPI.onWindowRestored) {
      window.backendAPI.onWindowRestored(callback);
    }
  }

  onWindowMinimized(callback: () => void) {
    if (window.backendAPI && window.backendAPI.onWindowMinimized) {
      window.backendAPI.onWindowMinimized(callback);
    }
  }

  onWindowClosed(callback: () => void) {
    if (window.backendAPI && window.backendAPI.onWindowClosed) {
      window.backendAPI.onWindowClosed(callback);
    }
  }

  onWindowResized(callback: (bounds: WindowBounds) => void) {
    if (window.backendAPI && window.backendAPI.onWindowResized) {
      window.backendAPI.onWindowResized(callback);
    }
  }

  onWindowMoved(callback: (position: { x: number; y: number }) => void) {
    if (window.backendAPI && window.backendAPI.onWindowMoved) {
      window.backendAPI.onWindowMoved(callback);
    }
  }
}

const windowControlAPI = new WindowControlAPI();

export default windowControlAPI;