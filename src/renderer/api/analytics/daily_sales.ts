// src/renderer/api/dailySales.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface DailySalesEntry {
  date: string;           // YYYY-MM-DD
  count: string | number;
  total: string | number;
  average: string | number;
  paidCount: string | number;
}

export interface DailySalesDetailsEntry {
  id: number;
  timestamp: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  customer?: any;
  saleItems?: any[];
}

export interface DailySalesChartPoint {
  date: string;
  total: string | number;
  count: string | number;
}

export interface DailySalesStats {
  totalSales: number;
  totalRevenue: number;
  bestDay: { date: string; total: string | number } | null;
  busiestDay: { date: string; count: string | number } | null;
  averageDailySales: number;
}

export interface ExportDailySalesRow {
  date: string;
  transactions: string | number;
  totalAmount: string | number;
  averageAmount: string | number;
  paidTransactions: string | number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces
// ----------------------------------------------------------------------

export interface DailySalesResponse {
  status: boolean;
  message: string;
  data: DailySalesEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface DailySalesDetailsResponse {
  status: boolean;
  message: string;
  data: DailySalesDetailsEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface DailySalesChartResponse {
  status: boolean;
  message: string;
  data: DailySalesChartPoint[];
}

export interface DailySalesStatsResponse {
  status: boolean;
  message: string;
  data: DailySalesStats;
}

export interface ExportDailySalesResponse {
  status: boolean;
  message: string;
  data: ExportDailySalesRow[];
  format: string; // 'csv'
}

// ----------------------------------------------------------------------
// 🧠 DailySalesAPI Class
// ----------------------------------------------------------------------

class DailySalesAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get daily aggregated sales data (grouped by day)
   * @param params.startDate - Optional start date (ISO string)
   * @param params.endDate - Optional end date
   * @param params.paymentMethod - Optional filter by payment method
   * @param params.status - Optional filter by status
   * @param params.page - Page number (for pagination after grouping)
   * @param params.limit - Items per page
   */
  async getDailySales(params?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DailySalesResponse> {
    try {
      if (!window.backendAPI?.dailySales) {
        throw new Error("Electron API (dailySales) not available");
      }
      const response = await window.backendAPI.dailySales({
        method: "getDailySales",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch daily sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch daily sales");
    }
  }

  /**
   * Get detailed sales for a specific day
   * @param params.date - Date in YYYY-MM-DD format
   * @param params.paymentMethod - Optional filter
   * @param params.status - Optional filter
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getDailySalesDetails(params: {
    date: string;
    paymentMethod?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<DailySalesDetailsResponse> {
    try {
      if (!window.backendAPI?.dailySales) {
        throw new Error("Electron API (dailySales) not available");
      }
      const response = await window.backendAPI.dailySales({
        method: "getDailySalesDetails",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch daily sales details");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch daily sales details");
    }
  }

  /**
   * Get data formatted for charts (e.g., line chart of daily totals)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   * @param params.paymentMethod - Optional filter
   * @param params.status - Optional filter
   */
  async getDailySalesChart(params?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    status?: string;
  }): Promise<DailySalesChartResponse> {
    try {
      if (!window.backendAPI?.dailySales) {
        throw new Error("Electron API (dailySales) not available");
      }
      const response = await window.backendAPI.dailySales({
        method: "getDailySalesChart",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch daily sales chart");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch daily sales chart");
    }
  }

  /**
   * Get statistics about daily sales
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   * @param params.paymentMethod - Optional filter
   * @param params.status - Optional filter
   */
  async getStats(params?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    status?: string;
  }): Promise<DailySalesStatsResponse> {
    try {
      if (!window.backendAPI?.dailySales) {
        throw new Error("Electron API (dailySales) not available");
      }
      const response = await window.backendAPI.dailySales({
        method: "getDailySalesStats",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch daily sales stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch daily sales stats");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT METHOD
  // --------------------------------------------------------------------

  /**
   * Export daily sales summary to CSV (returns data array ready for CSV conversion)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   * @param params.paymentMethod - Optional filter
   * @param params.status - Optional filter
   */
  async exportCSV(params?: {
    startDate?: string;
    endDate?: string;
    paymentMethod?: string;
    status?: string;
  }): Promise<ExportDailySalesResponse> {
    try {
      if (!window.backendAPI?.dailySales) {
        throw new Error("Electron API (dailySales) not available");
      }
      const response = await window.backendAPI.dailySales({
        method: "exportDailySales",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to export daily sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export daily sales");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.dailySales);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const dailySalesAPI = new DailySalesAPI();
export default dailySalesAPI;