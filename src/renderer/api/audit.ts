// src/renderer/api/auditLog.ts
// Audit Log API – aligned with backend IPC handlers (auditLog channel)

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on backend entity and service)
// ----------------------------------------------------------------------

export interface AuditLogEntry {
  id: number;
  action: string;               // e.g., 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'
  entity: string;               // e.g., 'Employee', 'PayrollRecord', 'AttendanceLog'
  entityId: string | null;      // ID of the affected entity (as string)
  timestamp: string;            // ISO datetime

  // User information (may be partially populated)
  userId: number | null;
  userType: string | null;      // e.g., 'admin', 'employee', 'system'
  ipAddress: string | null;
  userAgent: string | null;

  // Data snapshots (stored as JSON strings)
  oldData: string | null;       // Previous state (for UPDATE/DELETE)
  newData: string | null;       // New state (for CREATE/UPDATE)
  changes: string | null;       // Description of changes (optional)

  // Legacy/fallback field (if present)
  user?: string | null;         // Sometimes used for username
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface AuditLogsResponse {
  status: boolean;
  message: string;
  data: AuditLogEntry[];        // Array of logs (for listing/search)
}

export interface AuditLogResponse {
  status: boolean;
  message: string;
  data: AuditLogEntry;          // Single log (for getById)
}

export interface ExportAuditLogsResponse {
  status: boolean;
  message: string;
  data: {
    filePath: string;           // Path to the generated CSV file
  };
}

export interface CleanupResponse {
  status: boolean;
  message: string;
  data: {
    deletedCount: number;       // Number of logs deleted
  };
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: {
    id: number;                 // ID of the deleted log
  };
}

// ----------------------------------------------------------------------
// 🧠 AuditLogAPI Class
// ----------------------------------------------------------------------

class AuditLogAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all audit logs with optional filtering and pagination.
   * @param params - Filters: page, limit, entity, action, userId, startDate, endDate
   */
  async getAll(params?: {
    page?: number;
    limit?: number;
    entity?: string;
    action?: string;
    userId?: number;
    startDate?: string;         // ISO date or datetime
    endDate?: string;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      const response = await window.backendAPI.audit({
        method: "getAllAuditLogs",
        params: params || {},
      });

      if (response.status) {
        return response as AuditLogsResponse;
      }
      throw new Error(response.message || "Failed to fetch audit logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs");
    }
  }

  /**
   * Get a single audit log by ID.
   * @param id - Audit log ID
   */
  async getById(id: number): Promise<AuditLogResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      const response = await window.backendAPI.audit({
        method: "getAuditLogById",
        params: { id },
      });

      if (response.status) {
        return response as AuditLogResponse;
      }
      throw new Error(response.message || "Failed to fetch audit log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit log");
    }
  }

  /**
   * Get audit logs for a specific user.
   * @param params - userId, page, limit, startDate, endDate
   */
  async getByUser(params: {
    userId: number;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      const response = await window.backendAPI.audit({
        method: "getAuditLogsByUser",
        params,
      });

      if (response.status) {
        return response as AuditLogsResponse;
      }
      throw new Error(response.message || "Failed to fetch audit logs for user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs for user");
    }
  }

  /**
   * Get audit logs for a specific entity (e.g., 'Employee', 'PayrollRecord').
   * @param params - entity, entityId (optional), page, limit, startDate, endDate
   */
  async getByEntity(params: {
    entity: string;
    entityId?: string | number;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      // Convert entityId to string if needed (backend expects string)
      const payload = {
        ...params,
        entityId: params.entityId != null ? String(params.entityId) : undefined,
      };

      const response = await window.backendAPI.audit({
        method: "getAuditLogsByEntity",
        params: payload,
      });

      if (response.status) {
        return response as AuditLogsResponse;
      }
      throw new Error(response.message || "Failed to fetch audit logs for entity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs for entity");
    }
  }

  /**
   * Get audit logs within a specific date range.
   * @param params - startDate, endDate, page, limit
   */
  async getByDateRange(params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      const response = await window.backendAPI.audit({
        method: "getAuditLogsByDateRange",
        params,
      });

      if (response.status) {
        return response as AuditLogsResponse;
      }
      throw new Error(response.message || "Failed to fetch audit logs by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch audit logs by date range");
    }
  }

  /**
   * Search audit logs with flexible criteria.
   * @param params - searchTerm, entity, entityId, action, userId, startDate, endDate, page, limit
   */
  async search(params: {
    searchTerm?: string;        // Optional general search (may match entity, action, etc.)
    entity?: string;
    entityId?: string | number;
    action?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<AuditLogsResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      const payload = {
        ...params,
        entityId: params.entityId != null ? String(params.entityId) : undefined,
      };

      const response = await window.backendAPI.audit({
        method: "searchAuditLogs",
        params: payload,
      });

      if (response.status) {
        return response as AuditLogsResponse;
      }
      throw new Error(response.message || "Failed to search audit logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search audit logs");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Delete a single audit log by ID (if permitted).
   * @param id - Audit log ID
   * @param user - Optional username (defaults to 'system')
   */
  async delete(id: number, user: string = "system"): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      const response = await window.backendAPI.audit({
        method: "deleteAuditLog",
        params: { id },
        user,
      });

      if (response.status) {
        return response as DeleteResponse;
      }
      throw new Error(response.message || "Failed to delete audit log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete audit log");
    }
  }

  /**
   * Delete audit logs older than a specified date.
   * @param olderThan - ISO date string (e.g., '2023-01-01')
   * @param user - Optional username (defaults to 'system')
   */
  async cleanup(olderThan: string, user: string = "system"): Promise<CleanupResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      const response = await window.backendAPI.audit({
        method: "cleanupOldLogs",
        params: { olderThan },
        user,
      });

      if (response.status) {
        return response as CleanupResponse;
      }
      throw new Error(response.message || "Failed to cleanup old audit logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to cleanup old audit logs");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT METHOD
  // --------------------------------------------------------------------

  /**
   * Export filtered audit logs to CSV.
   * @param params - Filters: entity, entityId, action, userId, startDate, endDate
   */
  async exportCSV(params?: {
    entity?: string;
    entityId?: string | number;
    action?: string;
    userId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<ExportAuditLogsResponse> {
    try {
      if (!window.backendAPI?.audit) {
        throw new Error("Electron API (audit) not available");
      }

      const payload = {
        ...params,
        entityId: params?.entityId != null ? String(params.entityId) : undefined,
      };

      const response = await window.backendAPI.audit({
        method: "exportAuditLogsToCSV",
        params: payload || {},
      });

      if (response.status) {
        return response as ExportAuditLogsResponse;
      }
      throw new Error(response.message || "Failed to export audit logs to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export audit logs to CSV");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.audit);
  }

  /**
   * Quick check if there are any logs for a given entity/ID.
   * @param entity - Entity name
   * @param entityId - Optional entity ID
   */
  async hasLogs(entity: string, entityId?: string | number): Promise<boolean> {
    try {
      const response = await this.getByEntity({
        entity,
        entityId,
        limit: 1,
      });
      return (response.data?.length ?? 0) > 0;
    } catch (error) {
      console.error("Error checking audit logs:", error);
      return false;
    }
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const auditLogAPI = new AuditLogAPI();
export default auditLogAPI;