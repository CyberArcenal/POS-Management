import { useState, useEffect } from 'react';
import productAPI, { type Product } from '../../../api/product';
import { dialogs } from '../../../utils/dialogs';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await productAPI.getActive({ limit: 100 });
      if (response.status && response.data) {
        setProducts(response.data);
        setFilteredProducts(response.data.slice(0, 20));
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
  };

  // Filter products when searchTerm changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products.slice(0, 20));
    } else {
      const lower = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.sku.toLowerCase().includes(lower) ||
          (p.description && p.description.toLowerCase().includes(lower))
      );
      setFilteredProducts(filtered.slice(0, 20));
    }
  }, [searchTerm, products]);

  // Load once on mount
  useEffect(() => {
    loadProducts();
  }, []);

  return {
    products,
    filteredProducts,
    searchTerm,
    setSearchTerm,
    loadingProducts,
    loadProducts,
  };
};