import { useState, useEffect, useCallback } from "react";
import inventoryAPI, { type InventoryMovement } from "../../../api/inventory";

export interface MovementFilters {
  movementType: "all" | "sale" | "refund" | "adjustment";
  startDate?: string;
  endDate?: string;
  search: string;
  direction: "all" | "increase" | "decrease";
}

interface Summary {
  totalToday: number;
  byType: Record<string, number>;
  mostMovedProduct: { name: string; count: number } | null;
  // Add more as needed
}

// Helper to format movement type for display
export const formatMovementType = (type: string): string => {
  switch (type) {
    case "sale":
      return "Sale";
    case "refund":
      return "Return";
    case "adjustment":
      return "Adjustment";
    default:
      return type;
  }
};

// Helper to get color for movement type
export const getMovementTypeColor = (type: string): string => {
  switch (type) {
    case "sale":
      return "var(--accent-blue)";
    case "refund":
      return "var(--accent-red)";
    case "adjustment":
      return "var(--accent-amber)";
    default:
      return "var(--text-tertiary)";
  }
};

export const useMovements = (initialFilters: MovementFilters) => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [filters, setFilters] = useState<MovementFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({
    totalToday: 0,
    byType: {},
    mostMovedProduct: null,
  });

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build API params from filters
      const params: any = {
        movementType:
          filters.movementType === "all" ? undefined : filters.movementType,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search || undefined,
        direction: filters.direction === "all" ? undefined : filters.direction,
        // You may also include pagination later
      };
      const response = await inventoryAPI.getAll(params);
      if (!response.status) throw new Error(response.message);
      setMovements(response.data);

      // Compute summary from data
      const today = new Date().toISOString().split("T")[0];
      const todayMovements = response.data.filter(
        (m) => new Date(m.timestamp).toISOString().split("T")[0] === today,
      );
      const byType: Record<string, number> = {};
      todayMovements.forEach((m) => {
        byType[m.movementType] = (byType[m.movementType] || 0) + 1;
      });

      // Find most moved product (by absolute quantity change)
      const productMovements: Record<number, { name: string; total: number }> =
        {};
      response.data.forEach((m) => {
        if (m.product && m.product.id) {
          const id = m.product.id;
          if (!productMovements[id]) {
            productMovements[id] = { name: m.product.name, total: 0 };
          }
          productMovements[id].total += Math.abs(m.qtyChange);
        }
      });
      let mostMovedProduct = null;
      let maxTotal = 0;
      Object.values(productMovements).forEach((p) => {
        if (p.total > maxTotal) {
          maxTotal = p.total;
          mostMovedProduct = p;
        }
      });

      setSummary({
        totalToday: todayMovements.length,
        byType,
        mostMovedProduct,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return {
    movements,
    filters,
    setFilters,
    loading,
    error,
    reload: fetchMovements,
    summary,
  };
};
