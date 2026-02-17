// src/renderer/api/inventoryReports.ts
// Similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface InventorySummary {
  totalProducts: number;
  totalStockQty: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface ProductStock {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  stockQty: number;
  reorderLevel: number;
  reorderQty: number;
  isActive: boolean;
  category?: { id: number; name: string };
  supplier?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: number;
  productId: number;
  product?: { id: number; name: string; sku: string };
  movementType: 'sale' | 'purchase' | 'return' | 'adjustment' | 'transfer';
  qtyChange: number;
  newStockQty: number;
  reason?: string;
  timestamp: string;
  saleId?: number;
  purchaseId?: number;
  // etc.
}

export interface InventoryStats {
  topSelling: Array<{
    productId: number;
    productName: string;
    totalSold: number;
  }>;
  topReturned: Array<{
    productId: number;
    productName: string;
    totalReturned: number;
  }>;
  movementsByType: Array<{
    type: string;
    count: number | string;
    totalQtyChange: number | string;
  }>;
}

export interface PaginatedProducts {
  items: ProductStock[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedMovements {
  items: InventoryMovement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryReport {
  summary: InventorySummary;
  lowStock: ProductStock[];
  outOfStock: ProductStock[];
  recentMovements: InventoryMovement[];
  stats: InventoryStats;
  generatedAt: string;
  filters: any;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces
// ----------------------------------------------------------------------

export interface InventorySummaryResponse {
  status: boolean;
  message: string;
  data: InventorySummary;
}

export interface StockLevelsResponse {
  status: boolean;
  message: string;
  data: ProductStock[];
  total: number;
  page: number;
  limit: number;
}

export interface LowStockAlertsResponse {
  status: boolean;
  message: string;
  data: ProductStock[];
  total: number;
  page: number;
  limit: number;
}

export interface OutOfStockResponse {
  status: boolean;
  message: string;
  data: ProductStock[];
  total: number;
  page: number;
  limit: number;
}

export interface InventoryMovementsResponse {
  status: boolean;
  message: string;
  data: InventoryMovement[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductStockHistoryResponse {
  status: boolean;
  message: string;
  data: InventoryMovement[];
  total: number;
  page: number;
  limit: number;
}

export interface InventoryStatsResponse {
  status: boolean;
  message: string;
  data: InventoryStats;
}

export interface ExportInventoryReportResponse {
  status: boolean;
  message: string;
  data: any[]; // flat array for CSV
  format: string;
}

export interface GenerateInventoryReportResponse {
  status: boolean;
  message: string;
  data: InventoryReport;
}

// ----------------------------------------------------------------------
// 🧠 InventoryReportsAPI Class
// ----------------------------------------------------------------------

class InventoryReportsAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get high-level inventory summary
   */
  async getSummary(): Promise<InventorySummaryResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "getInventorySummary",
        params: {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch inventory summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch inventory summary");
    }
  }

  /**
   * Get paginated stock levels with optional filters
   * @param params.categoryId - Filter by category
   * @param params.supplierId - Filter by supplier
   * @param params.isActive - Filter by active status
   * @param params.searchTerm - Search in name, SKU, description
   * @param params.minStock - Minimum stock quantity
   * @param params.maxStock - Maximum stock quantity
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getStockLevels(params?: {
    categoryId?: number;
    supplierId?: number;
    isActive?: boolean;
    searchTerm?: string;
    minStock?: number;
    maxStock?: number;
    page?: number;
    limit?: number;
  }): Promise<StockLevelsResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "getStockLevels",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch stock levels");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch stock levels");
    }
  }

  /**
   * Get products with low stock (stockQty <= reorderLevel)
   * @param params.categoryId - Optional category filter
   * @param params.supplierId - Optional supplier filter
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getLowStockAlerts(params?: {
    categoryId?: number;
    supplierId?: number;
    page?: number;
    limit?: number;
  }): Promise<LowStockAlertsResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "getLowStockAlerts",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch low stock alerts");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch low stock alerts");
    }
  }

  /**
   * Get out-of-stock products (stockQty = 0)
   * @param params.categoryId - Optional category filter
   * @param params.supplierId - Optional supplier filter
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getOutOfStock(params?: {
    categoryId?: number;
    supplierId?: number;
    page?: number;
    limit?: number;
  }): Promise<OutOfStockResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "getOutOfStock",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch out-of-stock");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch out-of-stock");
    }
  }

  /**
   * Get inventory movements with filters
   * @param params.productId - Filter by product
   * @param params.movementType - Filter by type
   * @param params.startDate - Start date ISO string
   * @param params.endDate - End date ISO string
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getMovements(params?: {
    productId?: number;
    movementType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<InventoryMovementsResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "getInventoryMovements",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch inventory movements");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch inventory movements");
    }
  }

  /**
   * Get stock history for a specific product
   * @param params.productId - Product ID (required)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   * @param params.page - Page number
   * @param params.limit - Items per page
   */
  async getProductStockHistory(params: {
    productId: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ProductStockHistoryResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "getProductStockHistory",
        params,
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch product stock history");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch product stock history");
    }
  }

  /**
   * Get inventory statistics (top selling, top returned, movements by type)
   * @param params.startDate - Optional start date
   * @param params.endDate - Optional end date
   */
  async getStats(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<InventoryStatsResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "getInventoryStats",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to fetch inventory stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch inventory stats");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export inventory report to CSV (returns flat array of products)
   * @param params - Same filters as getStockLevels()
   */
  async exportCSV(params?: {
    categoryId?: number;
    supplierId?: number;
    isActive?: boolean;
    searchTerm?: string;
    minStock?: number;
    maxStock?: number;
  }): Promise<ExportInventoryReportResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "exportInventoryReport",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to export inventory report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export inventory report");
    }
  }

  /**
   * Generate a comprehensive inventory report
   * @param params - Optional filters (date range, etc.)
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
    // other filters can be passed down to sub-queries
  }): Promise<GenerateInventoryReportResponse> {
    try {
      if (!window.backendAPI?.inventoryReports) {
        throw new Error("Electron API (inventoryReports) not available");
      }
      const response = await window.backendAPI.inventoryReports({
        method: "generateInventoryReport",
        params: params || {},
      });
      if (response.status) return response;
      throw new Error(response.message || "Failed to generate inventory report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate inventory report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a product exists
   */
  async productExists(productId: number): Promise<boolean> {
    try {
      const response = await this.getStockLevels({ page: 1, limit: 1, searchTerm: productId.toString() });
      // Better: use a dedicated exists method, but we can improvise
      return response.total > 0;
    } catch {
      return false;
    }
  }

  /**
   * Validate if the backend API is available
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.inventoryReports);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const inventoryReportsAPI = new InventoryReportsAPI();
export default inventoryReportsAPI;