import type {
  InventoryOverviewData,
  LiveDashboardData,
  QuickStatsData,
  SalesTrendData,
  TopSellingProductsData,
} from "../../../api/dashboard";

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  period: "today" | "week" | "month" | "quarter" | "year" | "custom";
  category: string | null;
  paymentMethod: string | null;
}

export interface DashboardState {
  quickStats: QuickStatsData | null;
  liveData: LiveDashboardData | null;
  salesTrend: SalesTrendData | null;
  topProducts: TopSellingProductsData | null;
  inventory: InventoryOverviewData | null;
  loading: boolean;
  error: string | null;
}

export interface StatCardProps {
  title: string;
  value: number | string;
  change: number;
  icon: string;
  color: "blue" | "green" | "purple" | "orange" | "red";
  format?: "currency" | "number" | "percentage";
  loading?: boolean;
}
