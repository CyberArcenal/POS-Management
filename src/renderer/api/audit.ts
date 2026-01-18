// AuditTrailAPI.ts - Similar structure to activation.ts
export interface AuditTrailData {
  id: number;
  action: string;
  entity: string;
  entity_id: number;
  details: any | null;
  timestamp: string;
  user_id: number;
  user_info?: {
    id: number;
    username: string;
    role: string;
    display_name?: string;
  };
}

export interface AuditTrailSearchResult {
  results: AuditTrailData[];
  grouped_results: {
    action_matches: AuditTrailData[];
    entity_matches: AuditTrailData[];
    user_matches: AuditTrailData[];
    detail_matches: AuditTrailData[];
    other_matches: AuditTrailData[];
  };
  search_stats: {
    total_results: number;
    by_action: Record<string, number>;
    by_entity: Record<string, number>;
    by_user: Record<string, number>;
    by_date: any;
  };
  search_insights: Array<{
    type: string;
    message: string;
    priority: string;
    data?: any;
  }>;
  search_criteria: {
    query: string | null;
    filters_applied: string[];
  };
}

export interface AuditStatisticsData {
  total_audits: number;
  unique_entities: number;
  unique_users: number;
  unique_actions: number;
  period_days: number;
  average_daily_audits: number;
  audits_per_user: number;
  audits_per_entity: number;
  action_breakdown: Record<string, any>;
  entity_breakdown: Record<string, any>;
  user_activity: Record<string, any>;
  time_distribution: any;
  consistency_metrics: any;
  security_metrics: any;
  error_metrics: any;
}

export interface AuditActivityReportData {
  report_period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  summary: {
    total_audits: number;
    active_users: number;
    total_users: number;
    activity_rate: number;
    audits_per_active_user: number;
    audits_per_day: number;
  };
  user_activity: Array<any>;
  activity_categories: {
    highly_active: Array<any>;
    moderately_active: Array<any>;
    lightly_active: Array<any>;
    inactive: Array<any>;
  };
  category_statistics: Record<string, any>;
  daily_activity: Array<any>;
  entity_activity: Array<any>;
  insights: Array<any>;
  recommendations: Array<any>;
  filters_applied: any;
}

export interface SuspiciousActivitiesData {
  report_period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  audit_summary: {
    total_audits: number;
    suspicious_activities: number;
    suspicious_percentage: number;
  };
  suspicious_activities: Array<{
    id: number;
    action: string;
    entity: string;
    entity_id: number;
    timestamp: string;
    details: any | null;
    suspicious_reasons: string[];
    risk_level: string;
    confidence: number;
    user_info: any;
  }>;
  risk_assessment: {
    overall_risk: string;
    categories: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    metrics: any;
  };
  alerts: Array<any>;
  recommendations: Array<any>;
  suspicious_patterns_detected: string[];
  filters_applied: any;
}

export interface AuditTrailByActionData {
  action: string;
  action_description: string;
  audits: AuditTrailData[];
  summary: {
    total_audits: number;
    unique_entities: number;
    unique_users: number;
    first_audit: string;
    last_audit: string;
    time_span_days: number;
  };
  entity_breakdown: Record<string, any>;
  user_breakdown: Record<string, any>;
  date_trend: Array<any>;
  top_lists: {
    entities: Array<any>;
    users: Array<any>;
  };
  metrics: any;
  insights: Array<any>;
  filters_applied: any;
}

export interface AuditTrailByDateRangeData {
  audits: AuditTrailData[];
  summary: {
    total_audits: number;
    unique_entities: number;
    unique_users: number;
    unique_actions: number;
    date_range: {
      start_date: string;
      end_date: string;
      days: number;
    };
  };
  entity_summary: Record<string, any>;
  action_summary: Record<string, any>;
  user_summary: Record<string, any>;
  timeline: Array<any>;
  top_lists: {
    entities: Array<any>;
    actions: Array<any>;
    users: Array<any>;
  };
  metrics: any;
  filters_applied: any;
}

export interface AuditTrailByEntityData {
  entity: string;
  entity_id: number;
  audits: AuditTrailData[];
  summary: {
    total_audits: number;
    first_audit: string | null;
    last_audit: string | null;
    unique_users: number;
    actions: Record<string, number>;
  };
  timeline: Array<any>;
  user_activity: Record<string, any>;
  top_users: Array<any>;
  filters_applied: any;
}

export interface AuditTrailByUserData {
  user_info: {
    id: number;
    username: string;
    display_name: string;
    role: string;
    employee_id?: string;
    department?: string;
  };
  audits: AuditTrailData[];
  user_stats: any;
  entity_breakdown: Record<string, any>;
  activity_trend: Array<any>;
  recent_audits: AuditTrailData[];
  insights: Array<any>;
  period: string;
}

export interface AuditTrailByIdData {
  audit: AuditTrailData;
  parsed_details: any | null;
  context: {
    performed_by: {
      id: number;
      username: string;
      role: string;
    } | null;
    timestamp: string;
    entity_info: {
      type: string;
      id: number;
    };
  };
  related_activities: Array<any>;
}

// Base Response Interfaces
export interface AuditTrailBaseResponse {
  status: boolean;
  message: string;
  data: any;
}

export interface AuditTrailSearchResponse extends AuditTrailBaseResponse {
  data: AuditTrailSearchResult;
}

export interface AuditTrailStatisticsResponse extends AuditTrailBaseResponse {
  data: AuditStatisticsData;
}

export interface AuditTrailActivityReportResponse extends AuditTrailBaseResponse {
  data: AuditActivityReportData;
}

export interface SuspiciousActivitiesResponse extends AuditTrailBaseResponse {
  data: SuspiciousActivitiesData;
}

export interface AuditTrailByActionResponse extends AuditTrailBaseResponse {
  data: AuditTrailByActionData;
}

export interface AuditTrailByDateRangeResponse extends AuditTrailBaseResponse {
  data: AuditTrailByDateRangeData;
}

export interface AuditTrailByEntityResponse extends AuditTrailBaseResponse {
  data: AuditTrailByEntityData;
}

export interface AuditTrailByUserResponse extends AuditTrailBaseResponse {
  data: AuditTrailByUserData;
}

export interface AuditTrailByIdResponse extends AuditTrailBaseResponse {
  data: AuditTrailByIdData;
}

export interface AuditTrailPayload {
  method: string;
  params?: Record<string, any>;
}

class AuditTrailAPI {
  // 📋 READ-ONLY METHODS

  async getById(id: number): Promise<AuditTrailByIdResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trail by ID");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trail by ID");
    }
  }

  async getByEntity(entity: string, entityId?: number, filters: Record<string, any> = {}): Promise<AuditTrailByEntityResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailsByEntity",
        params: { entity, entity_id: entityId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trails by entity");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trails by entity");
    }
  }

  async getByUser(userId: number, filters: Record<string, any> = {}): Promise<AuditTrailByUserResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailsByUser",
        params: { user_id: userId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trails by user");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trails by user");
    }
  }

  async getByDateRange(startDate: string, endDate: string, filters: Record<string, any> = {}): Promise<AuditTrailByDateRangeResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailsByDateRange",
        params: { start_date: startDate, end_date: endDate, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trails by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trails by date range");
    }
  }

  async getByAction(action: string, filters: Record<string, any> = {}): Promise<AuditTrailByActionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditTrailsByAction",
        params: { action, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit trails by action");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit trails by action");
    }
  }

  async search(query: string = "", filters: Record<string, any> = {}): Promise<AuditTrailSearchResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "searchAuditTrails",
        params: { query, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search audit trails");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search audit trails");
    }
  }

  // 📊 REPORTING & ANALYTICS

  async getStatistics(filters: Record<string, any> = {}): Promise<AuditTrailStatisticsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditStatistics",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit statistics");
    }
  }

  async getActivityReport(filters: Record<string, any> = {}): Promise<AuditTrailActivityReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditActivityReport",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit activity report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit activity report");
    }
  }

  async getComplianceReport(filters: Record<string, any> = {}): Promise<AuditTrailBaseResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditComplianceReport",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit compliance report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit compliance report");
    }
  }

  // 🔒 SECURITY & MONITORING

  async getSuspiciousActivities(filters: Record<string, any> = {}): Promise<SuspiciousActivitiesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getSuspiciousActivities",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get suspicious activities");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get suspicious activities");
    }
  }

  async getSummary(filters: Record<string, any> = {}): Promise<AuditTrailBaseResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.auditTrail) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.auditTrail({
        method: "getAuditSummary",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get audit summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get audit summary");
    }
  }

  // 🔍 UTILITY METHODS

  async getRecentAudits(limit: number = 50): Promise<AuditTrailData[]> {
    try {
      const response = await this.getByDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        { limit }
      );
      return response.data.audits;
    } catch (error) {
      console.error("Error getting recent audits:", error);
      return [];
    }
  }

  async getUserActivity(userId: number, days: number = 30): Promise<AuditTrailData[]> {
    try {
      const response = await this.getByUser(userId, {
        start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      return response.data.audits;
    } catch (error) {
      console.error("Error getting user activity:", error);
      return [];
    }
  }

  async getEntityAudits(entity: string, entityId?: number, days: number = 90): Promise<AuditTrailData[]> {
    try {
      const response = await this.getByEntity(entity, entityId, {
        start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      return response.data.audits;
    } catch (error) {
      console.error("Error getting entity audits:", error);
      return [];
    }
  }

  async getActionCount(action: string, days: number = 30): Promise<number> {
    try {
      const response = await this.getByAction(action, {
        start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
      return response.data.summary.total_audits;
    } catch (error) {
      console.error("Error getting action count:", error);
      return 0;
    }
  }

  async searchAuditsWithPagination(
    query: string = "",
    filters: Record<string, any> = {},
    page: number = 1,
    pageSize: number = 20
  ): Promise<AuditTrailSearchResult & { pagination: any }> {
    try {
      const offset = (page - 1) * pageSize;
      const response = await this.search(query, { ...filters, limit: pageSize, offset });
      return {
        ...response.data,
        pagination: {
          page,
          pageSize,
          total: response.data.search_stats.total_results,
          totalPages: Math.ceil(response.data.search_stats.total_results / pageSize),
          hasNext: offset + pageSize < response.data.search_stats.total_results,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error("Error searching audits with pagination:", error);
      throw error;
    }
  }

  async exportAudits(format: 'csv' | 'json' = 'json', filters: Record<string, any> = {}): Promise<string> {
    try {
      const response = await this.getByDateRange(
        filters.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        filters.end_date || new Date().toISOString().split('T')[0],
        filters
      );

      if (format === 'csv') {
        // Convert to CSV
        const headers = ['ID', 'Action', 'Entity', 'Entity ID', 'Timestamp', 'User', 'Details'];
        const rows = response.data.audits.map((audit: AuditTrailData) => [
          audit.id,
          audit.action,
          audit.entity,
          audit.entity_id,
          audit.timestamp,
          audit.user_info?.username || 'Unknown',
          JSON.stringify(audit.details)
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
      } else {
        // Return as JSON
        return JSON.stringify(response.data.audits, null, 2);
      }
    } catch (error) {
      console.error("Error exporting audits:", error);
      throw error;
    }
  }

  // 🎯 HELPER METHODS

  isSuspiciousActivity(audit: AuditTrailData): boolean {
    const suspiciousActions = ['access_denied', 'config_change', 'permission_change', 'password_change', 'delete'];
    const offHours = new Date(audit.timestamp).getHours() >= 22 || new Date(audit.timestamp).getHours() <= 6;

    return suspiciousActions.includes(audit.action) || offHours;
  }

  getActionDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'create': 'Create - New record created',
      'update': 'Update - Existing record modified',
      'delete': 'Delete - Record deleted',
      'view': 'View - Record accessed',
      'login': 'Login - User logged in',
      'logout': 'Logout - User logged out',
      'access_denied': 'Access Denied - Unauthorized access attempt',
      'error': 'Error - System error occurred',
      'config_change': 'Configuration Change - System configuration modified',
      'permission_change': 'Permission Change - User permissions modified',
      'password_change': 'Password Change - User password changed',
    };
    
    return descriptions[action] || `Action: ${action}`;
  }

  formatAuditForDisplay(audit: AuditTrailData): any {
    return {
      id: audit.id,
      action: audit.action,
      action_description: this.getActionDescription(audit.action),
      entity: audit.entity,
      entity_id: audit.entity_id,
      timestamp: new Date(audit.timestamp).toLocaleString(),
      user: audit.user_info?.username || 'Unknown',
      user_role: audit.user_info?.role || 'Unknown',
      details: audit.details,
      is_suspicious: this.isSuspiciousActivity(audit)
    };
  }

  async monitorAuditHealth(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check recent error audits
      const errorCount = await this.getActionCount('error', 1);
      if (errorCount > 10) {
        issues.push(`High error rate: ${errorCount} errors in last 24 hours`);
      }

      // Check access denied attempts
      const accessDeniedCount = await this.getActionCount('access_denied', 1);
      if (accessDeniedCount > 5) {
        issues.push(`High access denied attempts: ${accessDeniedCount} in last 24 hours`);
      }

      // Check audit volume
      const recentAudits = await this.getRecentAudits(1000);
      if (recentAudits.length === 1000) {
        issues.push('High audit volume - consider archiving old logs');
      }

      return {
        healthy: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error("Error monitoring audit health:", error);
      return {
        healthy: false,
        issues: ['Failed to monitor audit health']
      };
    }
  }
}

const auditTrailAPI = new AuditTrailAPI();

export default auditTrailAPI;