import { useState, useEffect, useCallback } from "react";
import type { AuditLogEntry } from "../../../api/audit";
import auditAPI from "../../../api/audit";

export interface AuditFilters {
  action: "all" | string;
  startDate?: string;
  endDate?: string;
  search: string;
  entity?: string;
  user?: string; // changed from userId
}

interface Summary {
  totalToday: number;
  byAction: Record<string, number>;
  mostActiveUser: { user: string; count: number } | null;
  mostAffectedEntity: { entity: string; count: number } | null;
}

// Helper to get color for action type
export const getActionColor = (action: string): string => {
  const lower = action.toLowerCase();
  if (lower.includes('sale') || lower.includes('create')) return "var(--accent-green)";
  if (lower.includes('refund') || lower.includes('delete')) return "var(--accent-red)";
  if (lower.includes('inventory') || lower.includes('stock')) return "var(--accent-blue)";
  if (lower.includes('setting') || lower.includes('config')) return "var(--accent-amber)";
  return "var(--text-tertiary)";
};

export const useAuditLogs = (initialFilters: AuditFilters) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({
    totalToday: 0,
    byAction: {},
    mostActiveUser: null,
    mostAffectedEntity: null,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build API params from filters
      const params: any = {
        action: filters.action === "all" ? undefined : filters.action,
        startDate: filters.startDate,
        endDate: filters.endDate,
        user: filters.user,         // now using user string
        entity: filters.entity,
        searchTerm: filters.search,  // search method uses searchTerm
      };
      // Always use search (it supports all filters)
      const response = await auditAPI.search(params);
      if (!response.status) throw new Error(response.message);
      const items = response.data.items;
      setLogs(items);

      // Compute summary from logs
      const today = new Date().toISOString().split('T')[0];
      const todayLogs = items.filter(log => {
        const logDate = typeof log.timestamp === 'string' ? log.timestamp : new Date(log.timestamp).toISOString();
        return logDate.startsWith(today);
      });
      
      const byAction: Record<string, number> = {};
      const userCounts: Record<string, number> = {};   // keyed by username
      const entityCounts: Record<string, number> = {};

      items.forEach(log => {
        // Count by action
        const action = log.action || 'Unknown';
        byAction[action] = (byAction[action] || 0) + 1;

        // Count by user (use log.user, fallback to "System")
        const userName = log.user || 'System';
        userCounts[userName] = (userCounts[userName] || 0) + 1;

        // Count by entity
        if (log.entity) {
          entityCounts[log.entity] = (entityCounts[log.entity] || 0) + 1;
        }
      });

      let mostActiveUser = null;
      let maxUserCount = 0;
      Object.entries(userCounts).forEach(([user, count]) => {
        if (count > maxUserCount) {
          maxUserCount = count;
          mostActiveUser = { user, count };
        }
      });

      let mostAffectedEntity = null;
      let maxEntityCount = 0;
      Object.entries(entityCounts).forEach(([entity, count]) => {
        if (count > maxEntityCount) {
          maxEntityCount = count;
          mostAffectedEntity = { entity, count };
        }
      });

      setSummary({
        totalToday: todayLogs.length,
        byAction,
        mostActiveUser,
        mostAffectedEntity,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    filters,
    setFilters,
    loading,
    error,
    reload: fetchLogs,
    summary,
  };
};