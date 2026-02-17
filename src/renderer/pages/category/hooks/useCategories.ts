// src/renderer/pages/category/hooks/useCategories.ts
import { useState, useEffect, useCallback } from 'react';
import categoryAPI, { type Category, type CategoryWithProductCount } from '../../../api/category';

export interface CategoryFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export function useCategories(initialFilters?: Partial<CategoryFilters>) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<CategoryFilters>({
    search: '',
    status: 'all',
    sortBy: 'name',
    sortOrder: 'ASC',
    ...initialFilters,
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isActive = filters.status === 'all' ? undefined : filters.status === 'active';

      const response = await categoryAPI.getAll({
        search: filters.search || undefined,
        isActive,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      if (response.status) {
        // Response.data can be PaginatedCategories or Category[] depending on backend
        // Assuming getAll returns { items, total } or array. We'll handle both.
        const data = response.data;
        let items: Category[] = [];
        let totalCount = 0;

        if (Array.isArray(data)) {
          items = data;
          totalCount = data.length;
        } else if (data && 'items' in data && 'total' in data) {
          items = data.items;
          totalCount = data.total;
        }

        setCategories(items);
        setTotal(totalCount);
      } else {
        throw new Error(response.message || 'Failed to fetch categories');
      }

      // Fetch product counts (active categories only)
      const countsResponse = await categoryAPI.getWithProductCount(true);
      if (countsResponse.status) {
        const countsMap = new Map<number, number>();
        countsResponse.data.forEach((item: CategoryWithProductCount) => {
          countsMap.set(item.id, item.productCount);
        });
        setProductCounts(countsMap);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const reload = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    productCounts,
    loading,
    error,
    total,
    filters,
    setFilters,
    reload,
  };
}