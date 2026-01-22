import { useState, useCallback } from 'react';
import { productSyncAPI } from '../api/productSyncAPI';
import { useProductContext } from '../context/ProductContext';
import type { ProductFilters } from '../types/product.types';

export const useProducts = () => {
  const { state, dispatch } = useProductContext();
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async (filters: ProductFilters = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      setError(null);

      const response = await productSyncAPI.getProducts({
        ...state.filters,
        ...filters
      });

      if (response.status) {
        dispatch({
          type: 'SET_PRODUCTS',
          payload: {
            products: response.data,
            pagination: response.pagination
          }
        });
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load products:', err);
    }
  }, [dispatch, state.filters]);

  const searchProducts = useCallback(async (query: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_SEARCH', payload: query });

      const response = await productSyncAPI.searchProducts(query, 1);

      if (response.status) {
        dispatch({
          type: 'SET_PRODUCTS',
          payload: {
            products: response.data,
            pagination: response.pagination
          }
        });
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Search failed:', err);
    }
  }, [dispatch]);

  const changePage = useCallback(async (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
    await loadProducts({ page });
  }, [loadProducts, dispatch]);

  const applyFilter = useCallback(async (key: string, value: any) => {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
    await loadProducts({ [key]: value, page: 1 });
  }, [loadProducts, dispatch]);

  const clearFilters = useCallback(async () => {
    dispatch({ type: 'CLEAR_FILTERS' });
    await loadProducts({});
  }, [loadProducts, dispatch]);

  const refreshProducts = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  return {
    products: state.products,
    pagination: state.pagination,
    isLoading: state.isLoading,
    filters: state.filters,
    error,
    loadProducts,
    searchProducts,
    changePage,
    applyFilter,
    clearFilters,
    refreshProducts
  };
};