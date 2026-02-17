import { useState, useEffect, useCallback } from 'react';
import type { NotificationLogEntry, NotificationStats, PaginatedNotifications } from '../../../api/notification_log';
import notificationLogAPI from '../../../api/notification_log';

interface UseNotificationLogsParams {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const useNotificationLogs = (initialParams?: UseNotificationLogsParams) => {
  const [logs, setLogs] = useState<NotificationLogEntry[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedNotifications, 'items'>>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UseNotificationLogsParams>({
    page: 1,
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    ...initialParams,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (filters.keyword) {
        response = await notificationLogAPI.search({
          keyword: filters.keyword,
          page: filters.page,
          limit: filters.limit,
        });
      } else {
        response = await notificationLogAPI.getAll({
          page: filters.page,
          limit: filters.limit,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });
      }

      if (response.status) {
        setLogs(response.data.items);
        setPagination({
          total: response.data.total,
          page: response.data.page,
          limit: response.data.limit,
          totalPages: response.data.totalPages,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notification logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await notificationLogAPI.getStats();
      if (response.status) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  const refetch = useCallback(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  const updateFilters = useCallback((newFilters: Partial<UseNotificationLogsParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 })); // reset to first page
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 50,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    });
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs, fetchStats]);

  return {
    logs,
    pagination,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    setPage,
    setPageSize,
    refetch,
  };
};