// src/renderer/pages/supplier/hooks/useSuppliers.ts
import { useState, useEffect, useCallback } from 'react';
import supplierAPI, { type Supplier, type SupplierWithProductCount } from '../../../api/supplier';

export interface SupplierFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export function useSuppliers(initialFilters?: Partial<SupplierFilters>) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productCounts, setProductCounts] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<SupplierFilters>({
    search: '',
    status: 'all',
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'ASC',
    ...initialFilters,
  });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Convert status filter to isActive for API
      const isActive = filters.status === 'all' ? undefined : filters.status === 'active';

      const response = await supplierAPI.getAll({
        search: filters.search || undefined,
        isActive,
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (response.status) {
        setSuppliers(response.data);
        setTotal(response.data.length); // Note: backend doesn't return total count yet
      } else {
        throw new Error(response.message);
      }

      // Fetch product counts (active suppliers only)
      const countsResponse = await supplierAPI.getWithProductCount();
      if (countsResponse.status) {
        const countsMap = new Map<number, number>();
        countsResponse.data.forEach(item => {
          countsMap.set(item.id, item.productCount);
        });
        setProductCounts(countsMap);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const reload = useCallback(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  return {
    suppliers,
    productCounts,
    loading,
    error,
    total,
    filters,
    setFilters,
    reload,
  };
}