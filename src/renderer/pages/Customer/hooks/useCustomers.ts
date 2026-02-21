import { useState, useEffect, useCallback } from "react";
import customerAPI, { type Customer } from "../../../api/customer";
// import { saleAPI } from "../../../api/sale"; // kung nasa sale.ts

export interface CustomerFilters {
  search: string;
  status: "all" | "vip" | "elite" | "regular";
  sortBy: "name" | "points" | "createdAt";
  sortOrder: "ASC" | "DESC";
  minPoints?: number;
  maxPoints?: number;
}

interface Metrics {
  total: number;
  vipCount: number;
  eliteCount: number;
  regularCount: number;
  newThisMonth: number;
}

export const useCustomers = (initialFilters: CustomerFilters) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    vipCount: 0,
    eliteCount: 0,
    regularCount: 0,
    newThisMonth: 0,
  });
  const [totalsMap, setTotalsMap] = useState<Record<number, number>>({}); // <-- new state

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        search: filters.search || undefined,
        minPoints: filters.minPoints,
        maxPoints: filters.maxPoints,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };
      const response = await customerAPI.getAll(params);
      if (response.status) {
        let fetchedCustomers = response.data;

        // Apply client‑side status filter
        if (filters.status !== "all") {
          fetchedCustomers = fetchedCustomers.filter(
            (c) => c.status === filters.status
          );
        }

        setCustomers(fetchedCustomers);

        // Compute metrics
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const metrics: Metrics = {
          total: fetchedCustomers.length,
          vipCount: fetchedCustomers.filter((c) => c.status === "vip").length,
          eliteCount: fetchedCustomers.filter((c) => c.status === "elite").length,
          regularCount: fetchedCustomers.filter((c) => c.status === "regular").length,
          newThisMonth: fetchedCustomers.filter(
            (c) => new Date(c.createdAt) >= firstDayOfMonth
          ).length,
        };
        setMetrics(metrics);

        // Fetch total spent for all customers in batch
        if (fetchedCustomers.length > 0) {
          const ids = fetchedCustomers.map(c => c.id);
          // Gamitin ang bagong method (kung nasa customerAPI)
          const totals = await customerAPI.getTotalSpentForCustomers(ids);
          setTotalsMap(totals);
        } else {
          setTotalsMap({});
        }
      } else {
        throw new Error(response.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    filters,
    setFilters,
    loading,
    error,
    reload: fetchCustomers,
    metrics,
    totalsMap, // <-- expose totals map
  };
};