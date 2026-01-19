
import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardAPI from '../../../api/dashboard';
import type { DashboardFilters, DashboardState } from '../types';

const REFRESH_INTERVAL = 30000; // 30 seconds

export const useDashboardData = (filters: DashboardFilters) => {
  const [state, setState] = useState<DashboardState>({
    quickStats: null,
    liveData: null,
    salesTrend: null,
    topProducts: null,
    inventory: null,
    loading: true,
    error: null,
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const loadDashboardData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const [quickStats, liveData, salesTrend, topProducts, inventory] = await Promise.all([
        dashboardAPI.getQuickStats(),
        dashboardAPI.getLiveDashboard(),
        dashboardAPI.getSalesTrend({
          period: filters.period,
          startDate: filters.dateRange.start.toISOString(),
          endDate: filters.dateRange.end.toISOString(),
        }),
        dashboardAPI.getTopSellingProducts({ limit: 5 }),
        dashboardAPI.getInventoryOverview(),
      ]);

      setState({
        quickStats: quickStats.data,
        liveData: liveData.data,
        salesTrend: salesTrend.data,
        topProducts: topProducts.data,
        inventory: inventory.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data',
      }));
    }
  }, [filters]);

  const startAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    const interval = setInterval(loadDashboardData, REFRESH_INTERVAL);
    refreshIntervalRef.current = interval;
    return interval;
  }, [loadDashboardData]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const interval = startAutoRefresh();

    return () => {
      clearInterval(interval);
      stopAutoRefresh();
    };
  }, [loadDashboardData, startAutoRefresh, stopAutoRefresh]);

  const refreshData = () => {
    loadDashboardData();
  };

  return {
    ...state,
    refreshData,
  };
};