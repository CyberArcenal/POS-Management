// src/renderer/api/dashboard.ts
// Dashboard API – aligned with backend IPC handlers (dashboard channel)

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on backend entities and service responses)
// ----------------------------------------------------------------------

// Summary response data
export interface DashboardSummary {
  date: string;                  // YYYY-MM-DD
  salesToday: number;
  revenueToday: number;
  totalCustomers: number;
  lowStockCount: number;
  inventoryMovementsToday: number;
}

// Sales chart data point
export interface SalesChartPoint {
  date: string;                  // YYYY-MM-DD or YYYY-MM
  revenue: number;
  count: number;
}

// Inventory status item (for low stock)
export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  stockQty: number;
  price: number;
}

// Inventory status response data
export interface InventoryStatus {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  lowStockItems: InventoryItem[];
}

// Activity entry (for recent activities)
export interface ActivityEntry {
  type: 'sale' | 'inventory' | 'audit';
  id: number;
  description: string;
  customer?: string;              // for sales
  product?: string;               // for inventory
  user?: string;                  // for audit
  timestamp: string;              // ISO datetime
  formattedTime: string;          // human-readable
}

// Top product entry
export interface TopProduct {
  productId: number;
  productName: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
}

// Customer stats response data
export interface CustomerStats {
  totalCustomers: number;
  newCustomersToday: number;
  newCustomersThisWeek: number;
  topSpenders: Array<{
    customerId: number;
    name: string;
    totalSpent: number;
  }>;
  loyaltyDistribution: Array<{
    range: string;
    count: number;
  }>;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface DashboardSummaryResponse {
  status: boolean;
  message: string;
  data: DashboardSummary | null;
}

export interface SalesChartResponse {
  status: boolean;
  message: string;
  data: SalesChartPoint[] | null;
}

export interface InventoryStatusResponse {
  status: boolean;
  message: string;
  data: InventoryStatus | null;
}

export interface RecentActivitiesResponse {
  status: boolean;
  message: string;
  data: ActivityEntry[] | null;
}

export interface TopProductsResponse {
  status: boolean;
  message: string;
  data: TopProduct[] | null;
}

export interface LowStockAlertResponse {
  status: boolean;
  message: string;
  data: InventoryItem[] | null;
}

export interface CustomerStatsResponse {
  status: boolean;
  message: string;
  data: CustomerStats | null;
}

// ----------------------------------------------------------------------
// 🧠 DashboardAPI Class
// ----------------------------------------------------------------------

class DashboardAPI {
  // --------------------------------------------------------------------
  // 📊 DASHBOARD METHODS
  // --------------------------------------------------------------------

  /**
   * Get dashboard summary (today's sales, revenue, customer count, low stock count)
   * @param params - { date?: string } (defaults to today)
   */
  async getSummary(params?: { date?: string }): Promise<DashboardSummaryResponse> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({
        method: "getSummary",
        params: params || {},
      });

      if (response.status) {
        return response as DashboardSummaryResponse;
      }
      throw new Error(response.message || "Failed to fetch dashboard summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch dashboard summary");
    }
  }

  /**
   * Get sales data for chart (last 7 days by default)
   * @param params - { days?: number, groupBy?: 'day'|'month' }
   */
  async getSalesChart(params?: {
    days?: number;
    groupBy?: 'day' | 'month';
  }): Promise<SalesChartResponse> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({
        method: "getSalesChart",
        params: params || {},
      });

      if (response.status) {
        return response as SalesChartResponse;
      }
      throw new Error(response.message || "Failed to fetch sales chart");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales chart");
    }
  }

  /**
   * Get current inventory status: total products, total value, low stock items
   * @param params - { lowStockThreshold?: number }
   */
  async getInventoryStatus(params?: {
    lowStockThreshold?: number;
  }): Promise<InventoryStatusResponse> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({
        method: "getInventoryStatus",
        params: params || {},
      });

      if (response.status) {
        return response as InventoryStatusResponse;
      }
      throw new Error(response.message || "Failed to fetch inventory status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch inventory status");
    }
  }

  /**
   * Get recent activities (sales, inventory movements, audit logs)
   * @param params - { limit?: number }
   */
  async getRecentActivities(params?: {
    limit?: number;
  }): Promise<RecentActivitiesResponse> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({
        method: "getRecentActivities",
        params: params || {},
      });

      if (response.status) {
        return response as RecentActivitiesResponse;
      }
      throw new Error(response.message || "Failed to fetch recent activities");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch recent activities");
    }
  }

  /**
   * Get top selling products by quantity or revenue
   * @param params - { limit?: number, orderBy?: 'quantity'|'revenue', startDate?: string, endDate?: string }
   */
  async getTopProducts(params?: {
    limit?: number;
    orderBy?: 'quantity' | 'revenue';
    startDate?: string;
    endDate?: string;
  }): Promise<TopProductsResponse> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({
        method: "getTopProducts",
        params: params || {},
      });

      if (response.status) {
        return response as TopProductsResponse;
      }
      throw new Error(response.message || "Failed to fetch top products");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch top products");
    }
  }

  /**
   * Get products with stock below threshold
   * @param params - { threshold?: number }
   */
  async getLowStockAlert(params?: {
    threshold?: number;
  }): Promise<LowStockAlertResponse> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({
        method: "getLowStockAlert",
        params: params || {},
      });

      if (response.status) {
        return response as LowStockAlertResponse;
      }
      throw new Error(response.message || "Failed to fetch low stock alert");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch low stock alert");
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats(): Promise<CustomerStatsResponse> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({
        method: "getCustomerStats",
        params: {},
      });

      if (response.status) {
        return response as CustomerStatsResponse;
      }
      throw new Error(response.message || "Failed to fetch customer stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch customer stats");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.dashboard);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const dashboardAPI = new DashboardAPI();
export default dashboardAPI;