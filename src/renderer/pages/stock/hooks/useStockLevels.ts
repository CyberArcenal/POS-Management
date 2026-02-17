// src/renderer/pages/stock/hooks/useStockLevels.ts
import { useState, useEffect, useCallback } from 'react';
import productAPI, { type Product } from '../../../api/product';
import supplierAPI, { type Supplier } from '../../../api/supplier';
import categoryAPI, { type Category } from '../../../api/category';

export interface StockFilters {
  search: string;
  supplierId: number | '';
  categoryId: number | '';
  stockStatus: 'all' | 'instock' | 'lowstock' | 'outstock';
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
}

export function useStockLevels(initialFilters?: Partial<StockFilters>) {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<StockFilters>({
    search: '',
    supplierId: '',
    categoryId: '',
    stockStatus: 'all',
    page: 1,
    limit: 10,
    sortBy: 'name',
    sortOrder: 'ASC',
    ...initialFilters,
  });

  // Fetch suppliers and categories for filter dropdowns
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [suppliersRes, categoriesRes] = await Promise.all([
          supplierAPI.getActive(),
          categoryAPI.getActive(),
        ]);
        if (suppliersRes.status) {
          const suppliersData = Array.isArray(suppliersRes.data)
            ? suppliersRes.data
            : (suppliersRes.data as { items?: Supplier[] })?.items || [];
          setSuppliers(suppliersData);
        }
        if (categoriesRes.status) {
          const categoriesData = Array.isArray(categoriesRes.data)
            ? categoriesRes.data
            : (categoriesRes.data as { items?: Category[] })?.items || [];
          setCategories(categoriesData);
        }
      } catch (err) {
        console.error('Failed to fetch filter data', err);
        setError('Failed to load suppliers and categories.');
      }
    };
    fetchFilterData();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = {
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      if (filters.search) params.search = filters.search;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.categoryId) params.categoryId = filters.categoryId;

      const response = await productAPI.getAll(params);
      if (response.status) {
        let fetchedProducts = response.data;
        // Apply stock status filter on frontend
        if (filters.stockStatus !== 'all') {
          fetchedProducts = fetchedProducts.filter(p => {
            if (filters.stockStatus === 'instock') return p.stockQty > 5;
            if (filters.stockStatus === 'lowstock') return p.stockQty > 0 && p.stockQty <= 5;
            if (filters.stockStatus === 'outstock') return p.stockQty === 0;
            return true;
          });
        }
        setProducts(fetchedProducts);
        setTotal(fetchedProducts.length);
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const reload = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    suppliers,
    categories,
    loading,
    error,
    total,
    filters,
    setFilters,
    reload,
  };
}