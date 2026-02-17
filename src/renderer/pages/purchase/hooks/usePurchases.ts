// src/renderer/pages/purchase/hooks/usePurchases.ts
import { useState, useEffect, useCallback } from 'react';
import purchaseAPI, { type Purchase } from '../../../api/purchase';
import supplierAPI, { type Supplier } from '../../../api/supplier';

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
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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

  // Fetch suppliers for filter dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await supplierAPI.getActive();
        if (response.status) {
          const suppliersData = Array.isArray(response.data)
            ? response.data
            : (response.data as { items?: Supplier[] })?.items || [];
          setSuppliers(suppliersData);
        }
      } catch (err) {
        console.error('Failed to fetch suppliers', err);
        setError('Failed to load suppliers.');
      }
    };
    fetchSuppliers();
  }, []);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
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
        if (!Array.isArray(response.data)) {
          throw new Error('Invalid data format');
        }
        setPurchases(response.data);
        setTotal(response.data.length);
      } else {
        throw new Error(response.message || 'Failed to fetch purchases');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch purchases';
      setError(message);
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
    suppliers,
    loading,
    error,
    total,
    filters,
    setFilters,
    reload,
  };
}