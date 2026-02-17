// src/renderer/api/returnRefund.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface ReturnRefundEntry {
  id: number;
  referenceNo: string;
  createdAt: string;
  reason: string;
  refundMethod: string;
  totalAmount: number;
  status: string;
  customer?: { id: number; name: string };
  sale?: { id: number; referenceNo: string };
  items?: ReturnRefundItem[];
}

export interface ReturnRefundItem {
  id: number;
  productId: number;
  product?: { id: number; name: string; sku: string };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  reason?: string;
}

export interface ReturnRefundSummary {
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  statusBreakdown: Array<{ status: string; count: number; amount: number }>;
  dailySummary: Array<{ date: string; count: number; amount: number }>;
}

export interface ReturnRefundStats {
  byMethod: Array<{ method: string; count: number; amount: number }>;
  byMonth: Array<{ month: string; count: number; amount: number }>;
  topCustomers: Array<{
    customerId: number;
    customerName: string;
    returnCount: number;
    totalReturned: number;
  }>;
}

export interface PaginatedReturns {
  items: ReturnRefundEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReturnRefundReport {
  summary: ReturnRefundSummary;
  stats: ReturnRefundStats;
  recentReturns: ReturnRefundEntry[];
  generatedAt: string;
  filters: any;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces
// ----------------------------------------------------------------------

export interface ReturnRefundsResponse {
  status: boolean;
  message: string;
  data: ReturnRefundEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface ReturnRefundResponse {
  status: boolean;
  message: string;
  data: ReturnRefundEntry;
}

export interface ReturnRefundSummaryResponse {
  status: boolean;
  message: string;
  data: ReturnRefundSummary;
}

export interface ReturnRefundStatsResponse {
  status: boolean;
  message: string;
  data: ReturnRefundStats;
}

export interface ExportReturnRefundsResponse {
  status: boolean;
  message: string;
  data: any[]; // flat array for CSV
  format: string;
}

export interface GenerateReturnReportResponse {
  status: boolean;
  message: string;
  data: ReturnRefundReport;
}

// ----------------------------------------------------------------------
// 🧠 ReturnRefundAPI Class
// ----------------------------------------------------------------------

class ReturnRefundAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all return/refund records with pagination and filters
   * @param params.customerId - Filter by customer
   * @param params.status - Filter by status
   * @param params.refundMethod - Filter by refund method
   * @param params.startDate - Start date ISO string
   * @param params.endDate - End date ISO string
   * @param params.minAmount - Minimum total amount
   * @param params.maxAmount - Maximum total amount
   * @param params.searchTerm - Search in referenceNo, reason, customer name
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getAll(params?: {
    customerId?: number;
    status?: string;
    refundMethod?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }): Promise<ReturnRefundsResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "getAllReturnRefunds",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch return/refunds");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch return/refunds");
    }
  }

  /**
   * Get a single return/refund by ID
   * @param id - Return/Refund ID
   */
  async getById(id: number): Promise<ReturnRefundResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "getReturnRefundById",
        params: { id },
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch return/refund");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch return/refund");
    }
  }

  /**
   * Get return/refunds for a specific customer
   * @param params.customerId - Customer ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByCustomer(params: {
    customerId: number;
    page?: number;
    limit?: number;
  }): Promise<ReturnRefundsResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "getReturnRefundsByCustomer",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch returns by customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch returns by customer");
    }
  }

  /**
   * Get return/refunds within a date range
   * @param params.startDate - Start date ISO string
   * @param params.endDate - End date ISO string
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByDateRange(params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }): Promise<ReturnRefundsResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "getReturnRefundsByDateRange",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch returns by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch returns by date range");
    }
  }

  /**
   * Get return/refunds by status
   * @param params.status - Status (e.g., 'pending', 'processed', 'rejected')
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByStatus(params: {
    status: string;
    page?: number;
    limit?: number;
  }): Promise<ReturnRefundsResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "getReturnRefundsByStatus",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch returns by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch returns by status");
    }
  }

  /**
   * Get summary statistics of return/refunds
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ReturnRefundSummaryResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "getReturnRefundSummary",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch return summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch return summary");
    }
  }

  /**
   * Get detailed statistics of return/refunds
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ReturnRefundStatsResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "getReturnRefundStats",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch return stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch return stats");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export return/refunds to CSV (returns flat array)
   * @param params - Same filters as getAll()
   */
  async exportCSV(params?: {
    customerId?: number;
    status?: string;
    refundMethod?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
  }): Promise<ExportReturnRefundsResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "exportReturnRefunds",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to export returns");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export returns");
    }
  }

  /**
   * Generate a comprehensive return/refund report
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GenerateReturnReportResponse> {
    try {
      if (!window.backendAPI?.returnRefundReports) {
        throw new Error("Electron API (returnRefund) not available");
      }
      const response = await window.backendAPI.returnRefundReports({
        method: "generateReturnReport",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to generate return report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate return report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.returnRefundReports);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const returnRefundAPI = new ReturnRefundAPI();
export default returnRefundAPI;