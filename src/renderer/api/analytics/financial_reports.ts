// src/renderer/api/financialReports.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface FinancialSummary {
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  cogs: number;          // Cost of Goods Sold (placeholder)
  grossProfit: number;
  profitMargin: number;
}

export interface RevenueBreakdownItem {
  method?: string;        // for paymentMethod grouping
  category?: string;      // for category grouping
  productId?: number;     // for product grouping
  productName?: string;
  count?: number | string;
  amount?: number | string;
  quantity?: number | string;
}

export type RevenueBreakdown = RevenueBreakdownItem[];

export interface ProfitLossItem {
  period: string;         // e.g., "2025-03-15", "2025-12"
  revenue: number;
  refunds: number;
  netRevenue: number;
}

export interface ExpenseBreakdownItem {
  supplierId?: number;
  supplierName?: string;
  amount: number | string;
  count: number | string;
}

export interface FinancialChartDataPoint {
  date: string;
  revenue?: number;
  refunds?: number;
  netRevenue?: number;
}

export interface FinancialReport {
  summary: FinancialSummary;
  revenueBreakdown: RevenueBreakdown;
  profitLoss: ProfitLossItem[];
  expenseBreakdown: ExpenseBreakdownItem[];
  chartData: FinancialChartDataPoint[];
  generatedAt: string;
  filters: any;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces
// ----------------------------------------------------------------------

export interface FinancialSummaryResponse {
  status: boolean;
  message: string;
  data: FinancialSummary;
}

export interface RevenueBreakdownResponse {
  status: boolean;
  message: string;
  data: RevenueBreakdown;
}

export interface ProfitLossResponse {
  status: boolean;
  message: string;
  data: ProfitLossItem[];
}

export interface ExpenseBreakdownResponse {
  status: boolean;
  message: string;
  data: ExpenseBreakdownItem[];
}

export interface FinancialChartDataResponse {
  status: boolean;
  message: string;
  data: FinancialChartDataPoint[];
}

export interface ExportFinancialReportResponse {
  status: boolean;
  message: string;
  data: any;           // depends on format, likely JSON object
  format: string;
}

export interface GenerateFinancialReportResponse {
  status: boolean;
  message: string;
  data: FinancialReport;
}

// ----------------------------------------------------------------------
// 🧠 FinancialReportsAPI Class
// ----------------------------------------------------------------------

class FinancialReportsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get overall financial summary for a period
   * @param params.startDate - Optional start date (ISO string)
   * @param params.endDate - Optional end date
   */
  async getSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FinancialSummaryResponse> {
    try {
      if (!window.backendAPI?.financialReports) {
        throw new Error("Electron API (financialReports) not available");
      }
      const response = await window.backendAPI.financialReports({
        method: "getFinancialSummary",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch financial summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch financial summary");
    }
  }

  /**
   * Get revenue breakdown by payment method, category, or product
   * @param params.groupBy - 'paymentMethod', 'category', or 'product' (default 'paymentMethod')
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   * @param params.limit - Max items for product breakdown (default 20)
   */
  async getRevenueBreakdown(params?: {
    groupBy?: 'paymentMethod' | 'category' | 'product';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<RevenueBreakdownResponse> {
    try {
      if (!window.backendAPI?.financialReports) {
        throw new Error("Electron API (financialReports) not available");
      }
      const response = await window.backendAPI.financialReports({
        method: "getRevenueBreakdown",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch revenue breakdown");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch revenue breakdown");
    }
  }

  /**
   * Get profit and loss data grouped by time period
   * @param params.groupBy - 'day', 'week', or 'month' (default 'day')
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getProfitLoss(params?: {
    groupBy?: 'day' | 'week' | 'month';
    startDate?: string;
    endDate?: string;
  }): Promise<ProfitLossResponse> {
    try {
      if (!window.backendAPI?.financialReports) {
        throw new Error("Electron API (financialReports) not available");
      }
      const response = await window.backendAPI.financialReports({
        method: "getProfitLoss",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch profit/loss");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch profit/loss");
    }
  }

  /**
   * Get expense breakdown (currently purchases by supplier)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getExpenseBreakdown(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ExpenseBreakdownResponse> {
    try {
      if (!window.backendAPI?.financialReports) {
        throw new Error("Electron API (financialReports) not available");
      }
      const response = await window.backendAPI.financialReports({
        method: "getExpenseBreakdown",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch expense breakdown");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch expense breakdown");
    }
  }

  /**
   * Get data formatted for charts (revenue, profit, etc.)
   * @param params.chartType - 'revenue', 'profit', or 'comparison' (default 'revenue')
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getChartData(params?: {
    chartType?: 'revenue' | 'profit' | 'comparison';
    startDate?: string;
    endDate?: string;
  }): Promise<FinancialChartDataResponse> {
    try {
      if (!window.backendAPI?.financialReports) {
        throw new Error("Electron API (financialReports) not available");
      }
      const response = await window.backendAPI.financialReports({
        method: "getFinancialChartData",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch chart data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch chart data");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export financial data (returns JSON object with sections)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async exportReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ExportFinancialReportResponse> {
    try {
      if (!window.backendAPI?.financialReports) {
        throw new Error("Electron API (financialReports) not available");
      }
      const response = await window.backendAPI.financialReports({
        method: "exportFinancialReport",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to export financial report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export financial report");
    }
  }

  /**
   * Generate a comprehensive financial report
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GenerateFinancialReportResponse> {
    try {
      if (!window.backendAPI?.financialReports) {
        throw new Error("Electron API (financialReports) not available");
      }
      const response = await window.backendAPI.financialReports({
        method: "generateFinancialReport",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to generate financial report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate financial report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.financialReports);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const financialReportsAPI = new FinancialReportsAPI();
export default financialReportsAPI;