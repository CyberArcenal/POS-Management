// src/renderer/api/notification.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (matching Notification entity)
// ----------------------------------------------------------------------
export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "purchase" | "sale";
  isRead: boolean;
  metadata: Record<string, any> | null;
  createdAt: string; // ISO date string
  updatedAt: string | null;
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>; // e.g., { info: 5, warning: 2 }
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface MarkAllAsReadResponse {
  updatedCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface NotificationsResponse {
  status: boolean;
  message: string;
  data: Notification[];
}

export interface NotificationResponse {
  status: boolean;
  message: string;
  data: Notification;
}

export interface UnreadCountResponseWrapper {
  status: boolean;
  message: string;
  data: UnreadCountResponse;
}

export interface NotificationStatsResponse {
  status: boolean;
  message: string;
  data: NotificationStats;
}

export interface MarkAllAsReadResponseWrapper {
  status: boolean;
  message: string;
  data: MarkAllAsReadResponse;
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: { success: boolean };
}

// ----------------------------------------------------------------------
// 🧠 NotificationAPI Class
// ----------------------------------------------------------------------

class NotificationAPI {
  // --------------------------------------------------------------------
  // 📨 CREATE (internal use only; exposed for completeness)
  // --------------------------------------------------------------------

  /**
   * Create a new notification (usually called internally by backend services).
   * @param data - { userId, title, message, type?, metadata? }
   */
  async create(data: {
    userId: number;
    title: string;
    message: string;
    type?: Notification["type"];
    metadata?: Record<string, any>;
  }): Promise<NotificationResponse> {
    try {
      if (!window.backendAPI?.notification) {
        throw new Error("Electron API (notification) not available");
      }

      const response = await window.backendAPI.notification({
        method: "create",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create notification");
    }
  }

  // --------------------------------------------------------------------
  // 📋 READ OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Get all notifications for the current user with optional filters.
   * @param userId - ID of the user (must be provided)
   * @param params - { isRead?, limit?, offset?, sortBy?, sortOrder? }
   */
  async getAll(
    userId: number,
    params?: {
      isRead?: boolean;
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: "ASC" | "DESC";
    }
  ): Promise<NotificationsResponse> {
    try {
      if (!window.backendAPI?.notification) {
        throw new Error("Electron API (notification) not available");
      }

      const response = await window.backendAPI.notification({
        method: "getAll",
        params: { userId, ...params },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch notifications");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch notifications");
    }
  }

  /**
   * Get a single notification by ID, ensuring it belongs to the user.
   * @param userId - ID of the user
   * @param id - Notification ID
   */
  async getById(userId: number, id: number): Promise<NotificationResponse> {
    try {
      if (!window.backendAPI?.notification) {
        throw new Error("Electron API (notification) not available");
      }

      const response = await window.backendAPI.notification({
        method: "getById",
        params: { userId, id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch notification");
    }
  }

  /**
   * Get unread count for the user.
   * @param userId - ID of the user
   */
  async getUnreadCount(userId: number): Promise<UnreadCountResponseWrapper> {
    try {
      if (!window.backendAPI?.notification) {
        throw new Error("Electron API (notification) not available");
      }

      const response = await window.backendAPI.notification({
        method: "getUnreadCount",
        params: { userId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch unread count");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch unread count");
    }
  }

  /**
   * Get notification statistics for the user.
   * @param userId - ID of the user
   */
  async getStats(userId: number): Promise<NotificationStatsResponse> {
    try {
      if (!window.backendAPI?.notification) {
        throw new Error("Electron API (notification) not available");
      }

      const response = await window.backendAPI.notification({
        method: "getStats",
        params: { userId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch notification stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch notification stats");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ UPDATE OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Mark a specific notification as read (or unread).
   * @param userId - ID of the user
   * @param id - Notification ID
   * @param isRead - true for read, false for unread (default true)
   */
  async markAsRead(
    userId: number,
    id: number,
    isRead: boolean = true
  ): Promise<NotificationResponse> {
    try {
      if (!window.backendAPI?.notification) {
        throw new Error("Electron API (notification) not available");
      }

      const response = await window.backendAPI.notification({
        method: "markAsRead",
        params: { userId, id, isRead },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to mark notification as read");
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark notification as read");
    }
  }

  /**
   * Mark all unread notifications for the user as read.
   * @param userId - ID of the user
   */
  async markAllAsRead(userId: number): Promise<MarkAllAsReadResponseWrapper> {
    try {
      if (!window.backendAPI?.notification) {
        throw new Error("Electron API (notification) not available");
      }

      const response = await window.backendAPI.notification({
        method: "markAllAsRead",
        params: { userId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to mark all as read");
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark all as read");
    }
  }

  // --------------------------------------------------------------------
  // 🗑 DELETE OPERATION
  // --------------------------------------------------------------------

  /**
   * Delete a notification (hard delete).
   * @param userId - ID of the user
   * @param id - Notification ID
   */
  async delete(userId: number, id: number): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.notification) {
        throw new Error("Electron API (notification) not available");
      }

      const response = await window.backendAPI.notification({
        method: "delete",
        params: { userId, id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete notification");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete notification");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the notification API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.notification);
  }

  /**
   * Convenience method to get only unread notifications.
   * @param userId - ID of the user
   * @param limit - Max number of items
   */
  async getUnread(userId: number, limit?: number): Promise<NotificationsResponse> {
    return this.getAll(userId, { isRead: false, limit });
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const notificationAPI = new NotificationAPI();
export default notificationAPI;