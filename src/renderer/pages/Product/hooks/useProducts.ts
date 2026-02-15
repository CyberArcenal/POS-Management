import { useState, useEffect } from "react";
import productAPI, { type Product } from "../../../api/product";

export interface ProductFilters {
  search: string;
  status: "active" | "inactive" | "all";
  category: string;
  lowStock: boolean;
}

export function useProducts(initialFilters: ProductFilters) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        sortBy: "name",
        sortOrder: "ASC",
      };

      if (filters.status !== "all") {
        params.isActive = filters.status === "active";
      }

      if (filters.search) {
        params.search = filters.search;
      }

      if (filters.category) {
        params.category = filters.category;
      }

      const response = await productAPI.getAll(params);
      if (response.status) {
        setProducts(response.data);

        // Extract unique categories
        const cats = response.data
          .map((p) => (p as any).category)
          .filter(Boolean)
          .filter((v, i, a) => a.indexOf(v) === i);
        setCategories(cats);
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Apply filters locally
  useEffect(() => {
    let filtered = [...products];

    if (filters.lowStock) {
      filtered = filtered.filter((p) => p.stockQty <= 5);
    }

    if (filters.search) {
      const lower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.sku.toLowerCase().includes(lower) ||
          (p.description && p.description.toLowerCase().includes(lower))
      );
    }

    if (filters.category) {
      filtered = filtered.filter((p) => (p as any).category === filters.category);
    }

    if (filters.status !== "all") {
      filtered = filtered.filter(
        (p) => p.isActive === (filters.status === "active")
      );
    }

    setFilteredProducts(filtered);
  }, [products, filters]);

  useEffect(() => {
    loadProducts();
  }, [filters.status, filters.category]);

  return {
    products: filteredProducts,
    filters,
    setFilters,
    loading,
    error,
    categories,
    reload: loadProducts,
  };
}