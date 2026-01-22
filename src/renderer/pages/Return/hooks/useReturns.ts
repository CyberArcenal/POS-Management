import { useState, useEffect, useCallback } from 'react';
import { returnsAPI } from '../api/returns';
import { posAuthStore } from '../../../lib/authStore';

export interface UseReturnsOptions {
  initialFilters?: any;
  pageSize?: number;
  autoLoad?: boolean;
}

export const useReturns = (options: UseReturnsOptions = {}) => {
  const {
    initialFilters = {},
    pageSize = 20,
    autoLoad = true
  } = options;
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    page_size: pageSize
  });
  
  const loadTransactions = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const user = posAuthStore.getUserDisplayInfo();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const response = await returnsAPI.getRefundableTransactions({
        ...filters,
        page,
        limit: pageSize,
        user_id: user.terminalId ? parseInt(user.terminalId as string) : undefined
      });
      
      if (response.status) {
        setTransactions(response.data.transactions || []);
        setPagination(response.data.pagination || {
          current_page: page,
          total_pages: 1,
          total_count: response.data.transactions?.length || 0,
          page_size: pageSize
        });
      } else {
        throw new Error(response.message || 'Failed to load transactions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      console.error('Error loading returns:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);
  
  const updateFilters = useCallback((newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters }));
  }, []);
  
  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      loadTransactions(page);
    }
  }, [pagination.total_pages, loadTransactions]);
  
  // Auto-load on filter change
  useEffect(() => {
    if (autoLoad) {
      loadTransactions(1);
    }
  }, [filters, autoLoad, loadTransactions]);
  
  return {
    transactions,
    loading,
    error,
    filters,
    pagination,
    loadTransactions,
    updateFilters,
    goToPage,
    refresh: () => loadTransactions(pagination.current_page)
  };
};