import { useState, useEffect, useCallback } from "react";
import loyaltyAPI, {
  type LoyaltyTransaction,
  type LoyaltyStatisticsResponse,
} from "../../../api/loyalty";
import customerAPI, { type Customer } from "../../../api/customer";

export interface LoyaltyFilters {
  type: "all" | "earn" | "redeem";
  customerId?: number;
  startDate?: string;
  endDate?: string;
  search: string;
}

interface PointsDistribution {
  range: string;
  count: number;
}

interface TopCustomer {
  customerId: number;
  name: string;
  netPoints: number;
  transactionCount: number;
}

interface MonthlyTrend {
  month: string;
  earned: number;
  redeemed: number;
  count: number;
}

export const useLoyalty = (initialFilters: LoyaltyFilters) => {
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [statistics, setStatistics] = useState<
    LoyaltyStatisticsResponse["data"] | null
  >(null);
  const [filters, setFilters] = useState<LoyaltyFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [pointsDistribution, setPointsDistribution] = useState<
    PointsDistribution[]
  >([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch transactions with filters
      let tops = null;

      const params: any = {
        type: filters.type === "all" ? undefined : filters.type,
        customerId: filters.customerId,
        startDate: filters.startDate,
        endDate: filters.endDate,
        search: filters.search || undefined,
      };
      const txResponse = await loyaltyAPI.getAll(params);
      if (!txResponse.status) throw new Error(txResponse.message);
      setTransactions(txResponse.data);

      // Fetch statistics
      const statsResponse = await loyaltyAPI.getStatistics();
      if (statsResponse.status) {
        setStatistics(statsResponse.data);

        // Prepare monthly trends
        const trends = statsResponse.data.monthlyTrends.map((t) => ({
          month: t.month,
          earned: t.earned,
          redeemed: t.redeemed,
          count: t.count,
        }));
        setMonthlyTrends(trends);

        // Prepare top customers
        tops = statsResponse.data.topCustomers.map((tc) => ({
          customerId: tc.customerId,
          name: `Customer #${tc.customerId}`, // placeholder, we'll enrich with customer names
          netPoints: tc.netPoints,
          transactionCount: tc.transactionCount,
        }));
        setTopCustomers(tops);
      }

      // Fetch all customers to enrich top customers and points distribution
      const custResponse = await customerAPI.getAll({ limit: 1000 });
      if (custResponse.status) {
        setCustomers(custResponse.data);

        // Enrich top customers with names
        const enrichedTops = tops?.map((tc) => ({
          ...tc,
          name:
            custResponse.data.find((c) => c.id === tc.customerId)?.name ||
            tc.name,
        }));
        if (enrichedTops) {
          setTopCustomers(enrichedTops);
        }

        // Compute points distribution (ranges)
        const ranges = [
          { min: 0, max: 99, label: "0-99" },
          { min: 100, max: 499, label: "100-499" },
          { min: 500, max: 999, label: "500-999" },
          { min: 1000, max: Infinity, label: "1000+" },
        ];
        const distribution = ranges.map((r) => ({
          range: r.label,
          count: custResponse.data.filter(
            (c) =>
              c.loyaltyPointsBalance >= r.min &&
              c.loyaltyPointsBalance <= r.max,
          ).length,
        }));
        setPointsDistribution(distribution);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    transactions,
    statistics,
    filters,
    setFilters,
    loading,
    error,
    reload: fetchAll,
    topCustomers,
    pointsDistribution,
    monthlyTrends,
  };
};
