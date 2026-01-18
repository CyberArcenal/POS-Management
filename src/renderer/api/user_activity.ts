// user-activity.ts - Frontend API for User Activity
export interface UserActivity {
  id: number;
  user_id: number;
  action: string;
  entity: string | null;
  entity_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  details: string | null;
  created_at: string;
  user?: {
    id: number;
    username: string;
    display_name?: string;
    role?: string;
  };
}

export interface ActivityFilters {
  userId?: number;
  action?: string;
  entity?: string;
  entityId?: number;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
  search?: string;
}

export interface PaginatedActivityResponse {
  status: boolean;
  message: string;
  data: {
    activities: UserActivity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasMore: boolean;
    };
  };
}

export interface ActivityStats {
  total_activities: string;
  unique_users: string;
  unique_actions: string;
  unique_entities: string;
  top_actions: Array<{
    activity_action: string;
    count: string;
  }>;
  top_users: Array<{
    activity_user_id: number;
    user_username: string;
    activity_count: string;
  }>;
}

export interface ActivityStatsResponse {
  status: boolean;
  message: string;
  data: ActivityStats;
}

export interface ActivityTimelineItem {
  period: string;
  activity_count: string;
  user_count: string;
}

export interface ActivityTimelineResponse {
  status: boolean;
  message: string;
  data: {
    timeline: ActivityTimelineItem[];
    startDate: string;
    endDate: string;
    groupBy: string;
  };
}

export interface UserActivitySummary {
  user_id: number;
  period_days: number;
  total_activities: number;
  summary_by_action: Array<{
    activity_action: string;
    count: string;
    last_activity: string;
  }>;
  most_active_day: {
    date: string;
    count: string;
  } | null;
}

export interface UserActivitySummaryResponse {
  status: boolean;
  message: string;
  data: UserActivitySummary;
}

export interface SystemAuditLogResponse {
  status: boolean;
  message: string;
  data: {
    audit_log: UserActivity[];
    count: number;
    start_date: string;
    end_date: string;
    actions_filtered: string[];
  };
}

export interface SearchActivitiesResponse {
  status: boolean;
  message: string;
  data: {
    activities: UserActivity[];
    count: number;
    query: string;
  };
}

export interface ActivitiesResponse {
  status: boolean;
  message: string;
  data: UserActivity[];
}

export interface ActivityPayload {
  method: string;
  params?: Record<string, any>;
}

class UserActivityAPI {
  // 🔎 Read-only methods

  /**
   * Get user activities with pagination and filters
   */
  async getUserActivities(
    filters: ActivityFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedActivityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getUserActivities",
        params: { filters, page, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user activities");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user activities");
    }
  }

  /**
   * Get activities for a specific user
   */
  async getActivitiesByUser(
    targetUserId: number,
    limit: number = 30
  ): Promise<ActivitiesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getActivitiesByUser",
        params: { targetUserId, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get activities by user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get activities by user");
    }
  }

  /**
   * Get activities by action type
   */
  async getActivitiesByAction(
    action: string,
    limit: number = 50
  ): Promise<ActivitiesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getActivitiesByAction",
        params: { action, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get activities by action");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get activities by action");
    }
  }

  /**
   * Get activities for a specific entity
   */
  async getActivitiesByEntity(
    entity: string,
    entityId?: number,
    limit: number = 30
  ): Promise<ActivitiesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getActivitiesByEntity",
        params: { entity, entityId, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get activities by entity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get activities by entity");
    }
  }

  /**
   * Get most recent activities
   */
  async getRecentActivities(
    limit: number = 20
  ): Promise<ActivitiesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getRecentActivities",
        params: { limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get recent activities");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get recent activities");
    }
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(
    dateRange?: { startDate?: string; endDate?: string }
  ): Promise<ActivityStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getActivityStats",
        params: { dateRange },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get activity stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get activity stats");
    }
  }

  /**
   * Search activities by text query
   */
  async searchActivities(
    query: string,
    filters: ActivityFilters = {}
  ): Promise<SearchActivitiesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "searchActivities",
        params: { query, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search activities");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search activities");
    }
  }

  /**
   * Get activity timeline grouped by date
   */
  async getActivityTimeline(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<ActivityTimelineResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getActivityTimeline",
        params: { startDate, endDate, groupBy },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get activity timeline");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get activity timeline");
    }
  }

  /**
   * Get summary of user activities
   */
  async getUserActivitySummary(
    targetUserId: number,
    days: number = 30
  ): Promise<UserActivitySummaryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getUserActivitySummary",
        params: { targetUserId, days },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get user activity summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get user activity summary");
    }
  }

  /**
   * Get system audit log (for security/audit purposes)
   */
  async getSystemAuditLog(
    startDate?: string,
    endDate?: string,
    actions: string[] = []
  ): Promise<SystemAuditLogResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.userActivity) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.userActivity({
        method: "getSystemAuditLog",
        params: { startDate, endDate, actions },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get system audit log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get system audit log");
    }
  }

  // Utility methods

  /**
   * Log user activity (helper method)
   */
  async logActivity(params: {
    action: string;
    entity?: string;
    entityId?: number;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      if (!window.backendAPI || !window.backendAPI.user) {
        throw new Error("Electron API not available");
      }

      // Get current user info
      const userResponse = await window.backendAPI.user({
        method: "getCurrentUser",
      });

      if (!userResponse.status || !userResponse.data) {
        return { success: false, message: "User not authenticated" };
      }

      // Log the activity
      const activityResponse = await window.backendAPI.user({
        method: "logUserActivity",
        params: {
          userId: userResponse.data.id,
          ...params
        },
      });

      return {
        success: activityResponse.status,
        message: activityResponse.message,
      };
    } catch (error: any) {
      console.error("Error logging activity:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get user's recent activities
   */
  async getMyRecentActivities(limit: number = 20): Promise<UserActivity[]> {
    try {
      const userResponse = await window.backendAPI.user({
        method: "getCurrentUser",
      });

      if (!userResponse.status || !userResponse.data) {
        return [];
      }

      const activitiesResponse = await this.getActivitiesByUser(
        userResponse.data.id,
        limit
      );

      return activitiesResponse.status ? activitiesResponse.data : [];
    } catch (error) {
      console.error("Error getting my recent activities:", error);
      return [];
    }
  }

  /**
   * Get login history for a user
   */
  async getLoginHistory(
    userId?: number,
    limit: number = 50
  ): Promise<UserActivity[]> {
    try {
      if (!userId) {
        const userResponse = await window.backendAPI.user({
          method: "getCurrentUser",
        });
        userId = userResponse.data?.id;
      }

      if (!userId) {
        return [];
      }

      const response = await this.getActivitiesByAction("login", limit);
      if (response.status) {
        // Filter by user ID on client side since IPC handler doesn't support combined filters
        return response.data.filter(activity => 
          activity.user_id === userId && activity.action.includes("login")
        );
      }
      return [];
    } catch (error) {
      console.error("Error getting login history:", error);
      return [];
    }
  }

  /**
   * Track user login
   */
  async trackLogin(params: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<boolean> {
    try {
      const result = await this.logActivity({
        action: "LOGIN",
        entity: "User",
        ...params,
      });
      return result.success;
    } catch (error) {
      console.error("Error tracking login:", error);
      return false;
    }
  }

  /**
   * Track user logout
   */
  async trackLogout(params: {
    ipAddress?: string;
    userAgent?: string;
  }): Promise<boolean> {
    try {
      const result = await this.logActivity({
        action: "LOGOUT",
        entity: "User",
        ...params,
      });
      return result.success;
    } catch (error) {
      console.error("Error tracking logout:", error);
      return false;
    }
  }

  /**
   * Track entity creation
   */
  async trackEntityCreate(
    entity: string,
    entityId: number,
    details?: string
  ): Promise<boolean> {
    try {
      const result = await this.logActivity({
        action: `${entity.toUpperCase()}_CREATE`,
        entity,
        entityId,
        details,
      });
      return result.success;
    } catch (error) {
      console.error("Error tracking entity creation:", error);
      return false;
    }
  }

  /**
   * Track entity update
   */
  async trackEntityUpdate(
    entity: string,
    entityId: number,
    details?: string
  ): Promise<boolean> {
    try {
      const result = await this.logActivity({
        action: `${entity.toUpperCase()}_UPDATE`,
        entity,
        entityId,
        details,
      });
      return result.success;
    } catch (error) {
      console.error("Error tracking entity update:", error);
      return false;
    }
  }

  /**
   * Track entity deletion
   */
  async trackEntityDelete(
    entity: string,
    entityId: number,
    details?: string
  ): Promise<boolean> {
    try {
      const result = await this.logActivity({
        action: `${entity.toUpperCase()}_DELETE`,
        entity,
        entityId,
        details,
      });
      return result.success;
    } catch (error) {
      console.error("Error tracking entity deletion:", error);
      return false;
    }
  }

  /**
   * Get today's activities
   */
  async getTodayActivities(): Promise<UserActivity[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const response = await this.getUserActivities(
        { startDate: today, endDate: tomorrowStr },
        1,
        100
      );

      return response.status ? response.data.activities : [];
    } catch (error) {
      console.error("Error getting today's activities:", error);
      return [];
    }
  }

  /**
   * Get activities from the last N days
   */
  async getActivitiesLastNDays(days: number = 7): Promise<UserActivity[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.getUserActivities(
        {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        1,
        200
      );

      return response.status ? response.data.activities : [];
    } catch (error) {
      console.error("Error getting activities from last N days:", error);
      return [];
    }
  }

  /**
   * Export activities to CSV (client-side)
   */
  exportToCSV(activities: UserActivity[]): string {
    const headers = [
      'ID',
      'Timestamp',
      'User',
      'Action',
      'Entity',
      'Entity ID',
      'IP Address',
      'Details'
    ];

    const rows = activities.map(activity => [
      activity.id,
      new Date(activity.created_at).toLocaleString(),
      activity.user?.username || `User ${activity.user_id}`,
      activity.action,
      activity.entity || '',
      activity.entity_id || '',
      activity.ip_address || '',
      activity.details || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Download activities as CSV file
   */
  downloadActivitiesAsCSV(activities: UserActivity[], filename: string = 'activities.csv'): void {
    const csvContent = this.exportToCSV(activities);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

const userActivityAPI = new UserActivityAPI();

export default userActivityAPI;