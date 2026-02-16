import { useState, useEffect, useCallback } from "react";
import customerAPI, { type Customer } from "../../../api/customer";

export interface CustomerFilters {
  search: string;
  status: "all" | "vip" | "loyal" | "regular" | "new";
  sortBy: "name" | "points" | "createdAt";
  sortOrder: "ASC" | "DESC";
  minPoints?: number;
  maxPoints?: number;
}

interface Metrics {
  total: number;
  vipCount: number;
  loyalCount: number;
  regularCount: number;
  newCount: number;
  newThisMonth: number;
}

// Helper to compute status based on points
const getCustomerStatus = (points: number): Exclude<CustomerFilters["status"], "all"> => {
  if (points >= 1000) return "vip";
  if (points >= 500) return "loyal";
  if (points >= 100) return "regular";
  return "new";
};

export const useCustomers = (initialFilters: CustomerFilters) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filters, setFilters] = useState<CustomerFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    vipCount: 0,
    loyalCount: 0,
    regularCount: 0,
    newCount: 0,
    newThisMonth: 0,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build API params from filters
      const params: any = {
        search: filters.search || undefined,
        minPoints: filters.minPoints,
        maxPoints: filters.maxPoints,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        // Add pagination if needed (we'll handle client-side pagination for now)
      };
      const response = await customerAPI.getAll(params);
      if (response.status) {
        let fetchedCustomers = response.data;

        // Apply client-side status filter if not "all"
        if (filters.status !== "all") {
          fetchedCustomers = fetchedCustomers.filter(
            (c) => getCustomerStatus(c.loyaltyPointsBalance) === filters.status
          );
        }

        setCustomers(fetchedCustomers);

        // Compute metrics
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const metrics: Metrics = {
          total: fetchedCustomers.length,
          vipCount: fetchedCustomers.filter(c => getCustomerStatus(c.loyaltyPointsBalance) === "vip").length,
          loyalCount: fetchedCustomers.filter(c => getCustomerStatus(c.loyaltyPointsBalance) === "loyal").length,
          regularCount: fetchedCustomers.filter(c => getCustomerStatus(c.loyaltyPointsBalance) === "regular").length,
          newCount: fetchedCustomers.filter(c => getCustomerStatus(c.loyaltyPointsBalance) === "new").length,
          newThisMonth: fetchedCustomers.filter(c => new Date(c.createdAt) >= firstDayOfMonth).length,
        };
        setMetrics(metrics);
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
  };
};