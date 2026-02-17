// src/renderer/api/salesReport.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface SaleEntry {
  id: number;
  timestamp: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  notes?: string;
  customer?: { id: number; name: string };
  saleItems?: SaleItem[];
}

export interface SaleItem {
  id: number;
  productId: number;
  product?: { id: number; name: string; sku: string };
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SalesSummary {
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  statusBreakdown: Array<{ status: string; count: number; amount: number }>;
  paymentMethodBreakdown: Array<{ method: string; count: number; amount: number }>;
  dailySummary: Array<{ date: string; count: number; amount: number }>;
}

export interface SalesStats {
  topProducts: Array<{
    productId: number;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
  topCustomers: Array<{
    customerId: number;
    customerName: string;
    purchaseCount: number;
    totalSpent: number;
  }>;
  hourlyDistribution: Array<{
    hour: string;
    count: number;
    amount: number;
  }>;
}

export interface PaginatedSales {
  items: SaleEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SalesReport {
  summary: SalesSummary;
  stats: SalesStats;
  recentSales: SaleEntry[];
  generatedAt: string;
  filters: any;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces
// ----------------------------------------------------------------------

export interface SalesResponse {
  status: boolean;
  message: string;
  data: SaleEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface SaleResponse {
  status: boolean;
  message: string;
  data: SaleEntry;
}

export interface SalesSummaryResponse {
  status: boolean;
  message: string;
  data: SalesSummary;
}

export interface SalesStatsResponse {
  status: boolean;
  message: string;
  data: SalesStats;
}

export interface ExportSalesResponse {
  status: boolean;
  message: string;
  data: any[]; // flat array for CSV
  format: string;
}

export interface GenerateSalesReportResponse {
  status: boolean;
  message: string;
  data: SalesReport;
}

// ----------------------------------------------------------------------
// 🧠 SalesReportAPI Class
// ----------------------------------------------------------------------

class SalesReportAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all sales records with pagination and filters
   * @param params.customerId - Filter by customer
   * @param params.status - Filter by status
   * @param params.paymentMethod - Filter by payment method
   * @param params.startDate - Start date ISO string
   * @param params.endDate - End date ISO string
   * @param params.minAmount - Minimum total amount
   * @param params.maxAmount - Maximum total amount
   * @param params.searchTerm - Search in notes, customer name, payment method
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getAll(params?: {
    customerId?: number;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "getAllSales",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales");
    }
  }

  /**
   * Get a single sale by ID
   * @param id - Sale ID
   */
  async getById(id: number): Promise<SaleResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "getSaleById",
        params: { id },
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sale");
    }
  }

  /**
   * Get sales for a specific customer
   * @param params.customerId - Customer ID
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByCustomer(params: {
    customerId: number;
    page?: number;
    limit?: number;
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "getSalesByCustomer",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch sales by customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales by customer");
    }
  }

  /**
   * Get sales within a date range
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
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "getSalesByDateRange",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch sales by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales by date range");
    }
  }

  /**
   * Get sales by status
   * @param params.status - Status (e.g., 'paid', 'pending', 'cancelled')
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByStatus(params: {
    status: string;
    page?: number;
    limit?: number;
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "getSalesByStatus",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch sales by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales by status");
    }
  }

  /**
   * Get sales by payment method
   * @param params.paymentMethod - Payment method
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getByPaymentMethod(params: {
    paymentMethod: string;
    page?: number;
    limit?: number;
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "getSalesByPaymentMethod",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch sales by payment method");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales by payment method");
    }
  }

  /**
   * Get summary statistics of sales
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getSummary(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SalesSummaryResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "getSalesSummary",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch sales summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales summary");
    }
  }

  /**
   * Get detailed statistics of sales (top products, top customers, hourly distribution)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<SalesStatsResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "getSalesStats",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch sales stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales stats");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export sales to CSV (returns flat array)
   * @param params - Same filters as getAll()
   */
  async exportCSV(params?: {
    customerId?: number;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    searchTerm?: string;
  }): Promise<ExportSalesResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "exportSales",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to export sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export sales");
    }
  }

  /**
   * Generate a comprehensive sales report
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GenerateSalesReportResponse> {
    try {
      if (!window.backendAPI?.salesReport) {
        throw new Error("Electron API (salesReport) not available");
      }
      const response = await window.backendAPI.salesReport({
        method: "generateSalesReport",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to generate sales report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate sales report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.salesReport);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const salesReportAPI = new SalesReportAPI();
export default salesReportAPI;