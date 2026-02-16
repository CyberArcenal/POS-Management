// Similar structure to activation.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------
export interface AuditLogEntry {
  id: number;
  action: string;
  entity: string;
  entityId: number;
  timestamp: string;
  user: string | null;
  // Additional optional fields that may be present in detailed views
  userId?: number;
  oldData?: string | null;
  newData?: string | null;
  changes?: string;
  ipAddress?: string;
  userAgent?: string;
  userType?: string;
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogSummary {
  total: number;
  byAction: Array<{ action: string; count: string | number }>;
  byEntity: Array<{ entity: string; count: string | number }>;
  byUser: Array<{ user: string; count: string | number }>;
}

export interface AuditLogStats {
  total: number;
  avgPerDay: string | number;
  mostActiveDay: { day: string; count: string | number } | null;
  uniqueUsers: number;
  dateRange?: { start: string; end: string } | null;
}

export interface AuditLogCounts {
  byAction: Array<{ action: string; count: string | number }>;
  byEntity: Array<{ entity: string; count: string | number }>;
  byUser: Array<{ user: string; count: string | number }>;
}

export interface TopActivities {
  topActions: Array<{ action: string; count: string | number }>;
  topEntities: Array<{ entity: string; count: string | number }>;
  topUsers: Array<{ user: string; count: string | number }>;
}

export interface FileOperationResult {
  filePath: string;
}

export interface AuditReportResult {
  filePath: string;
  format: string;
  entryCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface AuditLogsResponse {
  status: boolean;
  message: string;
  data: PaginatedAuditLogs;
}

export interface AuditLogResponse {
  status: boolean;
  message: string;
  data: AuditLogEntry;
}

export interface AuditLogSummaryResponse {
  status: boolean;
  message: string;
  data: AuditLogSummary;
}

export interface AuditLogStatsResponse {
  status: boolean;
  message: string;
  data: AuditLogStats;
}

export interface AuditLogCountsResponse {
  status: boolean;
  message: string;
  data: AuditLogCounts;
}

export interface TopActivitiesResponse {
  status: boolean;
  message: string;
  data: TopActivities;
}

export interface RecentActivityResponse {
  status: boolean;
  message: string;
  data: {
    items: AuditLogEntry[];
    limit: number;
  };
}

export interface ExportAuditLogsResponse {
  status: boolean;
  message: string;
  data: FileOperationResult;
}

export interface GenerateAuditReportResponse {
  status: boolean;
  message: string;
  data: AuditReportResult;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

// ----------------------------------------------------------------------
// 🧠 AuditAPI Class
// ----------------------------------------------------------------------

class AuditAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all audit logs with pagination
   * @param params.page - Page number (1-based)
   * @param params.limit - Items per page (default 50, max 100)
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAllAuditLogs",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs");
    }
  }

  /**
   * Get a single audit log by ID
   * @param id - Audit log ID
   */
  async getById(id: number): Promise<AuditLogResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAuditLogById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit log");
    }
  }

  /**
   * Get audit logs filtered by entity
   * @param params.entity - Entity name (e.g., 'Room', 'Booking')
   * @param params.entityId - Optional specific entity ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByEntity(params: {
    entity: string;
    entityId?: number;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAuditLogsByEntity",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit logs by entity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs by entity");
    }
  }

  /**
   * Get audit logs filtered by user
   * @param params.user - Username
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByUser(params: {
    user: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAuditLogsByUser",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit logs by user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs by user");
    }
  }

  /**
   * Get audit logs filtered by action
   * @param params.action - Action name (e.g., 'CREATE', 'UPDATE')
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByAction(params: {
    action: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAuditLogsByAction",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit logs by action");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs by action");
    }
  }

  /**
   * Get audit logs within a date range
   * @param params.startDate - ISO date string
   * @param params.endDate - ISO date string
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByDateRange(params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAuditLogsByDateRange",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit logs by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs by date range");
    }
  }

  /**
   * Get summary statistics of audit logs
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogSummaryResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAuditLogSummary",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit summary");
    }
  }

  /**
   * Get detailed statistics of audit logs
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogStatsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAuditLogStats",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit stats");
    }
  }

  /**
   * Search audit logs with flexible filters
   * @param params - Supports searchTerm, entity, user, action, date range, pagination
   */
  async search(params: {
    searchTerm?: string;
    entity?: string;
    user?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "searchAuditLogs",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search audit logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search audit logs");
    }
  }

  /**
   * Get aggregated counts grouped by action, entity, and user
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getCounts(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogCountsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getAuditLogCounts",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch audit counts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit counts");
    }
  }

  /**
   * Get top activities (most frequent actions, entities, users)
   * @param params.limit - Number of top items to return (default 10, max 20)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getTopActivities(params?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TopActivitiesResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getTopActivities",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch top activities");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch top activities");
    }
  }

  /**
   * Get recent activity (latest audit logs)
   * @param limit - Number of entries (default 10, max 50)
   */
  async getRecentActivity(limit?: number): Promise<RecentActivityResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "getRecentActivity",
        params: { limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch recent activity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch recent activity");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS (read‑only file generation)
  // --------------------------------------------------------------------

  /**
   * Export filtered audit logs to CSV file
   * @param params - Same filters as search() (searchTerm, entity, user, action, date range)
   * @param params.limit - Max rows to export (default 5000, max 10000)
   */
  async exportCSV(params?: {
    searchTerm?: string;
    entity?: string;
    user?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<ExportAuditLogsResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "exportAuditLogs",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export audit logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export audit logs");
    }
  }

  /**
   * Generate a comprehensive audit report (JSON or HTML)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   * @param params.format - 'json' or 'html' (default 'json')
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
    format?: "json" | "html";
  }): Promise<GenerateAuditReportResponse> {
    try {
      if (!window.backendAPI?.auditLog) {
        throw new Error("Electron API (auditlog) not available");
      }

      const response = await window.backendAPI.auditLog({
        method: "generateAuditReport",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate audit report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate audit report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS (simplified wrappers)
  // --------------------------------------------------------------------

  /**
   * Check if a specific entity has any audit logs
   * @param entity - Entity name
   * @param entityId - Optional entity ID
   */
  async hasLogs(entity: string, entityId?: number): Promise<boolean> {
    try {
      const response = await this.getByEntity({ entity, entityId, limit: 1 });
      return response.data.total > 0;
    } catch (error) {
      console.error("Error checking audit logs:", error);
      return false;
    }
  }

  /**
   * Get the latest audit log entry for an entity
   * @param entity - Entity name
   * @param entityId - Entity ID
   */
  async getLatestEntry(entity: string, entityId: number): Promise<AuditLogEntry | null> {
    try {
      const response = await this.getByEntity({ entity, entityId, limit: 1, page: 1 });
      return response.data.items[0] || null;
    } catch (error) {
      console.error("Error fetching latest audit entry:", error);
      return null;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.auditLog);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const auditAPI = new AuditAPI();
export default auditAPI;