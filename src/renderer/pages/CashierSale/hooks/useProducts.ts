import { useState, useEffect, useCallback } from 'react';
import productAPI, { type Product } from '../../../api/product';
import { dialogs } from '../../../utils/dialogs';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const params: any = { limit: 100 };
      if (categoryId) params.categoryId = categoryId;
      if (searchTerm.trim()) params.search = searchTerm;

      const response = await productAPI.getActive(params);
      if (response.status && response.data) {
        setProducts(response.data);
        setFilteredProducts(response.data.slice(0, 20)); // simple pagination
      } else {
        setProducts([]);
        setFilteredProducts([]);
      }
    } catch (error) {
      console.error('Failed to load products', error);
      await dialogs.alert({
        title: 'Error',
        message: 'Could not load products. Please try again.',
      });
    } finally {
      setLoadingProducts(false);
    }
  }, [categoryId, searchTerm]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, categoryId, loadProducts]);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryId(null);
  };

  return {
    products,
    filteredProducts,
    searchTerm,
    setSearchTerm,
    categoryId,
    setCategoryId,
    loadingProducts,
    loadProducts,
    clearFilters,
  };
};