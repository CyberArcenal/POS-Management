// src/renderer/pages/category/hooks/useCategoryView.ts
import { useState } from 'react';
import type { Category } from '../../../api/category';
import productAPI, { type Product } from '../../../api/product';

export function useCategoryView() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const open = async (category: Category) => {
    setCategory(category);
    setIsOpen(true);
    setLoading(true);

    try {
      // Fetch products by category (active products)
      const response = await productAPI.getByCategory(category.id, { isActive: true });
      if (response.status) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Error loading category products:', error);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setCategory(null);
    setProducts([]);
  };

  return {
    isOpen,
    category,
    products,
    loading,
    open,
    close,
  };
}