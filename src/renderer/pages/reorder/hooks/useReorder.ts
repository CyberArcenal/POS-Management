// src/renderer/pages/reorder/hooks/useReorder.ts
import { useState, useEffect, useCallback } from 'react';
import productAPI, { type Product } from '../../../api/product';
import supplierAPI, { type Supplier } from '../../../api/supplier';

export interface LowStockProduct extends Product {
  supplier: Supplier | null; // supplier relation should be populated
}

export interface SupplierGroup {
  supplier: Supplier;
  products: LowStockProduct[];
  lowStockCount: number;
}

export function useReorder(threshold?: number) {
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch low stock products (backend should return with supplier populated)
      const response = await productAPI.getLowStock(threshold);
      if (!response.status) throw new Error(response.message);
      const lowStockProducts = response.data as LowStockProduct[];

      // Group by supplier
      const groupsMap = new Map<number, SupplierGroup>();
      lowStockProducts.forEach(product => {
        if (product.supplier) {
          const supplierId = product.supplier.id;
          if (!groupsMap.has(supplierId)) {
            groupsMap.set(supplierId, {
              supplier: product.supplier,
              products: [],
              lowStockCount: 0,
            });
          }
          groupsMap.get(supplierId)!.products.push(product);
        } else {
          // Products without supplier – put in an "Unassigned" group
          const unassignedId = 0;
          if (!groupsMap.has(unassignedId)) {
            groupsMap.set(unassignedId, {
              supplier: { id: 0, name: 'Unassigned', isActive: true } as Supplier,
              products: [],
              lowStockCount: 0,
            });
          }
          groupsMap.get(unassignedId)!.products.push(product);
        }
      });

      // Compute counts
      groupsMap.forEach(group => {
        group.lowStockCount = group.products.length;
      });

      setProducts(lowStockProducts);
      setSupplierGroups(Array.from(groupsMap.values()));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch low stock products');
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  const reload = useCallback(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  return {
    products,
    supplierGroups,
    loading,
    error,
    reload,
  };
}