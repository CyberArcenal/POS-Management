// src/renderer/pages/purchase/hooks/usePurchases.ts
import { useState, useEffect, useCallback } from 'react';
import purchaseAPI, { type Purchase } from '../../../api/purchase';

export interface PurchaseFilters {
  search: string;
  status: string;
  supplierId: number | '';
  startDate: string;
  endDate: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export function usePurchases(initialFilters?: Partial<PurchaseFilters>) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<PurchaseFilters>({
    search: '',
    status: '',
    supplierId: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
    sortBy: 'orderDate',
    sortOrder: 'DESC',
    ...initialFilters,
  });

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (filters.search) params.search = filters.search;
      if (filters.status) params.status = filters.status;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await purchaseAPI.getAll(params);
      if (response.status) {
        setPurchases(response.data);
        setTotal(response.data.length); // backend doesn't return total count yet
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch purchases');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const reload = useCallback(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return {
    purchases,
    loading,
    error,
    total,
    filters,
    setFilters,
    reload,
  };
}