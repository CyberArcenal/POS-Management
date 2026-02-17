// src/renderer/hooks/useDashboardData.ts
import { useState, useEffect, useCallback } from "react";
import dashboardAPI, {
  type DashboardSummary,
  type SalesChartPoint,
  type InventoryItem,
  type ActivityEntry,
  type TopProduct,
  type CustomerStats,
} from "../../../../api/dashboard";

interface LoadingState {
  summary: boolean;
  chart: boolean;
  lowStock: boolean;
  activities: boolean;
  topProducts: boolean;
  customerStats: boolean;
}

export default function useDashboardData() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [salesChart, setSalesChart] = useState<SalesChartPoint[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityEntry[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(
    null,
  );

  const [chartPeriod, setChartPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const [loading, setLoading] = useState<LoadingState>({
    summary: true,
    chart: true,
    lowStock: true,
    activities: true,
    topProducts: true,
    customerStats: true,
  });

  // Fetch summary, low stock, activities, top products, customer stats on mount
  useEffect(() => {
    const fetchSummary = async () => {
      setLoading((prev) => ({ ...prev, summary: true }));
      try {
        const res = await dashboardAPI.getSummary();
        if (res.status && res.data) setSummary(res.data);
      } catch (error) {
        console.error("Failed to fetch summary", error);
      } finally {
        setLoading((prev) => ({ ...prev, summary: false }));
      }
    };

    const fetchLowStock = async () => {
      setLoading((prev) => ({ ...prev, lowStock: true }));
      try {
        const res = await dashboardAPI.getLowStockAlert();
        if (res.status && res.data) setLowStockItems(res.data);
      } catch (error) {
        console.error("Failed to fetch low stock", error);
      } finally {
        setLoading((prev) => ({ ...prev, lowStock: false }));
      }
    };

    const fetchActivities = async () => {
      setLoading((prev) => ({ ...prev, activities: true }));
      try {
        const res = await dashboardAPI.getRecentActivities({ limit: 10 });
        if (res.status && res.data) setRecentActivities(res.data);
      } catch (error) {
        console.error("Failed to fetch activities", error);
      } finally {
        setLoading((prev) => ({ ...prev, activities: false }));
      }
    };

    const fetchTopProducts = async () => {
      setLoading((prev) => ({ ...prev, topProducts: true }));
      try {
        const res = await dashboardAPI.getTopProducts({
          limit: 5,
          orderBy: "revenue",
        });
        if (res.status && res.data) setTopProducts(res.data);
      } catch (error) {
        console.error("Failed to fetch top products", error);
      } finally {
        setLoading((prev) => ({ ...prev, topProducts: false }));
      }
    };

    const fetchCustomerStats = async () => {
      setLoading((prev) => ({ ...prev, customerStats: true }));
      try {
        const res = await dashboardAPI.getCustomerStats();
        if (res.status && res.data) setCustomerStats(res.data);
      } catch (error) {
        console.error("Failed to fetch customer stats", error);
      } finally {
        setLoading((prev) => ({ ...prev, customerStats: false }));
      }
    };

    fetchSummary();
    fetchLowStock();
    fetchActivities();
    fetchTopProducts();
    fetchCustomerStats();
  }, []);

  // Fetch chart data when period changes
  useEffect(() => {
    const fetchChart = async () => {
      setLoading((prev) => ({ ...prev, chart: true }));
      try {
        const days = chartPeriod === "7d" ? 7 : chartPeriod === "30d" ? 30 : 90;
        const res = await dashboardAPI.getSalesChart({ days, groupBy: "day" });
        if (res.status && res.data) setSalesChart(res.data);
      } catch (error) {
        console.error("Failed to fetch sales chart", error);
      } finally {
        setLoading((prev) => ({ ...prev, chart: false }));
      }
    };
    fetchChart();
  }, [chartPeriod]);

  const handlePeriodChange = useCallback((period: "7d" | "30d" | "90d") => {
    setChartPeriod(period);
  }, []);

  return {
    summary,
    salesChart,
    lowStockItems,
    recentActivities,
    topProducts,
    customerStats,
    loading,
    chartPeriod,
    onPeriodChange: handlePeriodChange,
  };
}
