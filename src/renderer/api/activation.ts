// activationAPI.ts - SIMILAR STRUCTURE TO activationOld.ts
export interface ActivationStatusData {
  isActivated: boolean;
  status: 'active' | 'trial' | 'grace_period' | 'expired' | 'inactive';
  remainingDays: number;
  activatedAt: string | null;
  expiresAt: string | null;
  trialStartedAt: string | null;
  deviceId: string;
  licenseType?: string;
  features?: string[];
  limits?: Record<string, number>;
}

export interface DeviceInfoData {
  deviceId: string;
  deviceName: string;
  platform: string;
  arch: string;
  hostname: string;
  macAddress: string;
  serialNumber: string | null;
  cpuId: string | null;
}

export interface ActivationStatsData {
  totalActivations: number;
  activeCount: number;
  trialCount: number;
  expiredCount: number;
  gracePeriodCount: number;
}

export interface ActivationResult {
  success: boolean;
  message: string;
  activationKey?: string;
  expiresAt?: string;
  data?: any;
}

export interface ActivationRequestData {
  key: string;
  isOnline?: boolean;
}

export interface ActivationCheckResponse {
  status: boolean;
  message: string;
  data: ActivationStatusData;
}

export interface DeviceInfoResponse {
  status: boolean;
  message: string;
  data: DeviceInfoData;
}

export interface ActivationStatsResponse {
  status: boolean;
  message: string;
  data: ActivationStatsData;
}

export interface ActivationResponse {
  status: boolean;
  message: string;
  data: ActivationResult;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

export interface FileOperationResponse {
  status: boolean;
  message: string;
  data: {
    filePath: string;
  };
}

export interface ActivationRequirementResponse {
  status: boolean;
  message: string;
  data: {
    requiresActivation: boolean;
    canContinue: boolean;
    message: string;
  };
}

export interface RemainingDaysResponse {
  status: boolean;
  message: string;
  data: {
    remainingDays: number;
    status: string;
    error?: string;
  };
}

export interface FeatureCheckResponse {
  status: boolean;
  message: string;
  data: boolean;
}

export interface LimitCheckResponse {
  status: boolean;
  message: string;
  data: boolean;
}

export interface ActivationPayload {
  method: string;
  params?: Record<string, any>;
}

class ActivationAPI {
  // 🔎 Read-only methods
  async check(): Promise<ActivationCheckResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "check",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check activation status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check activation status");
    }
  }

    async getDeviceInfo(): Promise<DeviceInfoResponse> {
      try {
        if (!window.backendAPI || !window.backendAPI.activation) {
          throw new Error("Electron API not available");
        }
  
        const response = await window.backendAPI.activation({
          method: "getDeviceInfo",
          params: {},
        });
  
        if (response.status) {
          return response;
        }
        throw new Error(response.message || "Failed to get device info");
      } catch (error: any) {
        throw new Error(error.message || "Failed to get device info");
      }
    }


  async getRemainingDays(): Promise<RemainingDaysResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "getRemainingDays",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get remaining days");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get remaining days");
    }
  }

  async validateKeyFormat(key: string): Promise<ValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "validateKeyFormat",
        params: { key },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate key format");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate key format");
    }
  }

  async getStats(): Promise<ActivationStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "getStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get activation stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get activation stats");
    }
  }

  async requiresActivation(): Promise<ActivationRequirementResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "requiresActivation",
        params: {},
      });

      if (response.status) {
        console.log(response)
        return response;
      }
      throw new Error(response.message || "Failed to check activation requirement");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check activation requirement");
    }
  }

  async getInfo(): Promise<ActivationCheckResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "getInfo",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get activation info");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get activation info");
    }
  }

  async checkFeature(feature: string): Promise<FeatureCheckResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "checkFeature",
        params: { feature },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check feature");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check feature");
    }
  }

  async checkLimit(limit: string, count: number = 0): Promise<LimitCheckResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "checkLimit",
        params: { limit, count },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check limit");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check limit");
    }
  }

  // 🔒 Mutating methods
  async activate(key: string, isOnline: boolean = true): Promise<ActivationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "activate",
        params: { key, isOnline },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to activate");
    } catch (error: any) {
      throw new Error(error.message || "Failed to activate");
    }
  }

  async deactivate(): Promise<ActivationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "deactivate",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to deactivate");
    } catch (error: any) {
      throw new Error(error.message || "Failed to deactivate");
    }
  }

  async backup(): Promise<FileOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "backup",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create backup");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create backup");
    }
  }

  async restore(): Promise<ActivationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "restore",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to restore activation");
    } catch (error: any) {
      throw new Error(error.message || "Failed to restore activation");
    }
  }

  async generateRequestFile(): Promise<FileOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "generateRequestFile",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate request file");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate request file");
    }
  }

  async importResponseFile(): Promise<ActivationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "importResponseFile",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to import response file");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import response file");
    }
  }

  async sync(): Promise<ActivationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.activation) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.activation({
        method: "sync",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to sync");
    } catch (error: any) {
      throw new Error(error.message || "Failed to sync");
    }
  }

  // Utility methods
  async checkAndRequireActivation(): Promise<boolean> {
    try {
      const requirement = await this.requiresActivation();
      return requirement.data.requiresActivation && !requirement.data.canContinue;
    } catch (error) {
      console.error("Error checking activation requirement:", error);
      return false; // Default to allowing access if check fails
    }
  }

  async getActivationStatus(): Promise<ActivationStatusData | null> {
    try {
      const response = await this.check();
      return response.data;
    } catch (error) {
      console.error("Error getting activation status:", error);
      return null;
    }
  }

  async isActivated(): Promise<boolean> {
    try {
      const status = await this.getActivationStatus();
      return status?.status === 'active' || status?.status === 'trial';
    } catch (error) {
      console.error("Error checking if activated:", error);
      return false;
    }
  }

  async getDaysRemaining(): Promise<number> {
    try {
      const response = await this.getRemainingDays();
      return response.data.remainingDays || 0;
    } catch (error) {
      console.error("Error getting days remaining:", error);
      return 0;
    }
  }

  async validateAndActivate(key: string): Promise<ActivationResponse> {
    try {
      const validation = await this.validateKeyFormat(key);
      if (!validation.data) {
        return {
          status: false,
          message: "Invalid key format (XXXX-XXXX-XXXX-XXXX)",
          data: {
            success: false,
            message: "Invalid key format (XXXX-XXXX-XXXX-XXXX)"
          }
        };
      }
      
      return await this.activate(key);
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Validation failed",
        data: {
          success: false,
          message: error.message || "Validation failed"
        }
      };
    }
  }

  async hasFeature(feature: string): Promise<boolean> {
    try {
      const result = await this.checkFeature(feature);
      return result.data || false;
    } catch (error) {
      console.error("Error checking feature:", error);
      return false;
    }
  }

  async isWithinLimit(limit: string, count: number = 0): Promise<boolean> {
    try {
      const result = await this.checkLimit(limit, count);
      return result.data || true;
    } catch (error) {
      console.error("Error checking limit:", error);
      return true;
    }
  }

  // Event listeners
  onActivationCompleted(callback: (data: any) => void) {
    if (window.backendAPI && window.backendAPI.onActivationCompleted) {
      window.backendAPI.onActivationCompleted(callback);
    }
  }

  onActivationDeactivated(callback: () => void) {
    if (window.backendAPI && window.backendAPI.onActivationDeactivated) {
      window.backendAPI.onActivationDeactivated(callback);
    }
  }
}

const activationAPI = new ActivationAPI();

export default activationAPI;