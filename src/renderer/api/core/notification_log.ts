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
  message: string;
  data: NotificationLogEntry;
}

export interface NotificationStatsResponse {
  status: boolean;
  message: string;
  data: NotificationStats;
}

export interface NotificationActionResponse {
  status: boolean;
  message: string;
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
   * Internal IPC caller – returns a raw backend response.
   * @throws if IPC is not available or response is malformed.
   */
  private async callRaw<
    T extends { status: boolean; message?: string; data?: any },
  >(method: string, params: Record<string, any> = {}): Promise<T> {
    if (!window.backendAPI?.notificationLog) {
      throw new Error("Electron API (notification) not available");
    }

    const response = await window.backendAPI.notificationLog({ method, params });

    if (!response || typeof response !== "object") {
      throw new Error("Invalid response format from backend");
    }

    return response as T;
  }

  /**
   * Normalizes a backend response to always include a message string.
   */
  private normalizeResponse<
    T extends { status: boolean; message?: string; data?: any },
  >(response: T): T & { message: string } {
    return {
      ...response,
      message: response.message ?? "",
    };
  }

  /**
   * Transforms a paginated backend response into NotificationsResponse.
   */
  private toNotificationsResponse(
    response: BackendPaginatedResponse,
  ): NotificationsResponse {
    const normalized = this.normalizeResponse(response);
    if (normalized.status && response.pagination) {
      const { page, limit, total, pages } = response.pagination;
      return {
        ...normalized,
        data: {
          items: response.data,
          page,
          limit,
          total,
          totalPages: pages,
        },
      };
    }
    // Failed response – return empty pagination
    return {
      ...normalized,
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
      },
    };
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
    const raw = await this.callRaw<BackendPaginatedResponse>(
      "getAllNotifications",
      params || {},
    );
    return this.toNotificationsResponse(raw);
  }

  async getById(id: number): Promise<NotificationResponse> {
    const raw = await this.callRaw<BackendSingleResponse>(
      "getNotificationById",
      { id },
    );
    return this.normalizeResponse(raw);
  }

  async getByRecipient(params: {
    recipient_email: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<BackendPaginatedResponse>(
      "getNotificationsByRecipient",
      params,
    );
    return this.toNotificationsResponse(raw);
  }

  async search(params: {
    keyword: string;
    page?: number;
    limit?: number;
  }): Promise<NotificationsResponse> {
    const raw = await this.callRaw<BackendPaginatedResponse>(
      "searchNotifications",
      params,
    );
    return this.toNotificationsResponse(raw);
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
    const raw = await this.callRaw<BackendStatsResponse>(
      "getNotificationStats",
      params || {},
    );
    return this.normalizeResponse(raw);
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATIONS
  // --------------------------------------------------------------------

  async delete(id: number): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<BackendActionResponse>(
      "deleteNotification",
      { id },
    );
    return this.normalizeResponse(raw);
  }

  async updateStatus(params: {
    id: number;
    status: string;
    errorMessage?: string | null;
  }): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<BackendActionResponse>(
      "updateNotificationStatus",
      params,
    );
    return this.normalizeResponse(raw);
  }

  // --------------------------------------------------------------------
  // 🔄 RETRY / RESEND OPERATIONS
  // --------------------------------------------------------------------

  async retryFailed(id: number): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<BackendActionResponse>(
      "retryFailedNotification",
      { id },
    );
    return this.normalizeResponse(raw);
  }

  async retryAllFailed(params?: {
    filters?: {
      recipient_email?: string;
      createdBefore?: string;
    };
  }): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<BackendActionResponse>(
      "retryAllFailed",
      params || {},
    );
    return this.normalizeResponse(raw);
  }

  async resend(id: number): Promise<NotificationActionResponse> {
    const raw = await this.callRaw<BackendActionResponse>(
      "resendNotification",
      { id },
    );
    return this.normalizeResponse(raw);
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  async hasLogs(recipient_email: string): Promise<boolean> {
    const response = await this.getByRecipient({ recipient_email, limit: 1 });
    return response.status && response.data.total > 0;
  }

  async getLatestByRecipient(
    recipient_email: string,
  ): Promise<NotificationLogEntry | null> {
    const response = await this.getByRecipient({
      recipient_email,
      limit: 1,
      page: 1,
    });
    if (response.status && response.data.items.length > 0) {
      return response.data.items[0];
    }
    return null;
  }

  isAvailable(): boolean {
    return !!window.backendAPI?.notificationLog;
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const notificationLogAPI = new NotificationLogAPI();
export default notificationLogAPI;
