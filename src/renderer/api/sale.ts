// src/renderer/api/sale.ts
// Sale API – aligned with backend IPC handlers (sale channel)

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on backend entities)
// ----------------------------------------------------------------------

export interface Customer {
  id: number;
  name: string;
  contactInfo: string | null;
  loyaltyPointsBalance: number;
  createdAt: string;       // ISO datetime
  updatedAt: string | null;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  price: number;           // decimal
  stockQty: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface SaleItem {
  id: number;
  quantity: number;
  unitPrice: number;       // decimal
  discount: number;        // decimal
  tax: number;             // decimal
  lineTotal: number;       // decimal
  createdAt: string;
  updatedAt: string | null;
  product: Product;        // populated relation
  saleId?: number;         // for reference
}

export interface Sale {
  id: number;
  timestamp: string;       // ISO datetime
  status: 'initiated' | 'paid' | 'refunded' | 'voided';
  paymentMethod: 'cash' | 'card' | 'wallet';
  totalAmount: number;     // decimal
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  customer: Customer | null;
  saleItems: SaleItem[];
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface SaleResponse {
  status: boolean;
  message: string;
  data: Sale;               // single sale
}

export interface SalesResponse {
  status: boolean;
  message: string;
  data: Sale[];             // array of sales
}

export interface StatisticsResponse {
  status: boolean;
  message: string;
  data: {
    totalRevenue: number;
    averageSale: number;
    todaySales: number;
    statusCounts: Array<{ status: string; count: number }>;
  };
}

export interface TopProductsResponse {
  status: boolean;
  message: string;
  data: Array<{
    productId: number;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

export interface ReceiptResponse {
  status: boolean;
  message: string;
  data: {
    receiptNumber: string;
    date: string;
    customer: { name: string; loyaltyPoints: number } | null;
    items: Array<{
      product: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      tax: number;
      lineTotal: number;
    }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    status: string;
  };
}

export interface ExportResponse {
  status: boolean;
  message: string;
  data: {
    format: 'csv' | 'json';
    data: string;           // CSV string or JSON string
    filename: string;
  };
}

export interface BulkOperationResponse {
  status: boolean;
  message: string;
  data: Sale[];             // array of created/updated sales
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
  };
}

// ----------------------------------------------------------------------
// 🧠 SaleAPI Class
// ----------------------------------------------------------------------

class SaleAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all sales with optional filtering and pagination.
   * @param params - Filters: status, statuses, startDate, endDate, customerId,
   *                 paymentMethod, search, sortBy, sortOrder, page, limit
   */
  async getAll(params?: {
    status?: string;
    statuses?: string[];
    startDate?: string;
    endDate?: string;
    customerId?: number;
    paymentMethod?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "getAllSales",
        params: params || {},
      });

      if (response.status) {
        console.log(response)
        return response as SalesResponse;
      }
      throw new Error(response.message || "Failed to fetch sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales");
    }
  }

  /**
   * Get a single sale by ID (with items and customer).
   * @param id - Sale ID
   */
  async getById(id: number): Promise<SaleResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSaleById",
        params: { id },
      });

      if (response.status) {
        return response as SaleResponse;
      }
      throw new Error(response.message || "Failed to fetch sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sale");
    }
  }

  /**
   * Get sales for a specific customer.
   * @param params - customerId, page, limit, startDate, endDate
   */
  async getByCustomer(params: {
    customerId: number;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSalesByCustomer",
        params,
      });

      if (response.status) {
        return response as SalesResponse;
      }
      throw new Error(response.message || "Failed to fetch sales by customer");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales by customer");
    }
  }

  /**
   * Get sales within a date range.
   * @param params - startDate, endDate, page, limit
   */
  async getByDateRange(params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSalesByDate",
        params,
      });

      if (response.status) {
        return response as SalesResponse;
      }
      throw new Error(response.message || "Failed to fetch sales by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch sales by date range");
    }
  }

  /**
   * Get all initiated (active) sales.
   * @param params - Optional pagination
   */
  async getActive(params?: { page?: number; limit?: number }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "getActiveSales",
        params: params || {},
      });

      if (response.status) {
        return response as SalesResponse;
      }
      throw new Error(response.message || "Failed to fetch active sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch active sales");
    }
  }

  /**
   * Get sales statistics (revenue, averages, counts).
   */
  async getStatistics(): Promise<StatisticsResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSaleStatistics",
        params: {},
      });

      if (response.status) {
        return response as StatisticsResponse;
      }
      throw new Error(response.message || "Failed to fetch statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch statistics");
    }
  }

  /**
   * Search sales with flexible criteria.
   * @param params - searchTerm, customerId, status, paymentMethod, date range, pagination
   */
  async search(params: {
    searchTerm?: string;
    customerId?: number;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "searchSales",
        params,
      });

      if (response.status) {
        return response as SalesResponse;
      }
      throw new Error(response.message || "Failed to search sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search sales");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new sale (initiated).
   * @param data - Sale data (items, customerId, paymentMethod, notes, loyaltyRedeemed)
   * @param user - Optional username (defaults to 'system')
   */
  async create(
    data: {
      items: Array<{
        productId: number;
        quantity: number;
        unitPrice?: number;   // if not provided, uses product's price
        discount?: number;
        tax?: number;
      }>;
      customerId?: number;
      paymentMethod?: 'cash' | 'card' | 'wallet';
      notes?: string;
      loyaltyRedeemed?: number;
    },
    user: string = "system"
  ): Promise<SaleResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "createSale",
        params: { ...data, user },
      });

      if (response.status) {
        return response as SaleResponse;
      }
      throw new Error(response.message || "Failed to create sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create sale");
    }
  }

  /**
   * Update an existing sale (only allowed for initiated sales, limited fields).
   * @param id - Sale ID
   * @param updates - Fields to update (paymentMethod, notes)
   * @param user - Optional username
   */
  async update(
    id: number,
    updates: { paymentMethod?: 'cash' | 'card' | 'wallet'; notes?: string },
    user: string = "system"
  ): Promise<SaleResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "updateSale",
        params: { id, updates, user },
      });

      if (response.status) {
        return response as SaleResponse;
      }
      throw new Error(response.message || "Failed to update sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update sale");
    }
  }

  /**
   * Delete a sale (use with caution – may be disallowed for non‑initiated sales).
   * @param id - Sale ID
   * @param user - Optional username
   */
  async delete(id: number, user: string = "system"): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "deleteSale",
        params: { id, user },
      });

      if (response.status) {
        return response as DeleteResponse;
      }
      throw new Error(response.message || "Failed to delete sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete sale");
    }
  }

  /**
   * Mark an initiated sale as paid.
   * @param id - Sale ID
   * @param user - Optional username
   */
  async markAsPaid(id: number, user: string = "system"): Promise<SaleResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "markAsPaid",
        params: { id, user },
      });

      if (response.status) {
        return response as SaleResponse;
      }
      throw new Error(response.message || "Failed to mark sale as paid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark sale as paid");
    }
  }

  /**
   * Void an initiated sale (restores stock).
   * @param id - Sale ID
   * @param reason - Reason for voiding
   * @param user - Optional username
   */
  async void(id: number, reason: string, user: string = "system"): Promise<SaleResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "voidSale",
        params: { id, reason, user },
      });

      if (response.status) {
        return response as SaleResponse;
      }
      throw new Error(response.message || "Failed to void sale");
    } catch (error: any) {
      throw new Error(error.message || "Failed to void sale");
    }
  }

  /**
   * Process a refund (full refund only currently).
   * @param id - Original sale ID
   * @param items - Items to refund (productId, quantity)
   * @param reason - Refund reason
   * @param user - Optional username
   */
  async refund(
    id: number,
    items: Array<{ productId: number; quantity: number }>,
    reason: string,
    user: string = "system"
  ): Promise<SaleResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "refundSale",
        params: { id, items, reason, user },
      });

      if (response.status) {
        return response as SaleResponse;
      }
      throw new Error(response.message || "Failed to process refund");
    } catch (error: any) {
      throw new Error(error.message || "Failed to process refund");
    }
  }

  // --------------------------------------------------------------------
  // 📊 STATISTICS METHODS
  // --------------------------------------------------------------------

  /**
   * Get daily sales summary.
   * @param params - date range (optional)
   */
  async getDailySales(params?: { startDate?: string; endDate?: string }): Promise<SalesResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "getDailySales",
        params: params || {},
      });

      if (response.status) {
        return response as SalesResponse;
      }
      throw new Error(response.message || "Failed to fetch daily sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch daily sales");
    }
  }

  /**
   * Get total revenue (paid sales).
   * @param params - date range (optional)
   */
  async getRevenue(params?: { startDate?: string; endDate?: string }): Promise<StatisticsResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "getSalesRevenue",
        params: params || {},
      });

      if (response.status) {
        return response as StatisticsResponse;
      }
      throw new Error(response.message || "Failed to fetch revenue");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch revenue");
    }
  }

  /**
   * Get top selling products by quantity/revenue.
   * @param params - date range, limit
   */
  async getTopProducts(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<TopProductsResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
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

  // --------------------------------------------------------------------
  // 🔄 BATCH OPERATIONS
  // --------------------------------------------------------------------

  /**
   * Bulk create multiple sales.
   * @param sales - Array of sale data objects (same as create)
   * @param user - Optional username
   */
  async bulkCreate(
    sales: Array<{
      items: Array<{ productId: number; quantity: number; unitPrice?: number; discount?: number; tax?: number }>;
      customerId?: number;
      paymentMethod?: 'cash' | 'card' | 'wallet';
      notes?: string;
      loyaltyRedeemed?: number;
    }>,
    user: string = "system"
  ): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "bulkCreateSales",
        params: { sales, user },
      });

      if (response.status) {
        return response as BulkOperationResponse;
      }
      throw new Error(response.message || "Failed to bulk create sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create sales");
    }
  }

  /**
   * Bulk update multiple sales (only allowed for initiated sales).
   * @param updates - Array of { id, updates }
   * @param user - Optional username
   */
  async bulkUpdate(
    updates: Array<{ id: number; updates: { paymentMethod?: string; notes?: string } }>,
    user: string = "system"
  ): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "bulkUpdateSales",
        params: { updates, user },
      });

      if (response.status) {
        return response as BulkOperationResponse;
      }
      throw new Error(response.message || "Failed to bulk update sales");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update sales");
    }
  }

  /**
   * Import sales from CSV string.
   * @param csvData - Raw CSV content
   * @param user - Optional username
   */
  async importCSV(csvData: string, user: string = "system"): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "importSalesFromCSV",
        params: { csvData, user },
      });

      if (response.status) {
        return response as BulkOperationResponse;
      }
      throw new Error(response.message || "Failed to import sales from CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import sales from CSV");
    }
  }

  /**
   * Export filtered sales to CSV.
   * @param params - Filters (same as getAll)
   */
  async exportCSV(params?: {
    status?: string;
    statuses?: string[];
    startDate?: string;
    endDate?: string;
    customerId?: number;
    paymentMethod?: string;
    search?: string;
  }): Promise<ExportResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "exportSalesToCSV",
        params: params || {},
      });

      if (response.status) {
        return response as ExportResponse;
      }
      throw new Error(response.message || "Failed to export sales to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export sales to CSV");
    }
  }

  // --------------------------------------------------------------------
  // 📄 REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Generate a receipt for a sale.
   * @param id - Sale ID
   */
  async generateReceipt(id: number): Promise<ReceiptResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "generateReceipt",
        params: { id },
      });

      if (response.status) {
        return response as ReceiptResponse;
      }
      throw new Error(response.message || "Failed to generate receipt");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate receipt");
    }
  }

  /**
   * Generate a comprehensive sales report.
   * @param params - Report parameters (date range, format, etc.)
   */
  async generateReport(params?: {
    startDate?: string;
    endDate?: string;
    format?: 'pdf' | 'csv' | 'json';
    groupBy?: 'day' | 'week' | 'month';
  }): Promise<ExportResponse> {
    try {
      if (!window.backendAPI?.sale) {
        throw new Error("Electron API (sale) not available");
      }

      const response = await window.backendAPI.sale({
        method: "generateSalesReport",
        params: params || {},
      });

      if (response.status) {
        return response as ExportResponse;
      }
      throw new Error(response.message || "Failed to generate sales report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate sales report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if the backend sale API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.sale);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const saleAPI = new SaleAPI();
export default saleAPI;