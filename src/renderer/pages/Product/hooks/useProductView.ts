import { useState } from "react";
import productAPI, { type Product, type ProductSalesReportItem } from "../../../api/product";
import inventoryAPI, { type InventoryMovement } from "../../../api/inventory";

export function useProductView() {
  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [salesStats, setSalesStats] = useState<ProductSalesReportItem | null>(null);
  const [loading, setLoading] = useState(false);

  const open = async (product: Product) => {
    setProduct(product);
    setIsOpen(true);
    setLoading(true);

    try {
      const movementsRes = await inventoryAPI.getByProduct(product.id);
      if (movementsRes.status) {
        setMovements(movementsRes.data.slice(0, 10));
      }

      const salesRes = await productAPI.getSalesReport({
        productId: product.id,
      });
      if (salesRes.status && salesRes.data.length > 0) {
        setSalesStats(salesRes.data[0]);
      }
    } catch (err) {
      console.error("Failed to load product details", err);
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setProduct(null);
    setMovements([]);
    setSalesStats(null);
  };

  return {
    isOpen,
    product,
    movements,
    salesStats,
    loading,
    open,
    close,
  };
}