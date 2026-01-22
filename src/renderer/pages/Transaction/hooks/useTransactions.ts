// src/features/transactions/hooks/useTransactions.ts
import { useState, useEffect, useCallback } from 'react';
import { transactionApi } from '../api/transactionApi';
import type { Transaction, FilterState, PaginationMeta } from '../api/types';
import { showError } from '../../../utils/notification';

interface UseTransactionsReturn {
  transactions: Transaction[];
  pagination: PaginationMeta | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  fetchTransactions: (page?: number) => Promise<void>;
  setPage: (page: number) => void;
}

export const useTransactions = (
  filters: FilterState,
  refreshTrigger: number = 0
): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTransactions = useCallback(async (page: number = currentPage) => {
    setIsFetching(true);
    setError(null);

    try {
      // Convert FilterState to TransactionFilters (string|null to string|undefined)
      const apiFilters: any = {};
      
      // Handle string/null to string/undefined conversion
      if (filters.start_date !== null) apiFilters.start_date = filters.start_date;
      if (filters.end_date !== null) apiFilters.end_date = filters.end_date;
      
      // Handle string to string conversion
      if (filters.reference_number) apiFilters.reference_number = filters.reference_number;
      if (filters.customer_name) apiFilters.customer_name = filters.customer_name;
      if (filters.status) apiFilters.status = filters.status;
      if (filters.payment_method) apiFilters.payment_method = filters.payment_method;
      if (filters.search) apiFilters.search = filters.search;
      
      // Handle string to number conversion
      if (filters.min_total) {
        const minTotal = parseFloat(filters.min_total);
        if (!isNaN(minTotal)) apiFilters.min_total = minTotal;
      }
      
      if (filters.max_total) {
        const maxTotal = parseFloat(filters.max_total);
        if (!isNaN(maxTotal)) apiFilters.max_total = maxTotal;
      }

      const response = await transactionApi.getTransactions(page, 20, apiFilters);
      
      if (response.status) {
        setTransactions(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load transactions';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshTrigger]);

  const setPage = (page: number) => {
    setCurrentPage(page);
  };

  return {
    transactions,
    pagination,
    isLoading,
    isFetching,
    error,
    fetchTransactions,
    setPage,
  };
};