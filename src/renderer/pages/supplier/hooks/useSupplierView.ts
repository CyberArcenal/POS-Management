// src/renderer/pages/supplier/hooks/useSupplierView.ts
import { useState } from 'react';
import type { Supplier } from '../../../api/supplier';
import productAPI, { type Product } from '../../../api/product';
import purchaseAPI, { type Purchase } from '../../../api/purchase';

export function useSupplierView() {
  const [isOpen, setIsOpen] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalSpent: 0,
    purchaseCount: 0,
    averageOrderValue: 0,
  });

  const open = async (supplier: Supplier) => {
    setSupplier(supplier);
    setIsOpen(true);
    setLoading(true);

    try {
      // Fetch products by supplier
      const productsRes = await productAPI.getBySupplier(supplier.id, { isActive: true });
      if (productsRes.status) {
        setProducts(productsRes.data);
      }

      // Fetch purchases by supplier
      const purchasesRes = await purchaseAPI.getBySupplier({ supplierId: supplier.id });
      if (purchasesRes.status) {
        const allPurchases = purchasesRes.data;
        setPurchases(allPurchases);
        // Compute metrics from completed purchases
        const completed = allPurchases.filter(p => p.status === 'completed');
        const totalSpent = completed.reduce((sum, p) => sum + Number(p.totalAmount), 0);
        setMetrics({
          totalSpent,
          purchaseCount: completed.length,
          averageOrderValue: completed.length ? totalSpent / completed.length : 0,
        });
      }
    } catch (error) {
      console.error('Error loading supplier details:', error);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setSupplier(null);
    setProducts([]);
    setPurchases([]);
    setMetrics({ totalSpent: 0, purchaseCount: 0, averageOrderValue: 0 });
  };

  return {
    isOpen,
    supplier,
    products,
    purchases,
    metrics,
    loading,
    open,
    close,
  };
}