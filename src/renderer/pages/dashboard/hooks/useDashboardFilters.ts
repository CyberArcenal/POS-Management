import { useState, useCallback } from 'react';
import type { DashboardFilters } from '../types';

const defaultFilters: DashboardFilters = {
  dateRange: {
    start: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
    end: new Date(),
  },
  period: 'month',
  category: null,
  paymentMethod: null,
};

export const useDashboardFilters = () => {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const updateFilters = useCallback((updates: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const toggleFilterPanel = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
    isFilterOpen,
    toggleFilterPanel,
  };
};