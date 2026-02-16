// src/renderer/api/notificationLog.ts
// Refactored – fully aligned with backend NotificationLogService

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (client‑side normalized shape)
// ----------------------------------------------------------------------

export interface NotificationLogEntry {
  id: number;
  recipient_email: string;
  subject: string | null;
  payload: string | null;
  status: "queued" | "sent" | "failed" | "resend";
  error_message: string | null;
  retry_count: number;
  resend_count: number;
  sent_at: string | null;
  last_error_at: string | null;
  created_at: string;
  updated_at: string;
  booking?: {
    id: number;
    checkInDate?: string;
    checkOutDate?: string;
    guest?: { fullName?: string; email?: string };
  } | null;
}

export interface PaginatedNotifications {
  items: NotificationLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationStats {
  total: number;
  byStatus: Record<string, number>;
  avgRetryFailed: number;
  last24h: number;
}

// ----------------------------------------------------------------------
// 📨 Client‑side response interfaces (normalized, message always present)
// ----------------------------------------------------------------------

export interface NotificationsResponse {
  status: boolean;
  message: string;
  data: PaginatedNotifications;
}

export interface NotificationResponse {
  status: boolean;
  message?: string;
  data: NotificationLogEntry;
}

export interface NotificationStatsResponse {
  status: boolean;
  message?: string;
  data: NotificationStats;
}

export interface NotificationActionResponse {
  status: boolean;
  message?: string;
  data?: any;
}

// ----------------------------------------------------------------------
// 🧠 Internal types – match actual backend IPC responses (message optional)
// ----------------------------------------------------------------------

interface BackendPaginatedResponse {
  status: boolean;
  message?: string;
  data: NotificationLogEntry[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface BackendSingleResponse {
  status: boolean;
  message?: string;
  data: NotificationLogEntry;
}

interface BackendStatsResponse {
  status: boolean;
  message?: string;
  data: NotificationStats;
}

interface BackendActionResponse {
  status: boolean;
  message?: string;
  data?: any;
}

// ----------------------------------------------------------------------
// 🧠 NotificationLogAPI Class
// ----------------------------------------------------------------------

class NotificationLogAPI {
  /**
   * Internal IPC caller – always returns a consistent response object
   * with a `message` string (never undefined). The generic type T
   * allows message to be optional, but the returned object will always
   * include a string message.
   */
  private async call<T extends { status: boolean; message?: string; data?: any }>(
    method: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    // Fallback when Electron API is missing
    if (!window.backendAPI?.notification) {
      return {
        status: false,
        message: "Electron API (notification) not available",
        data: null,
      } as T;
    }

    try {
      const response = await window.backendAPI.notification({ method, params });

      // Handle malformed or non‑object response
      if (!response || typeof response !== "object") {
        return {
          status: false,
          message: "Invalid response format from backend",
          data: null,
        } as T;
      }

      // ----- TRANSFORM PAGINATED RESPONSE -----
      if ("pagination" in response && Array.isArray(response.data)) {
        const paginated = response as BackendPaginatedResponse;
        if (paginated.status && paginated.pagination) {
          const { page, limit, total, pages } = paginated.pagination;
          return {
            status: true,
            message: "", // ensure message is always present
            data: {
              items: paginated.data,
              page,
              limit,
              total,
              totalPages: pages,
            },
          } as T;
        }
        // Failed paginated response – preserve original message or fallback
        return {
          status: false,
          message: paginated.message ?? "Unknown error",
          data: { items: [], total: 0, page: 1, limit: 50, totalPages: 0 },
        } as T;
      }

      // ----- NON‑PAGINATED RESPONSE -----
      // Guarantee a `message` string (backend might omit it on success)
      const enrichedResponse = {
        ...response,
        message: response.message ?? "",
      };

      return enrichedResponse as T;
    } catch (error: any) {
      return {
        status: false,
        message: error?.message ?? "Unknown error calling notification API",
        data: null,
      } as T;
    }
  }

  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  async getAll(params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<NotificationsResponse> {
    const response = await this.call<BackendPaginatedResponse>("getAllNotifications", params || {});
    // The call method already transformed paginated responses into NotificationsResponse shape
    return response as unknown as NotificationsResponse;
  }

  async getById(id: number): Promise<NotificationResponse> {
    return this.call<BackendSingleResponse>("getNotificationById", { id });
  }

  async getByRecipient(params: {
    recipient_email: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const response = await this.call<BackendPaginatedResponse>("getNotificationsByRecipient", params);
    return response as unknown as NotificationsResponse;
  }

  async getByBooking(params: {
    bookingId: number;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const response = await this.call<BackendPaginatedResponse>("getNotificationsByBooking", params);
    return response as unknown as NotificationsResponse;
  }

  async search(params: {
    keyword: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const response = await this.call<BackendPaginatedResponse>("searchNotifications", params);
    return response as unknown as NotificationsResponse;
  }

  async getByStatus(params: {
    status: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    return this.getAll({ ...params });
  }

  // --------------------------------------------------------------------
  // 📊 STATISTICS
  // --------------------------------------------------------------------

  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<NotificationStatsResponse> {
    return this.call<BackendStatsResponse>("getNotificationStats", params || {});
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  async delete(id: number): Promise<NotificationActionResponse> {
    return this.call<BackendActionResponse>("deleteNotification", { id });
  }

  async updateStatus(params: {
    id: number;
    status: string;
    errorMessage?: string | null;
  }): Promise<NotificationActionResponse> {
    return this.call<BackendActionResponse>("updateNotificationStatus", params);
  }

  // --------------------------------------------------------------------
  // 🔄 RETRY / RESEND OPERATIONS
  // --------------------------------------------------------------------

  async retryFailed(id: number): Promise<NotificationActionResponse> {
    return this.call<BackendActionResponse>("retryFailedNotification", { id });
  }

  async retryAllFailed(params?: {
    filters?: {
      recipient_email?: string;
      createdBefore?: string;
    };
  }): Promise<NotificationActionResponse> {
    return this.call<BackendActionResponse>("retryAllFailed", params || {});
  }

  async resend(id: number): Promise<NotificationActionResponse> {
    return this.call<BackendActionResponse>("resendNotification", { id });
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  async hasLogs(recipient_email: string): Promise<boolean> {
    const response = await this.getByRecipient({ recipient_email, limit: 1 });
    return response.status && response.data.total > 0;
  }

  async getLatestByRecipient(recipient_email: string): Promise<NotificationLogEntry | null> {
    const response = await this.getByRecipient({ recipient_email, limit: 1, page: 1 });
    if (response.status && response.data.items.length > 0) {
      return response.data.items[0];
    }
    return null;
  }

  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.notification);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const notificationLogAPI = new NotificationLogAPI();
export default notificationLogAPI;